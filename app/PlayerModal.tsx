// components/PlayerModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/public/lib/supabase';
import { X, Goal, Award, Footprints } from 'lucide-react';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  giocatore: {
    id: string;
    nickname: string;
    avatar_url: string;
  } | null;
  stagioneId?: string | null;
}

export default function PlayerModal({ isOpen, onClose, giocatore, stagioneId }: PlayerModalProps) {
  const [stats, setStats] = useState({ gol: 0, assist: 0, presenze: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadStats() {
      if (!giocatore?.id || !stagioneId) return;
      setLoading(true);

      // 1. Recupera gli ID delle partite giocate nella stagione selezionata
      const { data: partite } = await supabase
        .from('partite')
        .select('id')
        .eq('stagione_id', stagioneId)
        .eq('stato', 'giocata');

      const partitaIds = partite?.map((p) => p.id) || [];

      if (partitaIds.length === 0) {
        setStats({ gol: 0, assist: 0, presenze: 0 });
        setLoading(false);
        return;
      }

      // 2. Recupera le statistiche del giocatore per quelle partite
      const { data: matchStats } = await supabase
        .from('partite_giocatori')
        .select('gol, assist')
        .eq('giocatore_id', giocatore.id)
        .in('partita_id', partitaIds);

      if (matchStats && matchStats.length > 0) {
        const presenze = matchStats.length;
        const gol = matchStats.reduce((acc, item) => acc + (item.gol || 0), 0);
        const assist = matchStats.reduce((acc, item) => acc + (item.assist || 0), 0);
        setStats({ gol, assist, presenze });
      } else {
        setStats({ gol: 0, assist: 0, presenze: 0 });
      }

      setLoading(false);
    }

    if (isOpen) {
      loadStats();
    }
  }, [isOpen, giocatore?.id, stagioneId]);

  if (!isOpen || !giocatore) return null;

  const defaultAvatar =
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-2xl relative flex flex-col items-center">
        {/* Pulsante Chiudi */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Immaggine Avatar in Grande */}
        <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md mb-3 mt-1">
          <img
            src={giocatore.avatar_url || defaultAvatar}
            alt={giocatore.nickname}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Nome Giocatore */}
        <h3 className="text-lg font-extrabold text-slate-900 mb-4">{giocatore.nickname}</h3>

        {/* Badge Statistiche */}
        {loading ? (
          <div className="text-xs font-medium text-slate-400 py-2">Caricamento statistiche...</div>
        ) : (
          <div className="grid grid-cols-3 gap-2 w-full">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex flex-col items-center">
              <Goal size={16} className="text-emerald-600 mb-1" />
              <span className="text-xs text-emerald-800 font-medium">Gol</span>
              <span className="text-base font-black text-emerald-900">{stats.gol}</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex flex-col items-center">
              <Award size={16} className="text-blue-600 mb-1" />
              <span className="text-xs text-blue-800 font-medium">Assist</span>
              <span className="text-base font-black text-blue-900">{stats.assist}</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col items-center">
              <Footprints size={16} className="text-slate-600 mb-1" />
              <span className="text-xs text-slate-700 font-medium">Presenze</span>
              <span className="text-base font-black text-slate-900">{stats.presenze}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}