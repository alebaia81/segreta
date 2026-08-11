import { createSupabaseClient } from '../_lib/supabase.js';

// POST /api/ordini — Crea un nuovo ordine
export async function onRequestPost({ request, env }) {
  try {
    const supabase = createSupabaseClient(env);

    const body = await request.json();
    const {
      nome_cliente,
      telefono,
      indirizzo_spedizione,
      metodo_pagamento,
      metodo_consegna,
      totale,
      dettaglio_articoli,
      stato,
    } = body;

    if (!nome_cliente || !telefono || !dettaglio_articoli || totale === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: "Campi obbligatori dell'ordine mancanti." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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

    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
