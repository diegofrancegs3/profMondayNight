// public/lib/db.ts
import { neon } from '@neondatabase/serverless';
import { ENV } from './env.config.js';

if (!ENV.NEON_DATABASE_URL) {
  throw new Error('La NEON_DATABASE_URL non è definita nel file env.config.js');
}

// Verifica se siamo in ambiente di produzione (es. Vercel)
const isProduction = process.env.NODE_ENV === 'production';

// Inizializza il client SQL: attiva il fetchOptions solo su Vercel per evitare il blocco in locale
const sql = isProduction
  ? neon(ENV.NEON_DATABASE_URL, { fetchOptions: { cache: 'no-store' } })
  : neon(ENV.NEON_DATABASE_URL);

export default sql;