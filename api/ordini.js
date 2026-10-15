import supabase from './_lib/supabase.js';

// POST /api/ordini — Crea un nuovo ordine
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const {
    nome_cliente,
    telefono,
    indirizzo_spedizione,
    metodo_pagamento,
    metodo_consegna,
    totale,
    dettaglio_articoli,
    stato,
    stripe_session_id,
    note,
    email,
  } = req.body;

  if (!nome_cliente || !telefono || !dettaglio_articoli || totale === undefined) {
    return res.status(400).json({ success: false, error: "Campi obbligatori dell'ordine mancanti." });
  }

  const dettaglio = typeof dettaglio_articoli === 'string'
    ? JSON.parse(dettaglio_articoli)
    : dettaglio_articoli;

  const sessionId = stripe_session_id || (Array.isArray(dettaglio) && dettaglio[0]?.stripe_session_id);
  if (sessionId && Array.isArray(dettaglio) && dettaglio.length > 0 && !dettaglio[0].stripe_session_id) {
    dettaglio[0].stripe_session_id = sessionId;
  }

  // 1. Controllo di deduplicazione autoritativo tramite Stripe session_id univoco
  if (sessionId) {
    const { data: existingBySession } = await supabase
      .from('ordini')
      .select('*')
      .contains('dettaglio_articoli', JSON.stringify([{ stripe_session_id: sessionId }]))
      .limit(1)
      .maybeSingle();

    if (existingBySession) {
      return res.status(200).json({ success: true, data: existingBySession });
    }
  }

  // 2. Fallback deduplicazione su anagrafica + importo
  if (metodo_pagamento === 'Carta / Stripe') {
    const { data: existing } = await supabase
      .from('ordini')
      .select('*')
      .eq('telefono', telefono)
      .eq('totale', parseFloat(totale))
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({ success: true, data: existing });
    }
  }

  const insertData = {
    nome_cliente,
    telefono,
    indirizzo_spedizione,
    metodo_pagamento: metodo_pagamento || 'Satispay',
    metodo_consegna: metodo_consegna || 'Spedizione',
    totale: parseFloat(totale),
    dettaglio_articoli: dettaglio,
    stato: stato || (metodo_pagamento === 'PayPal' ? 'Pagamento Ricevuto - In Lavorazione' : 'Verifica Pagamento'),
  };
  if (email) insertData.email = email;
  if (note) insertData.note = String(note).trim();

  let { data, error } = await supabase
    .from('ordini')
    .insert([insertData])
    .select()
    .single();

  if (error && note && (error.code === 'PGRST204' || (error.message && error.message.includes('note')))) {
    console.warn('[Ordini API local] Colonna note assente su Supabase, fallback su indirizzo_spedizione');
    const fallbackData = {
      ...insertData,
      indirizzo_spedizione: `${indirizzo_spedizione}\n[Note: ${note}]`.trim()
    };
    delete fallbackData.note;
    const retry = await supabase.from('ordini').insert([fallbackData]).select().single();
    data = retry.data;
    error = retry.error;
  }

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.status(201).json({ success: true, data });
}
