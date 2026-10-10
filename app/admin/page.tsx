// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  getAdminInitialData, 
  createStagione, 
  saveMatch, 
  deleteMatch, 
  getMatchPlayersAdmin, 
  saveMatchPlayers 
} from '@/app/actions/matches';
import { Save, Plus, Trash2, Calendar, Users, Shield, LogOut, Lock, LayoutGrid } from 'lucide-react';
import Pitch from '@/public/lib/components/Pitch';
import { FORMATIONS, getFormationsForType, getDefaultFormationForType } from '@/public/lib/formations';

interface Stagione {
  id: string;
  nome: string;
}

interface Giocatore {
  id: string;
  nickname: string;
  avatar_url?: string;
  avatar_url_w?: string;
  avatar_url_b?: string;
}

interface Partita {
  id: string;
  stagione_id: string;
  data: string;
  time?: string;
  tipologia: string;
  formazione_bianchi: string;
  formazione_neri: string;
  stato: string;
}

interface PartitaGiocatore {
  id?: number;
  partita_id: string;
  giocatore_id: string;
  squadra: 'bianchi' | 'neri';
  posizione: number;
  gol: number;
  assist: number;
  giocatori?: Giocatore;
}

export default function AdminPage() {
  const [session, setSession] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [stagioni, setStagioni] = useState<Stagione[]>([]);
  const [selectedStagioneId, setSelectedStagioneId] = useState<string>('');
  const [isCreatingStagione, setIsCreatingStagione] = useState<boolean>(false);
  const [nuovaStagioneNome, setNuovaStagioneNome] = useState('');

  const [giocatori, setGiocatori] = useState<Giocatore[]>([]);
  const [partite, setPartite] = useState<Partita[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedMatchId, setSelectedMatchId] = useState<string | 'new' | null>(null);

  const [matchForm, setMatchForm] = useState<Omit<Partita, 'id'>>({
    stagione_id: '',
    data: new Date().toISOString().split('T')[0],
    time: '20:00',
    tipologia: '5v5',
    formazione_bianchi: '1-2-1',
    formazione_neri: '1-2-1',
    stato: 'tbd',
  });

  const [matchPlayers, setMatchPlayers] = useState<PartitaGiocatore[]>([]);

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

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_auth') === 'true';
    if (isAuth) {
      setSession(true);
      loadBaseData();
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    if (passwordInput === 'admin2026') { // Password configurabile per il circolo
      sessionStorage.setItem('admin_auth', 'true');
      setSession(true);
      loadBaseData();
    } else {
      setLoginError('Password non errata');
    }
  }

  async function handleLogout() {
    sessionStorage.removeItem('admin_auth');
    setSession(false);
  }

  async function loadBaseData() {
    setLoading(true);
    const data = await getAdminInitialData();

    if (data.stagioni && data.stagioni.length > 0) {
      setStagioni(data.stagioni as Stagione[]);
      const maxStagione = data.stagioni[0];
      setSelectedStagioneId(maxStagione.id);
      setMatchForm((prev) => ({ ...prev, stagione_id: maxStagione.id }));
    }

    if (data.giocatori) setGiocatori(data.giocatori as Giocatore[]);
    if (data.partite) setPartite(data.partite as Partita[]);

    setLoading(false);
  }

  function handleStagioneSelectChange(value: string) {
    if (value === 'new_season') {
      setIsCreatingStagione(true);
    } else {
      setIsCreatingStagione(false);
      setSelectedStagioneId(value);
      setMatchForm((prev) => ({ ...prev, stagione_id: value }));
      setSelectedMatchId(null);
    }
  }

  async function handleCreateStagione() {
    if (!nuovaStagioneNome.trim()) return;

    const data = await createStagione(nuovaStagioneNome.trim());

    if (data) {
      const updatedStagioni = [data, ...stagioni];
      setStagioni(updatedStagioni);
      setSelectedStagioneId(data.id);
      setMatchForm((prev) => ({ ...prev, stagione_id: data.id }));
      setNuovaStagioneNome('');
      setIsCreatingStagione(false);
      setSelectedMatchId(null);
      alert('Nuova stagione creata e selezionata!');
    } else {
      alert('Errore creazione stagione');
    }
  }

  async function handleSelectMatch(matchId: string) {
    if (!matchId) {
      setSelectedMatchId(null);
      return;
    }

    setSelectedMatchId(matchId);
    const match = partite.find((m) => m.id === matchId);
    if (match) {
      setMatchForm({
        stagione_id: match.stagione_id,
        data: match.data || '',
        time: match.time ? match.time.slice(0, 5) : '20:00',
        tipologia: match.tipologia || '5v5',
        formazione_bianchi: match.formazione_bianchi || '1-2-1',
        formazione_neri: match.formazione_neri || '1-2-1',
        stato: match.stato || 'tbd',
      });
      loadMatchPlayers(match.id);
    }
  }

  function handleStartNewMatch() {
    setSelectedMatchId('new');
    setMatchForm({
      stagione_id: selectedStagioneId || stagioni[0]?.id || '',
      data: new Date().toISOString().split('T')[0],
      time: '20:00',
      tipologia: '5v5',
      formazione_bianchi: '1-2-1',
      formazione_neri: '1-2-1',
      stato: 'tbd',
    });
    setMatchPlayers([]);
  }

  function handleTipologiaChange(newTipologia: string) {
    const validFormations = getFormationsForType(newTipologia);
    const defaultFormation = getDefaultFormationForType(newTipologia);

    const newFormazioneBianchi = validFormations.includes(matchForm.formazione_bianchi)
      ? matchForm.formazione_bianchi
      : defaultFormation;

    const newFormazioneNeri = validFormations.includes(matchForm.formazione_neri)
      ? matchForm.formazione_neri
      : defaultFormation;

    setMatchForm({
      ...matchForm,
      tipologia: newTipologia,
      formazione_bianchi: newFormazioneBianchi,
      formazione_neri: newFormazioneNeri,
    });
  }

  async function loadMatchPlayers(partitaId: string) {
    const data = await getMatchPlayersAdmin(partitaId);
    if (data) {
      setMatchPlayers(data as PartitaGiocatore[]);
    }
  }

  async function handleSaveMatch() {
    if (!selectedMatchId) {
      alert('Nessuna partita selezionata!');
      return;
    }

    if (!matchForm.stagione_id) {
      alert('Seleziona una stagione!');
      return;
    }

    const data = await saveMatch(matchForm, selectedMatchId);
    if (data) {
      if (selectedMatchId === 'new') {
        setPartite([data, ...partite]);
        setSelectedMatchId(data.id);
        alert('Partita creata! Ora puoi assegnare i giocatori.');
      } else {
        setPartite(partite.map((p) => (p.id === selectedMatchId ? { ...p, ...matchForm } : p)));
        alert('Dati partita aggiornati!');
      }
    } else {
      alert('Errore durante il salvataggio della partita.');
    }
  }

  async function handleDeleteMatch() {
    if (!selectedMatchId || selectedMatchId === 'new') return;

    if (matchForm.stato !== 'tbd') {
      alert("È possibile eliminare una partita solo se lo stato è 'tbd'.");
      return;
    }

    if (matchPlayers.length > 0) {
      alert('Non puoi eliminare una partita a cui sono stati assegnati dei giocatori!');
      return;
    }

    const confirmDelete = window.confirm('Sei sicuro di voler eliminare questa partita?');
    if (!confirmDelete) return;

    await deleteMatch(selectedMatchId);
    alert('Partita eliminata con successo!');
    setPartite(partite.filter((p) => p.id !== selectedMatchId));
    setSelectedMatchId(null);
    setMatchPlayers([]);
  }

  function handleAddPlayerToMatch(squadra: 'bianchi' | 'neri') {
    if (selectedMatchId === 'new' || !selectedMatchId) {
      alert('Salva prima la partita per poter aggiungere i giocatori!');
      return;
    }

    const usedIds = new Set(matchPlayers.map((mp) => mp.giocatore_id));
    const available = giocatori.find((g) => !usedIds.has(g.id));

    if (!available) {
      alert('Tutti i giocatori disponibili sono già stati aggiunti!');
      return;
    }

    const maxPos = matchPlayers
      .filter((p) => p.squadra === squadra)
      .reduce((max, p) => Math.max(max, p.posizione), 0);

    const newPlayer: PartitaGiocatore = {
      partita_id: selectedMatchId,
      giocatore_id: available.id,
      squadra: squadra,
      posizione: Math.min(maxPos + 1, 11),
      gol: 0,
      assist: 0,
    };

    setMatchPlayers([...matchPlayers, newPlayer]);
  }

  function handleUpdatePlayer(index: number, field: keyof PartitaGiocatore, value: any) {
    const updated = [...matchPlayers];
    updated[index] = { ...updated[index], [field]: value };
    setMatchPlayers(updated);
  }

  function handleRemovePlayer(index: number) {
    const updated = matchPlayers.filter((_, i) => i !== index);
    setMatchPlayers(updated);
  }

  async function handleSavePlayers() {
    if (!selectedMatchId || selectedMatchId === 'new') return;
    await saveMatchPlayers(selectedMatchId, matchPlayers);
    alert('Formazione e statistiche salvate con successo!');
    loadMatchPlayers(selectedMatchId);
  }

  const filteredPartite = partite.filter((p) => p.stagione_id === selectedStagioneId);

  const whiteTeam = matchPlayers
    .filter((p) => p.squadra === 'bianchi')
    .map((p) => ({
      ...p,
      giocatore: giocatori.find((g) => g.id === p.giocatore_id),
    }));

  const blackTeam = matchPlayers
    .filter((p) => p.squadra === 'neri')
    .map((p) => ({
      ...p,
      giocatore: giocatori.find((g) => g.id === p.giocatore_id),
    }));

  const availableFormations = getFormationsForType(matchForm.tipologia);
  const usedGiocatoriIds = new Set(matchPlayers.map((p) => p.giocatore_id));

  const canDeleteMatch =
    selectedMatchId !== null &&
    selectedMatchId !== 'new' &&
    matchForm.stato === 'tbd' &&
    matchPlayers.length === 0;

  if (!session) {
    return (
      <div className="p-4 max-w-sm mx-auto my-10 space-y-4 text-slate-800 text-xs">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Lock size={18} className="text-slate-700" />
            <h1 className="font-bold text-sm text-slate-900">Area Riservata Admin</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Password Admin</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500"
              />
            </div>

            {loginError && <div className="text-red-500 text-[11px] font-medium">{loginError}</div>}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg transition-colors shadow-xs"
            >
              Accedi al Pannello
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-4 text-center text-xs text-slate-500">Caricamento pannello admin...</div>;
  }

  return (
    <div className="p-3 max-w-lg mx-auto space-y-4 text-slate-800 text-xs">
      <div className="flex items-center justify-between bg-slate-900 text-white p-3 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-emerald-400" />
          <h1 className="font-bold text-sm tracking-wide">Pannello Admin Partite</h1>
        </div>
        <button
          onClick={handleLogout}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
          title="Disconnetti"
        >
          <LogOut size={14} /> Esci
        </button>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Stagione</label>
            <select
              value={isCreatingStagione ? 'new_season' : selectedStagioneId}
              onChange={(e) => handleStagioneSelectChange(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium text-slate-800 focus:outline-none focus:border-slate-500"
            >
              {stagioni.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
              <option value="new_season">+ Inserisci nuova stagione</option>
            </select>

            {isCreatingStagione && (
              <div className="flex gap-1.5 mt-2">
                <input
                  type="text"
                  placeholder="Nome nuova stagione"
                  value={nuovaStagioneNome}
                  onChange={(e) => setNuovaStagioneNome(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
                />
                <button
                  onClick={handleCreateStagione}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px] shrink-0"
                >
                  <Plus size={12} /> Salva
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Seleziona Partita</label>
            <select
              value={selectedMatchId === 'new' ? '' : selectedMatchId || ''}
              onChange={(e) => handleSelectMatch(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50 font-medium text-slate-800 focus:outline-none focus:border-slate-500 capitalize"
            >
              <option value="">-- Nessuna partita selezionata --</option>
              {filteredPartite.map((m) => {
                const isPlayed = m.stato === 'finita' || m.stato === 'giocata';
                const labelStato = isPlayed ? 'Giocata' : m.stato === 'tbd' ? 'TBD' : 'Programmata';
                const formattedDate = formatDate(m.data, m.time);
                const timeStr = m.time ? ` ${m.time.slice(0, 5)}` : '';

                return (
                  <option key={m.id} value={m.id}>
                    [{labelStato}] {formattedDate}{timeStr} - {m.tipologia}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="pt-1 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleStartNewMatch}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              selectedMatchId === 'new'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <Plus size={14} /> Crea Nuova Partita
          </button>
        </div>
      </div>

      {selectedMatchId && (
        <>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b pb-1.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-500" />
                <span>Dettagli Partita {selectedMatchId === 'new' ? '(Nuova)' : ''}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Stato Partita</label>
                <select
                  value={matchForm.stato}
                  onChange={(e) => setMatchForm({ ...matchForm, stato: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white"
                >
                  <option value="programmata">Programmata</option>
                  <option value="giocata">Giocata</option>
                  <option value="tbd">Tbd</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Tipologia</label>
                <select
                  value={matchForm.tipologia}
                  onChange={(e) => handleTipologiaChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white"
                >
                  {Object.keys(FORMATIONS).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Data</label>
                <input
                  type="date"
                  value={matchForm.data}
                  onChange={(e) => setMatchForm({ ...matchForm, data: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Ora</label>
                <input
                  type="time"
                  value={matchForm.time}
                  onChange={(e) => setMatchForm({ ...matchForm, time: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Modulo Bianchi</label>
                <select
                  value={matchForm.formazione_bianchi}
                  onChange={(e) => setMatchForm({ ...matchForm, formazione_bianchi: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white font-semibold text-slate-800"
                >
                  {availableFormations.map((fmt) => (
                    <option key={`white-${fmt}`} value={fmt}>
                      {fmt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Modulo Neri</label>
                <select
                  value={matchForm.formazione_neri}
                  onChange={(e) => setMatchForm({ ...matchForm, formazione_neri: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white font-semibold text-slate-800"
                >
                  {availableFormations.map((fmt) => (
                    <option key={`black-${fmt}`} value={fmt}>
                      {fmt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSaveMatch}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Save size={15} />
                {selectedMatchId === 'new' ? 'Crea Partita' : 'Salva Modifiche'}
              </button>

              {selectedMatchId !== 'new' && (
                <button
                  onClick={handleDeleteMatch}
                  disabled={!canDeleteMatch}
                  className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
                    canDeleteMatch
                      ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Trash2 size={15} />
                  Elimina
                </button>
              )}
            </div>
          </div>

          {selectedMatchId !== 'new' && (
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b pb-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Users size={14} className="text-emerald-600" />
                  <span>Convocati e Statistiche</span>
                </span>
                <button
                  onClick={handleSavePlayers}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded-lg font-semibold flex items-center gap-1 text-xs"
                >
                  <Save size={13} /> Salva Rosa
                </button>
              </div>

              {(['bianchi', 'neri'] as const).map((squadra) => {
                const teamPlayers = matchPlayers
                  .map((p, originalIndex) => ({ ...p, originalIndex }))
                  .filter((p) => p.squadra === squadra);

                const isBianchi = squadra === 'bianchi';

                return (
                  <div
                    key={squadra}
                    className={`p-2.5 rounded-xl border ${
                      isBianchi ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 text-white border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-extrabold capitalize text-xs tracking-wide">Squadra {squadra}</span>
                      <button
                        onClick={() => handleAddPlayerToMatch(squadra)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                          isBianchi
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                            : 'bg-slate-700 hover:bg-slate-600 text-white'
                        }`}
                      >
                        <Plus size={12} /> Aggiungi Giocatore
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {teamPlayers.length === 0 ? (
                        <div className="text-[11px] opacity-50 italic">Nessun giocatore assegnato.</div>
                      ) : (
                        teamPlayers.map((item) => {
                          const selectableGiocatori = giocatori.filter(
                            (g) => !usedGiocatoriIds.has(g.id) || g.id === item.giocatore_id
                          );

                          return (
                            <div
                              key={item.originalIndex}
                              className={`flex items-center gap-1.5 p-1.5 rounded-lg border ${
                                isBianchi ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
                              }`}
                            >
                              <select
                                value={item.giocatore_id}
                                onChange={(e) => handleUpdatePlayer(item.originalIndex, 'giocatore_id', e.target.value)}
                                className={`flex-1 rounded p-1 text-xs font-semibold ${
                                  isBianchi ? 'bg-slate-50 text-slate-800' : 'bg-slate-900 text-white border-slate-700'
                                }`}
                              >
                                {selectableGiocatori.map((g) => (
                                  <option key={g.id} value={g.id}>
                                    {g.nickname}
                                  </option>
                                ))}
                              </select>

                              <div className="flex items-center gap-1">
                                <span className="text-[10px] opacity-70 font-medium">Pos:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="11"
                                  value={item.posizione}
                                  onChange={(e) =>
                                    handleUpdatePlayer(item.originalIndex, 'posizione', parseInt(e.target.value) || 1)
                                  }
                                  className={`w-10 p-1 text-center rounded text-xs font-bold ${
                                    isBianchi ? 'border border-slate-200' : 'bg-slate-900 text-white border-slate-700'
                                  }`}
                                />
                              </div>

                              {matchForm.stato === 'giocata' && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-emerald-500">G:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.gol}
                                      onChange={(e) =>
                                        handleUpdatePlayer(item.originalIndex, 'gol', parseInt(e.target.value) || 0)
                                      }
                                      className={`w-9 p-1 text-center rounded text-xs font-bold ${
                                        isBianchi ? 'border border-slate-200' : 'bg-slate-900 text-white border-slate-700'
                                      }`}
                                    />
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-blue-500">A:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.assist}
                                      onChange={(e) =>
                                        handleUpdatePlayer(item.originalIndex, 'assist', parseInt(e.target.value) || 0)
                                      }
                                      className={`w-9 p-1 text-center rounded text-xs font-bold ${
                                        isBianchi ? 'border border-slate-200' : 'bg-slate-900 text-white border-slate-700'
                                      }`}
                                    />
                                  </div>
                                </>
                              )}

                              <button
                                onClick={() => handleRemovePlayer(item.originalIndex)}
                                className="p-1 text-red-500 hover:text-red-700 rounded ml-0.5"
                                title="Rimuovi giocatore"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b pb-1.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <LayoutGrid size={14} className="text-emerald-600" />
                <span>Anteprima Campo da Gioco</span>
              </span>
            </div>

            <Pitch
              matchType={matchForm.tipologia}
              formationWhite={matchForm.formazione_bianchi}
              formationBlack={matchForm.formazione_neri}
              whiteTeam={whiteTeam}
              blackTeam={blackTeam}
              stagioneId={selectedStagioneId}
            />
          </div>
        </>
      )}
    </div>
  );
}