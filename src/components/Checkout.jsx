import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { CheckCircle, ShoppingBag, CreditCard, Truck, Landmark, Store } from 'lucide-react';

export default function Checkout({ onBackToShopping }) {
  const { cartItems, cartTotal, clearCart } = useCart();
  
  const [formData, setFormData] = useState({
    nome_cliente: '',
    telefono: '',
    indirizzo_spedizione: '',
    metodo_pagamento: 'Contanti alla consegna',
    metodo_consegna: 'Spedizione a domicilio'
  });

  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrderDetails, setCompletedOrderDetails] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nome_cliente || !formData.telefono) {
      alert('Per favore, compila il tuo nome e numero di telefono.');
      return;
    }

    if (formData.metodo_consegna === 'Spedizione a domicilio' && !formData.indirizzo_spedizione) {
      alert('Per favore, specifica l\'indirizzo di spedizione.');
      return;
    }

    const nuovoOrdine = {
      id: Math.floor(Math.random() * 10000) + 1,
      nome_cliente: formData.nome_cliente,
      telefono: formData.telefono,
      indirizzo_spedizione: formData.metodo_consegna === 'Ritiro in negozio' 
        ? 'Ritiro in negozio (Monticelli d\'Ongina)' 
        : formData.indirizzo_spedizione,
      metodo_pagamento: formData.metodo_pagamento,
      metodo_consegna: formData.metodo_consegna,
      totale: cartTotal,
      dettaglio_articoli: JSON.stringify(cartItems.map(item => ({
        id: item.id,
        titolo: item.titolo,
        prezzo: item.prezzo,
        taglia: item.size,
        quantita: item.quantity
      }))),
      stato: 'In attesa',
      created_at: new Date().toISOString()
    };

    // Salvataggio nel Local Storage per far sì che la Dashboard Amministratore lo veda
    const ordiniSalvati = localStorage.getItem('segreta_ordini');
    const ordiniList = ordiniSalvati ? JSON.parse(ordiniSalvati) : [];
    ordiniList.unshift(nuovoOrdine); // Aggiunge all'inizio
    localStorage.setItem('segreta_ordini', JSON.stringify(ordiniList));

    // Salva i dettagli per visualizzarli nella schermata finale
    setCompletedOrderDetails(nuovoOrdine);
    
    // Pulisce il carrello
    clearCart();
    setOrderComplete(true);
  };

  if (orderComplete && completedOrderDetails) {
    const articoliOrdinati = JSON.parse(completedOrderDetails.dettaglio_articoli);
    
    return (
      <section className="checkout-section container fade-in">
        <div className="order-success-card">
          <CheckCircle size={64} className="success-icon" />
          <h2>Grazie del tuo ordine!</h2>
          <p className="success-desc">
            Il tuo ordine <strong>#{completedOrderDetails.id}</strong> è stato ricevuto con successo. 
            Verrai contattato telefonicamente da Greta a breve per confermare la disponibilità e organizzare la consegna.
          </p>

          <div className="order-summary-box">
            <h3>Riepilogo Ordine</h3>
            <div className="summary-accent-line"></div>
            
            <div className="summary-details">
              <p><strong>Cliente:</strong> {completedOrderDetails.nome_cliente}</p>
              <p><strong>Telefono:</strong> {completedOrderDetails.telefono}</p>
              <p><strong>Metodo di Consegna:</strong> {completedOrderDetails.metodo_consegna}</p>
              <p><strong>Indirizzo Spedizione:</strong> {completedOrderDetails.indirizzo_spedizione}</p>
              <p><strong>Metodo di Pagamento:</strong> {completedOrderDetails.metodo_pagamento}</p>
            </div>

            <table className="order-items-table">
              <thead>
                <tr>
                  <th>Articolo</th>
                  <th>Taglia</th>
                  <th>Qtà</th>
                  <th style={{ textAlign: 'right' }}>Prezzo</th>
                </tr>
              </thead>
              <tbody>
                {articoliOrdinati.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.titolo}</td>
                    <td>{item.taglia}</td>
                    <td>{item.quantita}</td>
                    <td style={{ textAlign: 'right' }}>€{(item.prezzo * item.quantita).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="table-total-row">
                  <td colSpan="3">Totale complessivo</td>
                  <td style={{ textAlign: 'right' }}>€{completedOrderDetails.totale.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <button className="btn-primary" onClick={onBackToShopping}>
            Torna allo Shopping
          </button>
        </div>

        <style>{`
          .checkout-section {
            padding: var(--spacing-xl) var(--spacing-lg);
          }
          .order-success-card {
            background-color: var(--bg-secondary);
            border-radius: var(--radius-lg);
            padding: var(--spacing-xl);
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-md);
            text-align: center;
            max-width: 600px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .success-icon {
            color: var(--success);
            margin-bottom: var(--spacing-md);
          }
          .success-desc {
            font-size: 1.05rem;
            color: var(--text-secondary);
            margin-bottom: var(--spacing-xl);
          }
          .order-summary-box {
            width: 100%;
            background-color: var(--bg-primary);
            border-radius: var(--radius-md);
            padding: var(--spacing-lg);
            border: 1px solid var(--border-color);
            margin-bottom: var(--spacing-xl);
            text-align: left;
          }
          .order-summary-box h3 {
            font-size: 1.3rem;
            color: var(--text-primary);
          }
          .summary-accent-line {
            width: 40px;
            height: 2px;
            background-color: var(--accent-gold);
            margin: var(--spacing-xs) 0 var(--spacing-md);
          }
          .summary-details {
            margin-bottom: var(--spacing-md);
            font-size: 0.9rem;
          }
          .summary-details p {
            margin-bottom: var(--spacing-xs);
          }
          .order-items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
            margin-top: var(--spacing-md);
          }
          .order-items-table th {
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 0.4rem;
            text-align: left;
            font-weight: 600;
            color: var(--text-secondary);
          }
          .order-items-table td {
            border-bottom: 1px solid var(--border-color);
            padding: 0.6rem 0;
            color: var(--text-primary);
          }
          .table-total-row td {
            font-weight: 700;
            font-size: 1.05rem;
            border-bottom: none;
            padding-top: var(--spacing-md);
          }
        `}</style>
      </section>
    );
  }

  return (
    <section className="checkout-section container fade-in">
      <div className="checkout-grid">
        {/* Form di Checkout */}
        <div className="checkout-form-container">
          <h2>Completa il tuo Ordine</h2>
          <div className="accent-line-left"></div>
          <p className="checkout-intro">
            Inserisci i tuoi dati di spedizione per inviare l'ordine. Greta ti contatterà per definire i dettagli.
          </p>

          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-group">
              <label htmlFor="nome_client" className="form-label">Nome Completo *</label>
              <input
                type="text"
                id="nome_client"
                name="nome_cliente"
                className="form-control"
                value={formData.nome_cliente}
                onChange={handleInputChange}
                required
                placeholder="Es. Maria Rossi"
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono" className="form-label">Numero di Telefono *</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                className="form-control"
                value={formData.telefono}
                onChange={handleInputChange}
                required
                placeholder="Es. 340 1234567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="metodo_consegna" className="form-label">Metodo di Consegna *</label>
              <select
                id="metodo_consegna"
                name="metodo_consegna"
                className="form-control"
                value={formData.metodo_consegna}
                onChange={handleInputChange}
              >
                <option value="Spedizione a domicilio">Spedizione a domicilio (Piacenza, Cremona e tutta Italia)</option>
                <option value="Ritiro in negozio">Ritiro in Negozio (Monticelli d'Ongina)</option>
              </select>
            </div>

            {formData.metodo_consegna === 'Spedizione a domicilio' && (
              <div className="form-group fade-in">
                <label htmlFor="indirizzo_spedizione" className="form-label">Indirizzo Completo *</label>
                <input
                  type="text"
                  id="indirizzo_spedizione"
                  name="indirizzo_spedizione"
                  className="form-control"
                  value={formData.indirizzo_spedizione}
                  onChange={handleInputChange}
                  required
                  placeholder="Es. Via Roma 45, 29010 Monticelli d'Ongina (PC)"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="metodo_pagamento" className="form-label">Metodo di Pagamento Preferito *</label>
              <select
                id="metodo_pagamento"
                name="metodo_pagamento"
                className="form-control"
                value={formData.metodo_pagamento}
                onChange={handleInputChange}
              >
                <option value="Contanti alla consegna">Contanti / Ritiro di persona</option>
                <option value="Bonifico bancario">Bonifico bancario anticipato</option>
                <option value="Ricarica Postepay o Satispay">Satispay / Postepay</option>
              </select>
            </div>

            <div className="checkout-actions">
              <button type="submit" className="btn-primary submit-order-btn">
                Invia l'Ordine a Greta
              </button>
              <button type="button" className="btn-secondary" onClick={onBackToShopping}>
                Torna agli Acquisti
              </button>
            </div>
          </form>
        </div>

        {/* Riepilogo a Destra */}
        <aside className="checkout-summary-sidebar">
          <h3>Il tuo Carrello</h3>
          <div className="summary-accent-line"></div>

          {cartItems.length === 0 ? (
            <p>Il carrello è vuoto.</p>
          ) : (
            <>
              <ul className="checkout-summary-list">
                {cartItems.map((item) => (
                  <li key={`${item.id}-${item.size}`} className="summary-item">
                    <span className="summary-item-name">
                      {item.titolo} <span className="summary-item-size">(Taglia {item.size})</span>
                      <span className="summary-item-qty"> x{item.quantity}</span>
                    </span>
                    <span className="summary-item-price">€{(item.prezzo * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <div className="checkout-summary-total">
                <div className="summary-total-row">
                  <span>Subtotale:</span>
                  <span>€{cartTotal.toFixed(2)}</span>
                </div>
                <div className="summary-total-row">
                  <span>Consegna:</span>
                  <span>
                    {formData.metodo_consegna === 'Ritiro in negozio' ? 'Gratuito' : 'Da concordare'}
                  </span>
                </div>
                <div className="summary-total-final">
                  <span>Totale:</span>
                  <span>€{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      <style>{`
        .checkout-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: var(--spacing-xl);
          align-items: start;
        }

        .checkout-form-container {
          background-color: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xl);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        .checkout-form-container h2 {
          font-size: 2rem;
        }

        .accent-line-left {
          width: 50px;
          height: 2px;
          background-color: var(--accent-gold);
          margin-bottom: var(--spacing-md);
        }

        .checkout-intro {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-lg);
        }

        .checkout-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .checkout-actions {
          display: flex;
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
          flex-wrap: wrap;
        }

        .submit-order-btn {
          flex-grow: 1;
        }

        .checkout-summary-sidebar {
          background-color: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 90px;
        }

        .checkout-summary-list {
          list-style: none;
          margin-bottom: var(--spacing-lg);
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          padding: var(--spacing-sm) 0;
          border-bottom: 1px dashed var(--border-color);
          color: var(--text-primary);
        }

        .summary-item-size {
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .summary-item-qty {
          font-weight: 600;
          color: var(--text-primary);
        }

        .summary-item-price {
          font-family: var(--font-serif);
          font-weight: 600;
        }

        .checkout-summary-total {
          background-color: var(--bg-primary);
          padding: var(--spacing-md);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }

        .summary-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .summary-total-final {
          display: flex;
          justify-content: space-between;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          border-top: 1px solid var(--border-color);
          padding-top: var(--spacing-sm);
          margin-top: var(--spacing-sm);
        }

        .summary-total-final span:last-child {
          font-family: var(--font-serif);
          font-size: 1.35rem;
        }

        @media (max-width: 900px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }
          
          .checkout-summary-sidebar {
            position: static;
          }
        }
      `}</style>
    </section>
  );
}
