import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metodo non consentito' });
  }

  const { cartItems, customerData, metodo_consegna } = req.body || {};

  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ success: false, error: 'Il carrello è vuoto.' });
  }

  if (!customerData || !customerData.nome || !customerData.telefono) {
    return res.status(400).json({ success: false, error: 'Dati cliente incompleti.' });
  }

  const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'http://localhost:5173';
  const isRitiro = metodo_consegna === 'Ritiro in negozio';
  const shippingFeeCents = isRitiro ? 0 : 690; // 6,90 € corriere espresso, 0 € ritiro

  const stripeKey = process.env.STRIPE_SECRET_KEY;

  // Fallback / Mock per test locali se la chiave Stripe non è ancora configurata
  if (!stripeKey || stripeKey.startsWith('mock')) {
    console.log('[Stripe] Chiave non configurata o mock attiva. Generazione sessione mock di test.');
    return res.status(200).json({
      success: true,
      url: `${origin}/thank-you?session_id=cs_test_mock_${Date.now()}&mock=true`,
      mock: true,
    });
  }

  try {
    const stripe = new Stripe(stripeKey);

    const lineItems = cartItems.map((item) => {
      const unitAmount = Math.round(parseFloat(item.prezzo) * 100);
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${item.titolo}${item.size ? ` (Taglia ${item.size})` : ''}`,
            images: item.immagine_url ? [item.immagine_url] : undefined,
          },
          unit_amount: unitAmount,
        },
        quantity: parseInt(item.quantity, 10) || 1,
      };
    });

    // Aggiungi spese di spedizione se previste (6,90 €)
    if (shippingFeeCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Spedizione Corriere Espresso',
            description: 'Consegna a domicilio tracciata (24/48h)',
          },
          unit_amount: shippingFeeCents,
        },
        quantity: 1,
      });
    }

    const indirizzoCompleto = isRitiro
      ? "Ritiro in boutique (Via Martiri della Libertà 67, Monticelli d'Ongina)"
      : `${customerData.indirizzo || ''}, ${customerData.cap || ''} ${customerData.citta || ''}`;

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'hosted_page',
      mode: 'payment',
      line_items: lineItems,
      customer_email: customerData.email || undefined,
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      automatic_tax: { enabled: false },
      allow_promotion_codes: false,
      submit_type: 'auto',
      shipping_address_collection: { allowed_countries: ['IT'] },
      name_collection: { individual: { enabled: true } },
      integration_identifier: 'hosted_web_0001',
      origin_context: 'web',
      metadata: {
        nome_cliente: `${customerData.nome} ${customerData.cognome || ''}`.trim(),
        telefono: customerData.telefono,
        email: customerData.email || '',
        indirizzo_spedizione: indirizzoCompleto,
        metodo_consegna: isRitiro ? 'Ritiro in negozio' : 'Spedizione a domicilio',
        note: customerData.note ? String(customerData.note).slice(0, 500) : '',
        dettaglio_articoli: JSON.stringify(
          cartItems.map((item) => ({
            id: item.id,
            titolo: item.titolo,
            prezzo: item.prezzo,
            taglia: item.size || 'Unica',
            quantita: item.quantity || 1,
          }))
        ),
      },
      success_url: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=true`,
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error('[Stripe Session Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Errore nella creazione della sessione Stripe',
    });
  }
}
