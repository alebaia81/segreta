import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useCookie } from '../context/CookieContext';
import { ShoppingBag, Check } from 'lucide-react';
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";


/**
 * Pagina Shop — /shop
 * Catalogo completo con filtri per categoria.
 * SEO: meta tag differenziati da Home (catalogo + shopping).
 */
export default function Shop({ articoli, onNavigateToHome, onNavigateToAdmin }) {
  const { addToCart } = useCart();
  const { openCookieSettings } = useCookie();

  const [selectedCategory, setSelectedCategory] = useState('TUTTI');
  const [selectedSizes, setSelectedSizes] = useState({});
  const [addedAnimation, setAddedAnimation] = useState({});
  const [zoomArticolo, setZoomArticolo] = useState(null);
  const [zoomImageIndex, setZoomImageIndex] = useState(null);

  const scrollShopSlider = (e, direction) => {
    e.stopPropagation();
    const wrapper = e.currentTarget.closest('.prodotto-image-wrapper');
    const slider = wrapper ? wrapper.querySelector('.prodotto-slider') : null;
    if (slider) {
      const scrollAmount = slider.clientWidth;
      slider.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // --- Meta tag SEO specifici per /shop ---
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Shop Online | Collezioni Abbigliamento Piacenza e Cremona — Segreta Style";

    // Description
    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (metaDesc) {
      metaDesc.setAttribute('content', "Esplora lo shop online di Segreta Style: abbigliamento donna per Piacenza e Cremona. Acquista online e finalizza tramite WhatsApp con Greta.");
    }

    // OG
    const updateOG = (property, content) => {
      const el = document.querySelector(`meta[property="${property}"]`);
      if (el) el.setAttribute('content', content);
    };
    updateOG('og:title', "Shop Online | Collezioni Abbigliamento Donna Piacenza e Cremona — Segreta Style");
    updateOG('og:description', "Scopri le nostre collezioni di abbigliamento donna. Ordina e personalizza via WhatsApp con consegna tra Piacenza e Cremona.");
    updateOG('og:url', 'https://www.segretastylemonticelli.it/shop');

    return () => {
      document.title = prevTitle;
      if (metaDesc) metaDesc.setAttribute('content', prevDesc);
      updateOG('og:title', "Segreta Style | Abbigliamento Moda Donna a Monticelli d'Ongina");
      updateOG('og:description', "Scopri la moda accessibile e divertente selezionata da Greta Righi nel centro storico di Monticelli d'Ongina. Spedizioni in tutta Italia e ritiro in negozio.");
      updateOG('og:url', 'https://www.segretastylemonticelli.it/');
    };
  }, []);

  // Lightbox keydowns and gestures are natively managed by the yet-another-react-lightbox library

  const CATEGORIE_SHOP = [
    'TUTTI',
    'ABITI',
    'CAMICE-BLUSE',
    'T-SHIRT-FELPE',
    'JEANS',
    'PANTALONI',
    'CAPPOTTI-GIACCHE',
    'SCARPE',
    'BORSE'
  ];

  const normalizeCategory = (cat) => {
    if (!cat) return '';
    const c = cat.toUpperCase().trim();
    if (c === 'ABITI' || c === 'GONNE' || c === 'ABITI-BLUES' || c === 'ABITI-BLUSE') return 'ABITI';
    if (c === 'CAMICIE E BLUSE' || c === 'CAMICIE' || c === 'MAGLIERIA' || c === 'CAMICE-MAGLIE-FELPE' || c === 'CAMICE-BLUES' || c === 'CAMICIE-BLUSE' || c === 'CAMICE-BLUSE') return 'CAMICE-BLUSE';
    if (c === 'T-SHIRT' || c === 'FELPE' || c === 'T-SHIRT-FELPE') return 'T-SHIRT-FELPE';
    if (c === 'JEANS') return 'JEANS';
    if (c === 'PANTALONI') return 'PANTALONI';
    if (c === 'GIACCHE' || c === 'GIACCHE E CAPPOTTI' || c === 'CAPPOTTI & GIACCHE' || c === 'CAPPOTTI-GIACCHE') return 'CAPPOTTI-GIACCHE';
    if (c === 'SCARPE') return 'SCARPE';
    if (c === 'BORSE' || c === 'ACCESSORI') return 'BORSE';
    return c;
  };

  const articoliAttivi = articoli.filter(a => a.attivo);
  const articoliTarget = articoliAttivi.filter(a => a.target === 'Donna');
  const categorie = CATEGORIE_SHOP;

  const articoliFiltrati = selectedCategory === 'TUTTI'
    ? articoliTarget
    : articoliTarget.filter(a => normalizeCategory(a.categoria) === selectedCategory);

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
          <h1>IL NOSTRO SHOP</h1>
          <div className="accent-line" style={{ margin: '1rem auto 1.25rem' }}></div>
          <p className="shop-hero-subtitle">
            Tutti i capi disponibili, aggiornati in tempo reale. Trova la categoria adatta ed esplora le novità.
          </p>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="shop-filter-wrapper container" style={{ marginTop: '2rem' }}>
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
      </div>

      {/* Products Grid */}
      <section className="container shop-grid-section" aria-label="Prodotti dello shop" style={{ marginTop: '1rem' }}>

        {articoliFiltrati.length === 0 ? (
          <div className="shop-empty">
            <p>Nessun articolo disponibile in questa categoria al momento.</p>
            <button className="btn-secondary" onClick={() => setSelectedCategory('TUTTI')}>
              Vedi tutti i prodotti
            </button>
          </div>
        ) : (
          <div className="shop-prodotti-grid">
            {articoliFiltrati.map(articolo => {
              const taglieList = articolo.taglie ? articolo.taglie.split(',').map(s => s.trim()) : [];
              const selectedSize = selectedSizes[articolo.id];
              const isAdded = addedAnimation[articolo.id];

              const matchSconto = articolo.descrizione ? articolo.descrizione.match(/\[SCONTO:(\d+)\]/) : null;
              const scontoPercent = matchSconto ? parseInt(matchSconto[1]) : 0;
              const cleanDescrizione = articolo.descrizione ? articolo.descrizione.replace(/\[SCONTO:\d+\]/, '').trim() : '';
              const prezzoScontato = scontoPercent > 0 
                ? articolo.prezzo - (articolo.prezzo * scontoPercent) / 100 
                : articolo.prezzo;

              return (
                <article key={articolo.id} className="prodotto-card">
                  <div className="prodotto-image-wrapper">
                    <div className="prodotto-slider" style={{ position: 'absolute', top: 0, left: 0, display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', scrollbarWidth: 'none', width: '100%', height: '100%', backgroundColor: '#ffffff' }}>
                      {articolo.immagine_url.split(',').filter(Boolean).map((url, idx) => {
                        const imgUrl = url.trim().startsWith('http') || url.trim().startsWith('blob:') ? url.trim() : (url.trim().startsWith('/') ? url.trim() : `/${url.trim()}`);
                        return (
                          <div key={idx} style={{ flex: '0 0 100%', width: '100%', height: '100%', scrollSnapAlign: 'start', position: 'relative' }}>
                            <img
                              src={imgUrl}
                              alt={`${articolo.titolo} - Foto ${idx + 1}`}
                              className="prodotto-image"
                              style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'zoom-in' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomArticolo(articolo);
                                setZoomImageIndex(idx);
                              }}
                              onError={e => {
                                e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Navigazione frecce se più di 1 immagine */}
                    {articolo.immagine_url.split(',').filter(Boolean).length > 1 && (
                      <>
                        <button
                          type="button"
                          className="shop-slider-arrow shop-arrow-left"
                          onClick={(e) => scrollShopSlider(e, 'left')}
                          aria-label="Immagine precedente"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="shop-slider-arrow shop-arrow-right"
                          onClick={(e) => scrollShopSlider(e, 'right')}
                          aria-label="Immagine successiva"
                        >
                          ›
                        </button>
                      </>
                    )}

                    {articolo.categoria && (
                      <span className="prodotto-category-tag">{articolo.categoria}</span>
                    )}
                    {scontoPercent > 0 && (
                      <span className="prodotto-discount-tag" style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#E295AB', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '4px', zIndex: 12 }}>
                        -{scontoPercent}%
                      </span>
                    )}
                    {articolo.immagine_url.split(',').filter(Boolean).length > 1 && (
                      <div className="slider-dots" style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 10 }}>
                        {articolo.immagine_url.split(',').filter(Boolean).map((_, i) => (
                          <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="prodotto-details">
                    <h2 className="prodotto-title">{articolo.titolo}</h2>
                    <p className="prodotto-description">{cleanDescrizione}</p>
                    <div className="prodotto-price-row">
                      {scontoPercent > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span className="prodotto-price text-pink" style={{ color: '#E295AB', fontWeight: 700 }}>
                            €{prezzoScontato.toFixed(2)}
                          </span>
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            €{parseFloat(articolo.prezzo).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="prodotto-price">€{parseFloat(articolo.prezzo).toFixed(2)}</span>
                      )}
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
              <img
                src="/logo-footer-2.png"
                alt="Segreta Style Logo"
                className="footer-logo-img"
              />
            </button>
            <span className="footer-subtitle">DI GRETA RIGHI</span>
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
            <div className="footer-links-row">
              <a href="https://www.iubenda.com/privacy-policy/68426130" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              <a href="https://www.iubenda.com/privacy-policy/68426130/cookie-policy" target="_blank" rel="noopener noreferrer">Cookie Policy</a>
              <button className="footer-cookie-btn" onClick={openCookieSettings}>Gestisci preferenze Privacy</button>
            </div>
            <div className="footer-info-row">
              <span>© 2026 Segreta Style — <a href="https://presenzadigitale.com" target="_blank" rel="noopener noreferrer">Presenzadigitale.com</a></span>
              <span className="footer-separator"> | </span>
              <span>C.F. RGHGRT79R66D15OY — P.IVA 01563960333</span>
              <button 
                onClick={onNavigateToAdmin} 
                className="footer-lock-btn"
                aria-label="Area riservata gestione catalogo"
                title="Area Riservata"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </button>
            </div>
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

        /* Macro Selectors (Uomo/Donna) */
        .shop-macro-wrapper {
          padding: var(--spacing-lg) var(--spacing-lg) 0;
          display: flex;
          justify-content: center;
        }

        .shop-macro-bar {
          display: flex;
          background-color: var(--bg-tertiary);
          padding: 4px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
        }

        .shop-macro-btn {
          font-family: var(--font-sans);
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-secondary);
          padding: 0.6rem 2.2rem;
          border-radius: var(--radius-full);
          transition: var(--transition-smooth);
          min-height: 44px; /* WCAG 2.2 touch target */
          cursor: pointer;
          background: transparent;
          border: none;
        }

        .shop-macro-btn:hover {
          color: var(--text-primary);
        }

        .shop-macro-btn.active {
          background-color: var(--text-primary);
          color: var(--bg-secondary);
          box-shadow: var(--shadow-sm);
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
          background-color: #E295AB;
          color: #fff;
          border-color: #E295AB;
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

        .shop-section-header {
          margin-bottom: var(--spacing-lg);
          text-align: left;
        }

        .shop-section-title {
          font-size: clamp(1.8rem, 3.5vw, 2.4rem);
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }

        .shop-section-subtitle {
          font-size: clamp(0.95rem, 2vw, 1.1rem);
          color: var(--text-secondary);
          font-weight: 500;
          font-family: var(--font-sans);
          margin-top: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .accent-line-left {
          width: 40px;
          height: 2px;
          background-color: var(--accent-gold);
          margin-bottom: var(--spacing-md);
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
          height: 100%;
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
            background-color: #ffffff;
            overflow: hidden;
          }
          /* Slider arrows */
          .shop-slider-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(44, 37, 32, 0.15);
            color: var(--text-primary);
            font-size: 20px;
            font-weight: 300;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(44, 37, 32, 0.08);
            transition: var(--transition-fast);
            padding-bottom: 3px;
          }
          .shop-slider-arrow:hover {
            background: #fff;
            transform: translateY(-50%) scale(1.08);
            box-shadow: 0 6px 16px rgba(44, 37, 32, 0.12);
          }
          .shop-slider-arrow:focus-visible {
            outline: 3px solid var(--text-primary);
            outline-offset: 3px;
          }
          .shop-arrow-left {
            left: 8px;
          }
          .shop-arrow-right {
            right: 8px;
          }
         .prodotto-image-blur-bg {
           display: none;
         }
          .prodotto-image {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            object-fit: contain;
            object-position: center;
            z-index: 1;
            transition: var(--transition-smooth);
          }
         .prodotto-card:hover .prodotto-image {
           transform: scale(1.03);
         }
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
           z-index: 10;
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
          background-color: #E295AB;
          color: #fff;
          font-size: 0.88rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.8rem;
          border-radius: var(--radius-sm);
          min-height: 44px;
          border: 1px solid #E295AB;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
        }
        .btn-add-to-cart:hover:not(:disabled) {
          background-color: transparent;
          color: #E295AB;
          border-color: #E295AB;
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
          max-height: 80px;
          object-fit: contain;
          display: block;
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
        .footer-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--spacing-xs);
          text-align: right;
        }
        .footer-links-row {
          display: flex;
          gap: var(--spacing-md);
          font-size: 0.85rem;
          color: var(--border-color);
          align-items: center;
          flex-wrap: wrap;
        }
        .footer-links-row a {
          color: var(--border-color);
          opacity: 0.8;
          transition: var(--transition-fast);
        }
        .footer-links-row a:hover {
          opacity: 1;
          color: var(--accent-gold);
        }
        .footer-links-row a:focus-visible,
        .footer-cookie-btn:focus-visible,
        .social-footer-icon-btn:focus-visible,
        .footer-logo-btn:focus-visible,
        .footer-lock-btn:focus-visible {
          outline: 2px solid var(--accent-gold);
          outline-offset: 4px;
          border-radius: var(--radius-sm);
          opacity: 1;
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
          transition: var(--transition-fast);
        }
        .footer-cookie-btn:hover {
          opacity: 1;
          color: var(--accent-gold);
        }
        .footer-info-row {
          font-size: 0.75rem;
          color: var(--border-color);
          opacity: 0.7;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
        }
        .footer-info-row a {
          color: inherit;
          text-decoration: underline;
        }
        .footer-separator {
          opacity: 0.5;
        }
        .footer-lock-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          opacity: 0.4;
          transition: opacity 0.2s ease;
          vertical-align: middle;
          cursor: pointer;
          background: none;
          border: none;
          color: inherit;
        }
        .footer-lock-btn:hover {
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .shop-filter-wrapper {
            flex-direction: column;
            align-items: flex-start;
          }
          /* Responsive Footer */
          .footer-content {
            flex-direction: column;
            gap: var(--spacing-md);
            text-align: center;
            align-items: center;
          }
          .footer-left {
            flex-direction: column;
            gap: var(--spacing-xs);
            align-items: center;
          }
          .footer-right {
            align-items: center;
            text-align: center;
            gap: var(--spacing-sm);
          }
          .footer-links-row {
            justify-content: center;
            gap: var(--spacing-xs) var(--spacing-md);
          }
          .footer-info-row {
            justify-content: center;
            flex-direction: column;
            gap: 6px;
          }
          .footer-separator {
            display: none;
          }
        }
      `}</style>

      {zoomArticolo && (
        <Lightbox
          open={zoomArticolo !== null}
          close={() => { setZoomArticolo(null); setZoomImageIndex(null); }}
          index={zoomImageIndex || 0}
          slides={zoomArticolo.immagine_url.split(',').filter(Boolean).map(url => {
            const trimmed = url.trim();
            const src = trimmed.startsWith('http') || trimmed.startsWith('blob:') 
              ? trimmed 
              : (trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
            return { src, alt: zoomArticolo.titolo };
          })}
          plugins={[Zoom, Counter]}
          zoom={{
            maxZoomPixelRatio: 4,
            zoomInMultiplier: 2,
            doubleTapDelay: 300,
            doubleClickDelay: 300,
          }}
          styles={{
            container: { backgroundColor: "rgba(0, 0, 0, 0.75)" }
          }}
        />
      )}
    </div>
  );
}
