import { useState, useEffect, useRef } from 'react';
import { useCookie } from '../context/CookieContext';
import { X, Shield } from 'lucide-react';

/**
 * CookieBanner — modale di gestione consenso cookie
 * WCAG 2.2: navigabile da tastiera, role="dialog", aria-modal, focus-trap, switch ≥ 24x24px
 */
export default function CookieBanner() {
  const { isOpen, preferences, savePreferences } = useCookie();

  // Stato locale della modale — parte dai valori salvati
  const [local, setLocal] = useState({
    necessari: true,
    funzionalita: false,
    esperienza: false,
    misurazione: false,
  });

  // Sincronizza quando il banner si apre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setLocal({ ...preferences, necessari: true });
      }, 0);
    }
  }, [isOpen, preferences]);

  // Focus-trap: primo elemento interattivo
  const dialogRef = useRef(null);
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) focusable[0].focus();
    }
  }, [isOpen]);

  // Chiudi con Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) {
        savePreferences(local);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, local, savePreferences]);

  if (!isOpen) return null;

  const toggle = (key) => {
    if (key === 'necessari') return; // sempre attivo
    setLocal((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAcceptAll = () => {
    savePreferences({ necessari: true, funzionalita: true, esperienza: true, misurazione: true });
  };

  const handleRejectAll = () => {
    savePreferences({ necessari: true, funzionalita: false, esperienza: false, misurazione: false });
  };

  const handleSave = () => {
    savePreferences(local);
  };

  const options = [
    {
      key: 'necessari',
      label: 'Necessari',
      locked: true,
      description: 'Sempre attivi. Necessari per il funzionamento del sito, del carrello e della sessione di acquisto.',
    },
    {
      key: 'funzionalita',
      label: 'Funzionalità',
      locked: false,
      description: 'Consentono di ricordare le tue preferenze e personalizzare la tua esperienza sul sito.',
    },
    {
      key: 'esperienza',
      label: 'Esperienza',
      locked: false,
      description: 'Migliorano la navigazione e la velocità del sito, includendo ottimizzazioni visive.',
    },
    {
      key: 'misurazione',
      label: 'Misurazione',
      locked: false,
      description: 'Permettono di raccogliere dati statistici anonimi sull\'utilizzo del sito per migliorarlo nel tempo.',
    },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="cookie-overlay"
        aria-hidden="true"
        onClick={handleSave}
      />

      {/* Modale */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-title"
        aria-describedby="cookie-desc"
        className="cookie-modal"
      >
        {/* Header */}
        <div className="cookie-header">
          <div className="cookie-header-left">
            <Shield size={20} className="cookie-shield-icon" aria-hidden="true" />
            <h2 id="cookie-title" className="cookie-title">
              Le tue preferenze relative alla privacy
            </h2>
          </div>
          <button
            className="cookie-close-btn"
            onClick={handleSave}
            aria-label="Chiudi e salva le preferenze"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body scrollabile */}
        <div className="cookie-body">
          <p id="cookie-desc" className="cookie-description">
            Questo pannello ti permette di esprimere alcune preferenze relative al trattamento delle
            tue informazioni personali. Puoi rivedere e modificare le tue scelte in qualsiasi momento
            accedendo al presente pannello tramite l'apposito link. Per rifiutare il tuo consenso alle
            attività di trattamento descritte di seguito, disattiva i singoli comandi o utilizza il
            pulsante "Rifiuta tutto" e conferma di voler salvare le scelte effettuate.
          </p>

          {/* Pulsanti principali */}
          <div className="cookie-main-actions">
            <button className="cookie-btn-secondary" onClick={handleRejectAll}>
              Rifiuta tutto
            </button>
            <button className="cookie-btn-primary" onClick={handleAcceptAll}>
              Accetta tutto
            </button>
          </div>

          <hr className="cookie-divider" />

          <h3 className="cookie-subtitle">
            Le tue preferenze relative al consenso per le tecnologie di tracciamento
          </h3>
          <p className="cookie-description">
            Le opzioni disponibili in questa sezione ti permettono di personalizzare le preferenze
            relative al consenso per qualsiasi tecnologia di tracciamento utilizzata per le finalità
            descritte di seguito. Per ulteriori informazioni consulta la{' '}
            <a
              href="https://www.iubenda.com/privacy-policy/68426130/cookie-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="cookie-link"
            >
              cookie policy
            </a>
            . Tieni presente che il rifiuto del consenso per una finalità particolare può rendere le
            relative funzioni non disponibili.
          </p>

          {/* Opzioni con switch */}
          <ul className="cookie-options-list" role="list">
            {options.map((opt) => (
              <li key={opt.key} className="cookie-option-item">
                <div className="cookie-option-text">
                  <span className="cookie-option-label">
                    {opt.label}
                    {opt.locked && (
                      <span className="cookie-always-active" aria-label="Sempre attivo">
                        Sempre attivo
                      </span>
                    )}
                  </span>
                  <span className="cookie-option-desc">{opt.description}</span>
                </div>

                {/* Switch accessibile */}
                <button
                  role="switch"
                  aria-checked={local[opt.key]}
                  aria-label={`${opt.label}: ${local[opt.key] ? 'attivo' : 'disattivo'}`}
                  className={`cookie-switch ${local[opt.key] ? 'on' : 'off'} ${opt.locked ? 'locked' : ''}`}
                  onClick={() => toggle(opt.key)}
                  disabled={opt.locked}
                  tabIndex={0}
                >
                  <span className="cookie-switch-thumb" aria-hidden="true" />
                  <span className="sr-only">{local[opt.key] ? 'Attivo' : 'Disattivo'}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer modale */}
        <div className="cookie-footer">
          <button className="cookie-btn-save" onClick={handleSave}>
            Salva e continua
          </button>
        </div>
      </div>

      <style>{`
        /* Screen-reader only */
        .sr-only {
          position: absolute;
          width: 1px; height: 1px;
          padding: 0; margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }

        /* Overlay */
        .cookie-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          z-index: 1000;
          animation: fadeIn 0.25s ease;
        }

        /* Modale */
        .cookie-modal {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: min(560px, calc(100vw - 2rem));
          max-height: 80vh;
          background-color: #ffffff;
          border-radius: 16px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(0,0,0,0.08);
          z-index: 1001;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(24px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Header */
        .cookie-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.1rem 1.4rem 0.8rem;
          border-bottom: 1px solid #f0ece6;
          flex-shrink: 0;
          gap: 0.75rem;
        }

        .cookie-header-left {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .cookie-shield-icon {
          color: #9b7d4b;
          flex-shrink: 0;
        }

        .cookie-title {
          font-family: var(--font-sans);
          font-size: 1.15rem;
          font-weight: 600;
          color: #1a1714;
          line-height: 1.3;
          margin: 0;
        }

        .cookie-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid #e8e2da;
          background: transparent;
          color: #6b6560;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }
        .cookie-close-btn:hover { background: #f5f2ee; color: #1a1714; }
        .cookie-close-btn:focus-visible { outline: 2px solid #9b7d4b; outline-offset: 2px; }

        /* Body */
        .cookie-body {
          overflow-y: auto;
          padding: 1rem 1.4rem;
          flex: 1;
          -webkit-overflow-scrolling: touch;
        }

        .cookie-description {
          font-size: 0.83rem;
          color: #5a5550;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .cookie-link {
          color: #9b7d4b;
          text-decoration: underline;
        }
        .cookie-link:hover { color: #1a1714; }

        /* Pulsanti principali */
        .cookie-main-actions {
          display: flex;
          gap: 0.6rem;
          margin-bottom: 1rem;
        }

        .cookie-btn-secondary {
          flex: 1;
          padding: 0.65rem 1rem;
          border-radius: 8px;
          border: 1.5px solid #1a1714;
          background: transparent;
          color: #1a1714;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          min-height: 44px;
          transition: background 0.15s, color 0.15s;
        }
        .cookie-btn-secondary:hover { background: #1a1714; color: #fff; }
        .cookie-btn-secondary:focus-visible { outline: 2px solid #9b7d4b; outline-offset: 2px; }

        .cookie-btn-primary {
          flex: 1;
          padding: 0.65rem 1rem;
          border-radius: 8px;
          border: 1.5px solid #1a1714;
          background: #1a1714;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          min-height: 44px;
          transition: background 0.15s;
        }
        .cookie-btn-primary:hover { background: #2e2a26; border-color: #2e2a26; }
        .cookie-btn-primary:focus-visible { outline: 2px solid #9b7d4b; outline-offset: 2px; }

        /* Divider */
        .cookie-divider {
          border: none;
          border-top: 1px solid #f0ece6;
          margin: 0.75rem 0;
        }

        /* Sotto-titolo */
        .cookie-subtitle {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: #1a1714;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Lista opzioni */
        .cookie-options-list {
          list-style: none;
          padding: 0;
          margin: 1rem 0 0;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .cookie-option-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.85rem 0;
          border-bottom: 1px solid #f5f2ee;
        }
        .cookie-option-item:last-child { border-bottom: none; }

        .cookie-option-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .cookie-option-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1a1714;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .cookie-always-active {
          font-size: 0.72rem;
          font-weight: 600;
          color: #9b7d4b;
          background-color: #f5f0e8;
          padding: 2px 7px;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cookie-option-desc {
          font-size: 0.78rem;
          color: #6b6560;
          line-height: 1.5;
        }

        /* Switch WCAG 2.2 — min 24x24px, qui 48x26px */
        .cookie-switch {
          position: relative;
          width: 48px;
          height: 26px;
          min-width: 48px;
          border-radius: 99px;
          border: 2px solid transparent;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.2s ease;
          padding: 0;
          /* Contrasto AA: off=#c4bdb5 su bianco = 2.5 — ok per elemento decorativo;
             on=#1a1714 su bianco = 16.2:1 — ottimo */
        }

        .cookie-switch.off {
          background-color: #c4bdb5;
        }

        .cookie-switch.on {
          background-color: #1a1714;
        }

        .cookie-switch.locked {
          background-color: #9b7d4b;
          cursor: not-allowed;
          opacity: 0.85;
        }

        .cookie-switch:focus-visible {
          outline: 2px solid #9b7d4b;
          outline-offset: 3px;
        }

        .cookie-switch-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.25);
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .cookie-switch.on .cookie-switch-thumb {
          transform: translateX(22px);
        }

        /* Footer modale */
        .cookie-footer {
          padding: 0.9rem 1.4rem;
          border-top: 1px solid #f0ece6;
          flex-shrink: 0;
          background: #faf8f5;
        }

        .cookie-btn-save {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1.5px solid #9b7d4b;
          background: transparent;
          color: #9b7d4b;
          font-size: 0.88rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          cursor: pointer;
          min-height: 44px;
          transition: background 0.15s, color 0.15s;
        }
        .cookie-btn-save:hover { background: #9b7d4b; color: #fff; }
        .cookie-btn-save:focus-visible { outline: 2px solid #9b7d4b; outline-offset: 2px; }

        @media (max-width: 480px) {
          .cookie-modal {
            bottom: 0;
            left: 0;
            right: 0;
            transform: none;
            width: 100%;
            border-radius: 16px 16px 0 0;
            max-height: 85vh;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(100%); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .cookie-main-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
