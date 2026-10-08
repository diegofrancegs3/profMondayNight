// @/public/lib/formations.js
export const FORMATIONS = {
  '5v5': {
    '1-2-1': [
      { x: 50, y: 8 },
      { x: 50, y: 22 },
      { x: 25, y: 30 },
      { x: 75, y: 30 },
      { x: 50, y: 42 },
    ],
    '2-2': [
      { x: 50, y: 8 },
      { x: 30, y: 22 },
      { x: 70, y: 22 },
      { x: 35, y: 40 },
      { x: 65, y: 40 },
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
    '2-3-2': [
      { x: 50, y: 6 },
      { x: 35, y: 19 },
      { x: 65, y: 19 },
      { x: 20, y: 32 },
      { x: 50, y: 32 },
      { x: 80, y: 32 },
      { x: 35, y: 44 },
      { x: 65, y: 44 },
    ],
  },
};

// Helper per ottenere le formazioni disponibili in base al tipo di match
export const getFormationsForType = (matchType = '7v7') => {
  const matchFormations = FORMATIONS[matchType] || FORMATIONS['7v7'];
  return Object.keys(matchFormations);
};

// Helper per ottenere la formazione di default per un tipo di match
export const getDefaultFormationForType = (matchType = '7v7') => {
  const options = getFormationsForType(matchType);
  return options[0] || '3-2-1';
};