/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';

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
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isExpired = Date.now() > parsed.expiresAt;
        if (!isExpired) {
          return parsed.preferences;
        }
      }
    } catch {
      // ignore
    }
    return defaultPreferences;
  });

  const [isOpen, setIsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isExpired = Date.now() > parsed.expiresAt;
        if (!isExpired) {
          return false;
        }
      }
    } catch {
      // ignore
    }
    return true;
  });

  const savePreferences = useCallback((prefs) => {
    const payload = {
      preferences: { ...prefs, necessari: true },
      savedAt: Date.now(),
      expiresAt: Date.now() + CONSENT_DURATION_MS,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
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
