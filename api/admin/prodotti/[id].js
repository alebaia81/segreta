import supabase from '../../_lib/supabase.js';
import { checkAdminAuth } from '../../_lib/auth.js';

// PUT    /api/admin/prodotti/[id]         — Modifica articolo (o toggle se req.body.action === 'toggle')
// DELETE /api/admin/prodotti/[id]         — Elimina articolo
export default async function handler(req, res) {
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
      // Legge lo stato attuale
      const { data: product, error: fetchErr } = await supabase
        .from('articoli')
        .select('attivo')
        .eq('id', productId)
        .single();

      if (fetchErr || !product) {
        return res.status(404).json({ success: false, error: 'Articolo non trovato.' });
      }

      const { error: updateErr } = await supabase
        .from('articoli')
        .update({ attivo: !product.attivo })
        .eq('id', productId);

      if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });
      return res.json({ success: true, id: productId, attivo: !product.attivo });
    } else {
      // Modifica globale
      if (!titolo || prezzo === undefined || !categoria || !target) {
        return res.status(400).json({
          success: false,
          error: 'Campi obbligatori mancanti (Titolo, Prezzo, Target, Categoria).',
        });
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
        .single();

      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { data: product, error: fetchErr } = await supabase
      .from('articoli')
      .select('id')
      .eq('id', productId)
      .single();

    if (fetchErr || !product) {
      return res.status(404).json({ success: false, error: 'Articolo non trovato.' });
    }

    const { error } = await supabase.from('articoli').delete().eq('id', productId);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, message: 'Articolo eliminato con successo.' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
