// app/statistiche/page.tsx
'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useEffect } from 'react';
import { getSeasonsList, getStatisticsData } from '@/app/actions/matches';
import { Trophy, Calendar, ChevronRight, X, Footprints, Goal, Award, Swords, RefreshCw } from 'lucide-react';
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

interface TeamStats {
  vittorieBianchi: number;
  vittorieNeri: number;
  pareggi: number;
  totalePartite: number;
  serie: ('B' | 'N' | 'P')[];
}

type TipoClassifica = 'gol' | 'assist' | 'presenze' | 'squadre';
type FiltroSquadra = 'tutto' | 'bianchi' | 'neri';

export default function StatistichePage() {
  const [tipo, setTipo] = useState<TipoClassifica>('gol');
  const [filtroSquadra, setFiltroSquadra] = useState<FiltroSquadra>('tutto');
  const [stagioneId, setStagioneId] = useState<string | null>(null);
  const [stagioneNome, setStagioneNome] = useState<string>('');
  const [stagioniDisponibili, setStagioniDisponibili] = useState<Stagione[]>([]);

  const [classifica, setClassifica] = useState<StatGiocatore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [teamStats, setTeamStats] = useState<TeamStats>({
    vittorieBianchi: 0,
    vittorieNeri: 0,
    pareggi: 0,
    totalePartite: 0,
    serie: [],
  });

  const [selectedPlayer, setSelectedPlayer] = useState<StatGiocatore | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadSeasons() {
      const data = await getSeasonsList();
      if (data && data.length > 0) {
        setStagioniDisponibili(data);
        setStagioneId(data[0].id);
        setStagioneNome(data[0].nome);
      }
    }
    loadSeasons();
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!stagioneId) return;

      setLoading(true);
      const res = await getStatisticsData(stagioneId, tipo, filtroSquadra);

      setClassifica(res.classifica);
      setTeamStats(res.teamStats);
      setLoading(false);
    }

    loadData();
  }, [tipo, stagioneId, filtroSquadra]);

  const handleToggleFiltroSquadra = () => {
    setFiltroSquadra((prev) => {
      if (prev === 'tutto') return 'bianchi';
      if (prev === 'bianchi') return 'neri';
      return 'tutto';
    });
  };

  const handleOpenPlayerModal = (player: StatGiocatore) => {
    setSelectedPlayer(player);
    setIsPlayerModalOpen(true);
  };

  const handleSelectStagione = (st: Stagione) => {
    setStagioneId(st.id);
    setStagioneNome(st.nome);
  };

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
      case 'squadre':
        return 'Sfida Squadre ⚔️';
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
      case 'squadre':
        return 'SQUADRE';
    }
  };

  const getFiltroSquadraBadge = () => {
    switch (filtroSquadra) {
      case 'bianchi':
        return { label: 'Solo Bianchi ⚪', bg: 'bg-white text-slate-800 border-slate-300' };
      case 'neri':
        return { label: 'Solo Neri ⚫', bg: 'bg-slate-900 text-white border-slate-700' };
      default:
        return { label: 'Tutte le maglie 🌐', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  let currentRank = 0;
  let lastValue: number | null = null;

  const pctBianchi = teamStats.totalePartite
    ? Math.round((teamStats.vittorieBianchi / teamStats.totalePartite) * 100)
    : 0;
  const pctNeri = teamStats.totalePartite
    ? Math.round((teamStats.vittorieNeri / teamStats.totalePartite) * 100)
    : 0;

  const filtroInfo = getFiltroSquadraBadge();

  return (
    <div className="space-y-1.5">
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0 flex items-center gap-1">
          <Trophy size={11} />
          {getLabelBadge()}
        </span>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1">
            <Calendar size={13} className="text-slate-400" />
            {stagioneNome || 'Seleziona Stagione'}
          </span>
          <ChevronRight size={14} className="text-slate-400" />
        </div>
      </div>

      {tipo === 'squadre' ? (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-slate-900 text-sm font-extrabold flex items-center gap-1.5">
              <Swords size={16} className="text-slate-700" />
              <span>Bianchi vs Neri</span>
            </span>
            <span className="text-xs font-bold text-slate-400">
              {teamStats.totalePartite} Partit{teamStats.totalePartite === 1 ? 'a' : 'e'}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              Caricamento statistiche squadre...
            </div>
          ) : teamStats.totalePartite === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              Nessuna partita giocata in questa stagione.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 items-center text-center py-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-extrabold text-slate-700 uppercase">Bianchi</span>
                  <span className="text-2xl font-black text-slate-900">{teamStats.vittorieBianchi}</span>
                  <span className="text-[10px] font-semibold text-slate-400">{pctBianchi}% Vint.</span>
                </div>

                <div className="flex flex-col items-center border-x border-slate-200 px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pareggi</span>
                  <span className="text-lg font-bold text-slate-600">{teamStats.pareggi}</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-extrabold text-slate-900 uppercase">Neri</span>
                  <span className="text-2xl font-black text-slate-900">{teamStats.vittorieNeri}</span>
                  <span className="text-[10px] font-semibold text-slate-400">{pctNeri}% Vint.</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Distribuzione Vittorie</span>
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
                  <div
                    style={{ width: `${(teamStats.vittorieBianchi / teamStats.totalePartite) * 100}%` }}
                    className="bg-slate-300"
                    title="Vittorie Bianchi"
                  />
                  <div
                    style={{ width: `${(teamStats.pareggi / teamStats.totalePartite) * 100}%` }}
                    className="bg-slate-400"
                    title="Pareggi"
                  />
                  <div
                    style={{ width: `${(teamStats.vittorieNeri / teamStats.totalePartite) * 100}%` }}
                    className="bg-slate-900"
                    title="Vittorie Neri"
                  />
                </div>
              </div>

              {teamStats.serie.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Serie Risultati (Cronologica):
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {teamStats.serie.map((res, idx) => (
                      <span
                        key={idx}
                        className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 shadow-2xs ${
                          res === 'B'
                            ? 'bg-slate-200 text-slate-800 border border-slate-300'
                            : res === 'N'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                        title={
                          res === 'B'
                            ? 'Vittoria Bianchi'
                            : res === 'N'
                            ? 'Vittoria Neri'
                            : 'Pareggio'
                        }
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 px-0.5">
            <span className="text-slate-900 text-sm font-extrabold flex items-center gap-1.5">
              {getTitle()}
            </span>

            <button
              onClick={handleToggleFiltroSquadra}
              className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 transition-all shadow-2xs ${filtroInfo.bg}`}
              title="Clicca per cambiare filtro squadra"
            >
              <span>{filtroInfo.label}</span>
              <RefreshCw size={10} className="opacity-60" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              Caricamento classifica...
            </div>
          ) : classifica.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              Nessun dato registrato per questa combinazione di filtri.
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
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 text-center text-xs font-extrabold shrink-0">
                        {rank === 1 && <span className="text-base">🥇</span>}
                        {rank === 2 && <span className="text-base">🥈</span>}
                        {rank === 3 && <span className="text-base">🥉</span>}
                        {rank > 3 && (
                          <span className="text-slate-400 font-bold">{rank}</span>
                        )}
                      </div>

                      <div className="w-8 h-10 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
                        <img
                          src={item.avatar_url}
                          alt={item.nickname}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                        {item.nickname}
                      </span>
                    </div>

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
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col shadow-xl overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Filtra Statistiche</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Tipo di Statistica
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSelectTipo('gol')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
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
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
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
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      tipo === 'presenze'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Footprints size={16} />
                    Presenze
                  </button>

                  <button
                    onClick={() => handleSelectTipo('squadre')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      tipo === 'squadre'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Swords size={16} />
                    Sfida Squadre
                  </button>
                </div>
              </div>

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