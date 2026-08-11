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
  } = req.body;

  if (!nome_cliente || !telefono || !dettaglio_articoli || totale === undefined) {
    return res.status(400).json({ success: false, error: "Campi obbligatori dell'ordine mancanti." });
  }

  const dettaglio = typeof dettaglio_articoli === 'string'
    ? JSON.parse(dettaglio_articoli)
    : dettaglio_articoli;

  const { data, error } = await supabase
    .from('ordini')
    .insert([{
      nome_cliente,
      telefono,
      indirizzo_spedizione,
      metodo_pagamento: metodo_pagamento || 'Satispay',
      metodo_consegna: metodo_consegna || 'Spedizione',
      totale: parseFloat(totale),
      dettaglio_articoli: dettaglio,
      stato: stato || (metodo_pagamento === 'PayPal' ? 'Pagamento Ricevuto - In Lavorazione' : 'Verifica Pagamento'),
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.status(201).json({ success: true, data });
}
