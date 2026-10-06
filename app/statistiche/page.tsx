'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/public/lib/supabase';
import { Trophy, Calendar, ChevronRight, X, Footprints, Goal, Award } from 'lucide-react';
import PlayerModal from '../../public/lib/components/PlayerModal';

interface StatGiocatore {
  id: string;
  nickname: string;
  avatar_url: string;
  valore: number;
}

interface Stagione {
  id: string;
  nome: string;
}

type TipoClassifica = 'gol' | 'assist' | 'presenze';

export default function StatistichePage() {
  // Stati per filtri
  const [tipo, setTipo] = useState<TipoClassifica>('gol');
  const [stagioneId, setStagioneId] = useState<string | null>(null);
  const [stagioneNome, setStagioneNome] = useState<string>('');
  const [stagioniDisponibili, setStagioniDisponibili] = useState<Stagione[]>([]);

  // Stati per dati e popup filtro
  const [classifica, setClassifica] = useState<StatGiocatore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Stati per PlayerModal
  const [selectedPlayer, setSelectedPlayer] = useState<StatGiocatore | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);

  // 1. Carica le stagioni disponibili dalla tabella "stagioni"
  useEffect(() => {
    async function loadSeasons() {
      const { data } = await supabase
        .from('stagioni')
        .select('id, nome')
        .order('nome', { ascending: false });

      if (data && data.length > 0) {
        setStagioniDisponibili(data);
        // Imposta la prima stagione di default
        setStagioneId(data[0].id);
        setStagioneNome(data[0].nome);
      }
    }
    loadSeasons();
  }, []);

  // 2. Carica la classifica in base a Tipo e Stagione selezionata
  useEffect(() => {
    async function loadLeaderboard() {
      if (!stagioneId) return;

      setLoading(true);

      // Recupera SOLO le partite giocate della stagione selezionata
      const { data: partite } = await supabase
        .from('partite')
        .select('id')
        .eq('stagione_id', stagioneId)
        .eq('stato', 'giocata');

      const partitaIds = partite?.map((p) => p.id) || [];

      if (partitaIds.length === 0) {
        setClassifica([]);
        setLoading(false);
        return;
      }

      // Recupera le convocazioni/presenze
      const { data: matchPlayers } = await supabase
        .from('partite_giocatori')
        .select('giocatore_id, gol, assist')
        .in('partita_id', partitaIds);

      if (!matchPlayers || matchPlayers.length === 0) {
        setClassifica([]);
        setLoading(false);
        return;
      }

      // Aggrega i dati per giocatore
      const statsMap = new Map<string, number>();

      matchPlayers.forEach((mp) => {
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

      // Filtra chi ha un valore > 0 e prendi i dati anagrafici dei giocatori
      const playerIds = Array.from(statsMap.keys()).filter(
        (id) => (statsMap.get(id) || 0) > 0
      );

      if (playerIds.length === 0) {
        setClassifica([]);
        setLoading(false);
        return;
      }

      const { data: playersData } = await supabase
        .from('giocatori')
        .select('id, nickname, avatar_url')
        .in('id', playerIds);

      const defaultAvatar =
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';

      // Costruisci e ordina la classifica (Top 10)
      const list: StatGiocatore[] = (playersData || [])
        .map((p) => ({
          id: p.id,
          nickname: p.nickname || 'Giocatore',
          avatar_url: p.avatar_url || defaultAvatar,
          valore: statsMap.get(p.id) || 0,
        }))
        .sort((a, b) => b.valore - a.valore)
        .slice(0, 10);

      setClassifica(list);
      setLoading(false);
    }

    loadLeaderboard();
  }, [tipo, stagioneId]);

  // Gestione apertura scheda giocatore
  const handleOpenPlayerModal = (player: StatGiocatore) => {
    setSelectedPlayer(player);
    setIsPlayerModalOpen(true);
  };

  // Gestione selezione stagione
  const handleSelectStagione = (st: Stagione) => {
    setStagioneId(st.id);
    setStagioneNome(st.nome);
  };

  // Gestione selezione tipo statistica
  const handleSelectTipo = (nuovoTipo: TipoClassifica) => {
    setTipo(nuovoTipo);
    setIsModalOpen(false);
  };

  const getTitle = () => {
    switch (tipo) {
      case 'gol':
        return 'Classifica Gol ⚽';
      case 'assist':
        return 'Classifica Assist 👟';
      case 'presenze':
        return 'Classifica Presenze 🏃';
    }
  };

  const getLabelBadge = () => {
    switch (tipo) {
      case 'gol':
        return 'GOL';
      case 'assist':
        return 'ASSIST';
      case 'presenze':
        return 'PRESENZE';
    }
  };

  // Calcolo dinamico della posizione sequenziale per pari merito (Dense Ranking)
  let currentRank = 0;
  let lastValue: number | null = null;

  return (
    <div className="space-y-1.5">
      {/* HEADER CLASSIFICA COMPATTO (CLICCABILE PER POPUP FILTRI) */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
      >
        {/* Badge Categoria */}
        <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0 flex items-center gap-1">
          <Trophy size={11} />
          {getLabelBadge()}
        </span>

        {/* Info Stagione e Categoria */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1">
            <Calendar size={13} className="text-slate-400" />
            {stagioneNome || 'Seleziona Stagione'}
          </span>
          <ChevronRight size={14} className="text-slate-400" />
        </div>
      </div>

      {/* CONTENITORE TABELLA TOP 10 */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
        {/* Titolo Sezione */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 px-0.5">
          <span className="text-slate-900 text-sm font-extrabold flex items-center gap-1.5">
            {getTitle()}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Top 10
          </span>
        </div>

        {/* LISTA GIOCATORI */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            Caricamento classifica...
          </div>
        ) : classifica.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            Nessun dato registrato per questa stagione.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {classifica.map((item) => {
              if (item.valore !== lastValue) {
                currentRank++;
                lastValue = item.valore;
              }

              const rank = currentRank;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenPlayerModal(item)}
                  className="flex items-center justify-between py-2 px-1 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  {/* Posizione e Avatar e Nome */}
                  <div className="flex items-center gap-2.5">
                    {/* Posizione / Medaglia con pari merito */}
                    <div className="w-6 text-center text-xs font-extrabold shrink-0">
                      {rank === 1 && <span className="text-base">🥇</span>}
                      {rank === 2 && <span className="text-base">🥈</span>}
                      {rank === 3 && <span className="text-base">🥉</span>}
                      {rank > 3 && (
                        <span className="text-slate-400 font-bold">{rank}</span>
                      )}
                    </div>

                    {/* Foto Giocatore (Rettangolare stile pitch) */}
                    <div className="w-8 h-10 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
                      <img
                        src={item.avatar_url}
                        alt={item.nickname}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Nickname */}
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                      {item.nickname}
                    </span>
                  </div>

                  {/* Valore Statistica */}
                  <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    <span className="text-xs font-black text-slate-900">
                      {item.valore}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POPUP / MODAL SELEZIONE CLASSIFICA E STAGIONE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col shadow-xl overflow-hidden">
            {/* Header Modal */}
            <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Filtra Classifica</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Scelta Categoria */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Tipo di Statistica
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSelectTipo('gol')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      tipo === 'gol'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Goal size={16} />
                    Gol
                  </button>

                  <button
                    onClick={() => handleSelectTipo('assist')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      tipo === 'assist'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Award size={16} />
                    Assist
                  </button>

                  <button
                    onClick={() => handleSelectTipo('presenze')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      tipo === 'presenze'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Footprints size={16} />
                    Presenze
                  </button>
                </div>
              </div>

              {/* Scelta Stagione */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Stagione
                </label>
                <div className="flex flex-wrap gap-2">
                  {stagioniDisponibili.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleSelectStagione(st)}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                        stagioneId === st.id
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st.nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tasto Chiudi */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-slate-800 transition-colors mt-2"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP SCHEDA GIOCATORE */}
      <PlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => {
          setIsPlayerModalOpen(false);
          setSelectedPlayer(null);
        }}
        giocatore={selectedPlayer}
        stagioneId={stagioneId}
      />
    </div>
  );
}