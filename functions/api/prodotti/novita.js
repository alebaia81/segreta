import { createSupabaseClient } from '../../../_lib/supabase.js';

// GET /api/prodotti/novita — Ultimi 8 prodotti attivi
export async function onRequestGet({ env }) {
  try {
    const supabase = createSupabaseClient(env);

    const { data, error } = await supabase
      .from('articoli')
      .select('*')
      .eq('attivo', true)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
