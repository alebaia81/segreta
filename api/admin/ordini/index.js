import supabase from '../../_lib/supabase.js';
import { checkAdminAuth } from '../../_lib/auth.js';

// GET /api/admin/ordini          — Lista ordini (attivi o archiviati)
// Query: ?archivio=true          → solo archiviati
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!checkAdminAuth(req, res)) return;

  const showArchive = req.query.archivio === 'true';

  const query = supabase
    .from('ordini')
    .select('*')
    .order('id', { ascending: false });

  const { data, error } = showArchive
    ? await query.eq('stato', 'Archiviato')
    : await query.neq('stato', 'Archiviato');

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
}
