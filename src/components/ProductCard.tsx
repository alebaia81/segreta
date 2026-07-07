/**
 * ProductCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Scheda prodotto per Segreta Style — versione TypeScript con Framer Motion.
 *
 * WCAG 2.2 AA compliance:
 *   1.4.3  Badge categoria: bg rgba(255,255,255,0.92) + testo stone-900 → ~12:1.
 *   2.1.1  La card <article tabIndex={0}> risponde a Enter/Space.
 *          Ogni bottone (taglia + carrello) è un <button> nativo navigabile.
 *   2.4.7  Focus ring 3px solid / offset 3px su TUTTI gli elementi interattivi.
 *   2.3.3  useAccessibilityAnimation() azzera Y/scale se reducedMotion è attivo.
 */

import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Check, Tag } from 'lucide-react';
import useAccessibilityAnimation from '../hooks/useAccessibilityAnimation';

// ─── Tipi pubblici ────────────────────────────────────────────────────────────

/** Shape del singolo articolo — rispecchia il modello del DB Segreta */
export interface Articolo {
  id: number;
  titolo: string;
  descrizione?: string;
  prezzo: number;
  immagine_url: string;
  categoria?: string;
  taglie?: string;   // CSV: "S,M,L,XL"
  target?: string;
  attivo?: boolean;
}

export interface ProductCardProps {
  articolo: Articolo;
  /** Callback invocata con (articolo, taglia) al click di "Aggiungi al Carrello" */
  onAddToCart?: (articolo: Articolo, size: string) => void;
  /** Callback opzionale al click della card (es. navigazione dettaglio) */
  onCardClick?: () => void;
}

// ─── Costante fallback immagine ───────────────────────────────────────────────

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';

function resolveImgSrc(url: string): string {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ProductCard({
  articolo,
  onAddToCart,
  onCardClick,
}: ProductCardProps) {
  const { fadeUp } = useAccessibilityAnimation({ duration: 0.45 });

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const taglieList: string[] = articolo.taglie
    ? articolo.taglie.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const prezzoFormatted = `€${parseFloat(String(articolo.prezzo)).toFixed(2)}`;

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleAddToCart = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();

    if (taglieList.length > 0 && !selectedSize) {
      setSizeError(true);
      // Focus sul gruppo taglie per comunicare l'errore agli screen reader
      const groupEl = document.getElementById(`pc-sizes-${articolo.id}`);
      groupEl?.focus();
      return;
    }

    setSizeError(false);
    onAddToCart?.(articolo, selectedSize ?? 'Unica');

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  /** WCAG 2.1.1 — Enter/Space sulla card stessa (non su un figlio) */
  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCardClick ? onCardClick() : handleAddToCart(e);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <motion.article
      className="pc-card"
      /* Usa la variante passata dal genitore stagger, default fadeUp */
      variants={fadeUp}
      tabIndex={0}
      aria-label={`${articolo.titolo}, ${prezzoFormatted}`}
      onKeyDown={handleCardKeyDown}
      onClick={onCardClick}
      whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(44,37,32,0.12)' }}
      /* Riduzione movimento: Framer legge prefers-reduced-motion e sopprime
         automaticamente whileHover transform se reduced-motion è attivo,
         ma usiamo comunque il nostro hook per le varianti figlie.         */
    >
      {/* ── Immagine ──────────────────────────────────────────────────── */}
      <div className="pc-image-wrapper">
        <div className="pc-slider" ref={sliderRef} style={{ position: 'absolute', top: 0, left: 0, display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', scrollbarWidth: 'none', width: '100%', height: '100%' }}>
          {articolo.immagine_url.split(',').filter(Boolean).map((url, idx) => {
            const imgUrl = resolveImgSrc(url.trim());
            return (
              <div key={idx} style={{ flex: '0 0 100%', width: '100%', height: '100%', scrollSnapAlign: 'start', position: 'relative' }}>
                <img
                  src={imgUrl}
                  alt=""
                  className="pc-image-blur"
                  aria-hidden="true"
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                <img
                  src={imgUrl}
                  alt={`${articolo.titolo} - Foto ${idx + 1}`}
                  className="pc-image"
                  loading={idx === 0 ? "eager" : "lazy"}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
              </div>
            );
          })}
        </div>

        {/* Overlay sfumato basso — supporta leggibilità badge */}
        <div className="pc-image-overlay" aria-hidden="true" style={{ pointerEvents: 'none' }} />

        {/* Navigazione frecce se più di 1 immagine */}
        {articolo.immagine_url.split(',').filter(Boolean).length > 1 && (
          <>
            <button
              type="button"
              className="pc-slider-arrow pc-arrow-left"
              onClick={(e) => { e.stopPropagation(); scrollSlider('left'); }}
              aria-label="Immagine precedente"
            >
              ‹
            </button>
            <button
              type="button"
              className="pc-slider-arrow pc-arrow-right"
              onClick={(e) => { e.stopPropagation(); scrollSlider('right'); }}
              aria-label="Immagine successiva"
            >
              ›
            </button>
          </>
        )}

        {/* Dots per immagini multiple */}
        {articolo.immagine_url.split(',').filter(Boolean).length > 1 && (
          <div className="slider-dots" style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 10 }}>
            {articolo.immagine_url.split(',').filter(Boolean).map((_, i) => (
              <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />
            ))}
          </div>
        )}

        {/* Badge categoria (WCAG 1.4.3: contrasto ~12:1 garantito) */}
        {articolo.categoria && (
          <span
            className="pc-category-badge"
            aria-label={`Categoria: ${articolo.categoria}`}
          >
            <Tag size={10} aria-hidden="true" />
            {articolo.categoria}
          </span>
        )}
      </div>

      {/* ── Dettagli ──────────────────────────────────────────────────── */}
      <div className="pc-details">
        <h3 className="pc-title">{articolo.titolo}</h3>

        {articolo.descrizione && (
          <p className="pc-description">{articolo.descrizione}</p>
        )}

        {/* Prezzo */}
        <div className="pc-price-row">
          <span
            className="pc-price"
            aria-label={`Prezzo: ${prezzoFormatted}`}
          >
            {prezzoFormatted}
          </span>
        </div>

        {/* ── Selezione taglie ─────────────────────────────────────── */}
        {taglieList.length > 0 && (
          <div
            className="pc-sizes-wrapper"
            id={`pc-sizes-${articolo.id}`}
            tabIndex={-1}   // Focusabile programmaticamente per errori
          >
            <span
              id={`pc-sizes-label-${articolo.id}`}
              className={`pc-sizes-label${sizeError ? ' error' : ''}`}
            >
              {sizeError ? '⚠ Seleziona una taglia' : 'Seleziona Taglia:'}
            </span>

            <div
              role="group"
              aria-labelledby={`pc-sizes-label-${articolo.id}`}
              className="pc-sizes-row"
            >
              {taglieList.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`pc-size-btn${selectedSize === size ? ' selected' : ''}${sizeError ? ' error' : ''}`}
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

        {/* ── Bottone Aggiungi al Carrello ─────────────────────────── */}
        {/* aria-label esplicito (WCAG 2.4.6): "Aggiungi [Nome] al carrello" */}
        <button
          type="button"
          className={`pc-add-btn${isAdded ? ' success' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleAddToCart(e); }}
          disabled={isAdded}
          aria-label={
            isAdded
              ? `${articolo.titolo} aggiunto al carrello`
              : `Aggiungi ${articolo.titolo} al carrello`
          }
          aria-live="polite"
          aria-busy={isAdded}
        >
          {isAdded ? (
            <>
              <Check size={17} aria-hidden="true" />
              <span>Aggiunto!</span>
            </>
          ) : (
            <>
              <ShoppingBag size={17} aria-hidden="true" />
              <span>Aggiungi al Carrello</span>
            </>
          )}
        </button>
      </div>

      <style>{CSS}</style>
    </motion.article>
  );
}

// ─── CSS scoped ───────────────────────────────────────────────────────────────

const CSS = `
  /* ── Card container ─────────────────────────────────────────────── */
  .pc-card {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
    cursor: pointer;
    transition: border-color 0.2s ease;
    position: relative;
  }

  /* WCAG 2.4.7 — focus ring 3px solid / offset 3px */
  .pc-card:focus-visible {
    outline: 3px solid var(--text-primary);
    outline-offset: 3px;
    border-color: var(--accent-gold);
  }

  /* Reduced-motion: Framer sopprime whileHover transform, usiamo solo color */
  @media (prefers-reduced-motion: reduce) {
    .pc-card { transition: border-color 0.15s ease, opacity 0.15s ease; }
    .pc-card:hover { opacity: 0.92; }
  }

  /* ── Immagine ────────────────────────────────────────────────────── */
  .pc-image-wrapper {
    position: relative;
    width: 100%;
    padding-top: 125%;   /* Aspect ratio 4:5 */
    background: var(--bg-tertiary);
    overflow: hidden;
  }

  .pc-image-blur {
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    filter: blur(22px) brightness(0.88);
    opacity: 0.45;
    transform: scale(1.15);
    pointer-events: none;
  }

  .pc-image {
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center;
    z-index: 1;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .pc-card:hover .pc-image,
  .pc-card:focus-visible .pc-image {
    transform: scale(1.045);
  }

  @media (prefers-reduced-motion: reduce) {
    .pc-image { transition: none !important; transform: none !important; }
  }

  .pc-image-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 55%, rgba(20,14,10,0.28) 100%);
    z-index: 2;
    pointer-events: none;
  }

  /* Badge: bg rgba(255,255,255,0.92) → stone-900 contrasto ~12:1 (WCAG 1.4.3) */
  .pc-category-badge {
    position: absolute;
    top: var(--spacing-sm);
    left: var(--spacing-sm);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    color: #1C1917;   /* text-stone-900 */
    padding: 0.22rem 0.6rem;
    font-family: var(--font-sans);
    font-size: 0.67rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(230,223,215,0.7);
    z-index: 10;
    pointer-events: none;
  }

  /* Slider arrows */
  .pc-slider-arrow {
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
  .pc-slider-arrow:hover {
    background: #fff;
    transform: translateY(-50%) scale(1.08);
    box-shadow: 0 6px 16px rgba(44, 37, 32, 0.12);
  }
  .pc-slider-arrow:focus-visible {
    outline: 3px solid var(--text-primary);
    outline-offset: 3px;
  }
  .pc-arrow-left {
    left: 8px;
  }
  .pc-arrow-right {
    right: 8px;
  }

  /* ── Dettagli ────────────────────────────────────────────────────── */
  .pc-details {
    padding: var(--spacing-md);
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: var(--spacing-xs);
  }

  .pc-title {
    font-family: var(--font-serif);
    font-size: 1.12rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0 0 2px;
    line-height: 1.3;
  }

  .pc-description {
    font-size: 0.84rem;
    color: var(--text-secondary);
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0 0 var(--spacing-xs);
  }

  .pc-price-row { margin: var(--spacing-xs) 0 var(--spacing-sm); }

  .pc-price {
    font-family: var(--font-serif);
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  /* ── Taglie ──────────────────────────────────────────────────────── */
  .pc-sizes-wrapper {
    margin-bottom: var(--spacing-sm);
    outline: none;
  }

  .pc-sizes-label {
    display: block;
    font-family: var(--font-sans);
    font-size: 0.71rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xs);
  }

  .pc-sizes-label.error { color: var(--error); }

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
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-primary);
    background: var(--bg-secondary);
    cursor: pointer;
    transition: var(--transition-fast);
  }

  .pc-size-btn:hover { border-color: var(--text-primary); background: var(--bg-tertiary); }

  /* WCAG 2.4.7 — focus ring 3px solid / offset 3px */
  .pc-size-btn:focus-visible {
    outline: 3px solid var(--text-primary);
    outline-offset: 3px;
  }

  .pc-size-btn.selected {
    background: var(--text-primary);
    color: var(--bg-secondary);
    border-color: var(--text-primary);
  }

  .pc-size-btn.error { border-color: var(--error); }

  @keyframes errorBorder {
    0%, 100% { border-color: var(--error); }
    50%       { border-color: rgba(201,42,42,0.35); }
  }

  .pc-size-btn.error {
    animation: errorBorder 0.8s ease 2;
  }

  @media (prefers-reduced-motion: reduce) {
    .pc-size-btn.error { animation: none; }
  }

  /* ── Bottone Aggiungi al Carrello ────────────────────────────────── */
  .pc-add-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: auto;
    background: #E295AB;
    color: #fff;
    font-family: var(--font-sans);
    font-size: 0.83rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 0.85rem;
    border-radius: var(--radius-sm);
    border: 1.5px solid #E295AB;
    /* WCAG 2.2 touch target: min 48px (meglio del minimo 24px) */
    min-height: 48px;
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .pc-add-btn:hover:not(:disabled) {
    background: transparent;
    color: #E295AB;
  }

  .pc-add-btn:focus-visible {
    outline: 3px solid var(--text-primary);
    outline-offset: 3px;
    /* Illuminazione aggiuntiva per massimizzare la visibilità */
    box-shadow: 0 0 0 6px rgba(44, 37, 32, 0.10);
  }

  .pc-add-btn.success {
    background: var(--success);
    border-color: var(--success);
    color: #fff;
    cursor: default;
  }

  .pc-add-btn:disabled:not(.success) {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
