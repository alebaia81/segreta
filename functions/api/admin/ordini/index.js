import { createSupabaseClient } from '../../../_lib/supabase.js';
import { checkAdminAuth, unauthorizedResponse } from '../../../_lib/auth.js';

// GET /api/admin/ordini          — Lista ordini (attivi o archiviati)
// Query: ?archivio=true          → solo archiviati
export async function onRequestGet({ request, env }) {
  if (!await checkAdminAuth(request, env)) {
    return unauthorizedResponse();
  }

  try {
    const supabase = createSupabaseClient(env);
    const url = new URL(request.url);
    const showArchive = url.searchParams.get('archivio') === 'true';

    let query = supabase
      .from('ordini')
      .select('*')
      .order('id', { ascending: false });

    const { data, error } = showArchive
      ? await query.eq('stato', 'Archiviato')
      : await query.neq('stato', 'Archiviato');

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
