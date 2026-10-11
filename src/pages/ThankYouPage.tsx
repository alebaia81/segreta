import { useEffect, useState } from 'react';
import { CheckCircle, ShoppingBag, Landmark, Copy, Check, Printer } from 'lucide-react';
import { BANK_DETAILS } from '../lib/bankDetails';

interface ThankYouPageProps {
  onBackToShopping: () => void;
}

export default function ThankYouPage({ onBackToShopping }: ThankYouPageProps) {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedCausale, setCopiedCausale] = useState(false);

  useEffect(() => {
    // Se torniamo da una sessione Stripe con ?session_id=...
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    const lastOrder = localStorage.getItem('segreta_last_order');
    if (lastOrder) {
      try {
        const parsed = JSON.parse(lastOrder);
        if (sessionId) {
          parsed.stripe_session_id = sessionId;
          parsed.stato = 'Pagamento Ricevuto - In Lavorazione';
          parsed.metodo_pagamento = 'Carta / Stripe';
          localStorage.setItem('segreta_last_order', JSON.stringify(parsed));
          // Svuota carrello locale
          localStorage.removeItem('segreta_cart');
          window.dispatchEvent(new Event('segreta_cart_updated'));
        }
        setOrderDetails(parsed);
      } catch (err) {
        console.error('Errore nel parsing dell\'ultimo ordine:', err);
      }
    }
  }, []);

  const handleCopy = (text: string, type: 'iban' | 'causale') => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    if (type === 'iban') {
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2500);
    } else {
      setCopiedCausale(true);
      setTimeout(() => setCopiedCausale(false), 2500);
    }
  };

  const handleDownloadReceipt = () => {
    if (!orderDetails) return;
    const win = window.open('', '_blank');
    if (!win) {
      alert('Per favore, abilita i popup nel browser per visualizzare e scaricare la ricevuta.');
      return;
    }

    const itemsList = articoli.map((item: any) => `
      <tr>
        <td style="padding: 10px 6px; border-bottom: 1px solid #eee;">
          <strong>${item.titolo}</strong>
          ${item.taglia ? `<br><span style="font-size: 12px; color: #777;">Taglia: ${item.taglia}</span>` : ''}
        </td>
        <td style="padding: 10px 6px; text-align: center; border-bottom: 1px solid #eee;">x${item.quantita}</td>
        <td style="padding: 10px 6px; text-align: right; border-bottom: 1px solid #eee; font-weight: 600;">€${(item.prezzo * item.quantita).toFixed(2)}</td>
      </tr>
    `).join('');

    const isBonifico = orderDetails.metodo_pagamento === 'Bonifico Bancario';
    const isRitiro = orderDetails.metodo_consegna === 'Ritiro in negozio';
    const dataFormatted = orderDetails.created_at
      ? new Date(orderDetails.created_at).toLocaleString('it-IT')
      : new Date().toLocaleString('it-IT');

    win.document.write(`
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <title>Ricevuta Ordine #${orderDetails.id} — Segreta Style</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #2C2520;
            background: #fff;
            margin: 0;
            padding: 30px 20px;
          }
          .receipt-wrapper {
            max-width: 580px;
            margin: 0 auto;
            border: 1px solid #E6E1DC;
            border-radius: 12px;
            padding: 28px;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 2px solid #FAF0F4;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .receipt-logo {
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #2C2520;
            margin: 0 0 4px 0;
          }
          .receipt-tagline {
            font-size: 12px;
            color: #8C827A;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .receipt-meta {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            line-height: 1.5;
            background: #FAF8F5;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 20px;
          }
          .receipt-notice {
            border-radius: 8px;
            padding: 12px 14px;
            font-size: 13px;
            margin-bottom: 20px;
            line-height: 1.45;
          }
          .pickup-box {
            background: #FFF7F9;
            border: 1px solid #F5D5DF;
            color: #9C3353;
          }
          .bonifico-box {
            background: #FAF8F5;
            border: 1px solid #E6E1DC;
            color: #2C2520;
          }
          .bonifico-box h4 {
            margin: 0 0 6px 0;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-bottom: 16px;
          }
          th {
            text-align: left;
            padding: 8px 6px;
            border-bottom: 2px solid #E6E1DC;
            font-size: 11px;
            text-transform: uppercase;
            color: #7A726B;
            letter-spacing: 0.05em;
          }
          .total-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 2px solid #2C2520;
            padding-top: 12px;
            font-size: 16px;
            font-weight: 700;
          }
          .total-amount {
            font-size: 20px;
            color: #CB6B86;
          }
          .receipt-footer {
            text-align: center;
            font-size: 11px;
            color: #999;
            margin-top: 28px;
            padding-top: 14px;
            border-top: 1px solid #F0EBE6;
            line-height: 1.5;
          }
          @media print {
            body { padding: 0; }
            .receipt-wrapper { border: none; padding: 10px; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-wrapper">
          <div class="receipt-header">
            <h1 class="receipt-logo">Segreta Style</h1>
            <div class="receipt-tagline">Abbigliamento Donna & Accessori • Monticelli d'Ongina (PC)</div>
          </div>

          <div class="receipt-meta">
            <div>
              <strong>Ordine #${orderDetails.id}</strong><br>
              Data: ${dataFormatted}<br>
              Pagamento: <strong>${orderDetails.metodo_pagamento || 'Online'}</strong>
            </div>
            <div style="text-align: right;">
              <strong>${orderDetails.nome_cliente}</strong><br>
              Tel: ${orderDetails.telefono}<br>
              ${orderDetails.email ? `Email: ${orderDetails.email}<br>` : ''}
              Consegna: <strong>${orderDetails.metodo_consegna}</strong>
            </div>
          </div>

          ${isRitiro ? `
            <div class="receipt-notice pickup-box">
              <strong>🛍️ RITIRO IN NEGOZIO:</strong> Mostra questa ricevuta o comunica il numero d'ordine <strong>#${orderDetails.id}</strong> al momento del ritiro presso il negozio Segreta Style a Monticelli d'Ongina.
            </div>
          ` : `
            <div class="receipt-notice" style="background:#f9f9f9; border:1px solid #eee;">
              <strong>Indirizzo di spedizione:</strong> ${orderDetails.indirizzo_spedizione}
            </div>
          `}

          ${isBonifico ? `
            <div class="receipt-notice bonifico-box">
              <h4>Coordinate per il Bonifico Bancario</h4>
              <div><strong>Beneficiario:</strong> ${BANK_DETAILS.beneficiario}</div>
              <div><strong>IBAN:</strong> ${BANK_DETAILS.iban}</div>
              <div><strong>Banca:</strong> ${BANK_DETAILS.banca}</div>
              <div><strong>Importo da saldare:</strong> €${orderDetails.totale.toFixed(2)}</div>
              <div><strong>Causale:</strong> Ordine #${orderDetails.id} - ${orderDetails.nome_cliente}</div>
            </div>
          ` : ''}

          <table>
            <thead>
              <tr>
                <th>Articolo</th>
                <th style="text-align: center;">Qtà</th>
                <th style="text-align: right;">Prezzo</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          <div class="total-section">
            <span>Totale Complessivo</span>
            <span class="total-amount">€${orderDetails.totale.toFixed(2)}</span>
          </div>

          <div class="receipt-footer">
            Grazie per aver scelto Segreta Style! Per qualsiasi necessità contattaci su WhatsApp.<br>
            www.segretastyle.it
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 250);
  };

  if (!orderDetails) {
    return (
      <div className="thankyou-empty-container container">
        <ShoppingBag size={48} className="empty-icon" />
        <h2>Ordine non trovato</h2>
        <p>Non è stato possibile caricare i dettagli dell'ultimo ordine.</p>
        <button className="btn-primary" onClick={onBackToShopping}>
          Torna allo Shop
        </button>
        <style>{CSS}</style>
      </div>
    );
  }

  const articoli = orderDetails.dettaglio_articoli 
    ? (typeof orderDetails.dettaglio_articoli === 'string'
        ? JSON.parse(orderDetails.dettaglio_articoli)
        : orderDetails.dettaglio_articoli)
    : [];

  const causaleTesto = `Ordine #${orderDetails.id} - ${orderDetails.nome_cliente}`;
  const isRitiro = orderDetails.metodo_consegna === 'Ritiro in negozio';

  return (
    <section className="thankyou-section container fade-in">
      <div className="order-success-card">
        <CheckCircle size={64} className="success-icon" />
        <h2>Grazie del tuo ordine!</h2>
        <p className="success-desc">
          Il tuo ordine <strong>#{orderDetails.id}</strong> è stato registrato con successo.
          {orderDetails.metodo_pagamento === 'Satispay'
            ? ' Se hai già inviato il pagamento tramite l\'app Satispay, Greta verificherà l\'accredito e ti contatterà a breve.'
            : orderDetails.metodo_pagamento === 'Bonifico Bancario'
            ? ' Per completare l\'acquisto, effettua il bonifico bancario con i dati riportati di seguito. Gli articoli rimarranno riservati per te!'
            : ' Il pagamento con Carta / Stripe è andato a buon fine.'}
          {' '}Riceverai a breve un messaggio da Greta per la conferma finale dei tempi di spedizione.
        </p>

        {/* Avviso Ritiro in Negozio */}
        {isRitiro && (
          <div className="pickup-banner">
            <ShoppingBag size={22} className="pickup-banner-icon" />
            <div className="pickup-banner-content">
              <strong>Ritiro in Negozio (Monticelli d'Ongina)</strong>
              <p>Puoi scaricare la ricevuta con il pulsante qui sotto da mostrare direttamente dal cellulare quando passi a ritirare il tuo ordine.</p>
            </div>
          </div>
        )}

        {/* Box Coordinate Bonifico Bancario */}
        {orderDetails.metodo_pagamento === 'Bonifico Bancario' && (
          <div className="bank-transfer-box">
            <div className="bank-transfer-header">
              <div className="bank-icon-badge">
                <Landmark size={22} />
              </div>
              <div>
                <h3 className="bank-transfer-title">Dati per il Bonifico Bancario</h3>
                <p className="bank-transfer-subtitle">
                  Effettua il bonifico entro <strong>{BANK_DETAILS.scadenzaGiorni} giorni lavorativi</strong> per riservare gli articoli. L'ordine verrà elaborato non appena ricevuto l'accredito.
                </p>
              </div>
            </div>

            <div className="bank-details-list">
              <div className="bank-detail-row">
                <span className="bank-label">Beneficiario:</span>
                <span className="bank-value font-semibold">{BANK_DETAILS.beneficiario}</span>
              </div>

              <div className="bank-detail-row iban-row">
                <span className="bank-label">IBAN:</span>
                <div className="bank-copyable-field">
                  <code className="iban-code">{BANK_DETAILS.iban}</code>
                  <button
                    type="button"
                    className="copy-btn"
                    onClick={() => handleCopy(BANK_DETAILS.iban, 'iban')}
                    title="Copia codice IBAN"
                    aria-label="Copia codice IBAN"
                  >
                    {copiedIban ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedIban ? 'Copiato!' : 'Copia IBAN'}</span>
                  </button>
                </div>
              </div>

              <div className="bank-detail-row">
                <span className="bank-label">Banca:</span>
                <span className="bank-value">{BANK_DETAILS.banca}</span>
              </div>

              <div className="bank-detail-row">
                <span className="bank-label">Importo:</span>
                <span className="bank-value highlight-amount">€{orderDetails.totale.toFixed(2)}</span>
              </div>

              <div className="bank-detail-row causale-row">
                <span className="bank-label">Causale:</span>
                <div className="bank-copyable-field">
                  <span className="causale-code">{causaleTesto}</span>
                  <button
                    type="button"
                    className="copy-btn"
                    onClick={() => handleCopy(causaleTesto, 'causale')}
                    title="Copia causale"
                    aria-label="Copia causale"
                  >
                    {copiedCausale ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCausale ? 'Copiata!' : 'Copia Causale'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="order-summary-box">
          <h3>Riepilogo dell'Ordine</h3>
          <div className="summary-accent-line"></div>

          <div className="summary-details">
            <p><strong>Cliente:</strong> {orderDetails.nome_cliente}</p>
            <p><strong>Telefono:</strong> {orderDetails.telefono}</p>
            <p><strong>Metodo di Consegna:</strong> {orderDetails.metodo_consegna}</p>
            <p><strong>Indirizzo Spedizione:</strong> {orderDetails.indirizzo_spedizione}</p>
            <p>
              <strong>Metodo Pagamento:</strong> {orderDetails.metodo_pagamento || 'Online'}
              {orderDetails.metodo_pagamento === 'Satispay'
                ? ' (Inviato via App)'
                : orderDetails.metodo_pagamento === 'Bonifico Bancario'
                ? ' (In attesa di accredito)'
                : ' (Completato)'}
            </p>
          </div>

          <table className="order-items-table">
            <thead>
              <tr>
                <th>Articolo</th>
                <th>Taglia</th>
                <th style={{ textAlign: 'center' }}>Qtà</th>
                <th style={{ textAlign: 'right' }}>Prezzo</th>
              </tr>
            </thead>
            <tbody>
              {articoli.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td>{item.titolo}</td>
                  <td style={{ color: 'var(--accent-gold-hover)' }}>{item.taglia || 'Unica'}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantita}</td>
                  <td style={{ textAlign: 'right' }}>€{(item.prezzo * item.quantita).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="table-total-row">
                <td colSpan={3}>Totale complessivo</td>
                <td style={{ textAlign: 'right' }}>€{orderDetails.totale.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Azioni Ricevuta e Continuazione Shopping */}
        <div className="thankyou-actions-bar">
          <button
            type="button"
            className="receipt-download-btn"
            onClick={handleDownloadReceipt}
            aria-label="Scarica o stampa ricevuta d'ordine"
          >
            <Printer size={18} />
            <span>Scarica / Stampa Ricevuta (PDF)</span>
          </button>

          <button className="back-to-shop-action-btn" onClick={onBackToShopping}>
            Torna allo Shopping
          </button>
        </div>
      </div>

      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
  .thankyou-section {
    padding: var(--spacing-xxl) 0;
    max-width: 820px;
    margin: 0 auto;
  }

  .thankyou-empty-container {
    text-align: center;
    padding: 8rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
  }

  .empty-icon {
    color: var(--text-secondary);
    opacity: 0.5;
  }

  .order-success-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: var(--shadow-md);
  }

  .success-icon {
    color: #2e7d32;
    margin-bottom: var(--spacing-md);
  }

  .order-success-card h2 {
    font-family: var(--font-serif);
    font-size: 2.2rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  .success-desc {
    font-size: 1.05rem;
    color: var(--text-secondary);
    max-width: 620px;
    line-height: 1.6;
    margin: 0 0 var(--spacing-xl) 0;
  }

  /* Pickup Banner */
  .pickup-banner {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 14px;
    background: #FFF7F9;
    border: 1px solid #F5D5DF;
    border-radius: 12px;
    padding: 1rem 1.3rem;
    margin-bottom: var(--spacing-lg);
    text-align: left;
  }

  .pickup-banner-icon {
    color: #CB6B86;
    flex-shrink: 0;
  }

  .pickup-banner-content strong {
    display: block;
    color: #2C2520;
    font-size: 0.95rem;
    margin-bottom: 2px;
  }

  .pickup-banner-content p {
    margin: 0;
    font-size: 0.85rem;
    color: #7A726B;
    line-height: 1.4;
  }

  /* Bank Transfer Box */
  .bank-transfer-box {
    width: 100%;
    background-color: #FAF8F5;
    border: 1px solid #E6E1DC;
    border-radius: 14px;
    padding: 1.4rem 1.6rem;
    margin-bottom: var(--spacing-xl);
    text-align: left;
    box-shadow: 0 2px 8px rgba(44, 37, 32, 0.04);
  }

  .bank-transfer-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 1.2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #ECE7E1;
  }

  .bank-icon-badge {
    background: rgba(226, 149, 171, 0.16);
    color: #cb6b86;
    border-radius: 10px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .bank-transfer-title {
    font-family: var(--font-serif);
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px 0;
  }

  .bank-transfer-subtitle {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.45;
    margin: 0;
  }

  .bank-details-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .bank-detail-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 0.92rem;
    padding: 6px 0;
    border-bottom: 1px dashed rgba(230, 225, 220, 0.7);
  }

  .bank-detail-row:last-child {
    border-bottom: none;
  }

  .bank-label {
    color: var(--text-secondary);
    font-weight: 500;
    min-width: 110px;
  }

  .bank-value {
    color: var(--text-primary);
    font-size: 0.95rem;
  }

  .highlight-amount {
    font-size: 1.15rem;
    font-weight: 700;
    color: #cb6b86;
  }

  .bank-copyable-field {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .iban-code {
    background: #FFFFFF;
    border: 1px solid #D9D2CA;
    border-radius: 6px;
    padding: 5px 9px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9rem;
    letter-spacing: 0.04em;
    font-weight: 600;
    color: var(--text-primary);
  }

  .causale-code {
    background: #FFFFFF;
    border: 1px solid #D9D2CA;
    border-radius: 6px;
    padding: 5px 9px;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #FFFFFF;
    border: 1px solid #D9D2CA;
    border-radius: 6px;
    padding: 5px 10px;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .copy-btn:hover {
    border-color: #E295AB;
    background: rgba(226, 149, 171, 0.12);
    color: #cb6b86;
  }

  /* Order Summary Box */
  .order-summary-box {
    width: 100%;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    text-align: left;
    margin-bottom: var(--spacing-xl);
  }

  .order-summary-box h3 {
    font-family: var(--font-serif);
    font-size: 1.3rem;
    font-weight: 500;
    margin: 0 0 6px 0;
    color: var(--text-primary);
  }

  .summary-accent-line {
    height: 2px;
    width: 50px;
    background-color: var(--accent-gold);
    margin-bottom: var(--spacing-lg);
  }

  .summary-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: var(--spacing-lg);
    font-size: 0.95rem;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: var(--spacing-md);
  }

  .summary-details strong {
    color: var(--text-primary);
  }

  .order-items-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: var(--spacing-md);
    font-size: 0.95rem;
  }

  .order-items-table th {
    text-align: left;
    padding: 10px 0;
    border-bottom: 2px solid var(--border-color);
    color: var(--text-secondary);
    font-weight: 600;
  }

  .order-items-table td {
    padding: 12px 0;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
  }

  .table-total-row td {
    font-weight: 700;
    font-size: 1.1rem;
    border-bottom: none;
    padding-top: var(--spacing-md);
  }

  /* Action Buttons */
  .thankyou-actions-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
    width: 100%;
  }

  .receipt-download-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background-color: #2C2520;
    color: #FFFFFF;
    border: none;
    padding: 0.85rem 1.6rem;
    border-radius: var(--radius-sm);
    font-size: 0.92rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-smooth);
    box-shadow: 0 2px 8px rgba(44, 37, 32, 0.15);
  }

  .receipt-download-btn:hover {
    background-color: #423832;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(44, 37, 32, 0.22);
  }

  .back-to-shop-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    padding: 0.85rem 1.6rem;
    border-radius: var(--radius-sm);
    font-size: 0.92rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .back-to-shop-action-btn:hover {
    border-color: #E295AB;
    background: rgba(226, 149, 171, 0.08);
    color: #cb6b86;
  }
`;
