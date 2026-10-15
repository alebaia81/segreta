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

## 💡 Idee Future / In Sospeso

### Contatore Visite e Statistiche Traffico (Dashboard Admin)
- **Obiettivo:** Mostrare a Greta le statistiche essenziali (visite di oggi, della settimana, totali e i 5 capi più visti).
- **Approccio scelto:** Interno con Supabase (zero cookie, 100% GDPR-friendly, nessun servizio esterno).
- **Script SQL pronto per Supabase:**
  ```sql
  CREATE TABLE IF NOT EXISTS visite (
    id BIGSERIAL PRIMARY KEY,
    pagina TEXT NOT NULL,
    articolo_id BIGINT REFERENCES articoli(id) ON DELETE SET NULL,
    sessione_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_visite_created_at ON visite (created_at);
  CREATE INDEX IF NOT EXISTS idx_visite_articolo_id ON visite (articolo_id);
  ```

