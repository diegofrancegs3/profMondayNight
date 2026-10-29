// app/api/get-scheduled-matches/route.ts
import { NextResponse } from 'next/server';
import sql from '@/public/lib/db';
import { ENV } from '@/public/lib/env.config';

export async function GET(request: Request) {
  // 1. Controllo di sicurezza tramite Token / Key
  const apiKey = request.headers.get('x-api-key');
  const secretKey = ENV?.WEAR_OS_API_KEY;

  if (!secretKey || !apiKey || apiKey !== secretKey) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 2. Recupera tutte le partite in programma da oggi in poi
    const scheduledMatches = await sql`
      SELECT p.id, p.stagione_id, TO_CHAR(p.data, 'YYYY-MM-DD') as data, p.time, p.tipologia, p.formazione_bianchi, p.formazione_neri, p.stato, s.nome as stagione_nome 
      FROM partite p
      JOIN stagioni s ON p.stagione_id = s.id
      WHERE p.stato = 'programmata' AND p.data >= ${todayStr}
      ORDER BY p.data ASC, p.time ASC
    `;

    if (scheduledMatches.length === 0) {
      return NextResponse.json({ matches: [], tutti_giocatori: [] });
    }

    const matchIds = scheduledMatches.map((m: any) => m.id);

    // 3. Recupera in un'unica query tutti i giocatori convocati per queste partite
    const allMatchPlayers = await sql`
      SELECT partita_id, squadra, posizione, giocatore_id 
      FROM partite_giocatori 
      WHERE partita_id = ANY(${matchIds})
      ORDER BY posizione ASC
    `;

    // 4. Recupera l'elenco globale di tutti i giocatori disponibili (solo nickname)
    const allGiocatori = await sql`
      SELECT nickname 
      FROM giocatori 
      ORDER BY nickname ASC
    `;
    const tutti_giocatori = allGiocatori.map((g: any) => g.nickname);

    // 5. Raccogli tutti gli ID unici dei giocatori convocati per fare un'unica chiamata anagrafica
    const uniquePlayerIds = Array.from(new Set(allMatchPlayers.map((mp: any) => mp.giocatore_id)));
    
    let playersData: any[] = [];
    if (uniquePlayerIds.length > 0) {
      playersData = await sql`
        SELECT id, nickname 
        FROM giocatori 
        WHERE id = ANY(${uniquePlayerIds})
      `;
    }
    const playersMap = new Map(playersData.map((p: any) => [p.id, p.nickname]));

    // 6. Assembla la lista delle partite arricchita con le rispettive rose
    const matches = scheduledMatches.map((m: any) => {
      const matchPList = allMatchPlayers.filter((mp: any) => mp.partita_id === m.id);

      const rosa_bianchi = matchPList
        .filter((mp: any) => mp.squadra === 'bianchi')
        .map((mp: any) => playersMap.get(mp.giocatore_id))
        .filter(Boolean);

      const rosa_neri = matchPList
        .filter((mp: any) => mp.squadra === 'neri')
        .map((mp: any) => playersMap.get(mp.giocatore_id))
        .filter(Boolean);

      return {
        id: m.id,
        stagione_id: m.stagione_id,
        stagione_nome: m.stagione_nome,
        data: m.data ? String(m.data).split('T')[0] : null,
        time: m.time ? String(m.time).slice(0, 5) : null,
        tipologia: m.tipologia,
        formazione_bianchi: m.formazione_bianchi,
        formazione_neri: m.formazione_neri,
        stato: m.stato,
        rosa_bianchi,
        rosa_neri,
      };
    });

    // 7. Restituisci il JSON completo per lo smartwatch
    return NextResponse.json({
      matches,
      tutti_giocatori,
    });

  } catch (error) {
    console.error('Errore API get-scheduled-matches:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}