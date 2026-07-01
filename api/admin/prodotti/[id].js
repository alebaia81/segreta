import supabase from '../../../_lib/supabase.js';
import { checkAdminAuth } from '../../../_lib/auth.js';

// PUT    /api/admin/prodotti/[id]/toggle  — Attiva/disattiva prodotto
// DELETE /api/admin/prodotti/[id]         — Elimina prodotto
export default async function handler(req, res) {
  if (!checkAdminAuth(req, res)) return;

  const { id } = req.query;

  // ── PUT toggle ────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    // Legge lo stato attuale
    const { data: product, error: fetchErr } = await supabase
      .from('articoli')
      .select('attivo')
      .eq('id', id)
      .single();

    if (fetchErr || !product) {
      return res.status(404).json({ success: false, error: 'Articolo non trovato.' });
    }

    const { error: updateErr } = await supabase
      .from('articoli')
      .update({ attivo: !product.attivo })
      .eq('id', id);

    if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });
    return res.json({ success: true, id: Number(id), attivo: !product.attivo });
  }

  // ── DELETE ────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { data: product, error: fetchErr } = await supabase
      .from('articoli')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchErr || !product) {
      return res.status(404).json({ success: false, error: 'Articolo non trovato.' });
    }

    const { error } = await supabase.from('articoli').delete().eq('id', id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, message: 'Articolo eliminato con successo.' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
