// public/lib/db.ts
import { neon } from '@neondatabase/serverless';
import { ENV } from './env.config.js';

if (!ENV.NEON_DATABASE_URL) {
  throw new Error('La NEON_DATABASE_URL non è definita nel file env.config.js');
}

// Inizializza il client SQL di Neon
const sql = neon(ENV.NEON_DATABASE_URL);

export default sql;