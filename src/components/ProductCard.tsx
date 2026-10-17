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
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import './ProductCard.css';

// ─── Tipi pubblici ────────────────────────────────────────────────────────────

export interface VarianteColore {
  colore: string;
  hex?: string;
  immagini: string[];
  taglie: string[];
}

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
  varianti?: VarianteColore[] | string;
}

export interface ProductCardProps {
  articolo: Articolo;
  /** Callback invocata al click di "Aggiungi al Carrello" */
  onAddToCart?: (articolo: Articolo, size: string, color?: string | null, customImage?: string | null) => void;
  /** Callback opzionale al click della card (es. navigazione dettaglio) */
  onCardClick?: (id?: number) => void;
}

// ─── Costante fallback immagine ───────────────────────────────────────────────

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80';

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
  const [sizeError, setSizeError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState<number | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);

  const sliderRef = useRef<HTMLDivElement>(null);

  // Parsing ultra-robusto delle varianti (array, stringa JSON, tag [VARIANTI_B64:...] e [VARIANTI:...])
  const safeParseVarianti = (raw: any, descrizione?: string): VarianteColore[] => {
    let source = raw;
    if (!source && descrizione && typeof descrizione === 'string') {
      const matchB64 = descrizione.match(/\[VARIANTI_B64:([A-Za-z0-9+/=]+)\]/);
      if (matchB64) {
        try {
          source = decodeURIComponent(escape(atob(matchB64[1])));
        } catch {}
      }
      if (!source) {
        const matchPlain = descrizione.match(/\[VARIANTI:([\s\S]+?)\](?=\s*$|\s+[A-Za-z0-9])/);
        if (matchPlain) source = matchPlain[1];
      }
    }
    if (!source) return [];
    let parsed = source;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { return []; }
    }
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { }
    }
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(v => v && typeof v === 'object');
  };

  const variantiList: VarianteColore[] = safeParseVarianti(articolo.varianti, articolo.descrizione);

  const currentVariant = selectedVariantIndex !== null ? variantiList[selectedVariantIndex] : null;

  // Immagini correnti — deduplicazione con Set per evitare foto doppie
  const rawImagesList = currentVariant && Array.isArray(currentVariant.immagini) && currentVariant.immagini.length > 0
    ? currentVariant.immagini
    : (articolo.immagine_url ? articolo.immagine_url.split(',').map(s => s.trim()).filter(Boolean) : []);
  const currentImagesList = [...new Set(rawImagesList.map(u => u.trim()).filter(Boolean))];

  // Taglie correnti
  const taglieList: string[] = currentVariant && Array.isArray(currentVariant.taglie) && currentVariant.taglie.length > 0
    ? currentVariant.taglie
    : (articolo.taglie ? articolo.taglie.split(',').map((s) => s.trim()).filter(Boolean) : []);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const matchSconto = articolo.descrizione ? articolo.descrizione.match(/\[SCONTO:(\d+)\]/) : null;
  const scontoPercent = matchSconto ? parseInt(matchSconto[1]) : 0;
  const cleanDescrizione = articolo.descrizione 
    ? articolo.descrizione
        .replace(/\[IN_EVIDENZA\]/g, '')
        .replace(/\[SCONTO:\d+\]/g, '')
        .replace(/\[VARIANTI_B64:[A-Za-z0-9+/=]+\]/g, '')
        .replace(/\[VARIANTI:[\s\S]+?\](?=\s*$|\s+[A-Za-z0-9])/g, '')
        .trim() 
    : '';
  const prezzoScontato = scontoPercent > 0 
    ? articolo.prezzo - (articolo.prezzo * scontoPercent) / 100 
    : articolo.prezzo;

  const prezzoFormatted = `€${parseFloat(String(articolo.prezzo)).toFixed(2)}`;
  const prezzoScontatoFormatted = `€${parseFloat(String(prezzoScontato)).toFixed(2)}`;

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
    const colorName = currentVariant ? currentVariant.colore : null;
    const customImg = currentImagesList.length > 0 ? currentImagesList[0] : articolo.immagine_url;
    onAddToCart?.(articolo, selectedSize ?? 'Unica', colorName, customImg);

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  /** WCAG 2.1.1 — Enter/Space sulla card stessa (non su un figlio) */
  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCardClick ? onCardClick(articolo.id) : handleAddToCart(e);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <motion.article
      className="pc-card"
      /* Usa la variante passata dal genitore stagger, default fadeUp */
      variants={fadeUp}
      tabIndex={0}
      aria-label={`${articolo.titolo}, ${scontoPercent > 0 ? `Scontato a ${prezzoScontatoFormatted} (invece di ${prezzoFormatted})` : prezzoFormatted}`}
      onKeyDown={handleCardKeyDown}
      onClick={() => onCardClick && onCardClick(articolo.id)}
      whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(44,37,32,0.12)' }}
      /* Riduzione movimento: Framer legge prefers-reduced-motion e sopprime
         automaticamente whileHover transform se reduced-motion è attivo,
         ma usiamo comunque il nostro hook per le varianti figlie.         */
    >
      {/* ── Immagine ──────────────────────────────────────────────────── */}
      <div className="pc-image-wrapper">
        <div className="pc-slider" ref={sliderRef} style={{ position: 'absolute', top: 0, left: 0, display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', scrollbarWidth: 'none', width: '100%', height: '100%', backgroundColor: '#ffffff' }}>
          {currentImagesList.map((url, idx) => {
            const imgUrl = resolveImgSrc(url.trim());
            return (
              <div key={idx} style={{ flex: '0 0 100%', width: '100%', height: '100%', scrollSnapAlign: 'start', position: 'relative' }}>
                <img
                  src={imgUrl}
                  alt={`${articolo.titolo} - Foto ${idx + 1}`}
                  className="pc-image"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: onCardClick ? 'pointer' : 'zoom-in' }}
                  loading={idx === 0 ? "eager" : "lazy"}
                  onClick={(e) => {
                    if (onCardClick) {
                      onCardClick(articolo.id);
                    } else {
                      e.stopPropagation();
                      setZoomImageIndex(idx);
                    }
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
              </div>
            );
          })}
        </div>

        {/* Overlay sfumato basso — supporta leggibilità badge */}
        <div className="pc-image-overlay" aria-hidden="true" style={{ pointerEvents: 'none' }} />

        {/* Navigazione frecce se più di 1 immagine */}
        {currentImagesList.length > 1 && (
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
        {currentImagesList.length > 1 && (
          <div className="slider-dots" style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 10 }}>
            {currentImagesList.map((_, i) => (
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

        {scontoPercent > 0 && (
          <span
            className="pc-discount-badge"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: '#E295AB',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.25rem 0.6rem',
              borderRadius: '4px',
              zIndex: 11
            }}
          >
            -{scontoPercent}%
          </span>
        )}
      </div>

      {/* ── Dettagli ──────────────────────────────────────────────────── */}
      <div className="pc-details">
        <h3 className="pc-title">{articolo.titolo}</h3>

        {cleanDescrizione && (
          <p className="pc-description">{cleanDescrizione}</p>
        )}

        {/* Prezzo */}
        <div className="pc-price-row">
          {scontoPercent > 0 ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span
                className="pc-price text-pink"
                style={{ color: '#E295AB', fontWeight: 700 }}
                aria-label={`Prezzo Scontato: ${prezzoScontatoFormatted}`}
              >
                {prezzoScontatoFormatted}
              </span>
              <span
                style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.9rem' }}
                aria-label={`Prezzo Originale: ${prezzoFormatted}`}
              >
                {prezzoFormatted}
              </span>
            </div>
          ) : (
            <span
              className="pc-price"
              aria-label={`Prezzo: ${prezzoFormatted}`}
            >
              {prezzoFormatted}
            </span>
          )}
        </div>

        {/* ── Sezione Selettore Varianti Colore ────────────────────────────────────────── */}
        {variantiList.length > 0 && (
          <div className="pc-variants-bar" style={{ margin: '8px 0', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', width: '100%' }}>Colore:</span>
            
            {/* Pulsante Tutti (Ripristina Foto e Taglie Principali) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedVariantIndex(null);
                setSelectedSize(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.78rem',
                fontWeight: selectedVariantIndex === null ? '700' : '500',
                border: selectedVariantIndex === null ? '2px solid #E295AB' : '1px solid var(--border-color, #CCC)',
                background: selectedVariantIndex === null ? 'rgba(226, 149, 171, 0.15)' : 'var(--bg-secondary, #FFF)',
                color: 'var(--text-primary, #2C2520)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Tutti
            </button>

            {variantiList.map((v, idx) => {
              const isSelected = selectedVariantIndex === idx;
              return (
                <button
                  key={v.colore || idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariantIndex(idx);
                    setSelectedSize(null);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? '700' : '500',
                    border: isSelected ? '2px solid #E295AB' : '1px solid var(--border-color, #CCC)',
                    background: isSelected ? 'rgba(226, 149, 171, 0.15)' : 'var(--bg-secondary, #FFF)',
                    color: 'var(--text-primary, #2C2520)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {v.hex && (
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: v.hex,
                        border: '1px solid rgba(0,0,0,0.2)'
                      }}
                    />
                  )}
                  {v.colore}
                </button>
              );
            })}
          </div>
        )}

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

      {zoomImageIndex !== null && (
        <Lightbox
          open={true}
          close={() => setZoomImageIndex(null)}
          index={zoomImageIndex || 0}
          slides={currentImagesList.map(url => {
            const trimmed = String(url).trim();
            const src = resolveImgSrc(trimmed);
            return { src, alt: articolo.titolo };
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
    </motion.article>
  );
}
