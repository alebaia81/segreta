import supabase from '../_lib/supabase.js';

// GET /api/prodotti — Tutti i prodotti attivi per il negozio (utilizzato per keep-alive del database)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(500).json({
      success: false,
      error: "Supabase non inizializzato. SUPABASE_URL o SUPABASE_SECRET_KEY mancanti su Vercel."
    });
  }

  try {
    const { data, error } = await supabase
      .from('articoli')
      .select('*')
      .eq('attivo', true)
      .order('id', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('API Error in prodotti/index:', err);
    return res.status(500).json({ success: false, error: 'Eccezione API: ' + err.message });
  }
}
