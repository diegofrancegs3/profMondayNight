export const ENV = {
  SUPABASE_URL: 'https://gqwhhhqmhhjasswzjpou.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxd2hoaHFtaGhqYXNzd3pqcG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NDExOTIsImV4cCI6MjEwNjUxNzE5Mn0.jWAl1CtBsAcs6HRc1UdKdmvn4-A2Jyb43n5mE9vOw9Q',
  // Configurazione Neon (Nuova) - Inserisci qui la tua Connection String
  NEON_DATABASE_URL: 'postgresql://neondb_owner:npg_Hbs5RD0uUICc@ep-wild-shape-bakt4c94.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  //NEON_DATABASE_URL: 'postgresql://neondb_owner:npg_Hbs5RD0uUICc@ep-wild-shape-bakt4c94-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  
  // Flag per decidere quale usare al volo (puoi impostarlo su 'neon' o 'supabase')
  ACTIVE_PROVIDER: 'neon'
};