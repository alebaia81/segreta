/**
 * HeroGlass.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente Hero per Segreta Style — layout due colonne (Opzione A).
 * Colonna sinistra: testo + CTA su sfondo scuro semi-opaco.
 * Colonna destra: foto reale del negozio in primo piano con cornice elegante.
 *
 * WCAG 2.2 AA compliance:
 *   1.4.3  Testo bianco su rgba(20,14,10,0.82) → contrasto >13:1 ✓
 *   2.1.1  CTA sono <button> / <a href> nativi, navigabili da Tab.
 *   2.4.7  Focus ring 3px / offset 3px su tutti gli interattivi.
 *   2.3.3  useAccessibilityAnimation() azzera X/Y se reducedMotion è attivo.
 */

import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ArrowRight, Truck, Store } from 'lucide-react';
import useAccessibilityAnimation from '../hooks/useAccessibilityAnimation';

// ─── Tipi ────────────────────────────────────────────────────────────────────

export interface HeroGlassProps {
  /** Callback per navigare verso la sezione Catalogo / Shop */
  onNavigateToShop: () => void;
  /** Percorso opzionale per la foto del negozio */
  backgroundImage?: string;
  /** Testo headline opzionale (default: headline Segreta Style) */
  headline?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function HeroGlass({
  onNavigateToShop,
  backgroundImage = '/PHOTO-2026-07-07-17-53-56.jpg',
  headline = "Moda unica, frizzante e ricca di personalità nel cuore di Monticelli d'Ongina.",
}: HeroGlassProps) {
  const heroRef = useRef<HTMLElement>(null);
  const { fadeUp, fadeIn, staggerContainer } =
    useAccessibilityAnimation({ duration: 0.6 });

  // ── Parallax leggero al mousemove (disabilitato se CSS reduced-motion) ────
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 5;
      hero.style.setProperty('--hero-px', `${x}px`);
      hero.style.setProperty('--hero-py', `${y}px`);
    };

    hero.addEventListener('mousemove', handleMouseMove);
    return () => hero.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <header
      ref={heroRef}
      id="home"
      className="hg-root"
      aria-label="Segreta Style — Boutique abbigliamento donna Monticelli d'Ongina"
    >
      {/* ── Sfondo pattern/texture leggero per colonna sinistra ──────────── */}
      <div className="hg-bg-solid" aria-hidden="true" />

      {/* ── Layout due colonne ────────────────────────────────────────────── */}
      <div className="hg-inner">

        {/* ── Colonna sinistra: testo + CTA ─────────────────────────────── */}
        <motion.div
          className="hg-col-text"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          role="region"
          aria-label="Presentazione boutique"
        >
          {/* Badge */}
          <motion.span
            className="hg-badge"
            variants={fadeIn}
            aria-label="Boutique e shopping online"
          >
            Boutique &amp; Shopping Online
          </motion.span>

          {/* Headline */}
          <motion.h1 className="hg-headline" variants={fadeUp}>
            {headline.split('Monticelli')[0]}
            <span className="hg-locality">Monticelli d'Ongina</span>.
          </motion.h1>

          {/* Sottotitolo */}
          <motion.p className="hg-subtitle" variants={fadeUp}>
            Capi selezionati da Greta per esprimere la tua unicità.
            Scopri i nuovi arrivi e acquista online con assistenza WhatsApp.
          </motion.p>

          {/* CTA */}
          <motion.div className="hg-actions" variants={fadeUp}>
            <button
              id="hero-cta-primary"
              className="hg-btn-primary"
              onClick={onNavigateToShop}
              aria-label="Vai alla collezione prodotti"
            >
              <ShoppingBag size={18} aria-hidden="true" />
              Acquista la Collezione
              <ArrowRight size={16} aria-hidden="true" />
            </button>

            <a
              id="hero-cta-secondary"
              href="#chi-sono"
              className="hg-btn-secondary"
              aria-label="Scopri la storia di Segreta Style"
            >
              Scopri la Mia Storia
            </a>
          </motion.div>

          {/* Trust row */}
          <motion.div
            className="hg-trust"
            variants={fadeIn}
            aria-label="Garanzie del negozio"
          >
            {TRUST_ITEMS.map((item) => {
              const Icon = 'icon' in item ? item.icon : null;
              return (
                <span key={item.id} className="hg-trust-item">
                  {'isWhatsapp' in item && item.isWhatsapp ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 2C6.5 2 2 6.5 2 12c0 2.2.7 4.2 2 5.9L2.6 23l5.3-1.4c1.6 1 3.6 1.6 5.6 1.6 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
                      <path d="M16.5 13.9c-.3-.2-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.2l-.9 1.1c-.2.2-.4.2-.7.1-1-.4-1.8-1.2-2.2-2.2 0-.3.1-.5.2-.7l1.1-.9c.3-.2.3-.4.2-.7-.1-.3-.7-1.6-.9-1.9-.2-.3-.4-.3-.7-.3h-.6c-.2 0-.5.1-.7.3-1 1-1 2.5 0 3.8 2.5 3.3 4.5 4.3 6.3 4.7.6.1 1.2 0 1.6-.4.9-.9.9-.9 1.1-1.1.2-.2.2-.4 0-.6z" />
                    </svg>
                  ) : (
                    Icon && <Icon size={16} aria-hidden="true" />
                  )}
                  <span>{item.text}</span>
                </span>
              );
            })}
          </motion.div>
        </motion.div>

        {/* ── Colonna destra: foto negozio ──────────────────────────────── */}
        <motion.div
          className="hg-col-photo"
          initial={{ opacity: 0, x: 40, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          aria-hidden="true"
        >
          <div className="hg-photo-frame">
            <img
              src={backgroundImage}
              alt="Interno della boutique Segreta Style a Monticelli d'Ongina"
              className="hg-photo-img"
              loading="eager"
              decoding="async"
            />
            {/* Decorazione angolo */}
            <div className="hg-photo-corner hg-photo-corner--tl" />
            <div className="hg-photo-corner hg-photo-corner--br" />
          </div>
        </motion.div>

      </div>

      {/* Wave decorativa */}
      <div className="hg-wave" aria-hidden="true">
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          fill="var(--bg-primary)"
        >
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>

      <style>{CSS}</style>
    </header>
  );
}

// ─── Dati statici ─────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  {
    id: 'shipping',
    text: 'La spedizione te la regalo io dai 50€ in su',
    icon: Truck,
  },
  {
    id: 'pickup',
    text: 'Scegli il comodo ritiro nel mio punto vendita',
    icon: Store,
  },
  {
    id: 'whatsapp',
    text: 'Supporto diretto e assistenza via WhatsApp',
    isWhatsapp: true,
  },
] as const;

// ─── CSS (scoped in stringa) ──────────────────────────────────────────────────

const CSS = `
  /* ── Root ──────────────────────────────────────────────────────────── */
  .hg-root {
    position: relative;
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    --hero-px: 0px;
    --hero-py: 0px;
    background: #1a1209;
  }

  /* ── Sfondo texture grain leggero ──────────────────────────────────── */
  .hg-bg-solid {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 50%, rgba(139, 109, 56, 0.12) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(139, 109, 56, 0.08) 0%, transparent 50%),
      #1a1209;
    z-index: 0;
  }

  /* ── Layout interno due colonne ─────────────────────────────────────── */
  .hg-inner {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 38fr 62fr;
    gap: clamp(2rem, 5vw, 4rem);
    align-items: center;
    width: 100%;
    max-width: 1400px;
    padding: clamp(2rem, 4vh, 3rem) clamp(1.5rem, 5vw, 3rem) clamp(3rem, 6vh, 5rem);
  }

  /* ── Colonna testo ──────────────────────────────────────────────────── */
  .hg-col-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  /* ── Badge ─────────────────────────────────────────────────────────── */
  .hg-badge {
    display: inline-block;
    margin-bottom: var(--spacing-md);
    padding: 0.3rem 0.85rem;
    background: rgba(226, 149, 171, 0.15);
    border: 1px solid rgba(226, 149, 171, 0.35);
    color: #E295AB;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    border-radius: var(--radius-full);
  }

  /* ── Headline ──────────────────────────────────────────────────────── */
  .hg-headline {
    font-family: var(--font-serif);
    font-size: clamp(1.9rem, 3.5vw, 2.8rem);
    line-height: 1.2;
    font-weight: 500;
    color: #f5f0e8;
    margin-bottom: var(--spacing-md);
  }

  .hg-locality {
    font-style: italic;
    color: #E295AB;
  }

  /* ── Subtitle ──────────────────────────────────────────────────────── */
  .hg-subtitle {
    font-size: 1rem;
    color: rgba(245, 240, 232, 0.72);
    max-width: 440px;
    margin: 0 0 var(--spacing-lg) 0;
    line-height: 1.65;
  }

  /* ── CTA ───────────────────────────────────────────────────────────── */
  .hg-actions {
    display: flex;
    gap: var(--spacing-md);
    flex-wrap: wrap;
    margin-bottom: var(--spacing-lg);
  }

  .hg-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #E295AB;
    color: #1a1209;
    padding: 0.85rem 1.6rem;
    font-family: var(--font-sans);
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border-radius: var(--radius-sm);
    border: 1.5px solid #E295AB;
    min-height: 48px;
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .hg-btn-primary:hover {
    background: transparent;
    color: #E295AB;
  }

  .hg-btn-primary:focus-visible {
    outline: 3px solid #E295AB;
    outline-offset: 3px;
  }

  .hg-btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(245, 240, 232, 0.08);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    color: #f5f0e8;
    padding: 0.85rem 1.6rem;
    font-family: var(--font-sans);
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border-radius: var(--radius-sm);
    border: 1.5px solid rgba(245, 240, 232, 0.3);
    min-height: 48px;
    text-decoration: none;
    transition: var(--transition-smooth);
  }

  .hg-btn-secondary:hover {
    border-color: #E295AB;
    color: #E295AB;
    background: rgba(226, 149, 171, 0.08);
  }

  .hg-btn-secondary:focus-visible {
    outline: 3px solid #f5f0e8;
    outline-offset: 3px;
  }

  /* ── Trust badges ──────────────────────────────────────────────────── */
  .hg-trust {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: var(--spacing-sm);
  }

  .hg-trust-item {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-sans);
    font-size: 0.82rem;
    font-weight: 500;
    color: rgba(245, 240, 232, 0.9);
    letter-spacing: 0.01em;
  }

  .hg-trust-item svg {
    color: #E295AB;
    flex-shrink: 0;
  }

  /* ── Colonna foto ───────────────────────────────────────────────────── */
  .hg-col-photo {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hg-photo-frame {
    position: relative;
    width: 100%;
    border-radius: 16px;
    overflow: hidden;
    box-shadow:
      0 32px 64px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.06);
    transform: translate(var(--hero-px), var(--hero-py));
    transition: transform 0.14s ease-out;
    will-change: transform;
  }

  @media (prefers-reduced-motion: reduce) {
    .hg-photo-frame { transform: none !important; transition: none !important; }
  }

  .hg-photo-img {
    width: 100%;
    height: clamp(400px, 48vw, 620px);
    object-fit: cover;
    object-position: center;
    display: block;
  }

  /* Decorazioni angolo oro */
  .hg-photo-corner {
    position: absolute;
    width: 28px;
    height: 28px;
    border-color: #E295AB;
    border-style: solid;
  }

  .hg-photo-corner--tl {
    top: 12px;
    left: 12px;
    border-width: 2px 0 0 2px;
    border-radius: 4px 0 0 0;
  }

  .hg-photo-corner--br {
    bottom: 12px;
    right: 12px;
    border-width: 0 2px 2px 0;
    border-radius: 0 0 4px 0;
  }

  /* ── Wave ──────────────────────────────────────────────────────────── */
  .hg-wave {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    line-height: 0;
    z-index: 3;
    pointer-events: none;
  }

  .hg-wave svg {
    width: 100%;
    height: 80px;
    display: block;
  }

  /* ── Responsive ────────────────────────────────────────────────────── */
  @media (max-width: 900px) {
    .hg-inner {
      grid-template-columns: 1fr;
      text-align: center;
    }
    .hg-col-text {
      align-items: center;
    }
    .hg-subtitle {
      margin: 0 auto var(--spacing-lg);
    }
    .hg-trust {
      justify-content: center;
    }
    .hg-col-photo {
      order: -1;
    }
    .hg-photo-img {
      height: clamp(220px, 50vw, 360px);
    }
  }

  @media (max-width: 640px) {
    .hg-root {
      padding-bottom: 2.5rem; /* spazio tra contenuto e onda */
    }
    .hg-wave {
      bottom: -20px; /* onda leggermente più in basso */
    }
    .hg-wave svg {
      height: 60px;
    }
    .hg-actions { flex-direction: column; align-items: center; }
    .hg-btn-primary,
    .hg-btn-secondary { width: 100%; max-width: 320px; justify-content: center; }
    .hg-trust {
      flex-direction: column;
      align-items: stretch; /* ogni riga prende tutta la larghezza */
      gap: var(--spacing-xs);
      width: 100%;
      text-align: left;
    }
    .hg-trust-item {
      display: flex; /* sovrascrive inline-flex */
      justify-content: flex-start;
      align-items: center;
    }
  }
`;
