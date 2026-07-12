import { createSupabaseClient } from '../../../_lib/supabase.js';
import { checkAdminAuth, unauthorizedResponse } from '../../../_lib/auth.js';

// GET  /api/admin/prodotti — Tutti i prodotti (attivi e non)
// POST /api/admin/prodotti — Aggiunge un nuovo prodotto
export async function onRequest({ request, env }) {
  if (!await checkAdminAuth(request, env)) {
    return unauthorizedResponse();
  }

  const supabase = createSupabaseClient(env);

  // ── GET ──────────────────────────────────────────────────────────
  if (request.method === 'GET') {
    const { data, error } = await supabase
      .from('articoli')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── POST ─────────────────────────────────────────────────────────
  if (request.method === 'POST') {
    const body = await request.json();
    const { titolo, descrizione, prezzo, immagine_url, target, categoria, taglie } = body;

    if (!titolo || prezzo === undefined || !categoria || !target) {
      return new Response(
        JSON.stringify({ success: false, error: 'Campi obbligatori mancanti (Titolo, Prezzo, Target, Categoria).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validTarget = target === 'Uomo' ? 'Uomo' : 'Donna';

    const { data, error } = await supabase
      .from('articoli')
      .insert([{
        titolo,
        descrizione,
        prezzo: parseFloat(prezzo),
        immagine_url,
        target: validTarget,
        categoria,
        taglie,
        attivo: true,
      }])
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
    status: 405, headers: { 'Content-Type': 'application/json' },
  });
}
