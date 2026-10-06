export const FORMATIONS = {
  '5v5': {
    '1-2-1': [
      { x: 50, y: 8 },   // Portiere / Ultimo
      { x: 50, y: 22 },  // Difensore
      { x: 25, y: 30 },  // Esterno Sinistro
      { x: 75, y: 30 },  // Esterno Destro
      { x: 50, y: 42 },  // Attaccante
    ],
    '2-2': [
      { x: 50, y: 8 },   // Portiere
      { x: 30, y: 22 },  // Difensore Sinistro
      { x: 70, y: 22 },  // Difensore Destro
      { x: 35, y: 40 },  // Attaccante Sinistro
      { x: 65, y: 40 },  // Attaccante Destro
    ],
  },
  '7v7': {
    '2-3-1': [
      { x: 50, y: 6 },
      { x: 32, y: 19 },
      { x: 68, y: 19 },
      { x: 20, y: 32 },
      { x: 50, y: 30 },
      { x: 80, y: 32 },
      { x: 50, y: 42 },
    ],
    '3-2-1': [
      { x: 50, y: 6 },
      { x: 20, y: 19 },
      { x: 50, y: 19 },
      { x: 80, y: 19 },
      { x: 35, y: 32 },
      { x: 65, y: 32 },
      { x: 50, y: 44 },
    ],
    '3-3': [
      { x: 50, y: 6 },
      { x: 20, y: 21 },
      { x: 50, y: 21 },
      { x: 80, y: 21 },
      { x: 20, y: 35 },
      { x: 50, y: 43 },
      { x: 80, y: 35 },
    ],
  },
  '8v8': {
    '3-3-1': [
      { x: 50, y: 6 },
      { x: 20, y: 19 },
      { x: 50, y: 19 },
      { x: 80, y: 19 },
      { x: 20, y: 32 },
      { x: 50, y: 32 },
      { x: 80, y: 32 },
      { x: 50, y: 44 },
    ],
    '3-2-2': [
      { x: 50, y: 6 },
      { x: 20, y: 19 },
      { x: 50, y: 19 },
      { x: 80, y: 19 },
      { x: 35, y: 32 },
      { x: 65, y: 32 },
      { x: 35, y: 44 },
      { x: 65, y: 44 },
    ],
  },
};