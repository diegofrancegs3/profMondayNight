// public/lib/db.ts
import { neon } from '@neondatabase/serverless';
import { ENV } from '/home/diegofrancegs3/profMondayNight/public/lib/env.config.js'; // Il tuo file statico con le configurazioni

// Inizializza il client SQL di Neon con la connection string
const sql = neon(ENV.NEON_DATABASE_URL);

export default sql;