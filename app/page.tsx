'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/public/lib/supabase';
import Pitch from '@/public/lib/components/Pitch';
import { Clock, Calendar, ChevronRight, X } from 'lucide-react';

interface Giocatore {
  id: string;
  nickname: string;
  avatar_url: string;
  gol?: number;
  assist?: number;
}

interface Partita {
  id: string;
  data: string;
  time?: string;
  stato?: string;
  tipologia?: string;
  formazione_bianchi?: string;
  formazione_neri?: string;
}

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedMatchId = searchParams.get('matchId');

  const [match, setMatch] = useState<Partita | null>(null);
  const [whiteTeam, setWhiteTeam] = useState<Giocatore[]>([]);
  const [blackTeam, setBlackTeam] = useState<Giocatore[]>([]);
  const [whiteGoals, setWhiteGoals] = useState<number>(0);
  const [blackGoals, setBlackGoals] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Stato per il popup dell'elenco partite
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [matchesList, setMatchesList] = useState<Partita[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);

  // Helper per ricavare il numero massimo di giocatori per squadra in base alla tipologia (es. "7v7" -> 7)
  const getMaxPlayersPerTeam = (tipologia?: string): number => {
    if (!tipologia) return 99; // Se non specificata, non limita
    const matchType = tipologia.match(/(\d+)/);
    return matchType ? parseInt(matchType[1], 10) : 99;
  };

  // 1. Carica la partita selezionata o la più recente/prossima
  useEffect(() => {
    async function loadMatchData() {
      setLoading(true);
      let currentMatch: Partita | null = null;

      if (selectedMatchId) {
        const { data } = await supabase
          .from('partite')
          .select('*')
          .eq('id', selectedMatchId)
          .in('stato', ['programmata', 'giocata'])
          .maybeSingle();
        currentMatch = data;
      }

      if (!currentMatch) {
        const todayStr = new Date().toISOString().split('T')[0];
        let { data } = await supabase
          .from('partite')
          .select('*')
          .in('stato', ['programmata', 'giocata'])
          .gte('data', todayStr)
          .order('data', { ascending: true })
          .order('time', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!data) {
          const { data: lastMatch } = await supabase
            .from('partite')
            .select('*')
            .in('stato', ['programmata', 'giocata'])
            .order('data', { ascending: false })
            .order('time', { ascending: false })
            .limit(1)
            .maybeSingle();
          data = lastMatch;
        }

        currentMatch = data;
      }

      setMatch(currentMatch);

      if (currentMatch) {
        const maxPlayers = getMaxPlayersPerTeam(currentMatch.tipologia);

        // Estraiamo solo i giocatori con posizione da 1 a maxPlayers per squadra
        const { data: matchPlayers } = await supabase
          .from('partite_giocatori')
          .select('squadra, posizione, giocatore_id, gol, assist')
          .eq('partita_id', currentMatch.id)
          .lte('posizione', maxPlayers)
          .order('posizione', { ascending: true });

        const playerIds = matchPlayers?.map((mp) => mp.giocatore_id) || [];

        const { data: playersData } = playerIds.length
          ? await supabase
              .from('giocatori')
              .select('id, nickname, avatar_url')
              .in('id', playerIds)
          : { data: [] };

        const playersMap = new Map(playersData?.map((p) => [p.id, p]));

        const mapPlayerWithStats = (mp: any): Giocatore | undefined => {
          const base = playersMap.get(mp.giocatore_id);
          if (!base) return undefined;
          return {
            ...base,
            gol: mp.gol || 0,
            assist: mp.assist || 0,
          };
        };

        const wTeam =
          matchPlayers
            ?.filter((mp) => mp.squadra === 'bianchi')
            .map(mapPlayerWithStats)
            .filter((p): p is Giocatore => p !== undefined) || [];

        const bTeam =
          matchPlayers
            ?.filter((mp) => mp.squadra === 'neri')
            .map(mapPlayerWithStats)
            .filter((p): p is Giocatore => p !== undefined) || [];

        const wGoals =
          matchPlayers
            ?.filter((mp) => mp.squadra === 'bianchi')
            .reduce((acc, mp) => acc + (mp.gol || 0), 0) ?? 0;

        const bGoals =
          matchPlayers
            ?.filter((mp) => mp.squadra === 'neri')
            .reduce((acc, mp) => acc + (mp.gol || 0), 0) ?? 0;

        setWhiteTeam(wTeam);
        setBlackTeam(bTeam);
        setWhiteGoals(wGoals);
        setBlackGoals(bGoals);
      }

      setLoading(false);
    }

    loadMatchData();
  }, [selectedMatchId]);

  // 2. Carica l'elenco delle partite per il popup quando viene aperto
  const openMatchesModal = async () => {
    setIsModalOpen(true);
    if (matchesList.length === 0) {
      setLoadingList(true);
      const { data } = await supabase
        .from('partite')
        .select('*')
        .in('stato', ['programmata', 'giocata'])
        .order('data', { ascending: false })
        .order('time', { ascending: false });

      if (data) {
        setMatchesList(data);
      }
      setLoadingList(false);
    }
  };

  const handleSelectMatch = (matchId: string) => {
    setIsModalOpen(false);
    router.push(`/?matchId=${matchId}`);
  };

  const formatDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return '';
    const dateObj = new Date(`${dateStr}T${timeStr || '00:00'}`);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }
    return dateStr;
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-500 font-medium text-sm">
        Caricamento partita in corso...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-20 text-slate-500 font-medium text-sm">
        Nessuna partita presente nel sistema.
      </div>
    );
  }

  const isPlayed = match.stato === 'finita' || match.stato === 'giocata';
  const dateFormatted = formatDate(match.data, match.time);

  return (
    <div className="space-y-1.5">
      {/* HEADER PARTITA COMPATTO ED ESSENZIALE (CLICCABILE PER POPUP) */}
      <div
        onClick={openMatchesModal}
        className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
      >
        {/* Badge Stato */}
        <span
          className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border shrink-0 ${
            isPlayed
              ? 'bg-slate-100 text-slate-600 border-slate-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {isPlayed ? 'Giocata' : 'Prossimo Match'}
        </span>

        {/* Data e Ora */}
        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1 capitalize">
            <Calendar size={13} className="text-slate-400" />
            {dateFormatted}
          </span>
          {match.time && (
            <span className="flex items-center gap-1 text-slate-500">
              <Clock size={13} className="text-slate-400" />
              {match.time.slice(0, 5)}
            </span>
          )}
          <ChevronRight size={14} className="text-slate-400" />
        </div>
      </div>

      {/* TABELLONE FORMAZIONI + CAMPO PITCH */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
        {/* Intestazione Squadre */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 px-0.5">
          <span className="text-slate-900 text-sm font-extrabold flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-slate-300 bg-white inline-block shadow-xs"></span>
            Bianchi <span className="text-xs font-normal text-slate-400">({match.formazione_bianchi || '1-2-1'})</span>
          </span>

          {isPlayed ? (
            <span className="text-sm font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {whiteGoals} - {blackGoals}
            </span>
          ) : (
            <span className="text-slate-300 text-[10px] font-bold">VS</span>
          )}

          <span className="text-slate-900 text-sm font-extrabold flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-900 inline-block shadow-xs"></span>
            Neri <span className="text-xs font-normal text-slate-400">({match.formazione_neri || '1-2-1'})</span>
          </span>
        </div>

        <Pitch
          matchType={match.tipologia}
          formationWhite={match.formazione_bianchi}
          formationBlack={match.formazione_neri}
          whiteTeam={whiteTeam}
          blackTeam={blackTeam}
        />
      </div>

      {/* POPUP / MODAL SELEZIONE PARTITE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col shadow-xl overflow-hidden">
            {/* Header Modal */}
            <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Seleziona una partita</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lista Partite a Scorrimento */}
            <div className="overflow-y-auto p-2 space-y-1.5 flex-1 divide-y divide-slate-100">
              {loadingList ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Caricamento elenco partite...
                </div>
              ) : matchesList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Nessuna partita trovata.
                </div>
              ) : (
                matchesList.map((m) => {
                  const isSelected = m.id === match.id;
                  const mPlayed = m.stato === 'finita' || m.stato === 'giocata';

                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMatch(m.id)}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-slate-100 border border-slate-300'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            mPlayed
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {mPlayed ? 'Giocata' : 'Programmata'}
                        </span>
                        <div className="text-xs font-semibold text-slate-800 capitalize">
                          {formatDate(m.data, m.time)}
                          {m.time && (
                            <span className="text-slate-400 font-normal ml-1.5">
                              {m.time.slice(0, 5)}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight size={14} className="text-slate-400" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}