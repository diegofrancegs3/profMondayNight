'use client';

import { useState } from 'react';
import { FORMATIONS } from '@/public/lib/formations';
import PlayerModal from '@/components/PlayerModal'; // Assicurati che il percorso dell'import sia corretto

export default function Pitch({
  matchType = '7v7',
  formationWhite = '3-2-1',
  formationBlack = '3-2-1',
  whiteTeam = [],
  blackTeam = [],
  stagioneId = null, // Riceve l'id della stagione per calcolare le metriche
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<{
    id: string,
    nickname: string,
    avatar_url: string,
  } | null>(null);

  const getCoords = (type, formation, teamColor) => {
    const defaultCoords = [
      { x: 50, y: 8 },
      { x: 25, y: 22 },
      { x: 75, y: 22 },
      { x: 50, y: 34 },
      { x: 50, y: 44 },
    ];

    const list = FORMATIONS[type]?.[formation] || FORMATIONS['7v7']?.['3-2-1'] || defaultCoords;

    return list.map((pt) => ({
      x: pt.x,
      y: teamColor === 'white' ? pt.y : 100 - pt.y,
    }));
  };

  const whitePositions = getCoords(matchType, formationWhite, 'white');
  const blackPositions = getCoords(matchType, formationBlack, 'black');

  const getPlayerData = (item) => {
    if (!item) return { id: null, nickname: 'Giocatore', avatar_url: null, gol: 0, assist: 0 };

    const playerObj = item.giocatori || item.giocatore || item;

    const id = playerObj.id || item.giocatore_id || item.id;
    const nickname = playerObj.nickname || item.nickname || 'Giocatore';
    const avatar_url = playerObj.avatar_url || item.avatar_url || null;
    const gol = item.gol || 0;
    const assist = item.assist || 0;

    return { id, nickname, avatar_url, gol, assist };
  };

  const handlePlayerClick = (playerData) => {
    if (!playerData.id) return;
    setSelectedPlayer({
      id: playerData.id,
      nickname: playerData.nickname,
      avatar_url: playerData.avatar_url,
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '10px 0' }}>
      {/* RETTANGOLO VERDE DEL CAMPO DA GIOCO */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '400px',
          height: '620px',
          backgroundColor: '#047857',
          borderRadius: '16px',
          border: '3px solid #065f46',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          boxSizing: 'border-box',
          userSelect: 'none',
        }}
      >
        {/* TRACCIATO DEL CAMPO */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            bottom: '8px',
            left: '8px',
            right: '8px',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            borderRadius: '12px',
            pointerEvents: 'none',
            boxSizing: 'border-box',
          }}
        >
          {/* Linea di metà campo */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              borderTop: '1px solid rgba(255, 255, 255, 0.5)',
            }}
          />
          {/* Cerchio centrale */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100px',
              height: '100px',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '50%',
            }}
          />
          {/* Punto centrale */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '6px',
              height: '6px',
              backgroundColor: '#fff',
              borderRadius: '50%',
            }}
          />
          {/* Area Superiore */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '160px',
              height: '60px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
              borderRight: '1px solid rgba(255, 255, 255, 0.5)',
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px',
            }}
          />
          {/* Area Inferiore */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '160px',
              height: '60px',
              borderTop: '1px solid rgba(255, 255, 255, 0.5)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
              borderRight: '1px solid rgba(255, 255, 255, 0.5)',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
            }}
          />
        </div>

        {/* SQUADRA BIANCA (In alto) */}
        {whiteTeam.map((item, idx) => {
          const playerData = getPlayerData(item);
          const { id, nickname, avatar_url, gol, assist } = playerData;
          const pos = whitePositions[idx] || { x: 50, y: 20 };
          const defaultAvatar =
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';

          return (
            <div
              key={`w-${id || idx}`}
              onClick={() => handlePlayerClick(playerData)}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            >
              {/* PEDINA RETTANGOLARE / SCUDETTO */}
              <div
                style={{
                  position: 'relative',
                  width: '40px',
                  height: '54px',
                  borderRadius: '6px',
                  border: '2px solid #ffffff',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={avatar_url || defaultAvatar}
                  alt={nickname}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '4px',
                  }}
                />

                {/* BADGES STATISTICHE IN ALTO A DESTRA */}
                {(gol > 0 || assist > 0) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      zIndex: 20,
                    }}
                  >
                    {gol > 0 && (
                      <span
                        style={{
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          padding: '1px 3px',
                          fontSize: '7px',
                          fontWeight: 'bold',
                          borderRadius: '3px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1px',
                        }}
                      >
                        ⚽{gol}
                      </span>
                    )}
                    {assist > 0 && (
                      <span
                        style={{
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          padding: '1px 3px',
                          fontSize: '7px',
                          fontWeight: 'bold',
                          borderRadius: '3px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1px',
                        }}
                      >
                        👟{assist}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* NICKNAME */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0px' }}>
                <span
                  style={{
                    padding: '0px 4px',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                >
                  {nickname}
                </span>
              </div>
            </div>
          );
        })}

        {/* SQUADRA NERA (In basso) */}
        {blackTeam.map((item, idx) => {
          const playerData = getPlayerData(item);
          const { id, nickname, avatar_url, gol, assist } = playerData;
          const pos = blackPositions[idx] || { x: 50, y: 80 };
          const defaultAvatar =
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';

          return (
            <div
              key={`b-${id || idx}`}
              onClick={() => handlePlayerClick(playerData)}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            >
              {/* PEDINA RETTANGOLARE / SCUDETTO */}
              <div
                style={{
                  position: 'relative',
                  width: '40px',
                  height: '54px',
                  borderRadius: '6px',
                  border: '2px solid #0f172a',
                  backgroundColor: '#0f172a',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={avatar_url || defaultAvatar}
                  alt={nickname}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '4px',
                  }}
                />

                {/* BADGES STATISTICHE IN ALTO A DESTRA */}
                {(gol > 0 || assist > 0) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      zIndex: 20,
                    }}
                  >
                    {gol > 0 && (
                      <span
                        style={{
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          padding: '1px 3px',
                          fontSize: '7px',
                          fontWeight: 'bold',
                          borderRadius: '3px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1px',
                        }}
                      >
                        ⚽{gol}
                      </span>
                    )}
                    {assist > 0 && (
                      <span
                        style={{
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          padding: '1px 3px',
                          fontSize: '7px',
                          fontWeight: 'bold',
                          borderRadius: '3px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1px',
                        }}
                      >
                        👟{assist}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* NICKNAME */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0px' }}>
                <span
                  style={{
                    padding: '0px 4px',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    borderRadius: '4px',
                    border: '1px solid #334155',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                >
                  {nickname}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL GIOCATORE */}
      <PlayerModal
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        giocatore={selectedPlayer}
        stagioneId={stagioneId}
      />
    </div>
  );
}