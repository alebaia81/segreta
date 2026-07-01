import supabase from '../../_lib/supabase.js';
import { checkAdminAuth } from '../../_lib/auth.js';

// GET  /api/admin/prodotti — Tutti i prodotti (attivi e non)
// POST /api/admin/prodotti — Aggiunge un nuovo prodotto
export default async function handler(req, res) {
  if (!checkAdminAuth(req, res)) return;

  // ── GET ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('articoli')
      .select('*')
      .order('id', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data });
  }

  // ── POST ─────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { titolo, descrizione, prezzo, immagine_url, target, categoria, taglie } = req.body;

    if (!titolo || prezzo === undefined || !categoria || !target) {
      return res.status(400).json({
        success: false,
        error: 'Campi obbligatori mancanti (Titolo, Prezzo, Target, Categoria).',
      });
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

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
