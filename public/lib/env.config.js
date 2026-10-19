export const ENV = {
  SUPABASE_URL: 'https://gqwhhhqmhhjasswzjpou.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxd2hoaHFtaGhqYXNzd3pqcG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NDExOTIsImV4cCI6MjEwNjUxNzE5Mn0.jWAl1CtBsAcs6HRc1UdKdmvn4-A2Jyb43n5mE9vOw9Q',
  
  // Configurazione Neon (Nuova) - Inserisci qui la tua Connection String
  NEON_DATABASE_URL: 'postgresql://neondb_owner:npg_Hbs5RD0uUICc@ep-wild-shape-bakt4c94.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  
  // Chiave di sicurezza per l'API Wear OS (sostituita con la chiave sicura generata)
  WEAR_OS_API_KEY: 'pmn_sec_7f9b2a4e8c1d6f3e9a5b8c2d1f4e7a6b',

  // Flag per decidere quale usare al volo (puoi impostarlo su 'neon' o 'supabase')
  ACTIVE_PROVIDER: 'neon'
};