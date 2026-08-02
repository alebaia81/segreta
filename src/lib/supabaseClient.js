import { createClient } from '@supabase/supabase-js';

// Client Supabase per il frontend (usa la anon key pubblica)
// Usato per upload diretto di immagini su Supabase Storage
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
