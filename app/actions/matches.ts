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

  // Recupera i giocatori associati alla partita ordinati per posizione
  const matchPlayers = await sql`
    SELECT squadra, posizione, giocatore_id, gol, assist 
    FROM partite_giocatori 
    WHERE partita_id = ${match.id}
    ORDER BY posizione ASC
  `;

  const playerIds = matchPlayers.map((mp) => mp.giocatore_id);

  let playersData: any[] = [];
  if (playerIds.length > 0) {
    // Recupera i dettagli anagrafici dei giocatori coinvolti
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
      gol: mp.gol || 0,
      assist: mp.assist || 0,
    };
  };

  const whiteTeam = matchPlayers.filter((mp) => mp.squadra === 'bianchi').map(mapPlayerWithStats).filter(Boolean);
  const blackTeam = matchPlayers.filter((mp) => mp.squadra === 'neri').map(mapPlayerWithStats).filter(Boolean);

  const whiteGoals = matchPlayers.filter((mp) => mp.squadra === 'bianchi').reduce((acc, mp) => acc + (mp.gol || 0), 0);
  const blackGoals = matchPlayers.filter((mp) => mp.squadra === 'neri').reduce((acc, mp) => acc + (mp.gol || 0), 0);

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

  let matchStats;
  if (filtroSquadra && filtroSquadra !== 'tutto') {
    matchStats = await sql`
      SELECT gol, assist, squadra 
      FROM partite_giocatori 
      WHERE giocatore_id = ${giocatoreId} 
        AND partita_id = ANY(${partitaIds}) 
        AND squadra = ${filtroSquadra}
    `;
  } else {
    matchStats = await sql`
      SELECT gol, assist, squadra 
      FROM partite_giocatori 
      WHERE giocatore_id = ${giocatoreId} 
        AND partita_id = ANY(${partitaIds})
    `;
  }

  if (matchStats && matchStats.length > 0) {
    const presenze = matchStats.length;
    const gol = matchStats.reduce((acc, item) => acc + (item.gol || 0), 0);
    const assist = matchStats.reduce((acc, item) => acc + (item.assist || 0), 0);
    return { gol, assist, presenze };
  }

  return { gol: 0, assist: 0, presenze: 0 };
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

  const matchPlayers = await sql`
    SELECT partita_id, giocatore_id, squadra, gol, assist 
    FROM partite_giocatori 
    WHERE partita_id = ANY(${partitaIds})
  `;

  let vBianchi = 0;
  let vNeri = 0;
  let pareggi = 0;
  const serieResult: ('B' | 'N' | 'P')[] = [];

  partite.forEach((p) => {
    const pPlayers = matchPlayers.filter((mp) => mp.partita_id === p.id);
    const golBianchi = pPlayers.filter((mp) => mp.squadra === 'bianchi').reduce((acc, curr) => acc + (curr.gol || 0), 0);
    const golNeri = pPlayers.filter((mp) => mp.squadra === 'neri').reduce((acc, curr) => acc + (curr.gol || 0), 0);

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
  const filteredMatchPlayers = matchPlayers.filter((mp) => {
    if (filtroSquadra === 'tutto') return true;
    return mp.squadra === filtroSquadra;
  });

  filteredMatchPlayers.forEach((mp) => {
    const id = mp.giocatore_id;
    if (!id) return;

    const currentVal = statsMap.get(id) || 0;
    if (tipo === 'gol') {
      statsMap.set(id, currentVal + (mp.gol || 0));
    } else if (tipo === 'assist') {
      statsMap.set(id, currentVal + (mp.assist || 0));
    } else if (tipo === 'presenze') {
      statsMap.set(id, currentVal + 1);
    }
  });

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
    .sort((a, b) => b.valore - a.valore)
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
    SELECT pg.*, g.id as g_id, g.nickname, g.avatar_url, g.avatar_url_w, g.avatar_url_b
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
      INSERT INTO partite_giocatori (partita_id, giocatore_id, squadra, posizione, gol, assist)
      VALUES (${partitaId}, ${item.giocatore_id}, ${item.squadra}, ${Number(item.posizione) || 1}, ${Number(item.gol) || 0}, ${Number(item.assist) || 0})
    `;
  }
  return true;
}