import supabase from '../_lib/supabase.js';

// GET /api/prodotti/shop — Tutti i prodotti attivi per il negozio
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { data, error } = await supabase
    .from('articoli')
    .select('*')
    .eq('attivo', true)
    .order('id', { ascending: false });

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
}
