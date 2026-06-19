/**
 * HeroGlass.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente Hero per Segreta Style — versione TypeScript con Framer Motion.
 *
 * WCAG 2.2 AA compliance:
 *   1.4.3  Il pannello usa bg-white/85 (rgba 255,255,255,0.85) + overlay scuro
 *          sull'immagine → text-stone-900 (#1C1917) su sfondo ≥0.85 di opacità
 *          garantisce contrasto ~13:1. text-stone-600 (#57534E) → ~5.8:1 ✓
 *   2.1.1  CTA sono <button> / <a href> nativi, pienamente navigabili da Tab.
 *   2.4.7  Focus ring 3px / offset 3px su tutti gli interattivi.
 *   2.3.3  useAccessibilityAnimation() azzera X/Y se reducedMotion è attivo.
 */

import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import useAccessibilityAnimation from '../hooks/useAccessibilityAnimation';

// ─── Tipi ────────────────────────────────────────────────────────────────────

export interface HeroGlassProps {
  /** Callback per navigare verso la sezione Catalogo / Shop */
  onNavigateToShop: () => void;
  /** Percorso opzionale per l'immagine hero di sfondo */
  backgroundImage?: string;
  /** Testo headline opzionale (default: headline Segreta Style) */
  headline?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function HeroGlass({
  onNavigateToShop,
  backgroundImage = '/boutique_bg.png',
  headline = "Moda unica, frizzante e ricca di personalità nel cuore di Monticelli d'Ongina.",
}: HeroGlassProps) {
  const heroRef = useRef<HTMLElement>(null);
  const { fadeUp, fadeIn, staggerContainer } =
    useAccessibilityAnimation({ duration: 0.6 });

  // ── Parallax leggero al mousemove (disabilitato se CSS reduced-motion) ────
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    // Legge la media query direttamente — se attiva non registriamo il handler
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 6;
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
      {/* ── Immagine di sfondo con parallax CSS ─────────────────────────── */}
      <div
        className="hg-bg"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
        aria-hidden="true"
        role="presentation"
      />

      {/* ── Overlay garantito per contrasto WCAG 1.4.3 ──────────────────── */}
      {/* Scurisce l'immagine portando la luminosità media sotto al 15%,
          così il pannello glass bianco sopra ha abbastanza "stacco visivo". */}
      <div className="hg-overlay" aria-hidden="true" />

      {/* ── Pannello principale glass ────────────────────────────────────── */}
      {/* bg-white/85 + backdrop-blur-md → text-stone-900 contrasto ~13:1  */}
      <motion.div
        className="hg-panel"
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

        {/* Headline — h1 semantico (WCAG 1.3.1) */}
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
            Scopri la Nostra Storia
          </a>
        </motion.div>

        {/* Trust row */}
        <motion.div
          className="hg-trust"
          variants={fadeIn}
          aria-label="Garanzie del negozio"
        >
          {TRUST_ITEMS.map((item) => (
            <span key={item} className="hg-trust-item">
              <CheckCircle2 size={13} aria-hidden="true" />
              {item}
            </span>
          ))}
        </motion.div>
      </motion.div>

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
  'Spedizione gratuita sopra 50€',
  'Ritiro in negozio disponibile',
  'Assistenza WhatsApp',
] as const;

// ─── CSS (scoped in stringa) ──────────────────────────────────────────────────

const CSS = `
  /* ── Layout ────────────────────────────────────────────────────────── */
  .hg-root {
    position: relative;
    min-height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xxl) var(--spacing-lg) 6rem;
    overflow: hidden;
    --hero-px: 0px;
    --hero-py: 0px;
  }

  /* ── Immagine bg ───────────────────────────────────────────────────── */
  .hg-bg {
    position: absolute;
    inset: -20px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    transform: translate(var(--hero-px), var(--hero-py));
    transition: transform 0.12s ease-out;
    will-change: transform;
    z-index: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .hg-bg { transform: none !important; transition: none !important; }
  }

  /* ── Overlay contrasto (WCAG 1.4.3) ───────────────────────────────── */
  .hg-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      155deg,
      rgba(20, 14, 10, 0.58) 0%,
      rgba(20, 14, 10, 0.30) 55%,
      rgba(20, 14, 10, 0.48) 100%
    );
    z-index: 1;
  }

  /* ── Pannello glass (bg-white/85) ──────────────────────────────────── */
  /* text-stone-900 (#1C1917) su rgba(255,255,255,0.85) → contrasto ~13:1 */
  .hg-panel {
    position: relative;
    z-index: 2;
    max-width: 680px;
    width: 100%;
    background: rgba(255, 255, 255, 0.85);   /* bg-white/85 */
    backdrop-filter: blur(18px) saturate(1.5);
    -webkit-backdrop-filter: blur(18px) saturate(1.5);
    border: 1px solid rgba(255, 255, 255, 0.55);
    border-radius: var(--radius-lg);
    box-shadow:
      0 8px 32px rgba(44, 37, 32, 0.14),
      0 1px 0 rgba(255, 255, 255, 0.85) inset;
    padding: clamp(2rem, 5vw, 3rem) clamp(1.5rem, 5vw, 2.5rem);
    text-align: center;
  }

  /* ── Badge ─────────────────────────────────────────────────────────── */
  .hg-badge {
    display: inline-block;
    margin-bottom: var(--spacing-md);
    padding: 0.25rem 0.75rem;
    background: var(--accent-soft-gold);
    color: var(--text-secondary);   /* #5E534C su #F6F1EB → 4.9:1 ✓ */
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    border-radius: var(--radius-full);
  }

  /* ── Headline ──────────────────────────────────────────────────────── */
  /* text-stone-900 ≈ #1C1917 su bg-white/85 → ~13:1 ✓ WCAG 1.4.3     */
  .hg-headline {
    font-family: var(--font-serif);
    font-size: clamp(1.7rem, 4vw, 2.45rem);
    line-height: 1.25;
    font-weight: 500;
    color: #1C1917;   /* text-stone-900 */
    margin-bottom: var(--spacing-md);
  }

  .hg-locality {
    font-style: italic;
    color: var(--accent-gold-hover);
  }

  /* ── Subtitle ──────────────────────────────────────────────────────── */
  /* text-stone-600 ≈ #57534E su bg-white/85 → ~5.8:1 ✓ WCAG 1.4.3    */
  .hg-subtitle {
    font-size: 1rem;
    color: #57534E;   /* text-stone-600 */
    max-width: 520px;
    margin: 0 auto var(--spacing-lg);
    line-height: 1.65;
  }

  /* ── CTA ───────────────────────────────────────────────────────────── */
  .hg-actions {
    display: flex;
    justify-content: center;
    gap: var(--spacing-md);
    flex-wrap: wrap;
    margin-bottom: var(--spacing-lg);
  }

  .hg-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--text-primary);
    color: var(--bg-secondary);
    padding: 0.85rem 1.6rem;
    font-family: var(--font-sans);
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--text-primary);
    min-height: 48px;
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .hg-btn-primary:hover {
    background: transparent;
    color: var(--text-primary);
  }

  /* WCAG 2.4.7 — focus ring 3px / offset 3px */
  .hg-btn-primary:focus-visible {
    outline: 3px solid var(--text-primary);
    outline-offset: 3px;
  }

  .hg-btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    color: var(--text-primary);
    padding: 0.85rem 1.6rem;
    font-family: var(--font-sans);
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border-color);
    min-height: 48px;
    text-decoration: none;
    transition: var(--transition-smooth);
  }

  .hg-btn-secondary:hover {
    border-color: var(--text-primary);
    background: rgba(255, 255, 255, 0.75);
  }

  /* WCAG 2.4.7 */
  .hg-btn-secondary:focus-visible {
    outline: 3px solid var(--text-primary);
    outline-offset: 3px;
  }

  /* ── Trust badges ──────────────────────────────────────────────────── */
  .hg-trust {
    display: flex;
    justify-content: center;
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }

  .hg-trust-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-sans);
    font-size: 0.73rem;
    font-weight: 600;
    color: var(--text-secondary);
    letter-spacing: 0.01em;
  }

  .hg-trust-item svg {
    color: var(--accent-gold-hover);
    flex-shrink: 0;
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
  @media (max-width: 640px) {
    .hg-actions { flex-direction: column; align-items: center; }
    .hg-btn-primary,
    .hg-btn-secondary { width: 100%; max-width: 320px; justify-content: center; }
    .hg-trust { flex-direction: column; align-items: center; gap: var(--spacing-xs); }
  }
`;
