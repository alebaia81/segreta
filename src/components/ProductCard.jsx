/**
 * ProductCard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Card prodotto per Segreta Style con glassmorphism WCAG 2.2 AA conforme.
 *
 * WCAG 2.2 AA compliance:
 *  1.4.3  Il badge categoria ha bg rgba(255,255,255,0.92) + testo #2C2520 →
 *         contrasto ~12:1 indipendentemente dall'immagine sottostante.
 *  2.1.1  La card è un <article> tabIndex={0}. Tasto Invio/Spazio avvia
 *         l'aggiunta al carrello (se nessun figlio ha il focus) oppure
 *         attiva l'elemento figlio focalizzato.
 *  2.4.7  Focus-visible con outline 3px / offset 3px su ogni elemento
 *         interattivo. La card stessa mostra focus ring quando riceve focus.
 *  2.3.3  useReducedMotion: scale/translateY azzerati → solo opacity.
 *
 * Props:
 *   articolo       Object  – dati del prodotto (id, titolo, descrizione, prezzo,
 *                            immagine_url, categoria, taglie)
 *   onAddToCart    (articolo, size) => void
 *   onCardClick    () => void   – opzionale, naviga al dettaglio
 */

import { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';

/* Hook leggero per prefers-reduced-motion */
function useReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* Normalizza il percorso dell'immagine */
function resolveImageSrc(url) {
  if (!url) return 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

const FALLBACK_SRC = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';

export default function ProductCard({ articolo, onAddToCart, onCardClick }) {
  const reducedMotion = useReducedMotion();
  const [selectedSize, setSelectedSize] = useState(null);
  const [isAdded, setIsAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const taglieList = articolo.taglie
    ? articolo.taglie.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const imageSrc = resolveImageSrc(articolo.immagine_url);

  /* ─── Gestori ───────────────────────────────────────────────────────────── */

  const handleAddToCart = (e) => {
    e.stopPropagation(); // evita attivazione card

    if (taglieList.length > 0 && !selectedSize) {
      setSizeError(true);
      // Focus automatico sul gruppo taglie per assistive tech
      document.getElementById(`sizes-group-${articolo.id}`)?.focus();
      return;
    }
    setSizeError(false);

    if (onAddToCart) onAddToCart(articolo, selectedSize || 'Unica');

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  /* WCAG 2.1.1: Invio/Spazio sulla card stessa (non su un figlio) */
  const handleCardKeyDown = (e) => {
    if (e.target !== e.currentTarget) return; // delegare ai figli
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onCardClick) {
        onCardClick();
      } else {
        handleAddToCart(e);
      }
    }
  };

  /* ─── Render ────────────────────────────────────────────────────────────── */

  return (
    <article
      className={`pc-card${reducedMotion ? ' pc-reduced-motion' : ''}`}
      tabIndex={0}
      aria-label={`${articolo.titolo}, €${parseFloat(articolo.prezzo).toFixed(2)}`}
      onKeyDown={handleCardKeyDown}
      onClick={onCardClick}
    >
      {/* ── Immagine ──────────────────────────────────────────────────────── */}
      <div className="pc-image-wrapper">
        <div className="pc-slider" style={{ position: 'absolute', top: 0, left: 0, display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', scrollbarWidth: 'none', width: '100%', height: '100%' }}>
          {articolo.immagine_url.split(',').filter(Boolean).map((url, idx) => {
            const imgUrl = resolveImageSrc(url.trim());
            return (
              <div key={idx} style={{ flex: '0 0 100%', width: '100%', height: '100%', scrollSnapAlign: 'start', position: 'relative' }}>
                <img
                  src={imgUrl}
                  alt=""
                  className="pc-image-blur-bg"
                  aria-hidden="true"
                  onError={e => { e.target.src = FALLBACK_SRC; }}
                />
                <img
                  src={imgUrl}
                  alt={`${articolo.titolo} - Foto ${idx + 1}`}
                  className="pc-image"
                  loading={idx === 0 ? "eager" : "lazy"}
                  onError={e => { e.target.src = FALLBACK_SRC; }}
                />
              </div>
            );
          })}
        </div>

        {/* Badge categoria: testo scuro su sfondo molto opaco → contrasto > 10:1 */}
        {articolo.categoria && (
          <span className="pc-category-badge" aria-label={`Categoria: ${articolo.categoria}`}>
            {articolo.categoria}
          </span>
        )}

        {/* Dots per immagini multiple */}
        {articolo.immagine_url.split(',').filter(Boolean).length > 1 && (
          <div className="slider-dots" style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 10 }}>
            {articolo.immagine_url.split(',').filter(Boolean).map((_, i) => (
              <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />
            ))}
          </div>
        )}

        {/* Overlay scuro nell'area immagine per evitare testo illeggibile sotto */}
        <div className="pc-image-overlay" aria-hidden="true" style={{ pointerEvents: 'none' }} />
      </div>

      {/* ── Dettagli ──────────────────────────────────────────────────────── */}
      <div className="pc-details">
        <h3 className="pc-title">{articolo.titolo}</h3>

        {articolo.descrizione && (
          <p className="pc-description">{articolo.descrizione}</p>
        )}

        <div className="pc-price-row">
          <span className="pc-price" aria-label={`Prezzo: €${parseFloat(articolo.prezzo).toFixed(2)}`}>
            €{parseFloat(articolo.prezzo).toFixed(2)}
          </span>
        </div>

        {/* ── Taglie ──────────────────────────────────────────────────────── */}
        {taglieList.length > 0 && (
          <div
            className="pc-sizes-container"
            id={`sizes-group-${articolo.id}`}
            tabIndex={-1}
          >
            <span
              id={`sizes-label-${articolo.id}`}
              className="pc-sizes-label"
            >
              {sizeError
                ? '⚠ Seleziona una taglia'
                : 'Seleziona Taglia:'}
            </span>

            {/* role=group consente la navigazione assistiva delle opzioni */}
            <div
              className="pc-sizes-row"
              role="group"
              aria-labelledby={`sizes-label-${articolo.id}`}
            >
              {taglieList.map(size => (
                <button
                  key={size}
                  type="button"
                  className={`pc-size-btn${selectedSize === size ? ' selected' : ''}${sizeError ? ' error-pulse' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSize(size);
                    setSizeError(false);
                  }}
                  aria-pressed={selectedSize === size}
                  aria-label={`Taglia ${size}${selectedSize === size ? ', selezionata' : ''}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottone Aggiungi al Carrello ───────────────────────────────── */}
        <button
          type="button"
          className={`pc-add-to-cart-btn${isAdded ? ' success' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleAddToCart(e); }}
          disabled={isAdded}
          aria-label={
            isAdded
              ? `${articolo.titolo} aggiunto al carrello`
              : `Aggiungi ${articolo.titolo} al carrello`
          }
          aria-live="polite"
        >
          {isAdded ? (
            <>
              <Check size={18} aria-hidden="true" />
              <span>Aggiunto!</span>
            </>
          ) : (
            <>
              <ShoppingBag size={18} aria-hidden="true" />
              <span>Aggiungi al Carrello</span>
            </>
          )}
        </button>
      </div>

      <style>{`
        /* ── Card Container ──────────────────────────────────────────────── */
        .pc-card {
          background-color: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      border-color 0.2s ease;
          cursor: pointer;
          position: relative;
        }

        /* Reduced motion: solo opacity, niente transform (WCAG 2.3.3) */
        .pc-reduced-motion {
          transition: opacity 0.2s ease !important;
        }
        .pc-reduced-motion:hover,
        .pc-reduced-motion:focus-visible {
          transform: none !important;
          opacity: 0.92;
        }

        .pc-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-md);
          border-color: var(--accent-gold);
        }

        /* WCAG 2.4.7 — focus-visible sulla card stessa */
        .pc-card:focus-visible {
          outline: 3px solid var(--text-primary);
          outline-offset: 3px;
          border-color: var(--accent-gold);
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }

        /* ── Immagine ──────────────────────────────────────────────────── */
        .pc-image-wrapper {
          position: relative;
          width: 100%;
          padding-top: 125%; /* Aspect ratio 4:5 — standard abbigliamento */
          background-color: var(--bg-tertiary);
          overflow: hidden;
        }

        .pc-image-blur-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: blur(20px) brightness(0.9);
          opacity: 0.5;
          transform: scale(1.15);
          pointer-events: none;
        }

        .pc-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          z-index: 1;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .pc-card:hover .pc-image,
        .pc-card:focus-visible .pc-image {
          transform: scale(1.04);
        }

        .pc-reduced-motion .pc-image {
          transition: none !important;
          transform: none !important;
        }

        /* Overlay trasparente sull'immagine — assicura contrasto badge (WCAG 1.4.3) */
        .pc-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0) 60%,
            rgba(20, 14, 10, 0.25) 100%
          );
          z-index: 2;
          pointer-events: none;
        }

        /* ── Badge categoria (WCAG 1.4.3 garantito) ─────────────────────── */
        .pc-category-badge {
          position: absolute;
          top: var(--spacing-sm);
          left: var(--spacing-sm);
          /* bg molto opaco: contrasto ~12:1 su qualsiasi immagine */
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          color: var(--text-primary);
          padding: 0.2rem 0.65rem;
          font-family: var(--font-sans);
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(230, 223, 215, 0.7);
          z-index: 10;
          pointer-events: none;
        }

        /* ── Dettagli ──────────────────────────────────────────────────── */
        .pc-details {
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          gap: var(--spacing-xs);
        }

        .pc-title {
          font-family: var(--font-serif);
          font-size: 1.15rem;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 2px;
          line-height: 1.3;
        }

        .pc-description {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: 0 0 var(--spacing-xs);
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pc-price-row {
          margin: var(--spacing-xs) 0 var(--spacing-sm);
        }

        .pc-price {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* ── Taglie ────────────────────────────────────────────────────── */
        .pc-sizes-container {
          margin-bottom: var(--spacing-sm);
          outline: none; /* il focus è gestito programmaticamente */
        }

        .pc-sizes-label {
          display: block;
          font-family: var(--font-sans);
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .pc-sizes-label:has(+ .pc-sizes-row .selected) {
          color: var(--text-primary);
        }

        .pc-sizes-row {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .pc-size-btn {
          min-width: 38px;
          height: 38px;
          padding: 0 0.5rem;
          border-radius: var(--radius-sm);
          border: 1.5px solid var(--border-color);
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-primary);
          background: var(--bg-secondary);
          cursor: pointer;
          transition: var(--transition-fast);
          /* WCAG 2.4.7 */
        }

        .pc-size-btn:hover {
          border-color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        /* WCAG 2.4.7 — focus ring 3px / offset 3px */
        .pc-size-btn:focus-visible {
          outline: 3px solid var(--text-primary);
          outline-offset: 3px;
        }

        .pc-size-btn.selected {
          background: var(--text-primary);
          color: var(--bg-secondary);
          border-color: var(--text-primary);
        }

        /* Errore: pulsazione solo se non reduced-motion */
        @keyframes errorPulse {
          0%   { border-color: var(--error); }
          50%  { border-color: rgba(201, 42, 42, 0.4); }
          100% { border-color: var(--error); }
        }

        .pc-size-btn.error-pulse {
          border-color: var(--error);
          animation: errorPulse 0.8s ease 2;
        }

        @media (prefers-reduced-motion: reduce) {
          .pc-size-btn.error-pulse {
            animation: none;
            border-color: var(--error);
          }
        }

        /* ── Bottone Aggiungi ──────────────────────────────────────────── */
        .pc-add-to-cart-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: auto;
          background: var(--text-primary);
          color: var(--bg-secondary);
          font-family: var(--font-sans);
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.85rem 1rem;
          border-radius: var(--radius-sm);
          min-height: 48px; /* WCAG 2.2 touch target ≥ 24px, ottimizzato 48px */
          border: 1.5px solid var(--text-primary);
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .pc-add-to-cart-btn:hover:not(:disabled) {
          background: transparent;
          color: var(--text-primary);
        }

        /* WCAG 2.4.7 — focus ring ad alto contrasto */
        .pc-add-to-cart-btn:focus-visible {
          outline: 3px solid var(--text-primary);
          outline-offset: 3px;
        }

        .pc-add-to-cart-btn.success {
          background: var(--success);
          border-color: var(--success);
          color: #fff;
          cursor: default;
        }

        .pc-add-to-cart-btn:disabled:not(.success) {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </article>
  );
}
