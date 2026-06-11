import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CookieContext = createContext(null);

const STORAGE_KEY = 'segreta_cookie_consent';
const CONSENT_DURATION_MS = 6 * 30 * 24 * 60 * 60 * 1000; // 6 mesi

const defaultPreferences = {
  necessari: true,     // sempre attivo
  funzionalita: false,
  esperienza: false,
  misurazione: false,
};

export function CookieProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);

  // Controlla al mount se il consenso è già salvato e non scaduto
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isExpired = Date.now() > parsed.expiresAt;
        if (!isExpired) {
          setPreferences(parsed.preferences);
          return; // Non mostrare il banner
        }
      }
    } catch (_) {
      // localStorage non accessibile — ignora
    }
    // Nessun consenso valido: mostra il banner
    setIsOpen(true);
  }, []);

  const savePreferences = useCallback((prefs) => {
    const payload = {
      preferences: { ...prefs, necessari: true },
      savedAt: Date.now(),
      expiresAt: Date.now() + CONSENT_DURATION_MS,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {}
    setPreferences(payload.preferences);
    setIsOpen(false);
  }, []);

  const openCookieSettings = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <CookieContext.Provider value={{ isOpen, setIsOpen, preferences, savePreferences, openCookieSettings }}>
      {children}
    </CookieContext.Provider>
  );
}

export function useCookie() {
  const ctx = useContext(CookieContext);
  if (!ctx) throw new Error('useCookie deve essere usato dentro <CookieProvider>');
  return ctx;
}
