import supabase from '../../_lib/supabase.js';
import { checkAdminAuth } from '../../_lib/auth.js';

// PUT    /api/admin/ordini/[id]  con body { action: 'archivia' | 'stato', stato?: string }
// DELETE /api/admin/ordini/[id]  — Elimina ordine
export default async function handler(req, res) {
  try {
    if (!await checkAdminAuth(req, res)) return;

    const { id } = req.query;

    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Supabase client non inizializzato.' });
    }

    // Verifica che l'ordine esista
    const { data: order, error: fetchErr } = await supabase
      .from('ordini')
      .select('id, stato')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      return res.status(500).json({ success: false, error: 'Errore fetch ordine: ' + fetchErr.message });
    }
    if (!order) {
      return res.status(404).json({ success: false, error: 'Ordine non trovato.' });
    }

    // ── PUT — Archivia o cambia stato ────────────────────────────────
    if (req.method === 'PUT') {
      const { action, stato } = req.body || {};

      if (action === 'archivia') {
        const { error } = await supabase
          .from('ordini')
          .update({ stato: 'Archiviato' })
          .eq('id', id);

        if (error) return res.status(500).json({ success: false, error: 'Errore archiviazione: ' + error.message });
        return res.json({ success: true, id: Number(id), stato: 'Archiviato' });
      }

      if (action === 'stato') {
        if (!stato) {
          return res.status(400).json({ success: false, error: 'Stato ordine mancante.' });
        }

        const { error } = await supabase
          .from('ordini')
          .update({ stato })
          .eq('id', id);

        if (error) return res.status(500).json({ success: false, error: 'Errore aggiornamento stato: ' + error.message });
        return res.json({ success: true, id: Number(id), stato });
      }

      return res.status(400).json({ success: false, error: 'Action non valida. Usa "archivia" o "stato".' });
    }

    // ── DELETE ────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { error } = await supabase.from('ordini').delete().eq('id', id);
      if (error) return res.status(500).json({ success: false, error: 'Errore eliminazione: ' + error.message });
      return res.json({ success: true, message: 'Ordine eliminato con successo.' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error in ordini/[id]:', err);
    return res.status(500).json({ success: false, error: 'Eccezione API: ' + err.message });
  }
}
