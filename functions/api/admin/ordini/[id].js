import { createSupabaseClient } from '../../../_lib/supabase.js';
import { checkAdminAuth, unauthorizedResponse } from '../../../_lib/auth.js';

// PUT    /api/admin/ordini/[id]  con body { action: 'archivia' | 'stato', stato?: string }
// DELETE /api/admin/ordini/[id]  — Elimina ordine
export async function onRequest({ request, env, params }) {
  try {
    if (!await checkAdminAuth(request, env)) {
      return unauthorizedResponse();
    }

    const supabase = createSupabaseClient(env);
    const id = params.id;

    // Verifica che l'ordine esista
    const { data: order, error: fetchErr } = await supabase
      .from('ordini')
      .select('id, stato')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      return new Response(JSON.stringify({ success: false, error: 'Errore fetch ordine: ' + fetchErr.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!order) {
      return new Response(JSON.stringify({ success: false, error: 'Ordine non trovato.' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── PUT — Archivia o cambia stato ────────────────────────────────
    if (request.method === 'PUT') {
      const body = await request.json();
      const { action, stato } = body || {};

      if (action === 'archivia') {
        const { error } = await supabase
          .from('ordini')
          .update({ stato: 'Archiviato' })
          .eq('id', id);

        if (error) {
          return new Response(JSON.stringify({ success: false, error: 'Errore archiviazione: ' + error.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, id: Number(id), stato: 'Archiviato' }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        });
      }

      if (action === 'stato') {
        if (!stato) {
          return new Response(JSON.stringify({ success: false, error: 'Stato ordine mancante.' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabase
          .from('ordini')
          .update({ stato })
          .eq('id', id);

        if (error) {
          return new Response(JSON.stringify({ success: false, error: 'Errore aggiornamento stato: ' + error.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, id: Number(id), stato }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: false, error: 'Action non valida. Usa "archivia" o "stato".' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── DELETE ────────────────────────────────────────────────────────
    if (request.method === 'DELETE') {
      const { error } = await supabase.from('ordini').delete().eq('id', id);
      if (error) {
        return new Response(JSON.stringify({ success: false, error: 'Errore eliminazione: ' + error.message }), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Ordine eliminato con successo.' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('CF Function Error in ordini/[id]:', err);
    return new Response(JSON.stringify({ success: false, error: 'Eccezione API: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
