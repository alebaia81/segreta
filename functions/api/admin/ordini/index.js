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

    const { data, error } = await supabase
      .from('ordini')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    const archiveStatuses = ['Archiviato', 'Completato', 'Annullato'];
    const filteredData = (data || []).filter(item => 
      showArchive ? archiveStatuses.includes(item.stato) : !archiveStatuses.includes(item.stato)
    );

    return new Response(JSON.stringify({ success: true, data: filteredData }), {
      status: 200, headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
