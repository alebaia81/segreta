import { useState, useEffect } from 'react';
// @ts-ignore
import { useCart } from '../context/CartContext';
import { ArrowLeft, ShoppingBag, Landmark, ShieldCheck, X, CreditCard, Lock } from 'lucide-react';

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
    note: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState<'stripe' | 'satispay' | 'bonifico'>('stripe');

  // Gestione ritorno da annullamento Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('canceled') === 'true') {
      setErrorMessage('ℹ️ Il pagamento con carta è stato annullato. Il tuo carrello è rimasto intatto: puoi riprovare o selezionare un altro metodo.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  // Calcolo Spese Spedizione: 6,90 € corriere, 0 € ritiro in boutique
  const shippingFee =
    formData.metodo_consegna === 'Ritiro in negozio'
      ? 0
      : 6.90;

  const totalAmount = cartTotal + shippingFee;

  const handleStripePayment = async () => {
    if (!validateForm()) {
      setErrorMessage('⚠️ Compila tutti i campi obbligatori (nome, cognome, telefono, email e indirizzo) prima di procedere con il pagamento.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const indirizzoCompleto =
      formData.metodo_consegna === 'Ritiro in negozio'
        ? "Ritiro in boutique (Via Martiri della Libertà 67, Monticelli d'Ongina)"
        : `${formData.indirizzo}, ${formData.cap} ${formData.citta}`;

    const pendingOrder = {
      id: Math.floor(Math.random() * 10000) + 1,
      nome_cliente: `${formData.nome} ${formData.cognome}`.trim(),
      telefono: formData.telefono,
      email: formData.email,
      indirizzo_spedizione: indirizzoCompleto,
      metodo_pagamento: 'Carta / Stripe',
      metodo_consegna: formData.metodo_consegna,
      totale: parseFloat(totalAmount.toFixed(2)),
      note: formData.note.trim(),
      dettaglio_articoli: cartItems.map((item: any) => ({
        id: item.id,
        titolo: item.titolo,
        prezzo: item.prezzo,
        taglia: item.size || 'Unica',
        quantita: item.quantity || 1,
      })),
      stato: 'Pagamento Ricevuto - In Lavorazione',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('segreta_last_order', JSON.stringify(pendingOrder));

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems,
          customerData: formData,
          metodo_consegna: formData.metodo_consegna,
        }),
      });

      if (!response.ok) {
        // Se il backend locale non è avviato sulla porta 3000 in localhost
        if (response.status === 504 || response.status === 502) {
          console.warn('[Stripe Local Mock] Backend locale non avviato, fallback mock automatico.');
          clearCart();
          window.location.href = `/thank-you?session_id=cs_test_mock_${Date.now()}&mock=true`;
          return;
        }
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Impossibile creare la sessione di pagamento Stripe');
      }

      const data = await response.json();

      if (!data.success || !data.url) {
        throw new Error(data.error || 'Impossibile creare la sessione di pagamento Stripe');
      }

      if (data.mock) {
        clearCart();
      }

      window.location.href = data.url;
    } catch (err: any) {
      if (window.location.hostname === 'localhost' && (err.name === 'TypeError' || err.message?.includes('fetch'))) {
        console.warn('[Stripe Local Mock] Connessione locale fallita, simulazione mock su localhost.');
        clearCart();
        window.location.href = `/thank-you?session_id=cs_test_mock_${Date.now()}&mock=true`;
        return;
      }
      console.error('[Stripe Payment Error]:', err);
      setErrorMessage(
        err.message || 'Si è verificato un errore durante la connessione con Stripe. Per favore riprova o seleziona un altro metodo di pagamento.'
      );
      setSubmitting(false);
    }
  };

  const [showSatispayModal, setShowSatispayModal] = useState(false);
  const [createdOrderDetails, setCreatedOrderDetails] = useState<any>(null);

  // Chiudi la modale Satispay premendo ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSatispayModal) {
        setShowSatispayModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSatispayModal]);

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
      email: formData.email,
      indirizzo_spedizione: indirizzoCompleto,
      metodo_pagamento: 'Satispay',
      metodo_consegna: formData.metodo_consegna,
      stato: 'Verifica Pagamento',
      totale: parseFloat(totalAmount.toFixed(2)),
      note: formData.note.trim(),
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

  const handleBonificoPayment = async () => {
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
      email: formData.email,
      indirizzo_spedizione: indirizzoCompleto,
      metodo_pagamento: 'Bonifico Bancario',
      metodo_consegna: formData.metodo_consegna,
      stato: 'In attesa di bonifico',
      totale: parseFloat(totalAmount.toFixed(2)),
      note: formData.note.trim(),
      dettaglio_articoli: JSON.stringify(
        cartItems.map((item: any) => ({
          id: item.id,
          titolo: item.titolo,
          prezzo: item.prezzo,
          taglia: item.size,
          quantita: item.quantity,
        }))
      ),
    };

    let finalOrder = {
      ...ordineDaInviare,
      id: Math.floor(Math.random() * 10000) + 1,
      created_at: new Date().toISOString(),
    };

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
      clearCart();
      setSubmitting(false);
      setCurrentPath('/thank-you');
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

            {/* Note Ordine / Regalo */}
            <div className="form-group" style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" htmlFor="checkout_note" style={{ margin: 0, fontWeight: 600 }}>
                  Note o richieste speciali sull'ordine <span style={{ fontWeight: 'normal', color: '#888', fontSize: '0.85rem' }}>(Opzionale)</span>
                </label>
                <span style={{ fontSize: '0.78rem', color: formData.note.length >= 480 ? '#e0567a' : '#888' }}>
                  {formData.note.length}/500
                </span>
              </div>
              <textarea
                id="checkout_note"
                name="note"
                rows={3}
                maxLength={500}
                className="form-control"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="Es. Per regali: Nome e cognome destinatario, recapito e dedica di auguri. Oppure indicazioni per la consegna al corriere o orari di ritiro."
                style={{ resize: 'vertical', minHeight: '80px', lineHeight: '1.45', fontSize: '0.92rem' }}
              />
            </div>
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
              <label className={`payment-selector-card ${metodoPagamento === 'stripe' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="metodo_pagamento_select"
                  checked={metodoPagamento === 'stripe'}
                  onChange={() => setMetodoPagamento('stripe')}
                  className="payment-radio-input"
                />
                <div className="payment-selector-details">
                  <div className="payment-name-row">
                    <span className="payment-name">Carta di Credito / Apple Pay</span>
                    <span className="stripe-secure-badge">
                      <Lock size={11} /> Stripe
                    </span>
                  </div>
                  <span className="payment-desc">Visa, Mastercard, PostePay, Apple Pay & Google Pay</span>
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

              <label className={`payment-selector-card ${metodoPagamento === 'bonifico' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="metodo_pagamento_select"
                  checked={metodoPagamento === 'bonifico'}
                  onChange={() => setMetodoPagamento('bonifico')}
                  className="payment-radio-input"
                />
                <div className="payment-selector-details">
                  <span className="payment-name">Bonifico Bancario</span>
                  <span className="payment-desc">Coordinate fornite alla conferma</span>
                </div>
              </label>
            </div>

            <div className="payment-action-area">
              {submitting ? (
                <div className="loading-spinner-container">
                  <div className="spinner"></div>
                  <p>Salvataggio ordine in corso...</p>
                </div>
              ) : metodoPagamento === 'stripe' ? (
                <>
                  <p className="stripe-notice-text">
                    Verrai reindirizzato sulla pagina sicura e crittografata di <strong>Stripe</strong> per completare il pagamento in totale tranquillità.
                  </p>
                  <button
                    className="stripe-checkout-btn"
                    onClick={handleStripePayment}
                    disabled={submitting}
                  >
                    <CreditCard size={18} />
                    <span>{submitting ? 'Creazione sessione sicura...' : `Paga €${totalAmount.toFixed(2)} con Carta / Apple Pay`}</span>
                  </button>
                </>
              ) : metodoPagamento === 'bonifico' ? (
                <>
                  <p className="bonifico-notice-text">
                    Riceverai le coordinate bancarie e l'importo esatto subito dopo la conferma per effettuare il bonifico.
                  </p>
                  <button className="bonifico-btn" onClick={handleBonificoPayment}>
                    <Landmark size={18} />
                    <span>Conferma Ordine con Bonifico</span>
                  </button>
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

              {/* Avviso Legale, Tutela Dati & Diritto di Recesso GDPR */}
              <div className="checkout-privacy-box">
                <ShieldCheck size={18} className="checkout-privacy-icon" />
                <p className="checkout-privacy-text">
                  I tuoi dati personali sono protetti e trattati esclusivamente per elaborare e spedire il tuo ordine in conformità al GDPR (Reg. UE 2016/679). Per i dettagli consulta la nostra{' '}
                  <a href="https://www.iubenda.com/privacy-policy/68426130" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                  . Confermando l'ordine accetti le condizioni di vendita. Diritto di recesso garantito entro 14 giorni.
                </p>
              </div>

              {/* Pulsante ripensamento / Torna allo Shop */}
              <div className="checkout-reconsider-box">
                <button
                  type="button"
                  className="checkout-reconsider-btn"
                  onClick={onBackToShopping}
                  aria-label="Hai un ripensamento? Torna allo Shop"
                >
                  <ArrowLeft size={16} />
                  <span>Hai un ripensamento? Torna allo Shop</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL SATISPAY DESKTOP */}
      {showSatispayModal && (
        <div
          className="satispay-modal-overlay fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSatispayModal(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="satispay-modal-title"
        >
          <div className="satispay-modal-card">
            {/* Pulsante Chiudi X */}
            <button
              type="button"
              className="satispay-modal-close-btn"
              onClick={() => setShowSatispayModal(false)}
              aria-label="Chiudi e torna al checkout"
              title="Chiudi modale"
            >
              <X size={20} />
            </button>

            <div className="satispay-modal-header">
              <div className="satispay-badge">
                <svg className="satispay-logo-icon" viewBox="0 0 100 100" width="24" height="24" fill="none">
                  <circle cx="50" cy="50" r="48" fill="#e50014" />
                  <path d="M50 22c-15.46 0-28 12.54-28 28s12.54 28 28 28c9.02 0 17.06-4.27 22.18-10.92l-8.08-4.66c-3.4 4.54-8.82 7.58-14.1 7.58-10.49 0-19-8.51-19-19s8.51-19 19-19c6.07 0 11.53 2.87 14.88 7.37l8.08-4.67C68.17 26.54 59.88 22 50 22zm0 17c-6.07 0-11 4.93-11 11s4.93 11 11 11 11-4.93 11-11-4.93-11-11-11z" fill="#ffffff" />
                </svg>
                <span>Satispay Business</span>
              </div>
              <h2 id="satispay-modal-title">Completa il pagamento con Satispay</h2>
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
                type="button"
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
              <button
                type="button"
                className="satispay-cancel-btn"
                onClick={() => setShowSatispayModal(false)}
              >
                Annulla e cambia metodo di pagamento
              </button>
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
    background: var(--bg-secondary, #FFFFFF);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.6rem 1.1rem;
    border-radius: var(--radius-sm);
    transition: var(--transition-smooth);
    box-shadow: 0 1px 3px rgba(44, 37, 32, 0.05);
  }

  .back-to-shop-btn:hover {
    border-color: #E295AB;
    color: #cb6b86;
    background: rgba(226, 149, 171, 0.08);
  }

  .checkout-reconsider-box {
    margin-top: 1.2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    text-align: center;
  }

  .checkout-privacy-box {
    margin-top: 1.25rem;
    padding: 0.85rem 1rem;
    background: #FAF8F5;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: flex-start;
    gap: 10px;
    text-align: left;
  }

  .checkout-privacy-icon {
    color: var(--accent-gold);
    flex-shrink: 0;
    margin-top: 2px;
  }

  .checkout-privacy-text {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.45;
    color: var(--text-secondary);
  }

  .checkout-privacy-text a {
    color: var(--text-primary);
    font-weight: 600;
    text-decoration: underline;
  }

  .checkout-privacy-text a:hover {
    color: var(--accent-gold);
  }

  .checkout-reconsider-btn {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
  }

  .checkout-reconsider-btn:hover {
    border-color: #E295AB;
    background: rgba(226, 149, 171, 0.1);
    color: #cb6b86;
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

  .payment-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .stripe-secure-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: #635bff;
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .stripe-notice-text, .satispay-notice-text, .bonifico-notice-text {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin: 0 0 12px 0;
    text-align: left;
    line-height: 1.4;
  }

  .stripe-checkout-btn {
    width: 100%;
    min-height: 48px;
    background-color: #635bff;
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
    box-shadow: 0 4px 12px rgba(99, 91, 255, 0.25);
  }

  .stripe-checkout-btn:hover:not(:disabled) {
    background-color: #5348e0;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(99, 91, 255, 0.35);
  }

  .stripe-checkout-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
  }

  .bonifico-btn {
    width: 100%;
    min-height: 48px;
    background-color: var(--accent-gold, #2C2520);
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
    box-shadow: 0 2px 6px rgba(44, 37, 32, 0.12);
  }

  .bonifico-btn:hover {
    background-color: var(--accent-gold-hover, #423832);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(44, 37, 32, 0.2);
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
    position: relative;
    background: var(--bg-primary);
    border: 2px solid #e50014;
    border-radius: var(--radius-lg);
    max-width: 480px;
    width: 100%;
    padding: 2.2rem 2rem 2rem;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    text-align: center;
  }

  .satispay-modal-close-btn {
    position: absolute;
    top: 14px;
    right: 14px;
    background: #F3EFEA;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;
  }

  .satispay-modal-close-btn:hover {
    background: #e50014;
    color: #ffffff;
    border-color: #e50014;
    transform: rotate(90deg);
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

  .satispay-cancel-btn {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    padding: 0.65rem 1rem;
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 4px;
  }

  .satispay-cancel-btn:hover {
    background: rgba(0,0,0,0.04);
    color: var(--text-primary);
    border-color: var(--text-secondary);
  }
`;

