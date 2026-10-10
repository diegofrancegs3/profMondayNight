// public/lib/db.ts
import { neon } from '@neondatabase/serverless';

// Legge la stringa di connessione dalle variabili d'ambiente (sia locale che su Vercel)
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('La variabile d\'ambiente NEON_DATABASE_URL non è definita.');
}

// Inizializza il client SQL di Neon
const sql = neon(connectionString);

export default sql;