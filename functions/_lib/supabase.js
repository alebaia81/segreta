import { createClient } from '@supabase/supabase-js';

/**
 * Crea un client Supabase usando le variabili d'ambiente di Cloudflare Pages.
 * In CF Pages le env vars arrivano tramite `context.env`, non da process.env.
 * @param {object} env - context.env passato dalla Pages Function
 */
export function createSupabaseClient(env) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL || '';
  const key = env.SUPABASE_SECRET_KEY || '';

  if (!url || !key) {
    throw new Error('SUPABASE_URL o SUPABASE_SECRET_KEY mancanti nelle variabili d\'ambiente di Cloudflare.');
  }

  return createClient(url, key);
}
