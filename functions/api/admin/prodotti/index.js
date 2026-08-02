import { createSupabaseClient } from '../../../_lib/supabase.js';
import { checkAdminAuth, unauthorizedResponse } from '../../../_lib/auth.js';

// GET  /api/admin/prodotti — Tutti i prodotti (attivi e non)
// POST /api/admin/prodotti — Aggiunge un nuovo prodotto
export async function onRequest({ request, env }) {
  try {
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
      const { titolo, descrizione, prezzo, immagine_url, target, categoria, taglie, varianti } = body;

      if (!titolo || prezzo === undefined || !categoria || !target) {
        return new Response(
          JSON.stringify({ success: false, error: 'Campi obbligatori mancanti (Titolo, Prezzo, Target, Categoria).' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const validTarget = target === 'Uomo' ? 'Uomo' : 'Donna';
      const variantiData = varianti ? (typeof varianti === 'string' ? varianti : JSON.stringify(varianti)) : null;

      // Tentativo 1: Salva con la colonna varianti nativa
      let { data, error } = await supabase
        .from('articoli')
        .insert([{
          titolo,
          descrizione,
          prezzo: parseFloat(prezzo),
          immagine_url,
          target: validTarget,
          categoria,
          taglie,
          varianti: variantiData,
          attivo: true,
        }])
        .select()
        .single();

      // Fallback: Se la colonna 'varianti' non esiste su Supabase (PGRST204), salva integrando varianti in descrizione
      if (error && (error.code === 'PGRST204' || (error.message && error.message.includes('varianti')))) {
        const descPulita = (descrizione || '').replace(/\[VARIANTI:[^\]]+\]/g, '').trim();
        const descrizioneConVarianti = variantiData 
          ? `[VARIANTI:${variantiData}] ${descPulita}`.trim()
          : descPulita;

        const retryRes = await supabase
          .from('articoli')
          .insert([{
            titolo,
            descrizione: descrizioneConVarianti,
            prezzo: parseFloat(prezzo),
            immagine_url,
            target: validTarget,
            categoria,
            taglie,
            attivo: true,
          }])
          .select()
          .single();

        data = retryRes.data;
        error = retryRes.error;
      }

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
  } catch (err) {
    const envKeys = env ? Object.keys(env) : [];
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Errore interno serverless: ${err.message}. Chiavi env disponibili: [${envKeys.join(', ')}]` 
    }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
