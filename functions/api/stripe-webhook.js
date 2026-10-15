import Stripe from 'stripe';
import { createSupabaseClient } from '../_lib/supabase.js';

export async function onRequestPost({ request, env }) {
  try {
    const stripeKey = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

    const bodyText = await request.text();
    let event;

    const signature = request.headers.get('stripe-signature');
    if (stripeKey && webhookSecret && signature) {
      try {
        const stripe = new Stripe(stripeKey);
        event = await stripe.webhooks.constructEventAsync(bodyText, signature, webhookSecret);
      } catch (err) {
        console.error('[Cloudflare Webhook Sig Error]:', err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
      }
    } else {
      event = JSON.parse(bodyText);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('[Cloudflare Stripe Webhook] Completed session:', session.id);

      const metadata = session.metadata || {};
      const nome_cliente = metadata.nome_cliente || session.customer_details?.name || 'Cliente Stripe';
      const telefono = metadata.telefono || session.customer_details?.phone || '';
      const email = metadata.email || session.customer_details?.email || session.customer_email || '';
      const indirizzo_spedizione = metadata.indirizzo_spedizione || 'Spedizione a domicilio';
      const metodo_consegna = metadata.metodo_consegna || 'Spedizione';
      const totale = session.amount_total ? parseFloat((session.amount_total / 100).toFixed(2)) : 0;

      let dettaglio = [];
      if (metadata.dettaglio_articoli) {
        try {
          dettaglio = JSON.parse(metadata.dettaglio_articoli);
        } catch (e) {
          console.warn('Errore parsing dettaglio_articoli:', e);
        }
      }

      const note = metadata.note ? String(metadata.note).trim() : '';
      const stripe_session_id = session.id;
      if (stripe_session_id && Array.isArray(dettaglio) && dettaglio.length > 0 && !dettaglio[0].stripe_session_id) {
        dettaglio[0].stripe_session_id = stripe_session_id;
      }

      const supabase = createSupabaseClient(env);
      if (supabase) {
        // Controllo deduplicazione 1: cerca tramite stripe_session_id univoco
        let existing = null;
        if (stripe_session_id) {
          const { data: existingBySession } = await supabase
            .from('ordini')
            .select('id, stato')
            .contains('dettaglio_articoli', JSON.stringify([{ stripe_session_id }]))
            .limit(1)
            .maybeSingle();
          if (existingBySession) {
            existing = existingBySession;
          }
        }

        // Controllo deduplicazione 2: fallback per telefono + totale
        if (!existing) {
          const { data: existingByPhone } = await supabase
            .from('ordini')
            .select('id, stato')
            .eq('telefono', telefono)
            .eq('totale', totale)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (existingByPhone) {
            existing = existingByPhone;
          }
        }

        if (existing) {
          console.log('[Cloudflare Stripe Webhook] Ordine già registrato (ID:', existing.id, '), aggiorno stato');
          await supabase
            .from('ordini')
            .update({ stato: 'Pagamento Ricevuto - In Lavorazione' })
            .eq('id', existing.id);
        } else {
          const insertData = {
            nome_cliente,
            telefono,
            indirizzo_spedizione,
            metodo_pagamento: 'Carta / Stripe',
            metodo_consegna,
            totale,
            dettaglio_articoli: dettaglio,
            stato: 'Pagamento Ricevuto - In Lavorazione',
          };
          if (email) insertData.email = email;
          if (note) insertData.note = note;

          let { data, error } = await supabase.from('ordini').insert([insertData]).select().single();
          if (error && note && (error.code === 'PGRST204' || (error.message && error.message.includes('note')))) {
            console.warn('[Cloudflare Stripe Webhook] Colonna note non presente su Supabase, fallback su indirizzo_spedizione');
            const fallbackData = {
              ...insertData,
              indirizzo_spedizione: `${indirizzo_spedizione}\n[Note: ${note}]`.trim()
            };
            delete fallbackData.note;
            const retry = await supabase.from('ordini').insert([fallbackData]).select().single();
            data = retry.data;
            error = retry.error;
          }

          if (error) {
            console.error('[Cloudflare Stripe Webhook DB Error]:', error);
          } else {
            console.log('[Cloudflare Stripe Webhook] Saved order ID:', data?.id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Cloudflare Webhook Error]:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
