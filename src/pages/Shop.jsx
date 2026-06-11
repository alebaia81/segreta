import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useCookie } from '../context/CookieContext';
import { ShoppingBag, Check } from 'lucide-react';


/**
 * Pagina Shop — /shop
 * Catalogo completo con filtri per categoria.
 * SEO: meta tag differenziati da Home (catalogo + shopping).
 */
export default function Shop({ articoli, onNavigateToHome }) {
  const { addToCart } = useCart();
  const { openCookieSettings } = useCookie();

  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [selectedSizes, setSelectedSizes] = useState({});
  const [addedAnimation, setAddedAnimation] = useState({});

  // --- Meta tag SEO specifici per /shop ---
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Shop Abbigliamento Donna | Segreta Style — Monticelli d'Ongina";

    // Description
    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (metaDesc) {
      metaDesc.setAttribute('content', "Esplora il catalogo completo di Segreta Style: abiti, gonne, bluse, giacche e accessori moda donna. Acquista online con spedizione in tutta Italia o ritira in boutique a Monticelli d'Ongina (PC).");
    }

    // OG
    const updateOG = (property, content) => {
      const el = document.querySelector(`meta[property="${property}"]`);
      if (el) el.setAttribute('content', content);
    };
    updateOG('og:title', "Shop Moda Donna | Segreta Style — Abbigliamento Online");
    updateOG('og:description', "Scopri tutti i capi disponibili: abiti, gonne, bluse, giacche, T-shirt e accessori. Qualità, tendenze e prezzi accessibili da Segreta Style.");
    updateOG('og:url', 'https://www.segretastylemonticelli.it/shop');

    return () => {
      document.title = prevTitle;
      if (metaDesc) metaDesc.setAttribute('content', prevDesc);
      updateOG('og:title', "Segreta Style | Abbigliamento Moda Donna a Monticelli d'Ongina");
      updateOG('og:description', "Scopri la moda accessibile e divertente selezionata da Greta Righi nel centro storico di Monticelli d'Ongina. Spedizioni in tutta Italia e ritiro in negozio.");
      updateOG('og:url', 'https://www.segretastylemonticelli.it/');
    };
  }, []);

  const articoliAttivi = articoli.filter(a => a.attivo);
  const categorie = ['Tutti', ...new Set(articoliAttivi.map(a => a.categoria))];

  const articoliFiltrati = selectedCategory === 'Tutti'
    ? articoliAttivi
    : articoliAttivi.filter(a => a.categoria === selectedCategory);

  const handleSelectSize = (articoloId, size) => {
    setSelectedSizes(prev => ({ ...prev, [articoloId]: size }));
  };

  const handleAddToCart = (articolo) => {
    const size = selectedSizes[articolo.id];
    const taglieDisponibili = articolo.taglie ? articolo.taglie.split(',').map(s => s.trim()) : [];
    if (taglieDisponibili.length > 0 && !size) {
      alert('Per favore, seleziona una taglia prima di aggiungere al carrello.');
      return;
    }
    addToCart(articolo, size || 'Unica');
    setAddedAnimation(prev => ({ ...prev, [articolo.id]: true }));
    setTimeout(() => setAddedAnimation(prev => ({ ...prev, [articolo.id]: false })), 1500);
  };

  return (
    <div className="shop-page fade-in">

      {/* Shop Header */}
      <header className="shop-hero">
        <div className="container shop-hero-content">
          <span className="badge">Collezione 2026</span>
          <h1>Il Nostro Shop</h1>
          <div className="accent-line" style={{ margin: '1rem auto 1.25rem' }}></div>
          <p className="shop-hero-subtitle">
            Tutti i capi disponibili, aggiornati in tempo reale. Filtra per categoria e trova il tuo stile.
          </p>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="shop-filter-wrapper container">
        <div className="shop-filter-bar" role="group" aria-label="Filtra per categoria">
          {categorie.map(cat => (
            <button
              key={cat}
              className={`shop-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>
        <p className="shop-count">
          {articoliFiltrati.length} {articoliFiltrati.length === 1 ? 'articolo' : 'articoli'}
        </p>
      </div>

      {/* Products Grid */}
      <section className="container shop-grid-section">
        {articoliFiltrati.length === 0 ? (
          <div className="shop-empty">
            <p>Nessun articolo disponibile in questa categoria al momento.</p>
            <button className="btn-secondary" onClick={() => setSelectedCategory('Tutti')}>
              Vedi tutti i prodotti
            </button>
          </div>
        ) : (
          <div className="shop-prodotti-grid">
            {articoliFiltrati.map(articolo => {
              const taglieList = articolo.taglie ? articolo.taglie.split(',').map(s => s.trim()) : [];
              const selectedSize = selectedSizes[articolo.id];
              const isAdded = addedAnimation[articolo.id];
              return (
                <article key={articolo.id} className="prodotto-card">
                  <div className="prodotto-image-wrapper">
                    <img
                      src={
                        articolo.immagine_url.startsWith('http') || articolo.immagine_url.startsWith('blob:')
                          ? articolo.immagine_url
                          : `/public/${articolo.immagine_url}`
                      }
                      alt={articolo.titolo}
                      className="prodotto-image"
                      onError={e => {
                        e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    {articolo.categoria && (
                      <span className="prodotto-category-tag">{articolo.categoria}</span>
                    )}
                  </div>
                  <div className="prodotto-details">
                    <h2 className="prodotto-title">{articolo.titolo}</h2>
                    <p className="prodotto-description">{articolo.descrizione}</p>
                    <div className="prodotto-price-row">
                      <span className="prodotto-price">€{parseFloat(articolo.prezzo).toFixed(2)}</span>
                    </div>
                    {taglieList.length > 0 && (
                      <div className="prodotto-sizes-container">
                        <span className="sizes-label">Seleziona Taglia:</span>
                        <div className="sizes-row" role="group" aria-label={`Taglie per ${articolo.titolo}`}>
                          {taglieList.map(size => (
                            <button
                              key={size}
                              type="button"
                              className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                              onClick={() => handleSelectSize(articolo.id, size)}
                              aria-pressed={selectedSize === size}
                              aria-label={`Taglia ${size}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      className={`btn-add-to-cart ${isAdded ? 'success' : ''}`}
                      onClick={() => handleAddToCart(articolo)}
                      disabled={isAdded}
                      aria-label={`Aggiungi ${articolo.titolo} al carrello`}
                    >
                      {isAdded ? (
                        <><Check size={18} style={{ marginRight: '8px' }} />Aggiunto</>
                      ) : (
                        <><ShoppingBag size={18} style={{ marginRight: '8px' }} />Aggiungi al Carrello</>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="store-footer">
        <div className="container footer-content">
          {/* Sinistra: logo + social */}
          <div className="footer-left">
            <button
              className="footer-logo-btn"
              onClick={onNavigateToHome}
              aria-label="Torna alla Home"
            >
              <img src="/logo.png" alt="Segreta Style Logo" className="footer-logo-img" />
            </button>
            <span className="footer-subtitle">di Greta Righi</span>
            <div className="footer-social-links">
              <a href="https://www.facebook.com/SegretaAbbigliamento" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-footer-icon-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://www.instagram.com/segreta_style/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-footer-icon-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
            </div>
          </div>

          {/* Destra: policy + copyright */}
          <div className="footer-right">
            <div className="footer-links">
              <a href="https://www.iubenda.com/privacy-policy/68426130" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              <a href="https://www.iubenda.com/privacy-policy/68426130/cookie-policy" target="_blank" rel="noopener noreferrer">Cookie Policy</a>
              <button className="footer-cookie-btn" onClick={openCookieSettings}>Gestisci preferenze Privacy</button>
            </div>
            <p className="footer-copyright">
              © 2026 Segreta Style — <a href="https://presenzadigitale.com" target="_blank" rel="noopener noreferrer">Presenzadigitale.com</a>
            </p>
            <p className="footer-copyright">C.F. RGHGRT79R66D150Y — P.IVA 01563960333</p>
          </div>
        </div>
      </footer>

      <style>{`
        .shop-page {
          min-height: 100vh;
        }

        /* Shop Hero */
        .shop-hero {
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          padding: var(--spacing-xl) 0 var(--spacing-lg);
          text-align: center;
        }

        .shop-hero-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .shop-hero-content h1 {
          font-size: clamp(2rem, 5vw, 3rem);
          margin: var(--spacing-sm) 0 0;
          font-weight: 400;
        }

        .shop-hero-subtitle {
          color: var(--text-secondary);
          font-size: 1rem;
          max-width: 480px;
          margin: 0 auto;
        }

        /* Filter Bar */
        .shop-filter-wrapper {
          padding: var(--spacing-lg) var(--spacing-lg) 0;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--spacing-md);
          justify-content: space-between;
        }

        .shop-filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }

        .shop-filter-btn {
          padding: 0.5rem 1.1rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
          background-color: var(--bg-primary);
          min-height: 40px; /* WCAG 2.2: ≥24px, qui generoso 40px */
          transition: var(--transition-fast);
          cursor: pointer;
        }

        .shop-filter-btn:hover {
          border-color: var(--accent-gold);
          color: var(--text-primary);
        }

        .shop-filter-btn.active {
          background-color: var(--text-primary);
          color: var(--bg-secondary);
          border-color: var(--text-primary);
        }

        .shop-count {
          font-size: 0.85rem;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        /* Grid */
        .shop-grid-section {
          padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-xxl);
        }

        .shop-prodotti-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--spacing-xl);
        }

        /* Reuse prodotto-card styles from Catalogo — they're defined globally via index.css or inline in Catalogo.
           We re-declare them here for Shop page isolation. */
        .prodotto-card {
          background-color: var(--bg-primary);
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          transition: var(--transition-smooth);
        }
        .prodotto-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-md);
          border-color: var(--accent-gold);
        }
        .prodotto-image-wrapper {
          position: relative;
          width: 100%;
          padding-top: 125%;
          background-color: var(--bg-tertiary);
          overflow: hidden;
        }
        .prodotto-image {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          transition: var(--transition-smooth);
        }
        .prodotto-card:hover .prodotto-image { transform: scale(1.05); }
        .prodotto-category-tag {
          position: absolute;
          top: var(--spacing-sm); left: var(--spacing-sm);
          background-color: rgba(255,255,255,0.9);
          backdrop-filter: blur(4px);
          padding: 0.2rem 0.6rem;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }
        .prodotto-details {
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .prodotto-title {
          font-size: 1.25rem;
          margin-bottom: var(--spacing-xs);
          color: var(--text-primary);
        }
        .prodotto-description {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-md);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .prodotto-price-row {
          margin-top: auto;
          margin-bottom: var(--spacing-md);
        }
        .prodotto-price {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: var(--font-serif);
        }
        .prodotto-sizes-container { margin-bottom: var(--spacing-md); }
        .sizes-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
        }
        .sizes-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .size-btn {
          min-width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
          background-color: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
          cursor: pointer;
        }
        .size-btn:hover { border-color: var(--text-primary); background-color: var(--bg-tertiary); }
        .size-btn.selected { background-color: var(--text-primary); color: var(--bg-secondary); border-color: var(--text-primary); }
        .btn-add-to-cart {
          width: 100%;
          background-color: var(--text-primary);
          color: var(--bg-secondary);
          font-size: 0.88rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.8rem;
          border-radius: var(--radius-sm);
          min-height: 44px;
          border: 1px solid var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
        }
        .btn-add-to-cart:hover:not(:disabled) {
          background-color: transparent;
          color: var(--text-primary);
        }
        .btn-add-to-cart.success {
          background-color: var(--success);
          border-color: var(--success);
          color: var(--bg-secondary);
          cursor: default;
        }

        /* Empty state */
        .shop-empty {
          text-align: center;
          padding: var(--spacing-xxl);
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
        }

        /* Footer */
        .store-footer {
          background-color: var(--text-primary);
          color: var(--bg-primary);
          padding: var(--spacing-md) 0;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-lg);
        }
        .footer-left {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }
        .footer-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .footer-logo-img {
          max-height: 40px;
          object-fit: contain;
          display: block;
          /* Il logo su sfondo scuro: usa filter se necessario */
          filter: brightness(0) invert(1);
        }

        .footer-subtitle {
          font-family: var(--font-sans);
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--accent-gold);
          display: block;
          margin-bottom: var(--spacing-sm);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .footer-info {
          font-size: 0.8rem;
          color: var(--border-color);
          opacity: 0.8;
          line-height: 1.6;
          margin-bottom: var(--spacing-sm);
        }
        .footer-info a { color: inherit; text-decoration: underline; }
        .footer-copyright {
          font-size: 0.75rem;
          color: var(--border-color);
          opacity: 0.6;
          margin-top: var(--spacing-sm);
        }
        .footer-copyright a { color: inherit; text-decoration: underline; }
        .footer-links {
          display: flex;
          gap: var(--spacing-md);
          font-size: 0.85rem;
          color: var(--border-color);
          align-items: center;
          flex-wrap: wrap;
        }
        .footer-links a, .footer-link-btn {
          color: var(--border-color);
          opacity: 0.8;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 0;
        }
        .footer-links a:hover, .footer-link-btn:hover {
          opacity: 1;
          color: var(--accent-gold);
        }
        .footer-cookie-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          color: var(--border-color);
          opacity: 0.8;
          font-size: 0.85rem;
          text-decoration: underline;
          text-underline-offset: 2px;
          font-family: inherit;
        }
        .footer-cookie-btn:hover {
          opacity: 1;
          color: var(--accent-gold);
        }
        .social-footer-icon-btn {
          color: var(--border-color);
          opacity: 0.8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          transition: var(--transition-fast);
        }
        .social-footer-icon-btn:hover {
          opacity: 1;
          color: var(--accent-gold);
          background-color: rgba(255,255,255,0.05);
        }

        @media (max-width: 768px) {
          .shop-filter-wrapper {
            flex-direction: column;
            align-items: flex-start;
          }
          .footer-content {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
