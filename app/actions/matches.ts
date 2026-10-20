// app/actions/matches.ts
'use server';

import sql from '@/public/lib/db';

// Converte in modo pulito senza alterare i giorni
function sanitizeMatch(match: any) {
  if (!match) return null;
  return {
    ...match,
    data: match.data ? String(match.data).split('T')[0] : null,
    time: match.time ? String(match.time).slice(0, 5) : null,
  };
}

export async function getMatchData(selectedMatchId?: string | null) {
  let currentMatch = null;

  if (selectedMatchId) {
    const matches = await sql`
      SELECT id, stagione_id, TO_CHAR(data, 'YYYY-MM-DD') as data, time, tipologia, formazione_bianchi, formazione_neri, stato 
      FROM partite 
      WHERE id = ${selectedMatchId} AND stato IN ('programmata', 'giocata') 
      LIMIT 1
    `;
    currentMatch = matches[0] || null;
  }

  if (!currentMatch) {
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = await sql`
      SELECT id, stagione_id, TO_CHAR(data, 'YYYY-MM-DD') as data, time, tipologia, formazione_bianchi, formazione_neri, stato 
      FROM partite 
      WHERE stato IN ('programmata', 'giocata') AND data >= ${todayStr}
      ORDER BY data ASC, time ASC 
      LIMIT 1
    `;

    if (upcoming.length > 0) {
      currentMatch = upcoming[0];
    } else {
      const lastMatch = await sql`
        SELECT id, stagione_id, TO_CHAR(data, 'YYYY-MM-DD') as data, time, tipologia, formazione_bianchi, formazione_neri, stato 
        FROM partite 
        WHERE stato IN ('programmata', 'giocata')
        ORDER BY data DESC, time DESC 
        LIMIT 1
      `;
      currentMatch = lastMatch[0] || null;
    }
  }

  const match = sanitizeMatch(currentMatch);

  if (!match) return { match: null, whiteTeam: [], blackTeam: [], whiteGoals: 0, blackGoals: 0 };

  const matchPlayers = await sql`
    SELECT squadra, posizione, giocatore_id 
    FROM partite_giocatori 
    WHERE partita_id = ${match.id}
    ORDER BY posizione ASC
  `;

  // Leggi gli eventi della partita per calcolare gol, assist e autogol dinamici
  const matchEvents = await sql`
    SELECT squadra, giocatore_id, assist_man_id, is_autogol 
    FROM partita_eventi 
    WHERE partita_id = ${match.id}
  `;

  const whiteGoals = matchEvents.filter((ev) => ev.squadra === 'bianchi').length;
  const blackGoals = matchEvents.filter((ev) => ev.squadra === 'neri').length;

  const playerGoalsCount = new Map<string, number>();
  const playerAssistsCount = new Map<string, number>();
  const playerAutogolsCount = new Map<string, number>();

  matchEvents.forEach((ev) => {
    // Gli autogol non contano per i gol personali del giocatore
    if (ev.giocatore_id && !ev.is_autogol) {
      playerGoalsCount.set(ev.giocatore_id, (playerGoalsCount.get(ev.giocatore_id) || 0) + 1);
    }
    // Traccia gli autogol fatti dal giocatore
    if (ev.giocatore_id && ev.is_autogol) {
      playerAutogolsCount.set(ev.giocatore_id, (playerAutogolsCount.get(ev.giocatore_id) || 0) + 1);
    }
    if (ev.assist_man_id) {
      playerAssistsCount.set(ev.assist_man_id, (playerAssistsCount.get(ev.assist_man_id) || 0) + 1);
    }
  });

  const playerIds = matchPlayers.map((mp) => mp.giocatore_id);

  let playersData: any[] = [];
  if (playerIds.length > 0) {
    playersData = await sql`
      SELECT id, nickname, avatar_url, avatar_url_w, avatar_url_b 
      FROM giocatori 
      WHERE id = ANY(${playerIds})
    `;
  }

  const playersMap = new Map(playersData.map((p) => [p.id, p]));
  const defaultAvatar = '/avatars/default.jpg';

  const mapPlayerWithStats = (mp: any) => {
    const base = playersMap.get(mp.giocatore_id);
    if (!base) return undefined;
    return {
      ...base,
      avatar_url: base.avatar_url || defaultAvatar,
      gol: playerGoalsCount.get(mp.giocatore_id) || 0,
      assist: playerAssistsCount.get(mp.giocatore_id) || 0,
      autogol: playerAutogolsCount.get(mp.giocatore_id) || 0,
    };
  };

  const whiteTeam = matchPlayers.filter((mp) => mp.squadra === 'bianchi').map(mapPlayerWithStats).filter(Boolean);
  const blackTeam = matchPlayers.filter((mp) => mp.squadra === 'neri').map(mapPlayerWithStats).filter(Boolean);

  return {
    match,
    whiteTeam,
    blackTeam,
    whiteGoals,
    blackGoals,
  };
}

export async function getMatchesList() {
  const matches = await sql`
    SELECT id, stagione_id, TO_CHAR(data, 'YYYY-MM-DD') as data, time, tipologia, formazione_bianchi, formazione_neri, stato 
    FROM partite 
    WHERE stato IN ('programmata', 'giocata') 
    ORDER BY data DESC, time DESC
  `;
  return matches.map(sanitizeMatch);
}

export async function getPlayerStats(giocatoreId: string, stagioneId?: string | null, filtroSquadra?: string) {
  let partitaIds: string[] = [];

  if (stagioneId) {
    const partite = await sql`
      SELECT id FROM partite 
      WHERE stato = 'giocata' AND stagione_id = ${stagioneId}
    `;
    partitaIds = partite.map((p) => p.id);
  } else {
    const partite = await sql`
      SELECT id FROM partite 
      WHERE stato = 'giocata'
    `;
    partitaIds = partite.map((p) => p.id);
  }

  if (partitaIds.length === 0) {
    return { gol: 0, assist: 0, presenze: 0 };
  }

  // Presenze
  let matchPlayers;
  if (filtroSquadra && filtroSquadra !== 'tutto') {
    matchPlayers = await sql`
      SELECT squadra 
      FROM partite_giocatori 
      WHERE giocatore_id = ${giocatoreId} 
        AND partita_id = ANY(${partitaIds}) 
        AND squadra = ${filtroSquadra}
    `;
  } else {
    matchPlayers = await sql`
      SELECT squadra 
      FROM partite_giocatori 
      WHERE giocatore_id = ${giocatoreId} 
        AND partita_id = ANY(${partitaIds})
    `;
  }

  const presenze = matchPlayers ? matchPlayers.length : 0;

  // Gol (escludendo gli autogol) e assist da partita_eventi
  const golEvents = await sql`
    SELECT squadra FROM partita_eventi 
    WHERE giocatore_id = ${giocatoreId} AND partita_id = ANY(${partitaIds}) AND (is_autogol IS NOT TRUE)
  `;
  const assistEvents = await sql`
    SELECT squadra FROM partita_eventi 
    WHERE assist_man_id = ${giocatoreId} AND partita_id = ANY(${partitaIds})
  `;

  let gol = 0;
  let assist = 0;

  if (filtroSquadra && filtroSquadra !== 'tutto') {
    gol = golEvents.filter((e) => e.squadra === filtroSquadra).length;
    assist = assistEvents.filter((e) => e.squadra === filtroSquadra).length;
  } else {
    gol = golEvents.length;
    assist = assistEvents.length;
  }

  return { gol, assist, presenze };
}

export async function getSeasonsList(): Promise<Stagione[]> {
  const seasons = await sql`
    SELECT id, nome FROM stagioni 
    ORDER BY nome DESC
  `;
  return seasons as Stagione[];
}

export async function getStatisticsData(stagioneId: string, tipo: string, filtroSquadra: string) {
  const partite = await sql`
    SELECT id, TO_CHAR(data, 'YYYY-MM-DD') as data FROM partite 
    WHERE stagione_id = ${stagioneId} AND stato = 'giocata' 
    ORDER BY data ASC
  `;

  const partitaIds = partite.map((p) => p.id);

  if (partitaIds.length === 0) {
    return {
      classifica: [],
      teamStats: { vittorieBianchi: 0, vittorieNeri: 0, pareggi: 0, totalePartite: 0, serie: [] }
    };
  }

  const matchEvents = await sql`
    SELECT partita_id, giocatore_id, assist_man_id, squadra, is_autogol 
    FROM partita_eventi 
    WHERE partita_id = ANY(${partitaIds})
  `;

  let vBianchi = 0;
  let vNeri = 0;
  let pareggi = 0;
  const serieResult: ('B' | 'N' | 'P')[] = [];

  partite.forEach((p) => {
    const pEvents = matchEvents.filter((ev) => ev.partita_id === p.id);
    const golBianchi = pEvents.filter((ev) => ev.squadra === 'bianchi').length;
    const golNeri = pEvents.filter((ev) => ev.squadra === 'neri').length;

    if (golBianchi > golNeri) {
      vBianchi++;
      serieResult.push('B');
    } else if (golNeri > golBianchi) {
      vNeri++;
      serieResult.push('N');
    } else {
      pareggi++;
      serieResult.push('P');
    }
  });

  const teamStats = {
    vittorieBianchi: vBianchi,
    vittorieNeri: vNeri,
    pareggi: pareggi,
    totalePartite: partite.length,
    serie: serieResult,
  };

  if (tipo === 'squadre') {
    return { classifica: [], teamStats };
  }

  const statsMap = new Map<string, number>();

  if (tipo === 'presenze') {
    const matchPlayers = await sql`
      SELECT giocatore_id, squadra 
      FROM partite_giocatori 
      WHERE partita_id = ANY(${partitaIds})
    `;
    const filteredMatchPlayers = matchPlayers.filter((mp) => {
      if (filtroSquadra === 'tutto') return true;
      return mp.squadra === filtroSquadra;
    });

    filteredMatchPlayers.forEach((mp) => {
      if (!mp.giocatore_id) return;
      statsMap.set(mp.giocatore_id, (statsMap.get(mp.giocatore_id) || 0) + 1);
    });
  } else {
    matchEvents.forEach((ev) => {
      if (filtroSquadra !== 'tutto' && ev.squadra !== filtroSquadra) return;

      if (tipo === 'gol' && ev.giocatore_id && !ev.is_autogol) {
        statsMap.set(ev.giocatore_id, (statsMap.get(ev.giocatore_id) || 0) + 1);
      } else if (tipo === 'assist' && ev.assist_man_id) {
        statsMap.set(ev.assist_man_id, (statsMap.get(ev.assist_man_id) || 0) + 1);
      } else if (tipo === 'autogol' && ev.giocatore_id && ev.is_autogol) {
        statsMap.set(ev.giocatore_id, (statsMap.get(ev.giocatore_id) || 0) + 1);
      }
    });
  }

  const playerIds = Array.from(statsMap.keys()).filter((id) => (statsMap.get(id) || 0) > 0);

  if (playerIds.length === 0) {
    return { classifica: [], teamStats };
  }

  const playersData = await sql`
    SELECT id, nickname, avatar_url, avatar_url_w, avatar_url_b 
    FROM giocatori 
    WHERE id = ANY(${playerIds})
  `;

  const defaultAvatar = '/avatars/default.jpg';
  const classifica = playersData
    .map((p) => {
      let avatarPath = p.avatar_url;
      if (filtroSquadra === 'bianchi' && p.avatar_url_w) {
        avatarPath = p.avatar_url_w;
      } else if (filtroSquadra === 'neri' && p.avatar_url_b) {
        avatarPath = p.avatar_url_b;
      }

      return {
        id: p.id,
        nickname: p.nickname || 'Giocatore',
        avatar_url: avatarPath || defaultAvatar,
        valore: statsMap.get(p.id) || 0,
      };
    })
    .sort((a, b) => {
      if (b.valore !== a.valore) {
        return b.valore - a.valore;
      }
      return a.nickname.localeCompare(b.nickname);
    })
    .slice(0, 10);

  return { classifica, teamStats };
}

export async function getAdminInitialData() {
  const stagioni = await sql`SELECT * FROM stagioni ORDER BY id DESC`;
  const giocatori = await sql`SELECT id, nickname, avatar_url, avatar_url_w, avatar_url_b FROM giocatori ORDER BY nickname ASC`;
  
  const partite = await sql`
    SELECT id, stagione_id, TO_CHAR(data, 'YYYY-MM-DD') as data, time, tipologia, formazione_bianchi, formazione_neri, stato 
    FROM partite 
    ORDER BY data DESC, time DESC
  `;
  
  return { 
    stagioni, 
    giocatori, 
    partite: partite.map(sanitizeMatch) 
  };
}

export interface Stagione {
  id: string;
  nome: string;
}

export async function createStagione(nome: string): Promise<Stagione> {
  const result = await sql`
    INSERT INTO stagioni (nome) VALUES (${nome}) 
    RETURNING id, nome
  `;
  return result[0] as Stagione;
}

export async function saveMatch(matchForm: any, selectedMatchId: string | 'new') {
  let result;
  if (selectedMatchId === 'new') {
    result = await sql`
      INSERT INTO partite (stagione_id, data, time, tipologia, formazione_bianchi, formazione_neri, stato)
      VALUES (${matchForm.stagione_id}, ${matchForm.data}, ${matchForm.time}, ${matchForm.tipologia}, ${matchForm.formazione_bianchi}, ${matchForm.formazione_neri}, ${matchForm.stato})
      RETURNING id, stagione_id, TO_CHAR(data, 'YYYY-MM-DD') as data, time, tipologia, formazione_bianchi, formazione_neri, stato
    `;
  } else {
    result = await sql`
      UPDATE partite 
      SET stagione_id = ${matchForm.stagione_id}, data = ${matchForm.data}, time = ${matchForm.time}, tipologia = ${matchForm.tipologia}, formazione_bianchi = ${matchForm.formazione_bianchi}, formazione_neri = ${matchForm.formazione_neri}, stato = ${matchForm.stato}
      WHERE id = ${selectedMatchId}
      RETURNING id, stagione_id, TO_CHAR(data, 'YYYY-MM-DD') as data, time, tipologia, formazione_bianchi, formazione_neri, stato
    `;
  }
  return sanitizeMatch(result[0]);
}

export async function deleteMatch(matchId: string) {
  await sql`DELETE FROM partite WHERE id = ${matchId}`;
  return true;
}

export async function getMatchPlayersAdmin(partitaId: string) {
  const players = await sql`
    SELECT pg.squadra, pg.posizione, pg.giocatore_id, g.id as g_id, g.nickname, g.avatar_url, g.avatar_url_w, g.avatar_url_b
    FROM partite_giocatori pg
    JOIN giocatori g ON pg.giocatore_id = g.id
    WHERE pg.partita_id = ${partitaId}
    ORDER BY pg.squadra ASC, pg.posizione ASC
  `;
  return players.map((p) => ({
    ...p,
    giocatori: {
      id: p.g_id,
      nickname: p.nickname,
      avatar_url: p.avatar_url,
      avatar_url_w: p.avatar_url_w,
      avatar_url_b: p.avatar_url_b,
    },
  }));
}

export async function saveMatchPlayers(partitaId: string, matchPlayers: any[]) {
  await sql`DELETE FROM partite_giocatori WHERE partita_id = ${partitaId}`;

  for (const item of matchPlayers) {
    await sql`
      INSERT INTO partite_giocatori (partita_id, giocatore_id, squadra, posizione)
      VALUES (${partitaId}, ${item.giocatore_id}, ${item.squadra}, ${Number(item.posizione) || 1})
    `;
  }
  return true;
}

// ==========================================
// SEZIONE EVENTI PARTITA (CRONACA / TIMELINE)
// ==========================================

export async function getMatchEventsAdmin(partitaId: string) {
  const events = await sql`
    SELECT pe.*, 
           g.nickname as marcatore_nickname, 
           am.nickname as assist_nickname
    FROM partita_eventi pe
    JOIN giocatori g ON pe.giocatore_id = g.id
    LEFT JOIN giocatori am ON pe.assist_man_id = am.id
    WHERE pe.partita_id = ${partitaId}
    ORDER BY pe.orario ASC
  `;
  return events;
}

export async function saveMatchEvents(partitaId: string, events: any[]) {
  await sql`DELETE FROM partita_eventi WHERE partita_id = ${partitaId}`;

  for (const ev of events) {
    await sql`
      INSERT INTO partita_eventi (partita_id, orario, squadra, giocatore_id, assist_man_id, is_autogol)
      VALUES (${partitaId}, ${ev.orario}, ${ev.squadra}, ${ev.giocatore_id}, ${ev.is_autogol ? null : (ev.assist_man_id || null)}, ${Boolean(ev.is_autogol)})
    `;
  }
  return true;
}

// ==========================================
// SEZIONE GESTIONE GIOCATORI
// ==========================================

export interface Giocatore {
  id: string;
  nickname: string;
  avatar_url: string;
  avatar_url_w?: string | null;
  avatar_url_b?: string | null;
}

export async function getPlayersList(): Promise<Giocatore[]> {
  const players = await sql`
    SELECT id, nickname, avatar_url, avatar_url_w, avatar_url_b 
    FROM giocatori 
    ORDER BY nickname ASC
  `;
  return players as Giocatore[];
}

export async function createPlayer(data: {
  nickname: string;
  avatar_url?: string;
  avatar_url_w?: string;
  avatar_url_b?: string;
}) {
  const defaultAvatar = '/avatars/default.jpg';
  
  // 1. Trova l'ultimo ID inserito nel formato "giocatore_XXXX" per calcolare il successivo
  const lastPlayer = await sql`
    SELECT id FROM giocatori 
    WHERE id LIKE 'giocatore_%' 
    ORDER BY id DESC 
    LIMIT 1
  `;

  let nextNumber = 1;
  if (lastPlayer.length > 0) {
    const lastId = lastPlayer[0].id;
    const parts = lastId.split('_');
    if (parts[1]) {
      nextNumber = parseInt(parts[1], 10) + 1;
    }
  }

  // 2. Genera il nuovo ID con formato a 4 cifre (es. "giocatore_0006")
  const newId = `giocatore_${String(nextNumber).padStart(4, '0')}`;

  // 3. Inserimento esplicito del nuovo ID generato
  const result = await sql`
    INSERT INTO giocatori (id, nickname, avatar_url, avatar_url_w, avatar_url_b)
    VALUES (
      ${newId},
      ${data.nickname}, 
      ${data.avatar_url || defaultAvatar}, 
      ${data.avatar_url_w || null}, 
      ${data.avatar_url_b || null}
    )
    RETURNING id, nickname, avatar_url, avatar_url_w, avatar_url_b
  `;
  return result[0] as Giocatore;
}

export async function updatePlayer(
  id: string,
  data: {
    nickname: string;
    avatar_url?: string;
    avatar_url_w?: string;
    avatar_url_b?: string;
  }
) {
  const defaultAvatar = '/avatars/default.jpg';

  const result = await sql`
    UPDATE giocatori
    SET 
      nickname = ${data.nickname},
      avatar_url = ${data.avatar_url || defaultAvatar},
      avatar_url_w = ${data.avatar_url_w || null},
      avatar_url_b = ${data.avatar_url_b || null}
    WHERE id = ${id}
    RETURNING id, nickname, avatar_url, avatar_url_w, avatar_url_b
  `;
  return result[0] as Giocatore;
}