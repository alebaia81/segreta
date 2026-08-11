import supabase from '../../_lib/supabase.js';
import { checkAdminAuth } from '../../_lib/auth.js';

// GET /api/admin/ordini          — Lista ordini (attivi o archiviati)
// Query: ?archivio=true          → solo archiviati
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!await checkAdminAuth(req, res)) return;

  const showArchive = req.query.archivio === 'true';

  const { data, error } = await supabase
    .from('ordini')
    .select('*')
    .order('id', { ascending: false });

  if (error) return res.status(500).json({ success: false, error: error.message });

  const archiveStatuses = ['Archiviato', 'Completato', 'Annullato'];
  const filteredData = (data || []).filter(item => 
    showArchive ? archiveStatuses.includes(item.stato) : !archiveStatuses.includes(item.stato)
  );

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return res.json({ success: true, data: filteredData });
}
