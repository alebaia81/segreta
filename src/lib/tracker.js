// Helper per tracciamento visite 100% anonimo e GDPR-compliant
const SESSION_KEY = 'segreta_sess_id';
const RECENT_VISITS_KEY = 'segreta_recent_visits';

export function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = 's_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 's_fallback_' + Math.random().toString(36).substring(2, 9);
  }
}

/**
 * Registra una visita anonima alla pagina o alla scheda prodotto
 * @param {string} pagina - Percorso della pagina (es. '/' o '/shop' o '/prodotto/12')
 * @param {number|string|null} articoloId - ID articolo se scheda prodotto
 */
export async function trackPageView(pagina, articoloId = null) {
  try {
    // 1. Non tracciare se chi naviga è Greta / Admin loggata
    if (typeof window !== 'undefined' && sessionStorage.getItem('segreta_admin_logged') === 'true') {
      return;
    }

    // 2. Non tracciare percorsi admin interni o non rilevanti
    if (pagina.startsWith('/admin')) {
      return;
    }

    const sessionId = getSessionId();
    const cleanArticoloId = articoloId ? Number(articoloId) : null;
    const trackingKey = `${pagina}_${cleanArticoloId || 'none'}`;

    // 3. Deduplicazione locale: evita chiamate ripetute per la stessa pagina entro 10 minuti
    const now = Date.now();
    let recentVisits = {};
    try {
      recentVisits = JSON.parse(sessionStorage.getItem(RECENT_VISITS_KEY) || '{}');
    } catch {
      recentVisits = {};
    }

    if (recentVisits[trackingKey] && (now - recentVisits[trackingKey]) < 10 * 60 * 1000) {
      return; // Già conteggiata in questa sessione poco fa
    }

    recentVisits[trackingKey] = now;
    try {
      sessionStorage.setItem(RECENT_VISITS_KEY, JSON.stringify(recentVisits));
    } catch {
      // Ignora quote storage
    }

    // 4. Invio asincrono non bloccante
    const payload = JSON.stringify({
      pagina,
      articolo_id: cleanArticoloId,
      sessione_id: sessionId
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/visite', blob);
    } else {
      fetch('/api/visite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  } catch {
    // Failsafe silenzioso
  }
}
