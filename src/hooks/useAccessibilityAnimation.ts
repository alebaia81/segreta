/**
 * useAccessibilityAnimation.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook che restituisce varianti di animazione Framer Motion (motion/react)
 * rispettando la preferenza `prefers-reduced-motion` dell'utente (WCAG 2.3.3).
 *
 * Se `useReducedMotion()` è `true`:
 *   – Tutti gli spostamenti su X/Y sono azzerati.
 *   – Rimane solo una dissolvenza opacity 0 → 1 ("safe animation").
 *
 * Se `useReducedMotion()` è `false` (default):
 *   – Vengono usate le varianti complete (fade + translate).
 *
 * Utilizzo:
 *   const { fadeUp, fadeIn, slideLeft } = useAccessibilityAnimation();
 *   <motion.div variants={fadeUp} initial="hidden" animate="visible" />
 */

import { useReducedMotion } from 'motion/react';
import type { Variants, Easing, Transition } from 'motion/react';

// ─── Tipi pubblici ────────────────────────────────────────────────────────────

/** Durations in seconds */
export interface AnimationConfig {
  /** Durata base della transizione (default 0.5s) */
  duration?: number;
  /** Ritardo prima dell'avvio (default 0s) */
  delay?: number;
  /** Easing Framer Motion (default spring-like out) */
  ease?: Easing | Easing[];
}

export interface AccessibilityAnimationVariants {
  /** Fade + translateY verso l'alto — ideale per sezioni, card, panel */
  fadeUp: Variants;
  /** Fade + translateY verso il basso — ideale per tooltip, dropdown */
  fadeDown: Variants;
  /** Fade + translateX da sinistra — ideale per hero text, slide-in */
  slideLeft: Variants;
  /** Fade + translateX da destra — ideale per immagini, pannelli laterali */
  slideRight: Variants;
  /** Solo opacity — usato anche come fallback reduced-motion */
  fadeIn: Variants;
  /** Scala da 0.95 → 1 con fade — ideale per modal, card popup */
  scaleIn: Variants;
  /** Stagger container — usato per liste di card/item */
  staggerContainer: Variants;
}

// ─── Helper interno ───────────────────────────────────────────────────────────

/** Crea una transizione con durata e delay configurabili */
const makeTransition = (
  duration: number,
  delay: number,
  ease: Easing | Easing[]
): Transition => ({ duration, delay, ease });

// ─── Hook principale ──────────────────────────────────────────────────────────

/**
 * @param config  Configurazione opzionale per durata, delay ed easing.
 * @returns       Oggetto con tutte le varianti Framer Motion WCAG-safe.
 */
export function useAccessibilityAnimation(
  config: AnimationConfig = {}
): AccessibilityAnimationVariants {
  const reducedMotion = useReducedMotion();

  const {
    duration = 0.5,
    delay = 0,
    ease = [0.16, 1, 0.3, 1] as unknown as Easing[],
  } = config;

  const transition = makeTransition(
    reducedMotion ? Math.min(duration, 0.25) : duration,
    delay,
    ease
  );

  // ── Variante safe: solo opacity (usata quando reducedMotion è true) ─────────
  const safeHidden = { opacity: 0 } as const;
  const safeVisible = { opacity: 1, transition } as const;

  // ── fadeUp ──────────────────────────────────────────────────────────────────
  const fadeUp: Variants = {
    hidden: reducedMotion ? safeHidden : { opacity: 0, y: 24 },
    visible: reducedMotion ? safeVisible : { opacity: 1, y: 0, transition },
  };

  // ── fadeDown ────────────────────────────────────────────────────────────────
  const fadeDown: Variants = {
    hidden: reducedMotion ? safeHidden : { opacity: 0, y: -24 },
    visible: reducedMotion ? safeVisible : { opacity: 1, y: 0, transition },
  };

  // ── slideLeft (entra da sinistra) ───────────────────────────────────────────
  const slideLeft: Variants = {
    hidden: reducedMotion ? safeHidden : { opacity: 0, x: -40 },
    visible: reducedMotion ? safeVisible : { opacity: 1, x: 0, transition },
  };

  // ── slideRight (entra da destra) ────────────────────────────────────────────
  const slideRight: Variants = {
    hidden: reducedMotion ? safeHidden : { opacity: 0, x: 40 },
    visible: reducedMotion ? safeVisible : { opacity: 1, x: 0, transition },
  };

  // ── fadeIn (puro) ───────────────────────────────────────────────────────────
  const fadeIn: Variants = {
    hidden: safeHidden,
    visible: safeVisible,
  };

  // ── scaleIn ─────────────────────────────────────────────────────────────────
  const scaleIn: Variants = {
    hidden: reducedMotion ? safeHidden : { opacity: 0, scale: 0.95 },
    visible: reducedMotion
      ? safeVisible
      : { opacity: 1, scale: 1, transition },
  };

  // ── staggerContainer ────────────────────────────────────────────────────────
  // Il container orchestra lo stagger dei figli.
  // Con reduced-motion lo stagger è azzerato (delayChildren: 0, staggerChildren: 0).
  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: reducedMotion ? 0 : delay,
        staggerChildren: reducedMotion ? 0 : 0.08,
      },
    },
  };

  return {
    fadeUp,
    fadeDown,
    slideLeft,
    slideRight,
    fadeIn,
    scaleIn,
    staggerContainer,
  };
}

// ─── Export named per compatibilità con import default pattern ────────────────
export default useAccessibilityAnimation;
