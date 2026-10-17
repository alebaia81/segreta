/**
 * ProductDetail.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Pagina di dettaglio per Segreta Style (WCAG 2.2 AA conforme).
 *
 * Caratteristiche:
 * - Layout due colonne (Desktop): galleria fotografica a sinistra, box acquisto sticky a destra.
 * - Responsive fluido a colonna singola per dispositivi mobili.
 * - Galleria con miniature, frecce di navigazione e zoom Lightbox a schermo intero.
 * - Gestione varianti colore dinamiche con aggiornamento foto e taglie.
 * - Selettore taglie con validazione e feedback chiaro.
 * - Doppia CTA: "Aggiungi al Carrello" + "Chiedi consiglio a Greta su WhatsApp".
 * - Box fiducia boutique: spedizione gratis >50€, ritiro in negozio a Monticelli d'Ongina, pagamenti sicuri.
 * - Sezione "Potrebbe piacerti anche" con capi consigliati.
 */

import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Check, 
  Truck, 
  Store, 
  ShieldCheck, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight,
  Share2
} from 'lucide-react';
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";

import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

const WHATSAPP_PHONE = '393482946532';
const FALLBACK_SRC = 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80';

function resolveImageSrc(url) {
  if (!url) return FALLBACK_SRC;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

function safeSplit(str, delimiter = ',') {
  if (!str) return [];
  if (Array.isArray(str)) return str.map(s => String(s).trim()).filter(Boolean);
  if (typeof str === 'string') return str.split(delimiter).map(s => s.trim()).filter(Boolean);
  return [String(str)];
}

export default function ProductDetail({
  articoloId,
  articoli = [],
  onAddToCart,
  onNavigateToShop,
  onNavigateToHome,
  onOpenProduct,
  onNavigateToAdmin
}) {
  const articolo = articoli.find(a => String(a.id) === String(articoloId));

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(null);
  const [selectedSize, setSelectedSize] = useState(() => {
    const list = safeSplit(articolo?.taglie || '');
    return (list.length === 1 && list[0].toLowerCase() === 'unica') ? 'Unica' : null;
  });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const thumbnailsRef = useRef(null);

  // Parsing varianti
  const safeParseVarianti = (raw, desc) => {
    let source = raw;
    if (!source && desc && typeof desc === 'string') {
      const matchB64 = desc.match(/\[VARIANTI_B64:([A-Za-z0-9+/=]+)\]/);
      if (matchB64) {
        try {
          source = decodeURIComponent(escape(atob(matchB64[1])));
        } catch {
          // ignora errore b64
        }
      }
      if (!source) {
        const matchPlain = desc.match(/\[VARIANTI:([\s\S]+?)\](?=\s*$|\s+[A-Za-z0-9])/);
        if (matchPlain) source = matchPlain[1];
      }
    }
    if (!source) return [];
    let parsed = source;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { return []; }
    }
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        // ignora fallback parsing
      }
    }
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(v => v && typeof v === 'object');
  };

  const variantiList = articolo ? safeParseVarianti(articolo.varianti, articolo.descrizione) : [];
  const currentVariant = selectedVariantIndex !== null ? variantiList[selectedVariantIndex] : null;

  // Immagini correnti
  const rawImages = currentVariant && Array.isArray(currentVariant.immagini) && currentVariant.immagini.length > 0
    ? currentVariant.immagini
    : (articolo ? safeSplit(articolo.immagine_url) : []);
  const imagesList = [...new Set(rawImages.map(u => u.trim()).filter(Boolean))];
  const finalImages = imagesList.length > 0 ? imagesList : [FALLBACK_SRC];

  // Taglie correnti
  const rawTaglie = currentVariant && currentVariant.taglie
    ? currentVariant.taglie
    : (articolo ? articolo.taglie : '');
  const taglieList = safeSplit(rawTaglie);

  const handleSelectVariant = (idx) => {
    setSelectedVariantIndex(idx);
    setActiveImageIndex(0);
    setSizeError(false);
    const variant = idx !== null ? variantiList[idx] : null;
    const raw = variant?.taglie || (articolo ? articolo.taglie : '');
    const list = safeSplit(raw);
    if (list.length === 1 && list[0].toLowerCase() === 'unica') {
      setSelectedSize('Unica');
    } else {
      setSelectedSize(null);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [articoloId]);

  // Gestione sconto da descrizione [SCONTO:XX]
  const matchSconto = articolo?.descrizione ? articolo.descrizione.match(/\[SCONTO:(\d+)\]/) : null;
  const scontoPercent = matchSconto ? parseInt(matchSconto[1]) : 0;
  const cleanDescrizione = articolo?.descrizione 
    ? articolo.descrizione
        .replace(/\[IN_EVIDENZA\]/g, '')
        .replace(/\[SCONTO:\d+\]/g, '')
        .replace(/\[VARIANTI_B64:[A-Za-z0-9+/=]+\]/g, '')
        .replace(/\[VARIANTI:[\s\S]+?\](?=\s*$|\s+[A-Za-z0-9])/g, '')
        .trim() 
    : '';

  const prezzoScontato = scontoPercent > 0 && articolo
    ? articolo.prezzo - (articolo.prezzo * scontoPercent) / 100 
    : articolo?.prezzo || 0;

  const prezzoFormatted = articolo ? `€${parseFloat(articolo.prezzo).toFixed(2)}` : '';
  const prezzoScontatoFormatted = `€${parseFloat(prezzoScontato).toFixed(2)}`;

  // Handler aggiunta al carrello
  const handleAddToCart = () => {
    if (taglieList.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);

    if (onAddToCart && articolo) {
      const colorName = currentVariant ? currentVariant.colore : null;
      const customImg = finalImages.length > 0 ? finalImages[0] : articolo.immagine_url;
      onAddToCart(articolo, selectedSize || 'Unica', colorName, customImg);
    }

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  // Condividi link
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: articolo?.titolo || 'Segreta Style',
          text: `Guarda questo capo su Segreta Style: ${articolo?.titolo}`,
          url
        });
        return;
      } catch {
        // ignora se l'utente annulla la condivisione nativa
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch {
      // ignora se il clipboard non è disponibile
    }
  };

  // Link WhatsApp con messaggio precompilato
  const whatsappUrl = () => {
    if (!articolo) return `https://wa.me/${WHATSAPP_PHONE}`;
    const variantInfo = currentVariant ? ` colore "${currentVariant.colore}"` : '';
    const sizeInfo = selectedSize ? ` in taglia ${selectedSize}` : '';
    const msg = `Ciao Greta! Ho visto sul sito "${articolo.titolo}"${variantInfo}${sizeInfo} (€${parseFloat(prezzoScontato).toFixed(2)}). Vorrei maggiori informazioni sulla disponibilità o sulla vestibilità!`;
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
  };

  // Capi correlati (stessa categoria o altri attivi)
  const correlati = articoli
    .filter(a => a.id !== articolo?.id && a.attivo !== false)
    .slice(0, 4);

  if (!articolo) {
    return (
      <div className="pd-not-found-container">
        <div className="pd-not-found-card">
          <span className="pd-badge-empty">Segreta Style</span>
          <h2>Capo non trovato</h2>
          <p>L'articolo che stai cercando potrebbe essere esaurito o non più disponibile.</p>
          <div className="pd-not-found-actions">
            <button className="btn-primary" onClick={onNavigateToShop}>
              <ShoppingBag size={18} style={{ marginRight: '8px' }} />
              Torna allo Shop
            </button>
            <button className="btn-secondary" onClick={onNavigateToHome}>
              Vai alla Home
            </button>
          </div>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="pd-page">
      {/* ── Breadcrumb & Top Bar ────────────────────────────────────────── */}
      <nav className="pd-topbar" aria-label="Percorso di navigazione">
        <div className="pd-container pd-topbar-inner">
          <button 
            type="button" 
            className="pd-back-btn" 
            onClick={onNavigateToShop}
            aria-label="Torna al catalogo prodotti"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Torna allo Shop</span>
          </button>

          <div className="pd-breadcrumbs" aria-hidden="true">
            <span className="pd-breadcrumb-link" onClick={onNavigateToHome}>Home</span>
            <span className="pd-breadcrumb-sep">/</span>
            <span className="pd-breadcrumb-link" onClick={onNavigateToShop}>Shop</span>
            {articolo.categoria && (
              <>
                <span className="pd-breadcrumb-sep">/</span>
                <span className="pd-breadcrumb-current">{articolo.categoria}</span>
              </>
            )}
          </div>

          <button 
            type="button" 
            className="pd-share-btn" 
            onClick={handleShare}
            aria-label="Condividi questo capo"
            title="Condividi link articolo"
          >
            <Share2 size={16} aria-hidden="true" />
            <span>{copyFeedback ? 'Link copiato!' : 'Condividi'}</span>
          </button>
        </div>
      </nav>

      {/* ── Sezione Principale Dettaglio ──────────────────────────────── */}
      <main className="pd-main-section">
        <div className="pd-container pd-grid">

          {/* ── Colonna Sinistra: Galleria Foto ───────────────────────── */}
          <div className="pd-gallery-col">
            <div className="pd-main-image-wrapper">
              <img
                src={resolveImageSrc(finalImages[activeImageIndex])}
                alt={`${articolo.titolo} - Foto ${activeImageIndex + 1}`}
                className="pd-main-image"
                loading="eager"
                onClick={() => setIsLightboxOpen(true)}
              />

              {scontoPercent > 0 && (
                <span className="pd-discount-badge" aria-label={`Sconto del ${scontoPercent}%`}>
                  -{scontoPercent}%
                </span>
              )}

              <button
                type="button"
                className="pd-zoom-btn"
                onClick={() => setIsLightboxOpen(true)}
                aria-label="Ingrandisci foto a schermo intero"
                title="Zoom immagine"
              >
                <Maximize2 size={18} aria-hidden="true" />
              </button>

              {finalImages.length > 1 && (
                <>
                  <button
                    type="button"
                    className="pd-slider-btn pd-slider-btn-prev"
                    onClick={() => setActiveImageIndex(prev => (prev === 0 ? finalImages.length - 1 : prev - 1))}
                    aria-label="Foto precedente"
                  >
                    <ChevronLeft size={22} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="pd-slider-btn pd-slider-btn-next"
                    onClick={() => setActiveImageIndex(prev => (prev === finalImages.length - 1 ? 0 : prev + 1))}
                    aria-label="Foto successiva"
                  >
                    <ChevronRight size={22} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {/* Miniature (thumbnails) */}
            {finalImages.length > 1 && (
              <div className="pd-thumbnails-row" ref={thumbnailsRef} role="tablist" aria-label="Miniature foto prodotto">
                {finalImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={activeImageIndex === idx}
                    className={`pd-thumb-btn ${activeImageIndex === idx ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`Visualizza foto ${idx + 1}`}
                  >
                    <img 
                      src={resolveImageSrc(img)} 
                      alt="" 
                      className="pd-thumb-img" 
                      loading="lazy" 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Colonna Destra: Informazioni e Acquisto ───────────────── */}
          <div className="pd-info-col">
            <div className="pd-info-card">

              {/* Categoria */}
              {articolo.categoria && (
                <span className="pd-category-tag">{articolo.categoria}</span>
              )}

              {/* Titolo */}
              <h1 className="pd-title">{articolo.titolo}</h1>

              {/* Prezzo */}
              <div className="pd-price-box">
                {scontoPercent > 0 ? (
                  <div className="pd-price-row">
                    <span className="pd-price-discounted">{prezzoScontatoFormatted}</span>
                    <span className="pd-price-original">{prezzoFormatted}</span>
                    <span className="pd-price-save">Risparmi €{(parseFloat(articolo.prezzo) - prezzoScontato).toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="pd-price-regular">{prezzoFormatted}</span>
                )}
                <span className="pd-vat-note">IVA inclusa</span>
              </div>

              {/* Selettore Varianti Colore */}
              {variantiList.length > 0 && (
                <div className="pd-option-section">
                  <div className="pd-option-header">
                    <span className="pd-option-label">Colore:</span>
                    <span className="pd-option-value">
                      {currentVariant ? currentVariant.colore : 'Tutte le varianti'}
                    </span>
                  </div>
                  <div className="pd-variants-list" role="radiogroup" aria-label="Seleziona colore">
                    <button
                      type="button"
                      className={`pd-variant-btn ${selectedVariantIndex === null ? 'active' : ''}`}
                      onClick={() => handleSelectVariant(null)}
                      aria-label="Tutti i colori"
                    >
                      Tutti
                    </button>
                    {variantiList.map((v, idx) => (
                      <button
                        key={v.colore || idx}
                        type="button"
                        className={`pd-variant-btn ${selectedVariantIndex === idx ? 'active' : ''}`}
                        onClick={() => handleSelectVariant(idx)}
                        aria-label={`Colore ${v.colore}`}
                      >
                        {v.hex && (
                          <span 
                            className="pd-color-dot" 
                            style={{ backgroundColor: v.hex }} 
                            aria-hidden="true" 
                          />
                        )}
                        <span>{v.colore}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selettore Taglie */}
              {taglieList.length > 0 && (
                <div className="pd-option-section">
                  <div className="pd-option-header">
                    <span className="pd-option-label">
                      Taglia: {selectedSize && <strong className="pd-option-value">{selectedSize}</strong>}
                    </span>
                    {sizeError && (
                      <span className="pd-size-error-badge">Seleziona una taglia per continuare</span>
                    )}
                  </div>
                  <div className="pd-sizes-list" role="radiogroup" aria-label="Seleziona taglia">
                    {taglieList.map(size => (
                      <button
                        key={size}
                        type="button"
                        className={`pd-size-btn ${selectedSize === size ? 'active' : ''} ${sizeError ? 'shake' : ''}`}
                        onClick={() => {
                          setSelectedSize(size);
                          setSizeError(false);
                        }}
                        aria-pressed={selectedSize === size}
                        aria-label={`Taglia ${size}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Azioni: Aggiungi al Carrello + WhatsApp ─────────────── */}
              <div className="pd-actions-group">
                <button
                  type="button"
                  className={`pd-btn-cart ${isAdded ? 'added' : ''}`}
                  onClick={handleAddToCart}
                  disabled={isAdded}
                  aria-label={isAdded ? "Articolo aggiunto al carrello" : "Aggiungi al carrello"}
                >
                  {isAdded ? (
                    <>
                      <Check size={20} aria-hidden="true" />
                      <span>Aggiunto al Carrello!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={20} aria-hidden="true" />
                      <span>Aggiungi al Carrello</span>
                    </>
                  )}
                </button>

                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pd-btn-whatsapp"
                  aria-label="Chiedi consiglio a Greta su WhatsApp"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2C6.5 2 2 6.5 2 12c0 2.2.7 4.2 2 5.9L2.6 23l5.3-1.4c1.6 1 3.6 1.6 5.6 1.6 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
                    <path d="M16.5 13.9c-.3-.2-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.2l-.9 1.1c-.2.2-.4.2-.7.1-1-.4-1.8-1.2-2.2-2.2 0-.3.1-.5.2-.7l1.1-.9c.3-.2.3-.4.2-.7-.1-.3-.7-1.6-.9-1.9-.2-.3-.4-.3-.7-.3h-.6c-.2 0-.5.1-.7.3-1 1-1 2.5 0 3.8 2.5 3.3 4.5 4.3 6.3 4.7.6.1 1.2 0 1.6-.4.9-.9.9-.9 1.1-1.1.2-.2.2-.4 0-.6z" />
                  </svg>
                  <span>Chiedi a Greta su WhatsApp</span>
                </a>
              </div>

              {/* Descrizione Articolo */}
              {cleanDescrizione && (
                <div className="pd-description-box">
                  <h3 className="pd-section-subtitle">Dettagli del Capo</h3>
                  <p className="pd-description-text">{cleanDescrizione}</p>
                </div>
              )}

              {/* ── Box Fiducia Boutique ───────────────────────────────── */}
              <div className="pd-trust-box" aria-label="Vantaggi acquisto Segreta Style">
                <div className="pd-trust-row">
                  <Truck size={18} className="pd-trust-icon" aria-hidden="true" />
                  <div>
                    <strong>Spedizione gratuita da 50€</strong>
                    <p>Consegna rapida e tracciata con corriere espresso in tutta Italia.</p>
                  </div>
                </div>

                <div className="pd-trust-row">
                  <Store size={18} className="pd-trust-icon" aria-hidden="true" />
                  <div>
                    <strong>Ritiro gratuito in boutique</strong>
                    <p>Ritira comodamente il tuo ordine nel nostro negozio a Monticelli d’Ongina (PC).</p>
                  </div>
                </div>

                <div className="pd-trust-row">
                  <ShieldCheck size={18} className="pd-trust-icon" aria-hidden="true" />
                  <div>
                    <strong>Consulenza e Reso Semplice</strong>
                    <p>Hai dubbi sulla vestibilità? Greta è a tua disposizione diretta su WhatsApp.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ── Sezione Capi Consigliati ─────────────────────────────────── */}
        {correlati.length > 0 && (
          <section className="pd-related-section" aria-label="Altri capi consigliati">
            <div className="pd-container">
              <div className="pd-related-header">
                <span className="pd-related-badge">Ispirazione Stile</span>
                <h2 className="pd-related-title">Potrebbe piacerti anche</h2>
              </div>

              <div className="pd-related-grid">
                {correlati.map(corr => (
                  <ProductCard
                    key={corr.id}
                    articolo={corr}
                    onAddToCart={onAddToCart}
                    onCardClick={() => onOpenProduct && onOpenProduct(corr.id)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer onLogoClick={onNavigateToHome} onNavigateToAdmin={onNavigateToAdmin} />

      {/* ── Lightbox Zoom a Schermo Intero ─────────────────────────────── */}
      <Lightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        index={activeImageIndex}
        slides={finalImages.map(img => ({ src: resolveImageSrc(img) }))}
        plugins={[Zoom, Counter]}
        animation={{ fade: 250 }}
        carousel={{ finite: finalImages.length <= 1 }}
      />

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .pd-page {
    background-color: var(--bg-primary, #FAF8F5);
    min-height: 100vh;
    color: var(--text-primary, #2C2520);
    display: flex;
    flex-direction: column;
  }

  .pd-container {
    width: 100%;
    max-width: 1320px;
    margin: 0 auto;
    padding: 0 clamp(1rem, 3vw, 2.5rem);
  }

  /* ── Topbar / Breadcrumbs ────────────────────────────────────────── */
  .pd-topbar {
    background-color: rgba(250, 248, 245, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border-color, #E6DFD7);
    padding: 0.9rem 0;
    position: sticky;
    top: 70px;
    z-index: 30;
  }

  .pd-topbar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .pd-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    color: var(--text-primary, #2C2520);
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: var(--radius-sm, 6px);
    transition: all 0.2s ease;
  }

  .pd-back-btn:hover {
    color: #E295AB;
    background: rgba(226, 149, 171, 0.12);
    transform: translateX(-3px);
  }

  .pd-breadcrumbs {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: var(--text-secondary, #5E534C);
  }

  .pd-breadcrumb-link {
    cursor: pointer;
    color: var(--text-secondary, #5E534C);
    transition: color 0.15s ease;
  }

  .pd-breadcrumb-link:hover {
    color: #E295AB;
    text-decoration: underline;
  }

  .pd-breadcrumb-sep {
    opacity: 0.5;
    color: var(--text-muted, #8A7E77);
  }

  .pd-breadcrumb-current {
    color: var(--text-primary, #2C2520);
    font-weight: 600;
  }

  .pd-share-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--bg-secondary, #FFFFFF);
    border: 1px solid var(--border-color, #E6DFD7);
    color: var(--text-primary, #2C2520);
    padding: 6px 14px;
    border-radius: var(--radius-sm, 6px);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(44, 37, 32, 0.04);
  }

  .pd-share-btn:hover {
    border-color: #E295AB;
    color: #E295AB;
    background: rgba(226, 149, 171, 0.08);
  }

  /* ── Layout Principale ───────────────────────────────────────────── */
  .pd-main-section {
    flex: 1;
    padding: clamp(1.5rem, 4vw, 3.5rem) 0 4rem;
  }

  .pd-grid {
    display: grid;
    grid-template-columns: 1.15fr 1fr;
    gap: clamp(2rem, 5vw, 4.5rem);
    align-items: start;
  }

  /* ── Galleria (Colonna Sinistra) ─────────────────────────────────── */
  .pd-gallery-col {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
  }

  .pd-main-image-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 5;
    background-color: var(--bg-secondary, #FFFFFF);
    border-radius: var(--radius-lg, 16px);
    overflow: hidden;
    border: 1px solid var(--border-color, #E6DFD7);
    box-shadow: 0 10px 30px rgba(44, 37, 32, 0.08);
  }

  .pd-main-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    cursor: zoom-in;
    display: block;
    transition: transform 0.3s ease;
  }

  .pd-main-image:hover {
    transform: scale(1.02);
  }

  .pd-discount-badge {
    position: absolute;
    top: 14px;
    left: 14px;
    background: #E295AB;
    color: #ffffff;
    font-weight: 800;
    font-size: 0.85rem;
    padding: 4px 10px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(226, 149, 171, 0.4);
    z-index: 2;
  }

  .pd-zoom-btn {
    position: absolute;
    bottom: 14px;
    right: 14px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(6px);
    color: var(--text-primary, #2C2520);
    border: 1px solid var(--border-color, #E6DFD7);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .pd-zoom-btn:hover {
    background: #E295AB;
    color: #ffffff;
    border-color: #E295AB;
    transform: scale(1.08);
  }

  .pd-slider-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(6px);
    border: 1px solid var(--border-color, #E6DFD7);
    color: var(--text-primary, #2C2520);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 5;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .pd-slider-btn:hover {
    background: #E295AB;
    color: #ffffff;
    border-color: #E295AB;
  }

  .pd-slider-btn-prev { left: 12px; }
  .pd-slider-btn-next { right: 12px; }

  .pd-thumbnails-row {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding: 4px 2px 8px;
    scrollbar-width: thin;
  }

  .pd-thumb-btn {
    flex: 0 0 76px;
    height: 94px;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid transparent;
    padding: 0;
    background: var(--bg-secondary, #FFFFFF);
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.7;
    box-shadow: 0 1px 4px rgba(44, 37, 32, 0.06);
  }

  .pd-thumb-btn.active {
    border-color: #E295AB;
    opacity: 1;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(226, 149, 171, 0.3);
  }

  .pd-thumb-btn:hover {
    opacity: 1;
  }

  .pd-thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* ── Info & Acquisto (Colonna Destra) ─────────────────────────────── */
  .pd-info-col {
    position: sticky;
    top: 130px;
  }

  .pd-info-card {
    background: var(--bg-secondary, #FFFFFF);
    border: 1px solid var(--border-color, #E6DFD7);
    border-radius: var(--radius-lg, 16px);
    padding: clamp(1.5rem, 3vw, 2.2rem);
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
    box-shadow: 0 8px 24px rgba(44, 37, 32, 0.05);
  }

  .pd-category-tag {
    display: inline-block;
    align-self: flex-start;
    padding: 0.25rem 0.85rem;
    background: rgba(226, 149, 171, 0.15);
    border: 1px solid rgba(226, 149, 171, 0.35);
    color: #cb6b86;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-radius: 12px;
  }

  .pd-title {
    font-family: var(--font-serif, 'Plus Jakarta Sans', serif);
    font-size: clamp(1.6rem, 2.6vw, 2.2rem);
    font-weight: 700;
    color: var(--text-primary, #2C2520);
    line-height: 1.25;
    margin: 0;
  }

  .pd-price-box {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color, #E6DFD7);
  }

  .pd-price-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
  }

  .pd-price-regular,
  .pd-price-discounted {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary, #2C2520);
    letter-spacing: -0.01em;
  }

  .pd-price-original {
    font-size: 1.25rem;
    text-decoration: line-through;
    color: var(--text-muted, #8A7E77);
  }

  .pd-price-save {
    font-size: 0.82rem;
    font-weight: 700;
    color: #15803d;
    background: #dcfce7;
    padding: 3px 8px;
    border-radius: 4px;
  }

  .pd-vat-note {
    font-size: 0.78rem;
    color: var(--text-muted, #8A7E77);
  }

  /* ── Opzioni (Varianti & Taglie) ──────────────────────────────────── */
  .pd-option-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pd-option-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.88rem;
  }

  .pd-option-label {
    color: var(--text-secondary, #5E534C);
    font-weight: 600;
  }

  .pd-option-value {
    color: var(--text-primary, #2C2520);
    font-weight: 700;
  }

  .pd-size-error-badge {
    color: #dc2626;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .pd-variants-list,
  .pd-sizes-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pd-variant-btn,
  .pd-size-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 600;
    background: var(--bg-secondary, #FFFFFF);
    border: 1.5px solid var(--border-color, #E6DFD7);
    color: var(--text-primary, #2C2520);
    cursor: pointer;
    transition: all 0.15s ease;
    min-height: 42px;
  }

  .pd-variant-btn:hover,
  .pd-size-btn:hover {
    border-color: #E295AB;
    background: rgba(226, 149, 171, 0.08);
  }

  .pd-variant-btn.active,
  .pd-size-btn.active {
    border-color: #E295AB;
    background: rgba(226, 149, 171, 0.16);
    color: #cb6b86;
    font-weight: 700;
    box-shadow: 0 0 0 1px #E295AB;
  }

  .pd-size-btn.shake {
    border-color: #dc2626;
  }

  .pd-color-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.2);
  }

  /* ── Azioni (Carrello & WhatsApp) ─────────────────────────────────── */
  .pd-actions-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 0.4rem;
  }

  .pd-btn-cart {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #E295AB;
    color: #2C2520;
    border: none;
    border-radius: 8px;
    padding: 0.95rem 1.6rem;
    font-size: 0.95rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 16px rgba(226, 149, 171, 0.35);
  }

  .pd-btn-cart:hover:not(:disabled) {
    background: #db839d;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(226, 149, 171, 0.45);
  }

  .pd-btn-cart.added {
    background: #16a34a;
    color: #ffffff;
    box-shadow: 0 4px 16px rgba(22, 163, 74, 0.35);
  }

  .pd-btn-whatsapp {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #25D366;
    color: #ffffff;
    border: 1.5px solid #25D366;
    border-radius: 8px;
    padding: 0.85rem 1.6rem;
    font-size: 0.9rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 16px rgba(37, 211, 102, 0.25);
  }

  .pd-btn-whatsapp:hover {
    background: #20ba5a;
    border-color: #20ba5a;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(37, 211, 102, 0.35);
  }

  /* ── Descrizione ─────────────────────────────────────────────────── */
  .pd-description-box {
    padding-top: 1.2rem;
    border-top: 1px solid var(--border-color, #E6DFD7);
  }

  .pd-section-subtitle {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary, #2C2520);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 0.6rem 0;
  }

  .pd-description-text {
    font-size: 0.92rem;
    line-height: 1.65;
    color: var(--text-secondary, #5E534C);
    margin: 0;
    white-space: pre-line;
  }

  /* ── Box Fiducia ─────────────────────────────────────────────────── */
  .pd-trust-box {
    background: var(--bg-tertiary, #F3EFEA);
    border: 1px solid var(--border-color, #E6DFD7);
    border-radius: 12px;
    padding: 1.3rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  .pd-trust-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .pd-trust-icon {
    color: #cb6b86;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .pd-trust-row strong {
    display: block;
    font-size: 0.88rem;
    color: var(--text-primary, #2C2520);
    margin-bottom: 2px;
    font-weight: 700;
  }

  .pd-trust-row p {
    font-size: 0.82rem;
    color: var(--text-secondary, #5E534C);
    margin: 0;
    line-height: 1.45;
  }

  /* ── Capi Correlati ──────────────────────────────────────────────── */
  .pd-related-section {
    padding: 4rem 0 2rem;
    border-top: 1px solid var(--border-color, #E6DFD7);
    margin-top: 3.5rem;
  }

  .pd-related-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .pd-related-badge {
    display: inline-block;
    padding: 0.25rem 0.85rem;
    background: rgba(226, 149, 171, 0.15);
    border: 1px solid rgba(226, 149, 171, 0.35);
    color: #cb6b86;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-radius: 12px;
    margin-bottom: 0.6rem;
  }

  .pd-related-title {
    font-family: var(--font-serif, 'Plus Jakarta Sans', serif);
    font-size: clamp(1.8rem, 2.8vw, 2.4rem);
    font-weight: 700;
    color: var(--text-primary, #2C2520);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .pd-related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.5rem;
  }

  /* ── Stato Non Trovato ───────────────────────────────────────────── */
  .pd-not-found-container {
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .pd-not-found-card {
    background: #FFFFFF;
    border: 1px solid var(--border-color, #E6DFD7);
    border-radius: 16px;
    padding: 3rem 2rem;
    text-align: center;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 8px 24px rgba(44, 37, 32, 0.06);
  }

  .pd-not-found-card h2 {
    font-family: var(--font-serif, 'Plus Jakarta Sans', serif);
    font-size: 1.8rem;
    color: var(--text-primary, #2C2520);
    margin: 0;
  }

  .pd-not-found-card p {
    color: var(--text-secondary, #5E534C);
    font-size: 0.95rem;
    margin: 0;
  }

  .pd-not-found-actions {
    display: flex;
    gap: 12px;
    margin-top: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .pd-badge-empty {
    font-size: 0.75rem;
    color: #cb6b86;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* ── Responsive ──────────────────────────────────────────────────── */
  @media (max-width: 960px) {
    .pd-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    .pd-info-col {
      position: static;
    }
    .pd-main-image-wrapper {
      max-height: 520px;
    }
  }

  @media (max-width: 640px) {
    .pd-topbar {
      top: 60px;
    }
    .pd-topbar-inner {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.6rem;
    }
    .pd-breadcrumbs {
      display: none;
    }
    .pd-main-image-wrapper {
      aspect-ratio: 1 / 1;
      max-height: 380px;
    }
    .pd-info-card {
      padding: 1.2rem;
    }
    .pd-btn-cart,
    .pd-btn-whatsapp {
      width: 100%;
    }
  }
`;
