import crypto from 'crypto';
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

  if (!await checkAdminAuth(req, res)) return;

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

  // Calcola hash del file per deduplicazione
  const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 16);
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueName = `art-${hash}-${cleanFileName}`;

  // Upload su Supabase Storage nel bucket 'immagini-prodotti'
  const { error: uploadError } = await supabase.storage
    .from('immagini-prodotti')
    .upload(uniqueName, buffer, {
      contentType: mimeType || 'image/jpeg',
      upsert: false,
    });

  // Se il file esiste già (errore 409 o messaggio "already exists"), lo riutilizziamo
  if (uploadError && !uploadError.message.includes('already exists') && !uploadError.message.includes('Duplicate')) {
    return res.status(500).json({ success: false, error: uploadError.message });
  }

  // URL pubblico
  const { data: urlData } = supabase.storage
    .from('immagini-prodotti')
    .getPublicUrl(uniqueName);

  return res.json({ success: true, url: urlData.publicUrl, reused: !!uploadError });
}
