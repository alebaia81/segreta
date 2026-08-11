import { useState } from 'react';
// @ts-ignore
import { useCart } from '../context/CartContext';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import PayPalButton from '../components/PayPalButton';

interface CheckoutPageProps {
  onBackToShopping: () => void;
  setCurrentPath: (path: string) => void;
}

export default function CheckoutPage({ onBackToShopping, setCurrentPath }: CheckoutPageProps) {
  const { cartItems, cartTotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    indirizzo: '',
    citta: '',
    cap: '',
    metodo_consegna: 'Spedizione a domicilio',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState<'paypal' | 'satispay'>('paypal');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Rimuove l'errore del campo modificato
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.nome.trim()) errors.nome = 'Il nome è obbligatorio';
    if (!formData.cognome.trim()) errors.cognome = 'Il cognome è obbligatorio';
    if (!formData.telefono.trim()) errors.telefono = 'Il telefono è obbligatorio';
    if (!formData.email.trim()) {
      errors.email = "L'email è obbligatoria";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Inserisci un'email valida";
    }

    if (formData.metodo_consegna === 'Spedizione a domicilio') {
      if (!formData.indirizzo.trim()) errors.indirizzo = "L'indirizzo è obbligatorio";
      if (!formData.citta.trim()) errors.citta = 'La città è obbligatoria';
      if (!formData.cap.trim()) errors.cap = 'Il CAP è obbligatorio';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Calcolo Spese Spedizione
  const shippingFee =
    formData.metodo_consegna === 'Ritiro in negozio'
      ? 0
      : cartTotal >= 50
      ? 0
      : 5.90;

  const totalAmount = cartTotal + shippingFee;

  const handlePayPalSuccess = async (details: any) => {
    setSubmitting(true);
    setErrorMessage('');

    const indirizzoCompleto =
      formData.metodo_consegna === 'Ritiro in negozio'
        ? 'Ritiro in negozio (Monticelli d\'Ongina)'
        : `${formData.indirizzo}, ${formData.citta} (${formData.cap})`;

    const ordineDaInviare = {
      nome_cliente: `${formData.nome} ${formData.cognome}`,
      telefono: formData.telefono,
      indirizzo_spedizione: indirizzoCompleto,
      metodo_pagamento: 'PayPal',
      metodo_consegna: formData.metodo_consegna,
      stato: 'Pagamento Ricevuto - In Lavorazione',
      totale: parseFloat(totalAmount.toFixed(2)),
      dettaglio_articoli: JSON.stringify(
        cartItems.map((item: any) => ({
          id: item.id,
          titolo: item.titolo,
          prezzo: item.prezzo,
          taglia: item.size,
          quantita: item.quantity,
        }))
      ),
      paypal_order_id: details.id,
    };

    try {
      const response = await fetch('/api/ordini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ordineDaInviare),
      });

      const json = await response.json();
      if (json.success) {
        // Memorizza i dettagli per la pagina di ringraziamento
        localStorage.setItem(
          'segreta_last_order',
          JSON.stringify({
            ...ordineDaInviare,
            id: json.data?.id || Math.floor(Math.random() * 10000) + 1,
            created_at: new Date().toISOString(),
          })
        );
        clearCart();
        setCurrentPath('/thank-you');
      } else {
        throw new Error(json.error || 'Errore durante la creazione dell\'ordine');
      }
    } catch (err: any) {
      console.warn('Connessione API fallita, salvataggio locale di fallback.', err);
      // Fallback locale in caso di assenza server/connessione
      const ordineFallback = {
        ...ordineDaInviare,
        id: Math.floor(Math.random() * 10000) + 1,
        stato: 'In attesa',
        created_at: new Date().toISOString(),
      };
      const ordiniSalvati = localStorage.getItem('segreta_ordini');
      const ordiniList = ordiniSalvati ? JSON.parse(ordiniSalvati) : [];
      ordiniList.unshift(ordineFallback);
      localStorage.setItem('segreta_ordini', JSON.stringify(ordiniList));
      localStorage.setItem('segreta_last_order', JSON.stringify(ordineFallback));

      clearCart();
      setCurrentPath('/thank-you');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayPalError = (error: any) => {
    console.error('PayPal checkout error:', error);
    setErrorMessage(
      'Si è verificato un errore con il pagamento PayPal. Per favore riprova o seleziona un altro metodo.'
    );
  };

  const [showSatispayModal, setShowSatispayModal] = useState(false);
  const [createdOrderDetails, setCreatedOrderDetails] = useState<any>(null);

  const SATISPAY_SHOP_LINK = 'https://www.satispay.com/app/pay/shops/af986dff-094d-4a0f-ba4b-cea5fbeef43b';

  const handleSatispayPayment = async () => {
    if (!validateForm()) {
      alert('Per favore, compila tutti i campi obbligatori prima di procedere.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const indirizzoCompleto =
      formData.metodo_consegna === 'Ritiro in negozio'
        ? 'Ritiro in negozio (Monticelli d\'Ongina)'
        : `${formData.indirizzo}, ${formData.citta} (${formData.cap})`;

    const ordineDaInviare = {
      nome_cliente: `${formData.nome} ${formData.cognome}`,
      telefono: formData.telefono,
      indirizzo_spedizione: indirizzoCompleto,
      metodo_pagamento: 'Satispay',
      metodo_consegna: formData.metodo_consegna,
      stato: 'Verifica Pagamento',
      totale: parseFloat(totalAmount.toFixed(2)),
      dettaglio_articoli: JSON.stringify(
        cartItems.map((item: any) => ({
          id: item.id,
          titolo: item.titolo,
          prezzo: item.prezzo,
          taglia: item.size,
          quantita: item.quantity,
        }))
      ),
      satispay_transaction_id: 'satispay_shop_af986dff',
    };

    let finalOrder = { ...ordineDaInviare, id: Math.floor(Math.random() * 10000) + 1, created_at: new Date().toISOString() };

    try {
      const response = await fetch('/api/ordini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ordineDaInviare),
      });

      const json = await response.json();
      if (json.success && json.data) {
        finalOrder = { ...ordineDaInviare, ...json.data };
      }
    } catch (err: any) {
      console.warn('Connessione API fallita, salvataggio locale di fallback.', err);
      const ordiniSalvati = localStorage.getItem('segreta_ordini');
      const ordiniList = ordiniSalvati ? JSON.parse(ordiniSalvati) : [];
      ordiniList.unshift(finalOrder);
      localStorage.setItem('segreta_ordini', JSON.stringify(ordiniList));
    } finally {
      localStorage.setItem('segreta_last_order', JSON.stringify(finalOrder));
      setCreatedOrderDetails(finalOrder);
      setSubmitting(false);

      // Rilevamento smartphone (iOS / Android / screen width)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

      if (isMobile) {
        // Su Smartphone svuota il carrello, apre il link Satispay e va a ThankYou
        clearCart();
        window.open(SATISPAY_SHOP_LINK, '_blank');
        setCurrentPath('/thank-you');
      } else {
        // Su PC mostra il Modal con QR code senza svuotare prima il carrello
        setShowSatispayModal(true);
      }
    }
  };

  if (cartItems.length === 0 && !showSatispayModal) {
    return (
      <div className="checkout-empty-container container">
        <ShoppingBag size={48} className="empty-icon" />
        <h2>Il tuo carrello è vuoto</h2>
        <p>Aggiungi articoli al carrello per poter procedere al checkout.</p>
        <button className="btn-primary" onClick={onBackToShopping}>
          Torna allo Shop
        </button>
        <style>{CSS}</style>
      </div>
    );
  }

  return (
    <section className="checkout-section container fade-in">
      {/* Intestazione Checkout semplificata */}
      <div className="checkout-header-bar">
        <button className="back-to-shop-btn" onClick={onBackToShopping}>
          <ArrowLeft size={18} />
          <span>Torna allo Shop</span>
        </button>
        <h1 className="checkout-title">Checkout</h1>
      </div>

      <div className="checkout-grid">
        {/* Colonna 1: Dati di Spedizione */}
        <div className="checkout-form-container">
          <h2>Dati di Spedizione &amp; Consegna</h2>
          <div className="accent-line-left"></div>

          {errorMessage && <div className="error-banner">{errorMessage}</div>}

          <form className="checkout-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-row-two">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input
                  type="text"
                  name="nome"
                  className={`form-control ${formErrors.nome ? 'error' : ''}`}
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Es. Maria"
                />
                {formErrors.nome && <span className="error-text">{formErrors.nome}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Cognome *</label>
                <input
                  type="text"
                  name="cognome"
                  className={`form-control ${formErrors.cognome ? 'error' : ''}`}
                  value={formData.cognome}
                  onChange={handleInputChange}
                  placeholder="Es. Rossi"
                />
                {formErrors.cognome && <span className="error-text">{formErrors.cognome}</span>}
              </div>
            </div>

            <div className="form-row-two">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  className={`form-control ${formErrors.email ? 'error' : ''}`}
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Es. maria.rossi@email.it"
                />
                {formErrors.email && <span className="error-text">{formErrors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Telefono *</label>
                <input
                  type="tel"
                  name="telefono"
                  className={`form-control ${formErrors.telefono ? 'error' : ''}`}
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="Es. 340 1234567"
                />
                {formErrors.telefono && <span className="error-text">{formErrors.telefono}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Metodo di Consegna *</label>
              <select
                name="metodo_consegna"
                className="form-control"
                value={formData.metodo_consegna}
                onChange={handleInputChange}
              >
                <option value="Spedizione a domicilio">Spedizione a domicilio</option>
                <option value="Ritiro in negozio">Ritiro in negozio (Monticelli d'Ongina)</option>
              </select>
            </div>

            {formData.metodo_consegna === 'Spedizione a domicilio' && (
              <div className="shipping-fields fade-in">
                <div className="form-group">
                  <label className="form-label">Indirizzo di Spedizione *</label>
                  <input
                    type="text"
                    name="indirizzo"
                    className={`form-control ${formErrors.indirizzo ? 'error' : ''}`}
                    value={formData.indirizzo}
                    onChange={handleInputChange}
                    placeholder="Es. Via Roma 45"
                  />
                  {formErrors.indirizzo && <span className="error-text">{formErrors.indirizzo}</span>}
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label className="form-label">Città *</label>
                    <input
                      type="text"
                      name="citta"
                      className={`form-control ${formErrors.citta ? 'error' : ''}`}
                      value={formData.citta}
                      onChange={handleInputChange}
                      placeholder="Es. Piacenza"
                    />
                    {formErrors.citta && <span className="error-text">{formErrors.citta}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">CAP *</label>
                    <input
                      type="text"
                      name="cap"
                      className={`form-control ${formErrors.cap ? 'error' : ''}`}
                      value={formData.cap}
                      onChange={handleInputChange}
                      placeholder="Es. 29010"
                    />
                    {formErrors.cap && <span className="error-text">{formErrors.cap}</span>}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Colonna 2: Riepilogo Ordine (Sticky) */}
        <aside className="checkout-summary-sidebar">
          <h2>Riepilogo Ordine</h2>
          <div className="accent-line-left"></div>

          <ul className="checkout-summary-list">
            {cartItems.map((item: any) => (
              <li key={`${item.id}-${item.size}`} className="summary-item">
                <span className="summary-item-name">
                  {item.titolo}
                  {item.size && <span className="summary-item-size"> (Taglia: {item.size})</span>}
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
              <span>Costo Spedizione:</span>
              <span>
                {formData.metodo_consegna === 'Ritiro in negozio'
                  ? 'Gratuito'
                  : shippingFee === 0
                  ? 'Gratuita'
                  : `€${shippingFee.toFixed(2)}`}
              </span>
            </div>
            <div className="summary-total-final">
              <span>Totale Complessivo:</span>
              <span>€{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="payment-methods-container">
            <h3>Metodo di Pagamento</h3>
            <div className="payment-selectors">
              <label className={`payment-selector-card ${metodoPagamento === 'paypal' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="metodo_pagamento_select"
                  checked={metodoPagamento === 'paypal'}
                  onChange={() => setMetodoPagamento('paypal')}
                  className="payment-radio-input"
                />
                <div className="payment-selector-details">
                  <span className="payment-name">PayPal o Carta</span>
                  <span className="payment-desc">PayPal, PostePay, Carte di Credito</span>
                </div>
              </label>

              <label className={`payment-selector-card ${metodoPagamento === 'satispay' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="metodo_pagamento_select"
                  checked={metodoPagamento === 'satispay'}
                  onChange={() => setMetodoPagamento('satispay')}
                  className="payment-radio-input"
                />
                <div className="payment-selector-details">
                  <span className="payment-name">Satispay</span>
                  <span className="payment-desc">Paga istantaneamente tramite app Satispay</span>
                </div>
              </label>
            </div>

            <div className="payment-action-area">
              {submitting ? (
                <div className="loading-spinner-container">
                  <div className="spinner"></div>
                  <p>Salvataggio ordine in corso...</p>
                </div>
              ) : metodoPagamento === 'paypal' ? (
                <>
                  <p className="paypal-notice-text">
                    Paga in sicurezza con PayPal, carta di credito o prepagata.
                  </p>
                  <PayPalButton
                    amount={totalAmount}
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                  />
                </>
              ) : (
                <>
                  <p className="satispay-notice-text">
                    Verrai reindirizzato all'app Satispay per inquadrare il QR Code e completare il pagamento.
                  </p>
                  <button className="satispay-btn" onClick={handleSatispayPayment}>
                    <svg className="satispay-logo-icon" viewBox="0 0 100 100" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="0" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="48" fill="#e50014" />
                      <path d="M50 22c-15.46 0-28 12.54-28 28s12.54 28 28 28c9.02 0 17.06-4.27 22.18-10.92l-8.08-4.66c-3.4 4.54-8.82 7.58-14.1 7.58-10.49 0-19-8.51-19-19s8.51-19 19-19c6.07 0 11.53 2.87 14.88 7.37l8.08-4.67C68.17 26.54 59.88 22 50 22zm0 17c-6.07 0-11 4.93-11 11s4.93 11 11 11 11-4.93 11-11-4.93-11-11-11z" fill="#ffffff" />
                    </svg>
                    <span>Paga con Satispay</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL SATISPAY DESKTOP */}
      {showSatispayModal && (
        <div className="satispay-modal-overlay fade-in">
          <div className="satispay-modal-card">
            <div className="satispay-modal-header">
              <div className="satispay-badge">
                <svg className="satispay-logo-icon" viewBox="0 0 100 100" width="24" height="24" fill="none">
                  <circle cx="50" cy="50" r="48" fill="#e50014" />
                  <path d="M50 22c-15.46 0-28 12.54-28 28s12.54 28 28 28c9.02 0 17.06-4.27 22.18-10.92l-8.08-4.66c-3.4 4.54-8.82 7.58-14.1 7.58-10.49 0-19-8.51-19-19s8.51-19 19-19c6.07 0 11.53 2.87 14.88 7.37l8.08-4.67C68.17 26.54 59.88 22 50 22zm0 17c-6.07 0-11 4.93-11 11s4.93 11 11 11 11-4.93 11-11-4.93-11-11-11z" fill="#ffffff" />
                </svg>
                <span>Satispay Business</span>
              </div>
              <h2>Completa il pagamento con Satispay</h2>
              <p className="satispay-subtext">Inquadra il QR Code con l'app Satispay del tuo telefono</p>
            </div>

            <div className="satispay-modal-body">
              <div className="satispay-qr-container">
                <img src="/satispay-qr.png" alt="Satispay QR Code Segreta" className="satispay-qr-img" />
                <div className="satispay-shop-name">Segreta Style</div>
              </div>

              <div className="satispay-instructions">
                <div className="instruction-step">
                  <span className="step-num">1</span>
                  <span>Apri l'app <strong>Satispay</strong> e inquadra il QR Code.</span>
                </div>
                <div className="instruction-step">
                  <span className="step-num">2</span>
                  <span>
                    Inserisci l'importo esatto:
                    <strong className="amount-highlight"> €{(createdOrderDetails?.totale || totalAmount).toFixed(2)}</strong>
                  </span>
                </div>
                <div className="instruction-step">
                  <span className="step-num">3</span>
                  <span>Conferma l'invio del pagamento nell'app.</span>
                </div>
              </div>
            </div>

            <div className="satispay-modal-actions">
              <button
                className="satispay-confirm-btn"
                onClick={() => {
                  clearCart();
                  setCurrentPath('/thank-you');
                }}
              >
                Ho inviato il pagamento su Satispay
              </button>
              <a
                href={SATISPAY_SHOP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="satispay-link-secondary"
              >
                Oppure apri il link Satispay nel browser ↗
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
  .checkout-section {
    padding: var(--spacing-xl) 0;
    max-width: 1200px;
    margin: 0 auto;
  }

  .checkout-empty-container {
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

  .checkout-header-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: var(--spacing-md);
    margin-bottom: var(--spacing-xl);
  }

  .back-to-shop-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0.5rem;
    transition: var(--transition-smooth);
  }

  .back-to-shop-btn:hover {
    color: var(--text-primary);
  }

  .checkout-title {
    font-family: var(--font-serif);
    font-size: 2.2rem;
    font-weight: 500;
    margin: 0;
    color: var(--text-primary);
  }

  .checkout-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
    align-items: start;
  }

  @media (min-width: 992px) {
    .checkout-grid {
      grid-template-columns: 1.2fr 0.8fr;
    }
  }

  .checkout-form-container {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
  }

  .checkout-form-container h2 {
    font-family: var(--font-serif);
    font-size: 1.4rem;
    font-weight: 500;
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--text-primary);
  }

  .checkout-form {
    margin-top: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .form-row-two {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  @media (min-width: 576px) {
    .form-row-two {
      grid-template-columns: 1fr 1fr;
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .form-control {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    font-size: 0.95rem;
    outline: none;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    transition: var(--transition-smooth);
  }

  .form-control:focus {
    border-color: var(--accent-gold);
  }

  .form-control.error {
    border-color: #d32f2f;
    background-color: #ffebee20;
  }

  .error-text {
    font-size: 0.78rem;
    color: #d32f2f;
    font-weight: 500;
  }

  .error-banner {
    background-color: #ffebee;
    color: #c62828;
    border: 1px solid #ffcdd2;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-md);
    font-size: 0.9rem;
    font-weight: 500;
  }

  .shipping-fields {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .checkout-summary-sidebar {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    position: sticky;
    top: 130px;
  }

  .checkout-summary-sidebar h2 {
    font-family: var(--font-serif);
    font-size: 1.4rem;
    font-weight: 500;
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--text-primary);
  }

  .checkout-summary-list {
    list-style: none;
    padding: 0;
    margin: var(--spacing-lg) 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 240px;
    overflow-y: auto;
    padding-right: 5px;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    font-size: 0.95rem;
    gap: var(--spacing-md);
  }

  .summary-item-name {
    color: var(--text-secondary);
  }

  .summary-item-size {
    font-size: 0.8rem;
    color: var(--accent-gold-hover);
  }

  .summary-item-qty {
    font-size: 0.85rem;
    color: var(--text-secondary);
    opacity: 0.7;
  }

  .summary-item-price {
    font-weight: 600;
    color: var(--text-primary);
  }

  .checkout-summary-total {
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    padding: var(--spacing-md) 0;
    margin-bottom: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .summary-total-row {
    display: flex;
    justify-content: space-between;
    color: var(--text-secondary);
    font-size: 0.95rem;
  }

  .summary-total-final {
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    font-size: 1.15rem;
    color: var(--text-primary);
    margin-top: 4px;
  }

  .payment-methods-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .payment-methods-container h3 {
    font-size: 0.95rem;
    margin: 0;
    font-weight: 600;
    color: var(--text-primary);
  }

  .payment-selectors {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .payment-selector-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: var(--transition-smooth);
    background-color: var(--bg-primary);
  }

  .payment-selector-card:hover {
    border-color: var(--text-muted);
  }

  .payment-selector-card.selected {
    border-color: var(--accent-gold);
    background-color: rgba(197, 168, 128, 0.05);
  }

  .payment-radio-input {
    accent-color: var(--accent-gold);
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .payment-selector-details {
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  .payment-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .payment-desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .payment-action-area {
    margin-top: var(--spacing-sm);
    border-top: 1px dashed var(--border-color);
    padding-top: var(--spacing-md);
  }

  .paypal-notice-text, .satispay-notice-text {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin: 0 0 12px 0;
    text-align: left;
  }

  .satispay-btn {
    width: 100%;
    min-height: 48px;
    background-color: #e50014;
    color: #ffffff;
    border: none;
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 0.88rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .satispay-btn:hover {
    background-color: #c80010;
  }

  .satispay-logo-icon {
    flex-shrink: 0;
  }

  .loading-spinner-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 1rem;
    background-color: var(--bg-tertiary);
    border-radius: var(--radius-sm);
  }

  .spinner {
    border: 3px solid rgba(0, 0, 0, 0.1);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border-left-color: var(--accent-gold);
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* MODAL SATISPAY STYLES */
  .satispay-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  .satispay-modal-card {
    background: var(--bg-primary);
    border: 2px solid #e50014;
    border-radius: var(--radius-lg);
    max-width: 480px;
    width: 100%;
    padding: 2rem;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    text-align: center;
  }

  .satispay-modal-header {
    margin-bottom: 1.5rem;
  }

  .satispay-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background-color: #e50014;
    color: white;
    font-weight: 700;
    font-size: 0.82rem;
    padding: 4px 12px;
    border-radius: 20px;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .satispay-modal-header h2 {
    font-family: var(--font-serif);
    font-size: 1.6rem;
    margin: 0 0 6px 0;
    color: var(--text-primary);
  }

  .satispay-subtext {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .satispay-modal-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .satispay-qr-container {
    background: #ffffff;
    padding: 1rem;
    border-radius: var(--radius-md);
    border: 2px solid #e50014;
    box-shadow: 0 4px 12px rgba(229, 0, 20, 0.15);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .satispay-qr-img {
    width: 220px;
    height: 220px;
    object-fit: contain;

  }

  .satispay-shop-name {
    font-weight: 700;
    color: #e50014;
    font-size: 0.9rem;
    letter-spacing: 0.05em;
  }

  .satispay-order-number-badge {
    background-color: #fff0f1;
    border: 1px dashed #e50014;
    border-radius: var(--radius-sm);
    padding: 6px 12px;
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .order-badge-label {
    font-size: 0.75rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .order-badge-code {
    font-size: 1.1rem;
    color: #e50014;
    font-weight: 800;
  }

  .code-highlight {
    color: #e50014;
    font-weight: 700;
    background: #fff0f1;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #ffccd0;
  }

  .satispay-instructions {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: var(--bg-secondary);
    padding: 1rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    width: 100%;
  }

  .instruction-step {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 0.88rem;
    color: var(--text-primary);
  }

  .step-num {
    background-color: #e50014;
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .amount-highlight {
    color: #e50014;
    font-size: 1.05rem;
  }

  .satispay-modal-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .satispay-confirm-btn {
    background-color: #e50014;
    color: white;
    border: none;
    padding: 1rem;
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .satispay-confirm-btn:hover {
    background-color: #c80010;
    transform: translateY(-1px);
  }

  .satispay-link-secondary {
    color: var(--text-secondary);
    font-size: 0.82rem;
    text-decoration: underline;
    transition: var(--transition-smooth);
  }

  .satispay-link-secondary:hover {
    color: #e50014;
  }
`;

