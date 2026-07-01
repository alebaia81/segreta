import supabase from '../../_lib/supabase.js';
import { checkAdminAuth } from '../../_lib/auth.js';

// PUT    /api/admin/prodotti/[id]         — Modifica articolo (o toggle se req.body.action === 'toggle')
// DELETE /api/admin/prodotti/[id]         — Elimina articolo
export default async function handler(req, res) {
  try {
    if (!await checkAdminAuth(req, res)) return;

    const { id } = req.query;
    const productId = Number(id);

    if (isNaN(productId)) {
      return res.status(400).json({ success: false, error: 'ID prodotto non valido.' });
    }

    // ── PUT ────────────────────────────────────────────────────────────
    if (req.method === 'PUT') {
      const { action, titolo, descrizione, prezzo, immagine_url, target, categoria, taglie } = req.body || {};

      if (action === 'toggle') {
        if (!supabase) {
          return res.status(500).json({ success: false, error: 'Supabase client non inizializzato' });
        }

        const { data: product, error: fetchErr } = await supabase
          .from('articoli')
          .select('attivo')
          .eq('id', productId)
          .maybeSingle();

        if (fetchErr) {
          return res.status(500).json({ success: false, error: 'Errore fetch articolo: ' + fetchErr.message });
        }
        if (!product) {
          return res.status(404).json({ success: false, error: 'Articolo non trovato.' });
        }

        const nextState = !product.attivo;
        const { error: updateErr } = await supabase
          .from('articoli')
          .update({ attivo: nextState })
          .eq('id', productId);

        if (updateErr) {
          return res.status(500).json({ success: false, error: 'Errore update articolo: ' + updateErr.message });
        }
        return res.json({ success: true, id: productId, attivo: nextState });
      } else {
        // Modifica globale
        if (!titolo || prezzo === undefined || !categoria || !target) {
          return res.status(400).json({
            success: false,
            error: 'Campi obbligatori mancanti (Titolo, Prezzo, Target, Categoria).',
          });
        }

        if (!supabase) {
          return res.status(500).json({ success: false, error: 'Supabase client non inizializzato' });
        }

        const { data, error } = await supabase
          .from('articoli')
          .update({
            titolo,
            descrizione,
            prezzo: parseFloat(prezzo),
            immagine_url,
            target: target === 'Uomo' ? 'Uomo' : 'Donna',
            categoria,
            taglie
          })
          .eq('id', productId)
          .select()
          .maybeSingle();

        if (error) {
          return res.status(500).json({ success: false, error: 'Errore modifica articolo: ' + error.message });
        }
        return res.json({ success: true, data });
      }
    }

    // ── DELETE ────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase client non inizializzato' });
      }

      const { data: product, error: fetchErr } = await supabase
        .from('articoli')
        .select('id')
        .eq('id', productId)
        .maybeSingle();

      if (fetchErr) {
        return res.status(500).json({ success: false, error: 'Errore fetch per eliminazione: ' + fetchErr.message });
      }
      if (!product) {
        return res.status(404).json({ success: false, error: 'Articolo non trovato.' });
      }

      const { error } = await supabase.from('articoli').delete().eq('id', productId);
      if (error) {
        return res.status(500).json({ success: false, error: 'Errore durante eliminazione: ' + error.message });
      }
      return res.json({ success: true, message: 'Articolo eliminato con successo.' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error in prodotti/[id]:', err);
    return res.status(500).json({ success: false, error: 'Eccezione API: ' + err.message });
  }
}
