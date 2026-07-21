import { useCookie } from '../context/CookieContext';

export default function Footer({ onLogoClick, onNavigateToAdmin }) {
  const { openCookieSettings } = useCookie();

  return (
    <footer className="store-footer">
      <div className="container footer-content">
        {/* Sinistra: Logo + Dati Aziendali formattati a capo */}
        <div className="footer-left-group">
          <button
            className="footer-logo-btn"
            onClick={onLogoClick}
            aria-label="Torna in cima alla pagina"
          >
            <img
              src="/logo-footer-2.png"
              alt="Segreta Style Logo"
              className="footer-logo-img"
            />
          </button>
          
          <div className="footer-company-block">
            <span className="footer-company-title">Segreta Style di Greta Righi</span>
            <span>Via Martiri della Libertà 67 — 29010 Monticelli d'Ongina (PC)</span>
            <span>Tel: <a href="tel:0523820276">0523 820276</a> &nbsp;•&nbsp; Email: <a href="mailto:info@segretastyle.it">info@segretastyle.it</a></span>
            <span>C.F. RGHGRT79R66D150Y &nbsp;•&nbsp; P.IVA 01563960333</span>
          </div>
        </div>

        {/* Destra: Social + Link Legali/Privacy + Copyright */}
        <div className="footer-right-group">
          <div className="footer-social-links">
            <a href="https://www.facebook.com/SegretaAbbigliamento" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-footer-icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://www.instagram.com/segreta_style/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-footer-icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="https://whatsapp.com/channel/0029Vazn2RAHQbS0KG6T4x3P" target="_blank" rel="noopener noreferrer" aria-label="Canale WhatsApp" className="social-footer-icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C6.5 2 2 6.5 2 12c0 2.2.7 4.2 2 5.9L2.6 23l5.3-1.4c1.6 1 3.6 1.6 5.6 1.6 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
                <path d="M16.5 13.9c-.3-.2-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.2l-.9 1.1c-.2.2-.4.2-.7.1-1-.4-1.8-1.2-2.2-2.2 0-.3.1-.5.2-.7l1.1-.9c.3-.2.3-.4.2-.7-.1-.3-.7-1.6-.9-1.9-.2-.3-.4-.3-.7-.3h-.6c-.2 0-.5.1-.7.3-1 1-1 2.5 0 3.8 2.5 3.3 4.5 4.3 6.3 4.7.6.1 1.2 0 1.6-.4.9-.9.9-.9 1.1-1.1.2-.2.2-.4 0-.6z" />
              </svg>
            </a>
          </div>

          <div className="footer-links-row">
            <a href="https://www.iubenda.com/privacy-policy/68426130" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <a href="https://www.iubenda.com/privacy-policy/68426130/cookie-policy" target="_blank" rel="noopener noreferrer">Cookie Policy</a>
            <button className="footer-cookie-btn" onClick={openCookieSettings}>Preferenze Privacy</button>
          </div>

          <div className="footer-copyright-row">
            <span>© 2026 Segreta Style — <a href="https://presenzadigitale.com" target="_blank" rel="noopener noreferrer">Presenzadigitale.com</a></span>
            <button 
              onClick={onNavigateToAdmin} 
              className="footer-lock-btn"
              aria-label="Area riservata gestione catalogo"
              title="Area Riservata"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
