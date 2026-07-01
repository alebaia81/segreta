import { createClient } from '@supabase/supabase-js';

let supabase = null;
try {
  supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SECRET_KEY || ''
  );
} catch (err) {
  console.error("ERRORE INIZIALIZZAZIONE SUPABASE:", err.message);
}

export default supabase;
