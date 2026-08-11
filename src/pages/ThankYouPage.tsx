import { useEffect, useState } from 'react';
import { CheckCircle, ShoppingBag } from 'lucide-react';

interface ThankYouPageProps {
  onBackToShopping: () => void;
}

export default function ThankYouPage({ onBackToShopping }: ThankYouPageProps) {
  const [orderDetails, setOrderDetails] = useState<any>(null);

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
    ? JSON.parse(orderDetails.dettaglio_articoli) 
    : [];

  return (
    <section className="thankyou-section container fade-in">
      <div className="order-success-card">
        <CheckCircle size={64} className="success-icon" />
        <h2>Grazie del tuo ordine!</h2>
        <p className="success-desc">
          Il tuo ordine <strong>#{orderDetails.id}</strong> è stato registrato con successo.
          {orderDetails.metodo_pagamento === 'Satispay'
            ? ' Se hai già inviato il pagamento tramite l\'app Satispay, Greta verificherà l\'accredito e ti contatterà a breve.'
            : ' Il pagamento con PayPal è andato a buon fine.'}
          {' '}Riceverai a breve un messaggio da Greta per la conferma finale dei tempi di spedizione.
        </p>

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
              {orderDetails.metodo_pagamento === 'Satispay' ? ' (Inviato via App)' : ' (Completato)'}
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
    max-width: 800px;
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
    max-width: 600px;
    line-height: 1.6;
    margin: 0 0 var(--spacing-xl) 0;
  }

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
