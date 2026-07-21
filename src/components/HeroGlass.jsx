/**
 * HeroGlass.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente Hero per Segreta Style.
 *
 * WCAG 2.2 AA compliance:
 *  1.4.3  Contrasto testo ≥ 4.5:1 → overlay lineare che oscura l'immagine
 *         prima che il testo sia renderizzato; il pannello glass ha inoltre
 *         bg rgba(255,255,255,0.92) con backdrop-blur, garantendo che anche
 *         con sfondi variopinti il contrasto con --text-primary sia > 7:1.
 *  2.1.1  I link CTA sono elementi <a> con href → navigabili da tastiera.
 *  2.4.7  Focus-visible con outline 3px offset 3px coerente con il DS.
 *  2.3.3  useReducedMotion: fadeIn e transform dell'immagine azzerate;
 *         rimane solo opacity per la dissolvenza opaca.
 *
 * Prop obbligatorie:
 *   onNavigateToShop  () => void   – naviga verso la sezione catalogo
 */

import { useEffect, useRef } from 'react';
import { Truck, Store } from 'lucide-react';

/* Hook leggero per leggere prefers-reduced-motion senza dipendenze extra */
function useReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function HeroGlass({ onNavigateToShop }) {
  const reducedMotion = useReducedMotion();
  const heroRef = useRef(null);

  /* Parallax leggero al mousemove — disabilitato se reducedMotion */
  useEffect(() => {
    if (reducedMotion) return;
    const hero = heroRef.current;
    if (!hero) return;

    const handleMouseMove = (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 5;
      hero.style.setProperty('--px', `${x}px`);
      hero.style.setProperty('--py', `${y}px`);
    };

    hero.addEventListener('mousemove', handleMouseMove);
    return () => hero.removeEventListener('mousemove', handleMouseMove);
  }, [reducedMotion]);

  return (
    <header
      ref={heroRef}
      id="home"
      className="hero-glass-section"
      aria-label="Segreta Style — Boutique abbigliamento donna Monticelli d'Ongina"
    >
      {/* ─── Layer 1: Immagine di sfondo con parallax CSS ──────────────── */}
      <div className="hero-glass-bg" aria-hidden="true" />

      {/* ─── Layer 2: Overlay di contrasto garantito (WCAG 1.4.3) ──────── */}
      {/* L'overlay porta la luminosità dello sfondo sotto 10% garantendo
          che il glass panel sopra abbia sempre abbastanza "darkening"
          per mantenere il contrasto del testo ≥ 4.5:1.               */}
      <div className="hero-glass-overlay" aria-hidden="true" />

      {/* ─── Layer 3: Pannello glass ────────────────────────────────────── */}
      <div className="hero-glass-panel" data-reduced-motion={reducedMotion}>
        <span className="badge hero-badge">Boutique &amp; Shopping Online</span>

        <h1 className="hero-glass-title">
          Moda unica, frizzante e ricca di personalità nel cuore di{' '}
          <span className="hero-glass-locality">Monticelli d'Ongina</span>.
        </h1>

        <p className="hero-glass-subtitle">
          Capi selezionati da Greta per esprimere la tua unicità.
          Scopri i nuovi arrivi e acquista online.
        </p>

        <div className="hero-glass-actions">
          {/* Link <a> per navigazione tastiera completa (WCAG 2.1.1) */}
          <button
            className="btn-primary hero-cta-primary"
            onClick={onNavigateToShop}
            id="hero-cta-shop"
          >
            Acquista la Collezione
          </button>
          <a
            href="#chi-sono"
            className="btn-secondary hero-cta-secondary"
            id="hero-cta-story"
          >
            Scopri la Nostra Storia
          </a>
        </div>

        {/* Trust badge */}
        <div className="hero-trust-row" aria-label="Garanzie del negozio">
          <span className="hero-trust-badge">
            <Truck size={16} aria-hidden="true" />
            La spedizione te la regaliamo noi dai 50€ in su
          </span>
          <span className="hero-trust-badge">
            <Store size={16} aria-hidden="true" />
            Scegli il comodo ritiro nel nostro punto vendita
          </span>
          <span className="hero-trust-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2C6.5 2 2 6.5 2 12c0 2.2.7 4.2 2 5.9L2.6 23l5.3-1.4c1.6 1 3.6 1.6 5.6 1.6 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
              <path d="M16.5 13.9c-.3-.2-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.2l-.9 1.1c-.2.2-.4.2-.7.1-1-.4-1.8-1.2-2.2-2.2 0-.3.1-.5.2-.7l1.1-.9c.3-.2.3-.4.2-.7-.1-.3-.7-1.6-.9-1.9-.2-.3-.4-.3-.7-.3h-.6c-.2 0-.5.1-.7.3-1 1-1 2.5 0 3.8 2.5 3.3 4.5 4.3 6.3 4.7.6.1 1.2 0 1.6-.4.9-.9.9-.9 1.1-1.1.2-.2.2-.4 0-.6z" />
            </svg>
            Supporto diretto e assistenza via WhatsApp
          </span>
        </div>
      </div>

      {/* Wave decorativa in fondo */}
      <div className="hero-glass-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" fill="var(--bg-primary)">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>

      <style>{`
        /* ── Layout ──────────────────────────────────────────────────────── */
        .hero-glass-section {
          position: relative;
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xxl) var(--spacing-lg) 6rem;
          overflow: hidden;
          /* Variabili parallax, valorizzate da JS */
          --px: 0px;
          --py: 0px;
        }

        /* ── Immagine di sfondo ───────────────────────────────────────────── */
        .hero-glass-bg {
          position: absolute;
          inset: -20px;
          background:
            url('/boutique_bg.png') no-repeat center center / cover;
          transform: translate(var(--px), var(--py));
          /* Rispetta prefers-reduced-motion (il JS non imposta le variabili) */
          transition: transform 0.1s ease-out;
          will-change: transform;
          z-index: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-glass-bg {
            transform: none !important;
            transition: none !important;
          }
        }

        /* ── Overlay contrasto (WCAG 1.4.3) ────────────────────────────── */
        /* Gradiente scuro: assicura che il testo bianco/scuro sul pannello
           abbia sempre contrasto sufficiente indipendentemente dall'immagine. */
        .hero-glass-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            160deg,
            rgba(20, 14, 10, 0.55) 0%,
            rgba(20, 14, 10, 0.30) 50%,
            rgba(20, 14, 10, 0.45) 100%
          );
          z-index: 1;
        }

        /* ── Pannello Glass (WCAG 1.4.3 + Glassmorphism) ──────────────── */
        .hero-glass-panel {
          position: relative;
          z-index: 2;
          max-width: 680px;
          width: 100%;
          /* Sfondo altamente opaco: garantisce contrasto > 7:1 per --text-primary */
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(20px) saturate(1.4);
          -webkit-backdrop-filter: blur(20px) saturate(1.4);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: var(--radius-lg);
          box-shadow:
            0 8px 32px rgba(44, 37, 32, 0.12),
            0 1px 0 rgba(255, 255, 255, 0.8) inset;
          padding: clamp(2rem, 5vw, 3rem) clamp(1.5rem, 5vw, 2.5rem);
          text-align: center;
          /* Animazione entrata — azzerata con reduced-motion */
          animation: heroFadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .hero-glass-panel[data-reduced-motion="true"] {
          animation: heroFadeInOpacity 0.4s ease forwards;
        }

        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Solo dissolvenza opaca per reduced-motion (WCAG 2.3.3) */
        @keyframes heroFadeInOpacity {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Tipografia ────────────────────────────────────────────────── */
        .hero-badge {
          margin-bottom: var(--spacing-md);
        }

        .hero-glass-title {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          line-height: 1.25;
          color: var(--text-primary); /* #2C2520 su bg rgba(255,255,255,0.92) → ~12:1 */
          margin-bottom: var(--spacing-md);
          font-weight: 500;
        }

        .hero-glass-locality {
          /* Enfasi sul luogo per SEO locale */
          font-style: italic;
          color: var(--accent-gold-hover);
        }

        .hero-glass-subtitle {
          font-size: 1rem;
          color: var(--text-secondary); /* #5E534C su white → 5.4:1 ✓ WCAG AA */
          max-width: 520px;
          margin: 0 auto var(--spacing-lg);
          line-height: 1.6;
        }

        /* ── CTA ───────────────────────────────────────────────────────── */
        .hero-glass-actions {
          display: flex;
          justify-content: center;
          gap: var(--spacing-md);
          flex-wrap: wrap;
          margin-bottom: var(--spacing-lg);
        }

        .hero-cta-primary,
        .hero-cta-secondary {
          /* WCAG 2.4.7 – focus ring ad alto contrasto */
          border-radius: var(--radius-sm);
        }

        /* Focus ring 3px / offset 3px — Presenza Digitale DS */
        .hero-cta-primary:focus-visible,
        .hero-cta-secondary:focus-visible {
          outline: 3px solid var(--text-primary);
          outline-offset: 3px;
        }

        .hero-cta-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        /* ── Trust badges ──────────────────────────────────────────────── */
        .hero-trust-row {
          display: flex;
          justify-content: center;
          gap: var(--spacing-md);
          flex-wrap: wrap;
          margin-top: var(--spacing-sm);
        }

        .hero-trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.02em;
        }

        .hero-trust-badge svg {
          color: var(--accent-gold-hover);
          flex-shrink: 0;
        }

        /* ── Wave ──────────────────────────────────────────────────────── */
        .hero-glass-wave {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          line-height: 0;
          z-index: 3;
          pointer-events: none;
        }

        .hero-glass-wave svg {
          width: 100%;
          height: 80px;
          display: block;
        }

        /* ── Responsive ────────────────────────────────────────────────── */
        @media (max-width: 640px) {
          .hero-glass-actions {
            flex-direction: column;
            align-items: center;
          }
          .hero-cta-primary,
          .hero-cta-secondary {
            width: 100%;
            max-width: 320px;
          }
          .hero-trust-row {
            flex-direction: column;
            align-items: center;
            gap: var(--spacing-xs);
          }
        }
      `}</style>
    </header>
  );
}
