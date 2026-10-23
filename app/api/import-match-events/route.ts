import { NextResponse } from 'next/server';
import sql from '@/public/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partita_id, events } = body;

    if (!partita_id || !Array.isArray(events)) {
      return NextResponse.json({ success: false, error: 'Dati mancanti o non validi' }, { status: 400 });
    }

    // 1. Verifica che la partita esista e sia in stato 'programmata'
    const partite = await sql`
      SELECT id, stato FROM partite WHERE id = ${partita_id} LIMIT 1
    `;

    if (partite.length === 0 || partite[0].stato !== 'programmata') {
      return NextResponse.json({ success: false, error: 'Partita non trovata o non in stato programmata' }, { status: 404 });
    }

    // 2. Recupera i giocatori convocati e la loro squadra per questa partita
    const matchPlayers = await sql`
      SELECT giocatore_id, squadra FROM partite_giocatori WHERE partita_id = ${partita_id}
    `;
    const allowedPlayerIds = new Set(matchPlayers.map((mp) => mp.giocatore_id));
    const whitePlayerIds = new Set(matchPlayers.filter((mp) => mp.squadra === 'bianchi').map((mp) => mp.giocatore_id));
    const blackPlayerIds = new Set(matchPlayers.filter((mp) => mp.squadra === 'neri').map((mp) => mp.giocatore_id));

    if (allowedPlayerIds.size === 0) {
      return NextResponse.json({ success: false, error: 'Nessun giocatore convocato per questa partita' }, { status: 400 });
    }

    // 3. Riconciliazione dei nickname estraendo tutti i nickname unici dagli eventi in arrivo
    const nicknamesToCheck = new Set<string>();
    events.forEach((ev: any) => {
      if (ev.giocatore_nickname) nicknamesToCheck.add(ev.giocatore_nickname);
      if (ev.assist_nickname) nicknamesToCheck.add(ev.assist_nickname);
    });

    let playersMap = new Map<string, string>(); // nickname -> giocatore_id
    if (nicknamesToCheck.size > 0) {
      const dbPlayers = await sql`
        SELECT id, nickname FROM giocatori WHERE nickname = ANY(${Array.from(nicknamesToCheck)})
      `;
      dbPlayers.forEach((p) => {
        playersMap.set(p.nickname, p.id);
      });
    }

    // 4. Mappa e valida gli eventi verificando che i giocatori facciano parte della rosa e della squadra corretta
    const processedEvents = [];
    for (const ev of events) {
      const giocatore_id = ev.giocatore_nickname ? playersMap.get(ev.giocatore_nickname) : null;
      const assist_man_id = ev.assist_nickname ? playersMap.get(ev.assist_nickname) : null;

      // Se il marcatore è specificato ma non esiste o non è in rosa, blocco l'importazione
      if (ev.giocatore_nickname && (!giocatore_id || !allowedPlayerIds.has(giocatore_id))) {
        return NextResponse.json({ 
          success: false, 
          error: `Giocatore "${ev.giocatore_nickname}" non trovato o non convocato in questa partita` 
        }, { status: 400 });
      }

      // Se è presente il marcatore, verifichiamo la squadra corretta (invertita in caso di autogol)
      if (giocatore_id) {
        const squadraRealeGiocatore = ev.is_autogol 
          ? (ev.squadra === 'bianchi' ? 'neri' : 'bianchi') 
          : ev.squadra;

        const squadraValida = squadraRealeGiocatore === 'bianchi' 
          ? whitePlayerIds.has(giocatore_id) 
          : blackPlayerIds.has(giocatore_id);

        if (!squadraValida) {
          return NextResponse.json({ 
            success: false, 
            error: `Il giocatore "${ev.giocatore_nickname}" non fa parte della squadra corretta per questo evento` 
          }, { status: 400 });
        }
      }

      // Se l'assistman è specificato ma non esiste o non è in rosa, blocco l'importazione
      if (ev.assist_nickname && (!assist_man_id || !allowedPlayerIds.has(assist_man_id))) {
        return NextResponse.json({ 
          success: false, 
          error: `Assist man "${ev.assist_nickname}" non trovato o non convocato in questa partita` 
        }, { status: 400 });
      }

      processedEvents.push({
        orario: ev.orario || '00:00',
        squadra: ev.squadra, // 'bianchi' o 'neri'
        giocatore_id: giocatore_id || null,
        assist_man_id: ev.is_autogol ? null : (assist_man_id || null),
        is_autogol: Boolean(ev.is_autogol)
      });
    }

    // 5. Transazione per sovrascrivere gli eventi esistenti
    await sql`BEGIN`;

    // Elimina eventuali eventi precedenti per questa partita
    await sql`DELETE FROM partita_eventi WHERE partita_id = ${partita_id}`;

    // Inserisce i nuovi eventi
    for (const ev of processedEvents) {
      await sql`
        INSERT INTO partita_eventi (partita_id, orario, squadra, giocatore_id, assist_man_id, is_autogol)
        VALUES (${partita_id}, ${ev.orario}, ${ev.squadra}, ${ev.giocatore_id}, ${ev.assist_man_id}, ${ev.is_autogol})
      `;
    }

    await sql`COMMIT`;

    return NextResponse.json({ success: true, message: 'Tabellino importato con successo' });

  } catch (error) {
    await sql`ROLLBACK`;
    console.error('Errore durante l\'importazione del tabellino:', error);
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500 });
  }
}