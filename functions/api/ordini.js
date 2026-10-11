import { createSupabaseClient } from '../_lib/supabase.js';

// POST /api/ordini — Crea un nuovo ordine
export async function onRequestPost({ request, env }) {
  try {
    const supabase = createSupabaseClient(env);

    const body = await request.json();
    const {
      nome_cliente,
      telefono,
      email,
      indirizzo_spedizione,
      metodo_pagamento,
      metodo_consegna,
      totale,
      dettaglio_articoli,
      stato,
      stripe_session_id,
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

    // Se fornito stripe_session_id, includilo nel primo articolo per tracciabilità univoca
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
        console.log('[Ordini API] Ordine già registrato via stripe_session_id:', sessionId);
        return new Response(JSON.stringify({ success: true, data: existingBySession }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        });
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
        console.log('[Ordini API] Ordine Stripe già presente (ID:', existing.id, '), restituisco esistente');
        return new Response(JSON.stringify({ success: true, data: existing }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        });
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

    const { data, error } = await supabase
      .from('ordini')
      .insert([insertData])
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
