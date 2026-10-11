import Stripe from 'stripe';
import supabase from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event = req.body;

  // Se è configurato STRIPE_WEBHOOK_SECRET e abbiamo stripeKey, verifichiamo la firma
  if (stripeKey && webhookSecret && req.headers['stripe-signature']) {
    try {
      const stripe = new Stripe(stripeKey);
      const sig = req.headers['stripe-signature'];
      event = await stripe.webhooks.constructEventAsync(req.rawBody || JSON.stringify(req.body), sig, webhookSecret);
    } catch (err) {
      console.error('[Stripe Webhook Signature Error]:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('[Stripe Webhook] Ricevuto checkout.session.completed:', session.id);

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
        console.warn('Errore parsing dettaglio_articoli da metadata:', e);
      }
    }

    if (supabase) {
      try {
        // Controllo deduplicazione
        const { data: existing } = await supabase
          .from('ordini')
          .select('id, stato')
          .eq('telefono', telefono)
          .eq('totale', totale)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          console.log('[Stripe Webhook] Ordine già registrato (ID:', existing.id, '), aggiorno stato');
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

          const { data, error } = await supabase.from('ordini').insert([insertData]).select().single();

          if (error) {
            console.error('[Stripe Webhook] Errore inserimento ordine in Supabase:', error);
          } else {
            console.log('[Stripe Webhook] Ordine creato con successo ID:', data?.id);
          }
        }
      } catch (err) {
        console.error('[Stripe Webhook Exception]:', err);
      }
    }
  }

  return res.status(200).json({ received: true });
}
