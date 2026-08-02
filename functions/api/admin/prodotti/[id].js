import { createSupabaseClient } from '../../../_lib/supabase.js';
import { checkAdminAuth, unauthorizedResponse } from '../../../_lib/auth.js';

// PUT    /api/admin/prodotti/[id] — Modifica articolo (o toggle attivo)
// DELETE /api/admin/prodotti/[id] — Elimina articolo
export async function onRequest({ request, env, params }) {
  try {
    if (!await checkAdminAuth(request, env)) {
      return unauthorizedResponse();
    }

    const supabase = createSupabaseClient(env);
    const productId = Number(params.id);

    if (isNaN(productId)) {
      return new Response(JSON.stringify({ success: false, error: 'ID prodotto non valido.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── PUT ────────────────────────────────────────────────────────────
    if (request.method === 'PUT') {
      const body = await request.json();
      const { action, titolo, descrizione, prezzo, immagine_url, target, categoria, taglie, varianti } = body || {};

      if (action === 'toggle') {
        const { data: product, error: fetchErr } = await supabase
          .from('articoli')
          .select('attivo')
          .eq('id', productId)
          .maybeSingle();

        if (fetchErr) {
          return new Response(JSON.stringify({ success: false, error: 'Errore fetch articolo: ' + fetchErr.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
          });
        }
        if (!product) {
          return new Response(JSON.stringify({ success: false, error: 'Articolo non trovato.' }), {
            status: 404, headers: { 'Content-Type': 'application/json' },
          });
        }

        const nextState = !product.attivo;
        const { error: updateErr } = await supabase
          .from('articoli')
          .update({ attivo: nextState })
          .eq('id', productId);

        if (updateErr) {
          return new Response(JSON.stringify({ success: false, error: 'Errore update articolo: ' + updateErr.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, id: productId, attivo: nextState }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        });

      } else {
        // Modifica globale
        if (!titolo || prezzo === undefined || !categoria || !target) {
          return new Response(
            JSON.stringify({ success: false, error: 'Campi obbligatori mancanti (Titolo, Prezzo, Target, Categoria).' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const variantiData = varianti ? (typeof varianti === 'string' ? varianti : JSON.stringify(varianti)) : null;

        // Tentativo 1: Aggiorna con colonna varianti nativa
        let { data, error } = await supabase
          .from('articoli')
          .update({
            titolo,
            descrizione,
            prezzo: parseFloat(prezzo),
            immagine_url,
            target: target === 'Uomo' ? 'Uomo' : 'Donna',
            categoria,
            taglie,
            varianti: variantiData,
            attivo: true,
          })
          .eq('id', productId)
          .select()
          .maybeSingle();

        // Fallback: Se la colonna 'varianti' non esiste su Supabase (PGRST204), aggiorna integrando varianti in B64 in descrizione
        if (error && (error.code === 'PGRST204' || (error.message && error.message.includes('varianti')))) {
          const descPulita = (descrizione || '')
            .replace(/\[VARIANTI_B64:[A-Za-z0-9+/=]+\]/g, '')
            .replace(/\[VARIANTI:[\s\S]+?\](?=\s*$|\s+[A-Za-z0-9])/g, '')
            .trim();

          let b64 = '';
          if (variantiData) {
            try {
              if (typeof btoa === 'function') {
                b64 = btoa(unescape(encodeURIComponent(variantiData)));
              } else if (typeof Buffer !== 'undefined') {
                b64 = Buffer.from(variantiData, 'utf-8').toString('base64');
              }
            } catch (e) {
              console.error('Errore codifica b64 varianti:', e);
              b64 = '';
            }
          }

          const descrizioneConVarianti = b64 
            ? `[VARIANTI_B64:${b64}] ${descPulita}`.trim()
            : descPulita;

          const retryRes = await supabase
            .from('articoli')
            .update({
              titolo,
              descrizione: descrizioneConVarianti,
              prezzo: parseFloat(prezzo),
              immagine_url,
              target: target === 'Uomo' ? 'Uomo' : 'Donna',
              categoria,
              taglie,
              attivo: true,
            })
            .eq('id', productId)
            .select()
            .maybeSingle();

          data = retryRes.data;
          error = retryRes.error;
        }

        if (error) {
          return new Response(JSON.stringify({ success: false, error: 'Errore modifica articolo: ' + error.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, data }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ── DELETE ────────────────────────────────────────────────────────
    if (request.method === 'DELETE') {
      const { data: product, error: fetchErr } = await supabase
        .from('articoli')
        .select('id')
        .eq('id', productId)
        .maybeSingle();

      if (fetchErr) {
        return new Response(JSON.stringify({ success: false, error: 'Errore fetch per eliminazione: ' + fetchErr.message }), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!product) {
        return new Response(JSON.stringify({ success: false, error: 'Articolo non trovato.' }), {
          status: 404, headers: { 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase.from('articoli').delete().eq('id', productId);
      if (error) {
        return new Response(JSON.stringify({ success: false, error: 'Errore durante eliminazione: ' + error.message }), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Articolo eliminato con successo.' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('CF Function Error in prodotti/[id]:', err);
    return new Response(JSON.stringify({ success: false, error: 'Eccezione API: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
