import supabase from '../../_lib/supabase.js';
import { checkAdminAuth } from '../../_lib/auth.js';
import { isVariantiColumnError, descrizioneConVarianti } from '../../_lib/varianti.js';

// GET  /api/admin/prodotti — Tutti i prodotti (attivi e non)
// POST /api/admin/prodotti — Aggiunge un nuovo prodotto
export default async function handler(req, res) {
  if (!await checkAdminAuth(req, res)) return;

  if (!supabase) {
    return res.status(500).json({ success: false, error: "Supabase non inizializzato. SUPABASE_URL o SUPABASE_SECRET_KEY mancanti su Vercel." });
  }

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
    const { titolo, descrizione, prezzo, immagine_url, target, categoria, taglie, varianti } = req.body;

    if (!titolo || prezzo === undefined || !categoria || !target) {
      return res.status(400).json({
        success: false,
        error: 'Campi obbligatori mancanti (Titolo, Prezzo, Target, Categoria).',
      });
    }

    const validTarget = target === 'Uomo' ? 'Uomo' : 'Donna';
    const variantiData = varianti ? (typeof varianti === 'string' ? varianti : JSON.stringify(varianti)) : null;

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

    // Fallback: colonna 'varianti' assente su Supabase → varianti salvate in B64 nella descrizione
    if (isVariantiColumnError(error)) {
      const retryRes = await supabase
        .from('articoli')
        .insert([{
          titolo,
          descrizione: descrizioneConVarianti(descrizione, variantiData),
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

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, data });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
