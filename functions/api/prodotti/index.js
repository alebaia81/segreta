import { createSupabaseClient } from '../../_lib/supabase.js';

// GET /api/prodotti — Tutti i prodotti attivi
export async function onRequestGet({ env }) {
  try {
    const supabase = createSupabaseClient(env);

    const { data, error } = await supabase
      .from('articoli')
      .select('*')
      .neq('attivo', false)
      .order('id', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
