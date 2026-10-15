# Specifica Tecnica e Design: Campo Note Ordine

## 1. Riepilogo di Sintesi (Understanding Summary)
- **Cosa:** Aggiunta di un campo facoltativo di testo "Note o richieste speciali sull'ordine" nel modulo di checkout (fino a 500 caratteri).
- **Perché:** Consente al cliente di inserire istruzioni dedicate, ad esempio i dati per le Carte Regalo (nome/cognome destinatario, recapito e messaggio d'auguri) o note per la consegna al corriere/orari di ritiro.
- **Per chi:** Cliente finale (al checkout e nella pagina di ringraziamento) e Greta/Amministrazione (nella dashboard e nel messaggio WhatsApp).
- **Non-obiettivi:** Nessun campo vincolante o form a passaggi rigidi per regali. Tutto gestito con massima flessibilità tramite un campo unico chiaro.

## 2. Decision Log
- **Decisione:** Adozione dell'Approccio 1 (Resiliente Ibrido con tentativo colonna nativa `note` + fallback automatico).
- **Alternative valutate:** Solo schema manuale Supabase (Opzione 2, rischio blocco ordini), Solo JSON `dettaglio_articoli` (Opzione 3).
- **Motivazione:** Zero downtime, nessun rischio di fallimento ordini anche se la colonna `note` non è ancora stata creata manualmente su Supabase, piena compatibilità futura.

## 3. Architettura e Flusso Dati

### 3.1. Frontend Checkout (`CheckoutPage.tsx`)
- Nuovo campo `<textarea>` posizionato tra i dati di spedizione e la scelta del metodo di pagamento.
- Placeholder orientato ai regali e alle consegne.
- Contatore caratteri (max 500).
- Salvataggio nello stato `formData.note`.

### 3.2. Pagamenti e API
- **Bonifico / Satispay:**
  - Invio di `note` a `/api/ordini` (e `functions/api/ordini.js`).
- **Carta / Stripe:**
  - Invio di `note` a `/api/create-checkout-session` (e `functions/api/create-checkout-session.js`), memorizzato nei `metadata` della sessione Stripe.
  - Ricezione e persistenza tramite webhook Stripe (`api/stripe-webhook.js` e `functions/api/stripe-webhook.js`) e sincronizzazione da `ThankYouPage.tsx`.

### 3.3. Persistenza e Resilienza Database
- Tentativo di salvataggio nella colonna `note`.
- In caso di errore Supabase `PGRST204` (colonna inesistente), fallback trasparente: il testo della nota viene allegato in calce all'indirizzo di spedizione (es. `Note: ...`) garantendo che l'ordine venga inserito senza blocchi.

### 3.4. Visualizzazione
- **Admin Dashboard (`AdminDashboard.jsx`):** Riquadro evidente dedicato alle note nella scheda dell'ordine.
- **Thank You Page (`ThankYouPage.tsx`):** Riepilogo note mostrato al cliente dopo l'acquisto.
- **WhatsApp Generator (`getWhatsAppUrl`):** Inclusione della nota nel messaggio WhatsApp automatico per Greta.
