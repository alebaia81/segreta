import React, { useEffect } from 'react';
import { MapPin, Phone, Clock, ShieldCheck, Heart, Sparkles, Mail, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCookie } from '../context/CookieContext';


export default function Home({ articoli, onNavigateToShop }) {
  const { openCookieSettings } = useCookie();

  // --- Meta tag SEO specifici per Home (Brand + Local) ---
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Segreta Style | Abbigliamento Donna a Monticelli d'Ongina — Boutique di Greta Righi";
    return () => { document.title = prevTitle; };
  }, []);

  // Ultimi 8 articoli attivi (ordinati per id decrescente come proxy per data)
  const ultimiArrivi = articoli
    .filter(a => a.attivo)
    .slice(0, 8);
  return (
    <div className="home-page fade-in">
      {/* Hero Section */}
      <header id="home" className="hero-section">
        <div className="hero-content container">
          <span className="badge hero-badge">Boutique & Shopping Online</span>
          <h1>Moda unica, frizzante e ricca di personalità nel cuore di <br />Monticelli d’Ongina.</h1>
          <div className="hero-actions">
            <a href="#catalogo" className="btn-primary">Acquista la Collezione</a>
            <a href="#chi-sono" className="btn-secondary">Scopri la Nostra Storia</a>
          </div>
        </div>
        <div className="hero-wave"></div>
      </header>

      {/* Features Bar */}
      <section className="features-bar container">
        <div className="feature-item">
          <Sparkles className="feature-icon" size={24} />
          <div>
            <h4>Brand Selezionati</h4>
            <p>Qualità e tendenze del momento scelti con cura.</p>
          </div>
        </div>
        <div className="feature-item">
          <Heart className="feature-icon" size={24} />
          <div>
            <h4>Stile Frizzante</h4>
            <p>Capi divertenti per far vincere la tua personalità.</p>
          </div>
        </div>
        <div className="feature-item">
          <ShieldCheck className="feature-icon" size={24} />
          <div>
            <h4>Shopping Semplice</h4>
            <p>Ordina online e ritira in negozio o ricevi a casa.</p>
          </div>
        </div>
      </section>

      {/* Ultimi Arrivi Section */}
      <section className="ultimi-arrivi-section container">
        <div className="section-header-centered">
          <span className="badge">Novità</span>
          <h2>Ultimi Arrivi</h2>
          <div className="accent-line"></div>
          <p className="section-subtitle">
            I capi più freschi appena entrati in boutique. Aggiornati in tempo reale dal nostro catalogo.
          </p>
        </div>

        {ultimiArrivi.length === 0 ? (
          <div className="arrivi-empty">
            <p>Nessun prodotto disponibile al momento. Torna presto!</p>
          </div>
        ) : (
          <div className="arrivi-grid">
            {ultimiArrivi.map(articolo => (
              <article key={articolo.id} className="arrivo-card" onClick={onNavigateToShop} style={{ cursor: 'pointer' }}>
                <div className="arrivo-img-wrapper">
                  <img
                    src={
                      articolo.immagine_url.startsWith('http') || articolo.immagine_url.startsWith('blob:')
                        ? articolo.immagine_url
                        : `/public/${articolo.immagine_url}`
                    }
                    alt={articolo.titolo}
                    className="arrivo-img"
                    onError={e => {
                      e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  {articolo.categoria && (
                    <span className="arrivo-category-tag">{articolo.categoria}</span>
                  )}
                </div>
                <div className="arrivo-info">
                  <h3 className="arrivo-title">{articolo.titolo}</h3>
                  <span className="arrivo-price">€{parseFloat(articolo.prezzo).toFixed(2)}</span>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* CTA verso lo Shop */}
        <div className="arrivi-cta-wrapper">
          <p className="arrivi-cta-label">Sfoglia il catalogo completo con filtri per categoria</p>
          <button className="btn-primary arrivi-cta-btn" onClick={onNavigateToShop}>
            <ShoppingBag size={18} style={{ marginRight: '8px' }} />
            Vai allo Shop
            <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      </section>

      {/* Chi Sono Section - Storia di Greta Righi */}
      <section id="chi-sono" className="about-section">
        <div className="container about-grid">
          <div className="about-image-column">
            <div className="about-image-frame">
              <img
                src="/greta.jpg"
                alt="Greta Righi - Titolare di Segreta Style"
                className="about-image"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>
            <div className="about-image-accent"></div>
          </div>
          
          <div className="about-text-column">
            <span className="badge">Chi Sono</span>
            <h2>Mi chiamo Greta Righi</h2>
            <div className="accent-line-left"></div>
            
            <p className="about-paragraph highlight-paragraph">
              <strong>Segreta Style</strong> nasce con una mission precisa: offrire prodotti di moda adatti a chi ama giocare con lo stile attraverso brand accessibili e divertenti.
            </p>
            
            <p className="about-paragraph">
              Il <strong>6 febbraio 2010</strong> inauguro il mio negozio a <strong>Monticelli d’Ongina (PC)</strong>, a pochi km da Piacenza e da Cremona, sotto i portici del centro storico del paese, in una zona di forte passaggio anche turistico.
            </p>

            <p className="about-paragraph">
              Nel mio negozio trovi un po’ di me: marche frizzanti, pensate per un pubblico giovane ma anche più serie per chi non ha più vent’anni ma ama ancora far vincere la propria personalità. Gli stili si possono mischiare per creare ciò che vuoi essere senza filtri e senza finzioni.
            </p>

            <p className="about-paragraph">
              Adesso puoi venire a trovarmi nel mio punto vendita o iniziare il tuo shopping online cercando tra i tanti prodotti che ho accuratamente selezionato per te. Tendenze del momento e qualità sono stati i due aspetti a cui ho dato più importanza. Fare shopping è ancora più semplice, divertente e veloce.
            </p>
          </div>
        </div>
      </section>

      {/* Contact & Map Section (Local SEO info) */}
      <section className="contact-info-section container">
        <div className="contact-card">
          <div className="contact-info-column">
            <h3>Vieni a Trovarci</h3>
            <div className="accent-line-left"></div>
            <p>Siamo nel centro storico di Monticelli d'Ongina, sotto i caratteristici portici. Facilmente raggiungibili sia da Piacenza che da Cremona.</p>
            
            <ul className="contact-details-list">
              <li>
                <MapPin className="contact-icon" size={20} />
                <a
                  href="https://www.google.com/maps/place/Segreta+di+Greta+Righi/@45.089282,9.9312513,17z/data=!3m1!4b1!4m6!3m5!1s0x4780fb63157185a7:0x9b6ed9073d0eefb9!8m2!3d45.089282!4d9.9312513!16s%2Fg%2F1tq8hdmx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-map-link"
                  style={{ textDecoration: 'underline', color: 'var(--text-secondary)' }}
                >
                  Via Martiri della Libertà 67, 29010 Monticelli d'Ongina (PC)
                </a>
              </li>
              <li>
                <Phone className="contact-icon" size={20} />
                <span>
                  Tel: <a href="tel:0523820276" style={{ color: 'var(--text-secondary)' }}>0523 820276</a> / Cell: <a href="tel:3482946532" style={{ color: 'var(--text-secondary)' }}>348 2946532</a>
                </span>
              </li>
              <li>
                <Mail className="contact-icon" size={20} />
                <span>
                  Email: <a href="mailto:info@segretastyle.it" style={{ color: 'var(--text-secondary)' }}>info@segretastyle.it</a>
                </span>
              </li>
              <li>
                <Clock className="contact-icon" size={20} />
                <div>
                  <strong>Orari di Apertura:</strong><br />
                  Lunedì, Martedì, Mercoledì, Venerdì, Sabato:<br />
                  09:00 - 12:30 | 16:00 - 19:00<br />
                  Giovedì: <strong>Chiuso</strong><br />
                  Domenica: 09:00 - 12:15
                </div>
              </li>
            </ul>
          </div>

          <div className="contact-map-column">
            <div className="map-placeholder">
              <iframe
                title="Mappa di Segreta Style a Monticelli d'Ongina"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2812.247240375965!2d9.9286764!3d45.089282!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4780fb63157185a7%3A0x9b6ed9073d0eefb9!2sSegreta+di+Greta+Righi!5e0!3m2!1sit!2sit"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: 'var(--radius-md)' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="store-footer">
        <div className="container footer-content">
          {/* Sinistra: logo + social */}
          <div className="footer-left">
            <button
              className="footer-logo-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Torna in cima alla pagina"
            >
              <img
                src="/logo.png"
                alt="Segreta Style Logo"
                className="footer-logo-img"
              />
            </button>
            <span className="footer-subtitle">di Greta Righi</span>
            <div className="footer-social-links">
              <a href="https://www.facebook.com/SegretaAbbigliamento" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-footer-icon-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://www.instagram.com/segreta_style/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-footer-icon-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
            </div>
          </div>

          {/* Destra: policy + copyright */}
          <div className="footer-right">
            <div className="footer-links">
              <a href="https://www.iubenda.com/privacy-policy/68426130" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              <a href="https://www.iubenda.com/privacy-policy/68426130/cookie-policy" target="_blank" rel="noopener noreferrer">Cookie Policy</a>
              <button className="footer-cookie-btn" onClick={openCookieSettings}>Gestisci preferenze Privacy</button>
            </div>
            <p className="footer-copyright">
              © 2026 Segreta Style — <a href="https://presenzadigitale.com" target="_blank" rel="noopener noreferrer">Presenzadigitale.com</a>
            </p>
            <p className="footer-copyright">C.F. RGHGRT79R66D150Y — P.IVA 01563960333</p>
          </div>
        </div>
      </footer>

      <style>{`
        /* Hero Section Styling */
        .hero-section {
          background: linear-gradient(180deg, rgba(250, 248, 245, 0.45) 0%, rgba(250, 248, 245, 0.85) 100%), url('/boutique_bg.png') no-repeat center center;
          background-size: cover;
          padding: var(--spacing-xxl) 0;
          text-align: center;
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid var(--border-color);
          min-height: 70vh;
          display: flex;
          align-items: center;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 700px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: var(--spacing-xl) var(--spacing-lg);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: var(--shadow-glass);
        }

        .hero-badge {
          margin-bottom: var(--spacing-md);
        }

        .hero-section h1 {
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          line-height: 1.3;
          margin-bottom: var(--spacing-lg);
          font-weight: 400;
        }

        .hero-actions {
          display: flex;
          justify-content: center;
          gap: var(--spacing-md);
        }

        .hero-actions .btn-secondary {
          background-color: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(4px);
        }

        /* Features Bar */
        .features-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--spacing-lg);
          margin: -2rem auto var(--spacing-xxl);
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-md);
          position: relative;
          z-index: 5;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-md);
        }

        .feature-icon {
          color: var(--accent-gold);
          flex-shrink: 0;
        }

        .feature-item h4 {
          font-family: var(--font-sans);
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }

        .feature-item p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 0;
        }

        /* About Section (Chi Sono) */
        .about-section {
          background-color: var(--bg-tertiary);
          padding: var(--spacing-xxl) 0;
          margin-bottom: var(--spacing-xxl);
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
        }

        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: var(--spacing-xl);
          align-items: center;
        }

        .about-image-column {
          position: relative;
        }

        .about-image-frame {
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-lg);
          border: 8px solid var(--bg-secondary);
          aspect-ratio: 4/5;
          position: relative;
          z-index: 2;
        }

        .about-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .about-image-accent {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 20px;
          left: -20px;
          border: 2px solid var(--accent-gold);
          border-radius: var(--radius-lg);
          z-index: 1;
        }

        .about-text-column h2 {
          font-size: 2.2rem;
          margin-top: var(--spacing-xs);
        }

        .about-paragraph {
          font-size: 0.98rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-md);
        }

        .highlight-paragraph {
          font-size: 1.15rem;
          color: var(--text-primary);
          font-family: var(--font-serif);
          font-style: italic;
          border-left: 3px solid var(--accent-gold);
          padding-left: var(--spacing-md);
        }

        /* Contact & Map Section */
        .contact-info-section {
          margin-bottom: var(--spacing-xxl);
        }

        .contact-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          padding: var(--spacing-xl);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-xl);
        }

        .contact-info-column h3 {
          font-size: 1.8rem;
        }

        .contact-details-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
        }

        .contact-details-list li {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-md);
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        .contact-icon {
          color: var(--accent-gold);
          flex-shrink: 0;
          margin-top: 3px;
        }

        .contact-map-column {
          height: 300px;
        }

        .map-placeholder {
          width: 100%;
          height: 100%;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-color);
        }

        /* Footer */
        .store-footer {
          background-color: var(--text-primary);
          color: var(--bg-primary);
          padding: var(--spacing-md) 0;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .footer-left {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }

        .footer-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .footer-logo-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: block;
          margin-bottom: var(--spacing-xs);
          opacity: 0.9;
          transition: opacity 0.2s ease;
        }

        .footer-logo-btn:hover {
          opacity: 1;
        }

        .footer-logo-img {
          max-height: 52px;
          object-fit: contain;
          display: block;
          filter: brightness(0) invert(1);
        }

        .footer-subtitle {
          font-family: var(--font-sans);
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--accent-gold);
          display: block;
          margin-bottom: var(--spacing-sm);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .footer-info {
          font-size: 0.8rem;
          color: var(--border-color);
          opacity: 0.8;
          line-height: 1.6;
          margin-bottom: var(--spacing-sm);
        }

        .footer-info a {
          color: inherit;
          text-decoration: underline;
        }

        .footer-copyright {
          font-size: 0.75rem;
          color: var(--border-color);
          opacity: 0.6;
          margin-top: var(--spacing-sm);
        }

        .footer-copyright a {
          color: inherit;
          text-decoration: underline;
        }

        .footer-links {
          display: flex;
          gap: var(--spacing-md);
          font-size: 0.85rem;
          color: var(--border-color);
          align-items: center;
          flex-wrap: wrap;
        }

        .footer-links a {
          color: var(--border-color);
          opacity: 0.8;
        }

        .footer-links a:hover {
          opacity: 1;
          color: var(--accent-gold);
        }

        .footer-cookie-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          color: var(--border-color);
          opacity: 0.8;
          font-size: 0.85rem;
          text-decoration: underline;
          text-underline-offset: 2px;
          font-family: inherit;
        }

        .footer-cookie-btn:hover {
          opacity: 1;
          color: var(--accent-gold);
        }

        .social-footer-icon-btn {
          color: var(--border-color);
          opacity: 0.8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          transition: var(--transition-fast);
        }

        .social-footer-icon-btn:hover {
          opacity: 1;
          color: var(--accent-gold);
          background-color: rgba(255, 255, 255, 0.05);
        }

        /* Ultimi Arrivi Section */
        .ultimi-arrivi-section {
          padding: var(--spacing-xxl) var(--spacing-lg);
        }

        .section-header-centered {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }

        .section-header-centered h2 {
          font-size: 2.2rem;
          margin-top: var(--spacing-xs);
          color: var(--text-primary);
        }

        .section-subtitle {
          max-width: 540px;
          margin: 0 auto;
          color: var(--text-secondary);
          font-size: 0.98rem;
        }

        .accent-line {
          width: 60px;
          height: 2px;
          background-color: var(--accent-gold);
          margin: var(--spacing-sm) auto var(--spacing-md);
        }

        .arrivi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }

        .arrivo-card {
          background-color: var(--bg-primary);
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          transition: var(--transition-smooth);
        }

        .arrivo-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-md);
          border-color: var(--accent-gold);
        }

        .arrivo-img-wrapper {
          position: relative;
          width: 100%;
          padding-top: 120%;
          background-color: var(--bg-tertiary);
          overflow: hidden;
        }

        .arrivo-img {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          transition: var(--transition-smooth);
        }

        .arrivo-card:hover .arrivo-img { transform: scale(1.04); }

        .arrivo-category-tag {
          position: absolute;
          top: var(--spacing-sm); left: var(--spacing-sm);
          background-color: rgba(255,255,255,0.9);
          backdrop-filter: blur(4px);
          padding: 0.2rem 0.6rem;
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .arrivo-info {
          padding: var(--spacing-md);
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: var(--spacing-sm);
        }

        .arrivo-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
          flex: 1;
        }

        .arrivo-price {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: var(--font-serif);
          white-space: nowrap;
        }

        .arrivi-empty {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xl);
        }

        /* CTA Wrapper */
        .arrivi-cta-wrapper {
          text-align: center;
          padding: var(--spacing-xl);
          background-color: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
        }

        .arrivi-cta-label {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-bottom: var(--spacing-md);
        }

        .arrivi-cta-btn {
          display: inline-flex;
          align-items: center;
          font-size: 1rem;
          padding: 0.9rem 2rem;
        }

        @media (max-width: 768px) {
          .about-grid, .contact-card {
            grid-template-columns: 1fr;
          }
          
          .about-image-column {
            order: 2;
          }
          
          .about-text-column {
            order: 1;
          }

          .about-image-accent {
            display: none;
          }

          .features-bar {
            margin-top: 0;
          }
          
          .hero-actions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}
