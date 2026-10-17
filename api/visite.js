import supabase from './_lib/supabase.js';

// User agent bot regex
const BOT_REGEX = /bot|spider|crawler|crawl|google|bing|yandex|baidu|duckduck|slurp|headless|lighthouse|ptst/i;

// POST /api/visite — Registra una visita anonima
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Verifica bot
  const userAgent = req.headers['user-agent'] || '';
  if (BOT_REGEX.test(userAgent)) {
    return res.json({ success: true, skipped: 'bot' });
  }

  const { pagina, articolo_id, sessione_id } = req.body || {};

  if (!pagina || typeof pagina !== 'string' || !sessione_id || typeof sessione_id !== 'string') {
    return res.status(400).json({ success: false, error: 'Parametri pagina e sessione_id obbligatori' });
  }

  // Sanitizzazione input
  const cleanPagina = pagina.slice(0, 150);
  const cleanSessioneId = sessione_id.slice(0, 80);
  const cleanArticoloId = articolo_id && Number.isInteger(Number(articolo_id)) ? Number(articolo_id) : null;

  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase non configurato' });
  }

  try {
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

    // Se la tabella non esiste ancora, gestiamo l'errore senza crash
    if (checkError) {
      if (checkError.code === 'PGRST205' || checkError.message?.includes('visite')) {
        return res.json({ success: true, tableConfigured: false });
      }
      return res.status(500).json({ success: false, error: checkError.message });
    }

    if (existing && existing.length > 0) {
      return res.json({ success: true, deduplicated: true });
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
      return res.status(500).json({ success: false, error: insertError.message });
    }

    return res.json({ success: true, recorded: true });
  } catch (err) {
    console.error('Errore registrazione visita:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
