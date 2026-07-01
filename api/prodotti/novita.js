import supabase from '../_lib/supabase.js';

// GET /api/prodotti/novita — Ultimi 8 prodotti attivi
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { data, error } = await supabase
    .from('articoli')
    .select('*')
    .eq('attivo', true)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
}
