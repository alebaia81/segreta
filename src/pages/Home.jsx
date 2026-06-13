import { useEffect } from 'react';
import { MapPin, Phone, Clock, ShieldCheck, Heart, Sparkles, Mail, ArrowRight, ShoppingBag, Star } from 'lucide-react';
import { useCookie } from '../context/CookieContext';


export default function Home({ articoli, onNavigateToShop, onNavigateToAdmin }) {
  const { openCookieSettings } = useCookie();

  // --- Meta tag SEO specifici per Home (Brand + Local) ---
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Segreta Style | Boutique Abbigliamento Donna e Uomo Monticelli d'Ongina";

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (metaDesc) {
      metaDesc.setAttribute('content', "Benvenuti da Segreta Style di Greta Righi a Monticelli d'Ongina (PC), boutique di abbigliamento donna e uomo per le zone di Piacenza e Cremona. Acquista online con assistenza WhatsApp.");
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc) metaDesc.setAttribute('content', prevDesc);
    };
  }, []);



  // Ultimi 8 articoli attivi (ordinati per id decrescente come proxy per data)
  const ultimiArrivi = articoli
    .filter(a => a.attivo)
    .slice(0, 8);
  return (
    <div className="home-page fade-in">
      {/* JSON-LD Dati Strutturati SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ClothingStore",
            "name": "Segreta Style",
            "alternativeName": "Segreta di Greta Righi",
            "image": "https://www.segretastyle.it/assets/logo.png",
            "@id": "https://www.segretastyle.it/#store",
            "url": "https://www.segretastyle.it",
            "telephone": "+390523820276",
            "priceRange": "$$",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Via Martiri della Libertà 67",
              "addressLocality": "Monticelli d'Ongina",
              "addressRegion": "PC",
              "postalCode": "29010",
              "addressCountry": "IT"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 45.089282,
              "longitude": 9.9312513
            },
            "openingHoursSpecification": [
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday"],
                "opens": "09:00",
                "closes": "19:00"
              },
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Sunday",
                "opens": "09:00",
                "closes": "12:00"
              }
            ],
            "sameAs": [
              "https://www.instagram.com/segretastyle/"
            ],
            "areaServed": [
              {
                "@type": "AdministrativeArea",
                "name": "Piacenza"
              },
              {
                "@type": "AdministrativeArea",
                "name": "Cremona"
              }
            ],
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.6",
              "reviewCount": "10"
            }
          })
        }}
      />

      {/* Hero Section */}
      <header id="home" className="hero-section flex flex-col justify-center items-center min-h-[85vh] px-4">
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
                        : (articolo.immagine_url.startsWith('/') ? articolo.immagine_url : `/${articolo.immagine_url}`)
                    }
                    alt=""
                    className="arrivo-img-blur-bg"
                    aria-hidden="true"
                    onError={e => {
                      e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <img
                    src={
                      articolo.immagine_url.startsWith('http') || articolo.immagine_url.startsWith('blob:')
                        ? articolo.immagine_url
                        : (articolo.immagine_url.startsWith('/') ? articolo.immagine_url : `/${articolo.immagine_url}`)
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

      {/* Testimonials Section */}
      <section className="testimonials-section container">
        <div className="section-header-centered">
          <span className="badge">Dicono di Noi</span>
          <h2>Recensioni</h2>
          <div className="accent-line"></div>
          <p className="section-subtitle">
            Le parole di chi ha scelto lo stile di Segreta. Clicca e leggi l'esperienza in boutique.
          </p>
        </div>

        <div className="testimonials-grid">
          <figure className="testimonial-card">
            <div className="testimonial-card-header">
              <div className="testimonial-stars" aria-label="Valutazione 5 stelle su 5">
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
              </div>
              <span className="testimonial-verified-badge" title="Recensione reale verificata su Google Maps">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.357-2.89-6.357-6.457s2.847-6.456 6.357-6.456c1.621 0 3.092.604 4.22 1.59l3.053-3.053C19.23 2.201 15.96 1 12.24 1 5.922 1 1 5.922 1 12.24s4.922 11.24 11.24 11.24c6.12 0 11.24-4.514 11.24-11.24 0-.776-.072-1.5-.2-2.195H12.24z"/>
                </svg>
                Google
              </span>
            </div>
            <blockquote className="testimonial-text">
              "Negozio molto carino e accogliente, Greta la titolare è super gentile e disponibile e sa consigliarti al meglio. Capi d'abbigliamento e accessori particolari e molto giovanili, prezzi ottimi. Consigliatissimo!"
            </blockquote>
            <figcaption>
              — <cite className="testimonial-author">Eleonora</cite>
            </figcaption>
          </figure>

          <figure className="testimonial-card">
            <div className="testimonial-card-header">
              <div className="testimonial-stars" aria-label="Valutazione 5 stelle su 5">
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
              </div>
              <span className="testimonial-verified-badge" title="Recensione reale verificata su Google Maps">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.357-2.89-6.357-6.457s2.847-6.456 6.357-6.456c1.621 0 3.092.604 4.22 1.59l3.053-3.053C19.23 2.201 15.96 1 12.24 1 5.922 1 1 5.922 1 12.24s4.922 11.24 11.24 11.24c6.12 0 11.24-4.514 11.24-11.24 0-.776-.072-1.5-.2-2.195H12.24z"/>
                </svg>
                Google
              </span>
            </div>
            <blockquote className="testimonial-text">
              "Negozio bellissimo, abbigliamento super top! Greta splendida e solare sa sempre consigliarti l'outfit perfetto per te. Consigliatissimo!"
            </blockquote>
            <figcaption>
              — <cite className="testimonial-author">Simona</cite>
            </figcaption>
          </figure>

          <figure className="testimonial-card">
            <div className="testimonial-card-header">
              <div className="testimonial-stars" aria-label="Valutazione 5 stelle su 5">
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
              </div>
              <span className="testimonial-verified-badge" title="Recensione reale verificata su Google Maps">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.357-2.89-6.357-6.457s2.847-6.456 6.357-6.456c1.621 0 3.092.604 4.22 1.59l3.053-3.053C19.23 2.201 15.96 1 12.24 1 5.922 1 1 5.922 1 12.24s4.922 11.24 11.24 11.24c6.12 0 11.24-4.514 11.24-11.24 0-.776-.072-1.5-.2-2.195H12.24z"/>
                </svg>
                Google
              </span>
            </div>
            <blockquote className="testimonial-text">
              "Negozio accogliente con capi unici ed esclusivi. Greta è fantastica e ti guida nella scelta con una professionalità e una dolcezza uniche. Il top tra Piacenza e Cremona."
            </blockquote>
            <figcaption>
              — <cite className="testimonial-author">Rita</cite>
            </figcaption>
          </figure>
        </div>

        <div className="testimonials-footer">
          <a
            href="https://www.google.com/search?q=segreta+style+monticelli"
            target="_blank"
            rel="noopener noreferrer"
            className="google-reviews-link"
          >
            Leggi tutte le recensioni reali sulla nostra scheda Google Maps ➔
          </a>
        </div>
      </section>

      {/* Chi Sono Section - Storia di Greta Righi */}
      <section id="chi-sono" className="about-section" aria-labelledby="about-title">
        <h1 id="about-title" style={{ display: 'none' }}>Segreta Style | Boutique Abbigliamento Donna e Uomo Monticelli d'Ongina</h1>
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
            <h2>Dal 2010, la moda con personalità tra Piacenza e Cremona</h2>
            <div className="accent-line-left"></div>
            
            <p className="about-paragraph highlight-paragraph">
              Benvenuti nel mondo di <strong>Segreta Style</strong>, la boutique nata nel cuore di <strong>Monticelli d'Ongina</strong> dalla passione di <strong>Greta Righi</strong>. Da oltre quindici anni, il nostro obiettivo non è semplicemente vendere vestiti, ma aiutare ogni persona a far emergere la propria unicità attraverso selezioni di stile ricercate e mai banali.
            </p>

            <h3>Collezioni Frizzanti e Senza Età</h3>
            <p className="about-paragraph">
              La nostra filosofia si basa su un concetto di moda fluida e inclusiva. Amiamo mixare <strong>brand frizzanti</strong>, freschi e di tendenza, perfetti per un pubblico giovane che ama osare, con proposte più strutturate, eleganti e sofisticate dedicate a chi non ha più vent'anni ma non vuole assolutamente rinunciare a esprimere la propria forte personalità. Che tu stia cercando un abito da sera per un evento speciale a Piacenza o un look casual per il weekend a Cremona, da noi trovi capi selezionati a mano che valorizzano chi sei.
            </p>

            <h3>Un'Esperienza Boutique, Anche Online</h3>
            <p className="about-paragraph">
              Nati come punto di riferimento fisico per lo shopping nella <strong>provincia di Piacenza</strong> e limitrofi della <strong>provincia di Cremona</strong>, oggi portiamo l'atmosfera della nostra boutique direttamente sui tuoi schermi. Grazie alla nostra forte community su <strong>Instagram</strong>, mostriamo ogni settimana i nuovi arrivi in tempo reale. E la nostra assistenza non cambia: puoi ordinare sul sito e finalizzare l'acquisto direttamente su <strong>WhatsApp</strong>, parlando con noi per ricevere consigli personalizzati su taglie, vestibilità e abbinamenti, proprio come se fossi in negozio da Greta.
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
            <span className="footer-subtitle">DI GRETA RIGHI</span>
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
            <div className="footer-links-row">
              <a href="https://www.iubenda.com/privacy-policy/68426130" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              <a href="https://www.iubenda.com/privacy-policy/68426130/cookie-policy" target="_blank" rel="noopener noreferrer">Cookie Policy</a>
              <button className="footer-cookie-btn" onClick={openCookieSettings}>Gestisci preferenze Privacy</button>
            </div>
            <div className="footer-info-row">
              <span>© 2026 Segreta Style — <a href="https://presenzadigitale.com" target="_blank" rel="noopener noreferrer">Presenzadigitale.com</a></span>
              <span className="footer-separator"> | </span>
              <span>C.F. RGHGRT79R66D15OY — P.IVA 01563960333</span>
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
          background: rgba(255, 255, 255, 0.85);
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

        .about-text-column h3 {
          font-size: 1.35rem;
          margin-top: var(--spacing-lg);
          margin-bottom: var(--spacing-xs);
          color: var(--text-primary);
          font-weight: 600;
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
          padding: var(--spacing-lg) 0;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-lg);
          flex-wrap: wrap;
        }

        .footer-left {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .footer-logo-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: block;
          opacity: 0.9;
          transition: opacity 0.2s ease;
        }

        .footer-logo-btn:hover {
          opacity: 1;
        }

        .footer-logo-img {
          max-height: 48px;
          object-fit: contain;
          display: block;
          background-color: var(--bg-secondary);
          padding: 6px 12px;
          border-radius: var(--radius-md);
        }

        .footer-subtitle {
          font-family: var(--font-sans);
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--accent-gold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .footer-social-links {
          display: flex;
          gap: var(--spacing-xs);
          align-items: center;
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

        .footer-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--spacing-xs);
          text-align: right;
        }

        .footer-links-row {
          display: flex;
          gap: var(--spacing-md);
          font-size: 0.85rem;
          color: var(--border-color);
          align-items: center;
          flex-wrap: wrap;
        }

        .footer-links-row a {
          color: var(--border-color);
          opacity: 0.8;
          transition: var(--transition-fast);
        }

        .footer-links-row a:hover {
          opacity: 1;
          color: var(--accent-gold);
        }

        .footer-links-row a:focus-visible,
        .footer-cookie-btn:focus-visible,
        .social-footer-icon-btn:focus-visible,
        .footer-logo-btn:focus-visible,
        .footer-lock-btn:focus-visible {
          outline: 2px solid var(--accent-gold);
          outline-offset: 4px;
          border-radius: var(--radius-sm);
          opacity: 1;
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
          transition: var(--transition-fast);
        }

        .footer-cookie-btn:hover {
          opacity: 1;
          color: var(--accent-gold);
        }

        .footer-info-row {
          font-size: 0.75rem;
          color: var(--border-color);
          opacity: 0.7;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
        }

        .footer-info-row a {
          color: inherit;
          text-decoration: underline;
        }

        .footer-separator {
          opacity: 0.5;
        }

        .footer-lock-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          opacity: 0.4;
          transition: opacity 0.2s ease;
          vertical-align: middle;
          cursor: pointer;
          background: none;
          border: none;
          color: inherit;
        }

        .footer-lock-btn:hover {
          opacity: 0.9;
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

        .arrivo-img-blur-bg {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          filter: blur(20px) brightness(0.95);
          opacity: 0.55;
          transform: scale(1.1);
          pointer-events: none;
        }

        .arrivo-img {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: contain;
          z-index: 1;
          transition: var(--transition-smooth);
        }

        .arrivo-card:hover .arrivo-img { transform: scale(1.03); }

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
          z-index: 10;
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

          .hero-section {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 85vh;
            padding: 0 1rem;
          }

          .hero-content {
            padding: 1.5rem 1rem;
            margin: 0 auto 2rem;
            width: 100%;
            max-width: 100%;
          }
          
          .hero-actions {
            flex-direction: column;
            align-items: stretch;
            gap: var(--spacing-sm);
          }

          .hero-actions .btn-primary,
          .hero-actions .btn-secondary {
            padding: 10px 1.5rem;
            min-height: 44px; /* WCAG 2.2 touch target standard */
          }

          /* Responsive Footer */
          .footer-content {
            flex-direction: column;
            gap: var(--spacing-md);
            text-align: center;
            align-items: center;
          }
          .footer-left {
            flex-direction: column;
            gap: var(--spacing-xs);
            align-items: center;
          }
          .footer-right {
            align-items: center;
            text-align: center;
            gap: var(--spacing-sm);
          }
          .footer-links-row {
            justify-content: center;
            gap: var(--spacing-xs) var(--spacing-md);
          }
          .footer-info-row {
            justify-content: center;
            flex-direction: column;
            gap: 6px;
          }
          .footer-separator {
            display: none;
          }
        }

        /* Testimonials Section Styling */
        .testimonials-section {
          padding: var(--spacing-xxl) 0;
          background-color: var(--bg-primary);
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-lg);
          margin-top: var(--spacing-xl);
        }

        .testimonial-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          margin: 0;
          transition: var(--transition-smooth);
        }

        .testimonial-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--accent-gold);
        }

        .testimonial-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
          width: 100%;
        }

        .testimonial-verified-badge {
          display: inline-flex;
          align-items: center;
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-secondary);
          background-color: var(--bg-tertiary);
          padding: 3px 8px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .testimonial-stars {
          display: flex;
          gap: 2px;
          color: var(--accent-gold);
        }

        .testimonials-footer {
          text-align: center;
          margin-top: var(--spacing-xl);
        }

        .google-reviews-link {
          display: inline-flex;
          align-items: center;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
          text-decoration: underline;
          text-underline-offset: 4px;
          transition: var(--transition-fast);
          min-height: 44px;
          padding: 0 var(--spacing-md);
        }

        .google-reviews-link:hover {
          color: var(--accent-gold-hover);
          text-decoration-color: var(--accent-gold-hover);
        }

        .testimonial-text {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-md);
          font-style: italic;
          font-family: var(--font-sans);
          flex-grow: 1;
        }

        .testimonial-author {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-style: normal;
        }

        @media (max-width: 768px) {
          .testimonials-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: var(--spacing-md);
            padding-bottom: var(--spacing-md);
            margin: var(--spacing-lg) calc(-1 * var(--spacing-lg)) 0;
            padding-left: var(--spacing-lg);
            padding-right: var(--spacing-lg);
            scrollbar-width: none; /* Firefox */
          }

          .testimonials-grid::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
          }

          .testimonial-card {
            flex: 0 0 85%;
            scroll-snap-align: center;
          }
        }


      `}</style>
    </div>
  );
}
