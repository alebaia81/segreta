import { createSupabaseClient } from '../../_lib/supabase.js';
import { checkAdminAuth, unauthorizedResponse } from '../../_lib/auth.js';

// POST /api/admin/upload — Upload immagine su Supabase Storage
// Body: { imageData: "base64string", fileName: "nome.jpg", mimeType: "image/jpeg" }
// Limite: ~10MB (Cloudflare Pages Functions supporta fino a 100MB di body)
export async function onRequestPost({ request, env }) {
  if (!await checkAdminAuth(request, env)) {
    return unauthorizedResponse();
  }

  try {
    const supabase = createSupabaseClient(env);
    const body = await request.json();
    const { imageData, fileName, mimeType } = body;

    if (!imageData || !fileName) {
      return new Response(
        JSON.stringify({ success: false, error: 'imageData e fileName sono obbligatori.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Converte base64 → Uint8Array (CF Workers non ha Buffer Node.js)
    const base64 = imageData.replace(/^data:[^;]+;base64,/, '');
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Calcola hash MD5-like usando SubtleCrypto per deduplicazione
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);

    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `art-${hash}-${cleanFileName}`;

    // Upload su Supabase Storage nel bucket 'immagini-prodotti'
    const { error: uploadError } = await supabase.storage
      .from('immagini-prodotti')
      .upload(uniqueName, bytes, {
        contentType: mimeType || 'image/jpeg',
        upsert: false,
      });

    // Se il file esiste già (409 / "already exists"), lo riutilizziamo
    if (
      uploadError &&
      !uploadError.message.includes('already exists') &&
      !uploadError.message.includes('Duplicate')
    ) {
      return new Response(JSON.stringify({ success: false, error: uploadError.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    // URL pubblico
    const { data: urlData } = supabase.storage
      .from('immagini-prodotti')
      .getPublicUrl(uniqueName);

    return new Response(
      JSON.stringify({ success: true, url: urlData.publicUrl, reused: !!uploadError }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
