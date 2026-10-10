import { useEffect, useState } from 'react';
import { CheckCircle, ShoppingBag, Landmark, Copy, Check } from 'lucide-react';
import { BANK_DETAILS } from '../lib/bankDetails';

interface ThankYouPageProps {
  onBackToShopping: () => void;
}

export default function ThankYouPage({ onBackToShopping }: ThankYouPageProps) {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedCausale, setCopiedCausale] = useState(false);

  useEffect(() => {
    const lastOrder = localStorage.getItem('segreta_last_order');
    if (lastOrder) {
      try {
        setOrderDetails(JSON.parse(lastOrder));
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
            : ' Il pagamento con PayPal è andato a buon fine.'}
          {' '}Riceverai a breve un messaggio da Greta per la conferma finale dei tempi di spedizione.
        </p>

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

        <button className="btn-primary back-btn" onClick={onBackToShopping}>
          Torna allo Shopping
        </button>
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

  .back-btn {
    padding: 0.9rem 2.2rem;
    font-weight: 700;
  }
`;
