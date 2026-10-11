# Stripe Integration TODO & Single Source of Truth 🛍️💳

Documento di riferimento per l'integrazione di **Stripe Checkout** in **Segreta Style**.

---

## 1. Stato Integrazione (Ambiente Locale)

- [x] **Disattivazione / Rimozione PayPal** (rimossi componenti e dipendenza `@paypal/react-paypal-js`).
- [x] **Installazione SDK Stripe** (`stripe: ^23.0.0`).
- [x] **Endpoint Creazione Sessione Checkout**:
  - `api/create-checkout-session.js` (per Vercel & server di sviluppo `dev-server.js`)
  - `functions/api/create-checkout-session.js` (per Cloudflare Pages Functions)
- [x] **Endpoint Webhook per Conferma Pagamento**:
  - `api/stripe-webhook.js` (gestione evento `checkout.session.completed` con salvataggio ordine su Supabase)
  - `functions/api/stripe-webhook.js` (Cloudflare Pages Functions)
- [x] **Aggiornamento Frontend Checkout UI** (`src/pages/CheckoutPage.tsx`):
  - Spese di spedizione validate: **6,90 €** per corriere espresso, **0,00 €** per ritiro in boutique.
  - Pulsante unico "Paga con Carta o Wallet 🔒".
  - Fallback simulato / mock automatico per test locali senza chiavi Stripe inserite.
- [x] **Pagina di Ringraziamento** (`src/pages/ThankYouPage.tsx`):
  - Riconoscimento `session_id`, svuotamento automatico del carrello e messaggio di conferma ordine.
- [x] **Configurazione Parametri Autoritativi `fixed_by_ui`** (in `stripe.checkout.sessions.create`).
- [x] **Chiave Segreta di Test Configurata & Verificata** (`STRIPE_SECRET_KEY=sk_test_...` attiva e validata con Stripe API).
- [x] **Server API Locale Attivo** (`dev-server.js` in esecuzione su `http://localhost:3000` con proxy Vite `http://localhost:5173`).

---

## 2. Parametri Autoritativi Configurati (`fixed_by_ui`)

Tutti i parametri autoritativi sono stati applicati rigorosamente alla chiamata `stripe.checkout.sessions.create`:

| Parametro | Valore Configurato | Note |
|---|---|---|
| `ui_mode` | `'hosted_page'` | SDK Stripe `v23.0.0` (supporto Stripe Hosted Checkout) |
| `mode` | `'payment'` | Pagamento una tantum per prodotti e-commerce |
| `billing_address_collection` | `'required'` | Richiede indirizzo di fatturazione del titolare della carta |
| `phone_number_collection` | `{ enabled: true }` | Raccoglie il numero di cellulare per notifiche corriere |
| `automatic_tax` | `{ enabled: false }` | Prezzi IVA inclusa secondo normativa italiana |
| `allow_promotion_codes` | `false` | Disabilitati codici sconto al checkout Stripe |
| `submit_type` | `'auto'` | Testo dinamico per il pulsante Stripe |
| `shipping_address_collection` | `{ allowed_countries: ['IT'] }` | Ristretto alle consegne sul territorio italiano |
| `name_collection` | `{ individual: { enabled: true } }` | Richiede nome e cognome intestatario |
| `integration_identifier` | `'hosted_web_0001'` | Identificativo univoco di integrazione web |
| `origin_context` | `'web'` | Contesto origine web |
| `payment_method_collection` | *omesso* | Omesso in accordo con Regola 8 per `mode: 'payment'` |

### Parametri Dinamici Reali (`sample_only`):
- `line_items`: calcolo dinamico dagli articoli nel carrello + riga spedizione:
  - Spedizione con corriere: **6,90 €** (`unit_amount: 690`)
  - Ritiro in boutique: **0,00 €** (nessuna voce aggiuntiva di trasporto)
- `success_url`: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`
- `cancel_url`: `${origin}/checkout?canceled=true`
- `metadata`: nome, telefono, email, indirizzo di spedizione, metodo di consegna e dettaglio articoli in JSON per tracciabilità completa.

---

## 3. Guida Configurazione Chiavi d'Ambiente (`.env`)

Per passare dai test simulati ai pagamenti reali / sandbox Stripe, configurare il file `.env` nella root del progetto:

```env
# ===================================================
# STRIPE CONFIGURATION
# ===================================================

# 1. Chiave Segreta Stripe (Backend Serverless / dev-server.js)
# IMPORTANTE: Non deve avere il prefisso VITE_ per non essere esposta nel bundle client.
# In Test: sk_test_...
# In Produzione: sk_live_...
STRIPE_SECRET_KEY=sk_test_tuachiavesegreta_qui

# 2. Segreto Webhook Stripe (per verifica firma eventi in POST /api/stripe-webhook)
# Ottenibile dalla Stripe Dashboard -> Developers -> Webhooks oppure da Stripe CLI.
STRIPE_WEBHOOK_SECRET=whsec_tuosegretowebhook_qui

# 3. Chiave Pubblicabile (Opzionale / Solo se richiesta da SDK client frontend)
# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tuachiavepubblica_qui
```

> **Nota di sicurezza:** La `STRIPE_SECRET_KEY` viene letta esclusivamente lato backend (`dev-server.js`, `api/create-checkout-session.js`, Cloudflare Functions) e non trapela mai nel codice client JavaScript inviato al browser.

---

## 4. Modalità di Test in Locale

### A. Test con Mock Automatico (Senza Chiavi Stripe)
Se `STRIPE_SECRET_KEY` non è presente o inizia con `mock`:
1. Avviare il frontend con `npm run dev` (su `http://localhost:5173`).
2. Avviare l'API di sviluppo con `npm run dev:api` (su `http://localhost:3000`).
3. Procedere al Checkout selezionando "Carta di Credito / Apple Pay" -> Cliccare su **"Paga con Carta o Wallet 🔒"**.
4. Il sistema effettua una simulazione guidata con redirect su `http://localhost:5173/thank-you?session_id=cs_test_mock_...&mock=true`.
5. Il carrello viene svuotato regolarmente e compare il messaggio di conferma.

### B. Test con Account Stripe Sandbox (Test Mode)
1. Inserire `STRIPE_SECRET_KEY=sk_test_...` in `.env`.
2. Riavviare `npm run dev:api`.
3. Il checkout effettuerà il redirect sul portale Stripe Hosted Checkout reale con il riepilogo ordini e le spese di spedizione a 6,90 €.
4. Usare le carte di test Stripe (es. `4242 4242 4242 4242`).
5. Per testare il salvataggio automatico ordini tramite Webhook in locale:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```

---

## 5. Vincoli di Consegna

- [x] Spese di spedizione a **6,90 €** per corriere espresso, **0 €** per ritiro in negozio.
- [x] Supporto carte, Apple Pay e Google Pay tramite Stripe Checkout Hosted.
- [x] Lavoro isolato in locale: **NESSUN PUSH SU GITHUB** eseguito.
