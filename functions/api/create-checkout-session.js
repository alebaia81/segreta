import Stripe from 'stripe';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { cartItems, customerData, metodo_consegna } = body || {};

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Il carrello è vuoto.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!customerData || !customerData.nome || !customerData.telefono) {
      return new Response(JSON.stringify({ success: false, error: 'Dati cliente incompleti.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const requestUrl = new URL(request.url);
    const origin = request.headers.get('origin') || `${requestUrl.protocol}//${requestUrl.host}`;
    const isRitiro = metodo_consegna === 'Ritiro in negozio';
    const itemsTotalCents = (cartItems || []).reduce((acc, item) => {
      const price = Math.round(parseFloat(item.prezzo) * 100) || 0;
      const qty = parseInt(item.quantity, 10) || 1;
      return acc + price * qty;
    }, 0);
    const isFreeShipping = itemsTotalCents >= 5000; // Spedizione gratuita a partire da 50,00 €
    const shippingFeeCents = (isRitiro || isFreeShipping) ? 0 : 690; // 6,90 € corriere, 0 € se >= 50€ o ritiro

    const stripeKey = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

    if (!stripeKey || stripeKey.startsWith('mock')) {
      return new Response(
        JSON.stringify({
          success: true,
          url: `${origin}/thank-you?session_id=cs_test_mock_${Date.now()}&mock=true`,
          mock: true,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const stripe = new Stripe(stripeKey);

    const lineItems = cartItems.map((item) => {
      const unitAmount = Math.round(parseFloat(item.prezzo) * 100);
      let validImages = undefined;
      if (item.immagine_url) {
        const rawUrl = Array.isArray(item.immagine_url) ? item.immagine_url[0] : String(item.immagine_url).split(',')[0];
        const cleanUrl = String(rawUrl || '').trim();
        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
          validImages = [cleanUrl];
        }
      }

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${item.titolo}${item.size ? ` (Taglia ${item.size})` : ''}`,
            images: validImages,
          },
          unit_amount: unitAmount,
        },
        quantity: parseInt(item.quantity, 10) || 1,
      };
    });

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

    return new Response(JSON.stringify({ success: true, url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Cloudflare Stripe Error]:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Errore interno Stripe' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
