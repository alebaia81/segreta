# Prossimi Step e Note di Progetto — Segreta Style

## 🚀 Prossimo Step Prioritario: Collegamento Dominio Personalizzato `segretastyle.it`

Quando saremo pronti per il puntamento DNS definitivo:

1. **Dashboard Cloudflare Pages**:
   - Andare su *Workers & Pages* ➔ Progetto `segreta` ➔ Scheda *Custom domains*.
   - Aggiungere `segretastyle.it` e `www.segretastyle.it`.

2. **Configurazione DNS (sul Registrar del Dominio)**:
   - Configurare i record CNAME verso `segreta.pages.dev` (oppure aggiornare i Nameserver a quelli di Cloudflare per SSL automatizzato).

---

## 📌 Stato del Progetto (Aggiornato all'11 Agosto 2026)

- **Admin Dashboard**:
  - Polling ordini automatico ogni 5s + anti-cache attivo.
  - Selezione taglie di default vuota per i nuovi prodotti.
  - Badge metodo di pagamento (`Satispay` vs `PayPal / Carta`).
  - Stato unificato `Pagamento Ricevuto - In Lavorazione`.
  - Tasto elimina ordine manuale (con modal di conferma).
  - Filtro separato Ordini Attivi vs Archivio Ordini.

- **Checkout & Pagamenti**:
  - Validazione campi form (Nome, Cognome, Telefono, Email, Indirizzo/Città/CAP) obbligatoria prima di poter cliccare PayPal.
  - Integrazione colonna `email` nel database Supabase ed invio automatico ad ogni ordine.
  - Generazione ordine su Supabase con 3 tentativi di retry e fallback locale con ID PayPal reale (`PP_...`).

---

## 📌 Funzionalità Completate

- **Contatore Visite e Statistiche Traffico (Dashboard Admin)**:
  - Tab dedicata **Statistiche** in `AdminDashboard.jsx` con componente `AdminStatistiche.jsx`.
  - Tracciamento visite anonimo e GDPR compliant via `src/lib/tracker.js` (esclusione automatica admin e deduplicazione sessione).
  - Endpoint API sincroni per Cloudflare Pages (`functions/api/visite.js`, `functions/api/admin/statistiche.js`) e dev server (`api/visite.js`, `api/admin/statistiche.js`).
  - Script SQL per la creazione della tabella `visite` su Supabase:
    ```sql
    CREATE TABLE IF NOT EXISTS public.visite (
      id BIGSERIAL PRIMARY KEY,
      pagina TEXT NOT NULL,
      articolo_id BIGINT REFERENCES public.articoli(id) ON DELETE SET NULL,
      sessione_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_visite_created_at ON public.visite (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_visite_articolo_id ON public.visite (articolo_id);
    CREATE INDEX IF NOT EXISTS idx_visite_sessione_pagina ON public.visite (sessione_id, pagina, created_at);
    ALTER TABLE public.visite ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow public insert to visite" ON public.visite FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow service role read visite" ON public.visite FOR SELECT USING (true);
    ```


