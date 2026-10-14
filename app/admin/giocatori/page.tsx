// app/admin/giocatori/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPlayersList, createPlayer, updatePlayer, Giocatore } from '@/app/actions/matches';
import { Plus, Edit2, X, ArrowLeft } from 'lucide-react';

export default function AdminGiocatoriPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Giocatore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Stato per la gestione del Modale (Aggiungi / Modifica)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<Giocatore | null>(null);

  // Form State
  const [nickname, setNickname] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [avatarUrlW, setAvatarUrlW] = useState<string>('');
  const [avatarUrlB, setAvatarUrlB] = useState<string>('');

  // 1. Carica i giocatori
  const fetchPlayers = async () => {
    setLoading(true);
    const data = await getPlayersList();
    setPlayers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  // Apre il modale in modalità "Nuovo Giocatore" precompilato
  const handleOpenCreate = () => {
    setEditingPlayer(null);
    setNickname('');
    setAvatarUrl('avatars/default.jpg');
    setAvatarUrlW('avatars/default_w.jpg');
    setAvatarUrlB('avatars/default_b.jpg');
    setIsModalOpen(true);
  };

  // Apre il modale in modalità "Modifica Giocatore"
  const handleOpenEdit = (player: Giocatore) => {
    setEditingPlayer(player);
    setNickname(player.nickname || '');
    setAvatarUrl(player.avatar_url || '');
    setAvatarUrlW(player.avatar_url_w || '');
    setAvatarUrlB(player.avatar_url_b || '');
    setIsModalOpen(true);
  };

  // Salvataggio (Create o Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setSaving(true);
    const payload = {
      nickname: nickname.trim(),
      avatar_url: avatarUrl.trim() || undefined,
      avatar_url_w: avatarUrlW.trim() || undefined,
      avatar_url_b: avatarUrlB.trim() || undefined,
    };

    if (editingPlayer) {
      await updatePlayer(editingPlayer.id, payload);
    } else {
      await createPlayer(payload);
    }

    setSaving(false);
    setIsModalOpen(false);
    fetchPlayers(); // Ricarica la lista aggiornata da Neon
  };

  const defaultAvatar = '/avatars/default.jpg';

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-2">
      {/* Intestazione */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Torna al pannello admin"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-800">Gestione Giocatori</h1>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus size={15} /> Nuovo Giocatore
        </button>
      </div>

      {/* Lista Giocatori */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Caricamento giocatori...</div>
        ) : players.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Nessun giocatore presente.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {players.map((p) => (
              <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <img
                    src={p.avatar_url || defaultAvatar}
                    alt={p.nickname}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultAvatar;
                    }}
                  />
                  <h2 className="text-sm font-bold text-slate-800">{p.nickname}</h2>
                </div>

                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Modifica Giocatore"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale Creazione / Modifica */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingPlayer ? `Modifica: ${editingPlayer.nickname}` : 'Nuovo Giocatore'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nickname</label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Avatar Standard (URL)</label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Avatar Maglia Bianca (URL)</label>
                <input
                  type="text"
                  value={avatarUrlW}
                  onChange={(e) => setAvatarUrlW(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Avatar Maglia Nera (URL)</label>
                <input
                  type="text"
                  value={avatarUrlB}
                  onChange={(e) => setAvatarUrlB(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-400"
                />
              </div>

              {/* Bottoni Azione */}
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-xs text-white font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Salvataggio...' : editingPlayer ? 'Aggiorna' : 'Crea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}