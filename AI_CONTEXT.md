# Contesto Progetto: Segreta Style

Questo documento serve come "memoria" e riepilogo tecnico per future sessioni di sviluppo con AI. Contiene tutte le informazioni sull'architettura, le tecnologie utilizzate e le configurazioni del progetto.

## 1. Stack Tecnologico e Architettura
- **Frontend**: React.js (Vite).
- **Backend / API**: Vercel Serverless Functions (Node.js). Le API si trovano nella cartella `/api/` e fungono da intermediario sicuro tra il frontend e il database.
- **Database e Storage**: Supabase (PostgreSQL).
- **Hosting**: Vercel (collegato al repository GitHub `alebaia81/segreta`). Deploy automatico dal branch `main`.

## 2. Configurazione Supabase
- **Progetto**: `efebewxubvxxzfftesvv` (URL: `https://efebewxubvxxzfftesvv.supabase.co`)
- **Tabelle Database**:
  - `articoli` (catalogo prodotti)
  - `ordini` (ordini ricevuti dal negozio)
  - *Nota Permessi*: È stato eseguito il comando SQL `GRANT ALL` sulle tabelle e sulle sequenze per i ruoli `anon`, `authenticated` e `service_role` in modo da consentire l'accesso dalle Serverless Functions.
- **Storage (Bucket)**: 
  - Nome: `prodotti`
  - Impostato come **Pubblico** (per permettere la visualizzazione delle immagini dei vestiti senza restrizioni).

## 3. Variabili d'Ambiente (Vercel Environment Variables)
Per questioni di sicurezza, le chiavi API non sono nel codice sorgente ma impostate nella dashboard di Vercel:
- `SUPABASE_URL`: L'URL del progetto Supabase.
- `SUPABASE_SECRET_KEY`: La chiave segreta (`sb_secret_...`) utilizzata dalle Vercel API Routes per interrogare il database. *(NB: È importante non esporre questa chiave anteponendo "VITE_" per evitare che finisca nel bundle del browser)*.
- `ADMIN_PASSWORD` (o `VITE_ADMIN_PASSWORD`): La password utilizzata per sbloccare l'accesso al pannello `/admin` (es. `Segreta2026`).

## 4. Sicurezza e Flusso Dati
- Il browser (Frontend React) **non** comunica mai direttamente con Supabase per operazioni critiche sul database.
- Il frontend effettua chiamate fetch alle API di Vercel (es. `/api/admin/prodotti`).
- Le funzioni Vercel verificano l'autenticazione (tramite la password admin passata negli headers `x-admin-password`).
- Solo se la password è corretta, la funzione Vercel utilizza la `SUPABASE_SECRET_KEY` per leggere o scrivere su Supabase.

## 5. Stato Attuale (Luglio 2026)
- **Login Admin**: Funzionante (con gestione errori e icona occhio per mostrare/nascondere la password).
- **Gestione Errori**: Le funzioni API catturano eventuali problemi di inizializzazione di Supabase e restituiscono risposte esplicite al client, prevenendo crash silenziosi.
- **Navigazione**: Corretto il bug per cui i link diretti (come `segreta.vercel.app/admin`) non venivano risolti correttamente. Vite su Vercel ora gestisce il fallback alla `index.html`.
- **Database**: Connessione "verde" funzionante. I prodotti vengono caricati correttamente nel catalogo dell'Admin.
