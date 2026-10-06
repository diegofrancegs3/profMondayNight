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
      if (!giocatore?.id) return;
      setLoading(true);

      try {
        let queryPartite = supabase
          .from('partite')
          .select('id')
          .eq('stato', 'giocata');

        if (stagioneId) {
          queryPartite = queryPartite.eq('stagione_id', stagioneId);
        }

        const { data: partite } = await queryPartite;
        const partitaIds = partite?.map((p) => p.id) || [];

        if (partitaIds.length === 0) {
          setStats({ gol: 0, assist: 0, presenze: 0 });
          setLoading(false);
          return;
        }

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
      } catch (err) {
        console.error('Errore durante il caricamento delle statistiche:', err);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      loadStats();
    }
  }, [isOpen, giocatore?.id, stagioneId]);

  if (!isOpen || !giocatore) return null;

  const defaultAvatar =
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';

  return (
    /* OVERLAY SFONDO (Trasparente scuro, copre lo schermo) */
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        cursor: 'pointer',
      }}
    >
      {/* BOX POPUP ADATTABILE */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '500px',
          maxWidth: '90vw',
          height: 'auto',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          position: 'relative',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '20px',
          boxSizing: 'border-box',
          cursor: 'default',
        }}
      >
        {/* Pulsante Chiudi in alto a destra */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          aria-label="Chiudi"
        >
          <X size={20} />
        </button>

        {/* Sinistra: Immagine Avatar con adattamento senza crop */}
        <div
          style={{
            width: '123px',
            height: '220px',
            flexShrink: 0,
            borderRadius: '12px',
            overflow: 'hidden',
            border: '3px solid #000000',
            backgroundColor: '#0f172a',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={giocatore.avatar_url || defaultAvatar}
            alt={giocatore.nickname}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Destra: Nome e Statistiche */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flexGrow: 1,
          }}
        >
          <h3
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 2px 0',
            }}
          >
            {giocatore.nickname}
          </h3>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 16px 0',
            }}
          >
            {stagioneId ? 'Statistiche Stagione' : 'Statistiche Totali'}
          </p>

          {/* Badge Statistiche */}
          {loading ? (
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Caricamento...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                  padding: '6px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Goal size={16} color="#059669" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>Gol</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#064e3b' }}>{stats.gol}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '6px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={16} color="#2563eb" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e40af' }}>Assist</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#1e3a8a' }}>{stats.assist}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '6px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Footprints size={16} color="#475569" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Presenze</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{stats.presenze}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}