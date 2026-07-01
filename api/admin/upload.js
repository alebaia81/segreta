import supabase from '../_lib/supabase.js';
import { checkAdminAuth } from '../_lib/auth.js';

// POST /api/admin/upload — Upload immagine su Supabase Storage
// Body: { imageData: "base64string", fileName: "nome.jpg", mimeType: "image/jpeg" }
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Limite dimensione immagine
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!checkAdminAuth(req, res)) return;

  if (!supabase) {
    return res.status(500).json({ success: false, error: "Supabase non inizializzato." });
  }

  const { imageData, fileName, mimeType } = req.body;

  if (!imageData || !fileName) {
    return res.status(400).json({ success: false, error: 'imageData e fileName sono obbligatori.' });
  }

  // Converte base64 → Buffer
  const base64 = imageData.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');

  // Nome file univoco
  const uniqueName = `art-${Date.now()}-${Math.random().toString(36).slice(2)}-${fileName}`;

  // Upload su Supabase Storage nel bucket 'prodotti'
  const { error: uploadError } = await supabase.storage
    .from('prodotti')
    .upload(uniqueName, buffer, {
      contentType: mimeType || 'image/jpeg',
      upsert: false,
    });

  if (uploadError) {
    return res.status(500).json({ success: false, error: uploadError.message });
  }

  // URL pubblico
  const { data: urlData } = supabase.storage
    .from('prodotti')
    .getPublicUrl(uniqueName);

  return res.json({ success: true, url: urlData.publicUrl });
}
