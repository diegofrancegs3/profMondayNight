// app/api/get-match/route.ts
import { NextResponse } from 'next/server';
import sql from '@/public/lib/db';
import { ENV } from '@/public/lib/env.config';

interface PartitaRow {
  id: string;
  stagione_id: string;
  data: string;
  time: string;
  tipologia: string;
  formazione_bianchi: string;
  formazione_neri: string;
  stato: string;
}

export async function GET(request: Request) {
  // 1. Controllo di sicurezza tramite Token / Key presa da public/lib/env.config.js
  const apiKey = request.headers.get('x-api-key');
  const secretKey = ENV?.WEAR_OS_API_KEY;

  if (!secretKey || !apiKey || apiKey !== secretKey) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    // 2. Recupera la partita attiva o la prossima partita
    let currentMatch: PartitaRow | null = null;

    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = await sql<PartitaRow[]>`
      SELECT id, stagione_id, TO_CHAR(data, 'YYYY-MM-DD') as data, time, tipologia, formazione_bianchi, formazione_neri, stato 
      FROM partite 
      WHERE stato IN ('programmata', 'giocata') AND data >= ${todayStr}
      ORDER BY data ASC, time ASC 
      LIMIT 1
    `;

    if (upcoming.length > 0) {
      currentMatch = upcoming[0];
    } else {
      const lastMatch = await sql<PartitaRow[]>`
        SELECT id, stagione_id, TO_CHAR(data, 'YYYY-MM-DD') as data, time, tipologia, formazione_bianchi, formazione_neri, stato 
        FROM partite 
        WHERE stato IN ('programmata', 'giocata')
        ORDER BY data DESC, time DESC 
        LIMIT 1
      `;
      currentMatch = lastMatch[0] || null;
    }

    if (!currentMatch) {
      return NextResponse.json({ error: 'Nessuna partita trovata' }, { status: 404 });
    }

    // Pulisci le date/orari mantenendo la tipizzazione esplicita
    const match = {
      ...currentMatch,
      data: currentMatch.data ? String(currentMatch.data).split('T')[0] : null,
      time: currentMatch.time ? String(currentMatch.time).slice(0, 5) : null,
    };

    // 3. Recupera i giocatori convocati per questa partita
    const matchPlayers = await sql`
      SELECT squadra, posizione, giocatore_id 
      FROM partite_giocatori 
      WHERE partita_id = ${match.id}
      ORDER BY posizione ASC
    `;

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

    const mapPlayer = (mp: any) => {
      const base = playersMap.get(mp.giocatore_id);
      if (!base) return null;
      return {
        id: base.id,
        nickname: base.nickname,
        avatar_url: base.avatar_url || defaultAvatar,
        posizione: mp.posizione,
      };
    };

    const rosa_bianchi = matchPlayers
      .filter((mp) => mp.squadra === 'bianchi')
      .map(mapPlayer)
      .filter(Boolean);

    const rosa_neri = matchPlayers
      .filter((mp) => mp.squadra === 'neri')
      .map(mapPlayer)
      .filter(Boolean);

    // 4. Restituisci il JSON pulito per l'app Wear OS
    return NextResponse.json({
      match_id: match.id,
      match_info: match,
      rosa_bianchi,
      rosa_neri,
    });

  } catch (error) {
    console.error('Errore API get-match:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}