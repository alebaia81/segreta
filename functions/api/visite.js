import { createSupabaseClient } from '../_lib/supabase.js';

// User agent bot regex
const BOT_REGEX = /bot|spider|crawler|crawl|google|bing|yandex|baidu|duckduck|slurp|headless|lighthouse|ptst/i;

// POST /api/visite — Registra una visita anonima su Cloudflare Pages
export async function onRequestPost({ request, env }) {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    if (BOT_REGEX.test(userAgent)) {
      return new Response(JSON.stringify({ success: true, skipped: 'bot' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json().catch(() => ({}));
    const { pagina, articolo_id, sessione_id } = body;

    if (!pagina || typeof pagina !== 'string' || !sessione_id || typeof sessione_id !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Parametri pagina e sessione_id obbligatori' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanPagina = pagina.slice(0, 150);
    const cleanSessioneId = sessione_id.slice(0, 80);
    const cleanArticoloId = articolo_id && Number.isInteger(Number(articolo_id)) ? Number(articolo_id) : null;

    const supabase = createSupabaseClient(env);

    // Deduplicazione: non registrare la stessa pagina per la stessa sessione entro 15 minuti
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    let checkQuery = supabase
      .from('visite')
      .select('id')
      .eq('sessione_id', cleanSessioneId)
      .eq('pagina', cleanPagina)
      .gte('created_at', fifteenMinutesAgo)
      .limit(1);

    if (cleanArticoloId) {
      checkQuery = checkQuery.eq('articolo_id', cleanArticoloId);
    }

    const { data: existing, error: checkError } = await checkQuery;

    if (checkError) {
      if (checkError.code === 'PGRST205' || checkError.message?.includes('visite')) {
        return new Response(JSON.stringify({ success: true, tableConfigured: false }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ success: false, error: checkError.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ success: true, deduplicated: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Inserimento visita
    const { error: insertError } = await supabase.from('visite').insert([
      {
        pagina: cleanPagina,
        articolo_id: cleanArticoloId,
        sessione_id: cleanSessioneId,
        created_at: new Date().toISOString()
      }
    ]);

    if (insertError) {
      return new Response(JSON.stringify({ success: false, error: insertError.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, recorded: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
