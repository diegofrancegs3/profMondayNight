// public/lib/db.ts
import { neon } from '@neondatabase/serverless';
import { ENV } from './env.config.js';

if (!ENV.NEON_DATABASE_URL) {
  throw new Error('La NEON_DATABASE_URL non è definita nel file env.config.js');
}

// Inizializza il client SQL di Neon forzando il no-store per bypassare la cache di Vercel
const sql = neon(ENV.NEON_DATABASE_URL, {
  fetchOptions: { cache: 'no-store' },
});

export default sql;