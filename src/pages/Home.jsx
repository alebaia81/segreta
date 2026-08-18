import { useEffect } from 'react';
import { MapPin, Phone, Clock, ShieldCheck, Heart, Sparkles, Mail, ArrowRight, ShoppingBag, Star } from 'lucide-react';
import { useCookie } from '../context/CookieContext';
import HeroGlass from '../components/HeroGlass.tsx';
import ProductCard from '../components/ProductCard.tsx';
import Footer from '../components/Footer.jsx';
import { useCart } from '../context/CartContext';


export default function Home({ articoli, onNavigateToShop, onNavigateToAdmin }) {
  const { openCookieSettings } = useCookie();

  // --- Meta tag SEO specifici per Home (Brand + Local) ---
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Segreta Style | Boutique Abbigliamento Donna Monticelli d'Ongina";

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (metaDesc) {
      metaDesc.setAttribute('content', "Benvenuti da Segreta Style di Greta Righi a Monticelli d'Ongina (PC), boutique di abbigliamento donna per le zone di Piacenza e Cremona. Acquista online con assistenza WhatsApp.");
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc) metaDesc.setAttribute('content', prevDesc);
    };
  }, []);



  // Ultimi 4 articoli attivi (ordinati per id decrescente come proxy per data)
  const ultimiArrivi = articoli
    .filter(a => a.attivo !== false && a.attivo !== 0 && a.attivo !== 'false' && a.attivo !== '0')
    .slice(0, 4);
  const { addToCart } = useCart();

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
      {/* Hero Section — HeroGlass (WCAG 2.2 AA) */}
      <HeroGlass onNavigateToShop={onNavigateToShop} />

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
        </div>

        {ultimiArrivi.length === 0 ? (
          <div className="arrivi-empty">
            <p>Nessun prodotto disponibile al momento. Torna presto!</p>
          </div>
        ) : (
          <div className="arrivi-grid">
            {ultimiArrivi.map(articolo => (
              <ProductCard
                key={articolo.id}
                articolo={articolo}
                onAddToCart={addToCart}
                onCardClick={onNavigateToShop}
              />
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

      {/* Shop Benefits Section (Consegna, Cambi e Resi, Pagamenti) */}
      <section className="shop-benefits-section container" aria-label="Garanzie e Servizi di Acquisto">
        <div className="shop-benefits-grid">
          {/* Card 1: Consegna */}
          <div className="benefit-item">
            <div className="benefit-icon-wrapper">
              <img
                src="/icons/consegna.jpg"
                alt="Consegna Rapida"
                className="benefit-icon-img"
                loading="lazy"
              />
            </div>
            <h3 className="benefit-title">CONSEGNA IN 24/48 ORE</h3>
            <p className="benefit-text">
              Per ordini <strong>superiori a 50 €</strong> la <strong>spedizione è gratuita</strong>; per <strong>importi inferiori</strong> il costo è di <strong>5,90 €</strong>
            </p>
          </div>

          {/* Card 2: Cambi e Resi */}
          <div className="benefit-item">
            <div className="benefit-icon-wrapper">
              <img
                src="/icons/resi.jpg"
                alt="Cambi e Resi Facili"
                className="benefit-icon-img"
                loading="lazy"
              />
            </div>
            <h3 className="benefit-title">CAMBI E RESI</h3>
            <p className="benefit-text">
              Non ti piace o la taglia non è quella giusta? Nessun problema: hai <strong>14 giorni</strong> per <strong>cambiare l'articolo</strong>.
            </p>
          </div>

          {/* Card 3: Pagamenti Sicuri */}
          <div className="benefit-item">
            <div className="benefit-icon-wrapper">
              <img
                src="/icons/pagamenti.jpg"
                alt="Pagamenti Sicuri"
                className="benefit-icon-img"
                loading="lazy"
              />
            </div>
            <h3 className="benefit-title">PAGAMENTI SICURI</h3>
            <p className="benefit-text">
              PayPal, Satispay, Postepay, bonifico o contanti alla consegna (+5 €).
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section container">
        <div className="section-header-centered">
          <span className="badge">Dicono di Me</span>
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
            Leggi tutte le recensioni reali sulla mia scheda Google Maps ➔
          </a>
        </div>
      </section>

      {/* Chi Sono Section - Storia di Greta Righi */}
      <section id="chi-sono" className="about-section" aria-labelledby="about-title">
        <h1 id="about-title" style={{ display: 'none' }}>Segreta Style | Boutique Abbigliamento Donna Monticelli d'Ongina</h1>
        <div className="container about-container">
          {/* Testo prima della foto */}
          <div className="about-header-centered">
            <span className="badge">Chi Sono</span>
            <h2>Dal 2010, Segreta Style</h2>
            <div className="accent-line"></div>
            
            <p className="about-paragraph about-lead">
              Segreta nasce a Monticelli d’Ongina dalla mia passione per la moda e dal desiderio di offrire qualcosa di diverso.
            </p>
            <p className="about-paragraph">
              Da oltre 15 anni scelgo personalmente capi e accessori per donne che amano sentirsi bene esprimendo la propria personalità e… perché no, divertendosi con la moda.
            </p>
          </div>

          {/* Foto di Greta */}
          <div className="about-photo-wrapper">
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
          </div>

          {/* Testo dopo la foto */}
          <div className="about-content-after">
            <h3>Moda senza età, stile senza regole</h3>
            <p className="about-paragraph">
              Capi scelti con cura per donne che amano sentirsi bene, a qualsiasi età.
            </p>
            <p className="about-paragraph">
              Colori, tendenze, eleganza e un pizzico di follia: da Segreta trovi sempre qualcosa che parla di te.
            </p>

            <h3>Segreta, anche online</h3>
            <p className="about-paragraph">
              Le novità le trovi ogni settimana sui miei social.
            </p>
            <p className="about-paragraph">
              Hai visto qualcosa che ti piace? Scrivimi su WhatsApp: ti aiuterò con taglia, vestibilità e abbinamenti, proprio come se fossi in negozio.
            </p>
          </div>

          {/* Customer Service Card */}
          <div className="customer-service-card" aria-label="Assistenza Clienti">
            <h3 className="customer-service-title">Customer service</h3>
            <div className="customer-service-divider"></div>
            <p className="customer-service-text">
              Il nostro Customer Service è<br />
              disponibile negli orari di apertura del negozio.
            </p>
            <p className="customer-service-subtext">
              Tempo di risposta medio: 30 minuti
            </p>
            <a
              href="https://wa.me/393482946532?text=Ciao%20Greta,%20avrei%20bisogno%20di%20informazioni"
              target="_blank"
              rel="noopener noreferrer"
              className="customer-service-btn"
              aria-label="Contattaci su WhatsApp al 348 2946532"
            >
              CONTATTACI
            </a>
          </div>
        </div>
      </section>

      {/* Contact & Map Section (Local SEO info) */}
      <section id="contatti" className="contact-info-section container">
        <div className="contact-card">
          <div className="contact-info-column">
            <h3>Vieni a Trovarmi</h3>
            <div className="accent-line-left"></div>
            <p>Mi trovi nel centro storico di Monticelli d'Ongina, sotto i caratteristici portici. La boutique è facilmente raggiungibile sia da Piacenza che da Cremona.</p>
            
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

            {/* Social links */}
            <div className="contact-social-row">
              <span className="contact-social-label">Seguici su:</span>
              <div className="contact-social-icons">
                <a
                  href="https://www.facebook.com/SegretaAbbigliamento"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Seguici su Facebook"
                  className="contact-social-btn contact-social-btn--fb"
                  title="Facebook"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  <span>Facebook</span>
                </a>
                <a
                  href="https://www.instagram.com/segreta_style/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Seguici su Instagram"
                  className="contact-social-btn contact-social-btn--ig"
                  title="Instagram"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  <span>Instagram</span>
                </a>
                <a
                  href="https://whatsapp.com/channel/0029Vazn2RAHQbS0KG6T4x3P"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Iscriviti al canale WhatsApp di Segreta Style"
                  className="contact-social-btn contact-social-btn--wa"
                  title="Canale WhatsApp"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.089.537 4.049 1.475 5.757L.057 23.882a.5.5 0 0 0 .61.61l6.125-1.418A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.676-.513-5.2-1.408l-.372-.219-3.863.893.912-3.771-.24-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  <span>Canale WhatsApp</span>
                </a>
              </div>
            </div>
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
      <Footer 
        onLogoClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
        onNavigateToAdmin={onNavigateToAdmin} 
      />


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
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: var(--spacing-xl) var(--spacing-lg);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.4);
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
          margin: 4rem auto 1.5rem;
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

        .about-container {
          max-width: 720px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .about-header-centered {
          width: 100%;
          margin-bottom: var(--spacing-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .about-header-centered h2 {
          font-size: 2.2rem;
          margin-top: var(--spacing-xs);
        }

        .about-lead {
          font-size: 1.15rem;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.6;
        }

        .about-photo-wrapper {
          width: 100%;
          max-width: 380px;
          margin: 0 auto var(--spacing-xl);
        }

        .about-image-frame {
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-lg);
          border: 6px solid var(--bg-secondary);
          aspect-ratio: 4/5;
          position: relative;
        }

        .about-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .about-content-after {
          width: 100%;
          margin-bottom: var(--spacing-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .about-content-after h3 {
          font-size: 1.45rem;
          margin-top: var(--spacing-lg);
          margin-bottom: var(--spacing-xs);
          color: var(--text-primary);
          font-weight: 600;
        }

        .about-content-after h3:first-child {
          margin-top: 0;
        }

        .about-paragraph {
          font-size: 1.02rem;
          color: var(--text-secondary);
          line-height: 1.65;
          margin-bottom: var(--spacing-sm);
          max-width: 620px;
        }

        /* Customer Service Section */
        .customer-service-card {
          background-color: #FBF1F3;
          border: 1px solid #F5DDE3;
          border-radius: var(--radius-lg);
          padding: 2.8rem 2rem;
          width: 100%;
          max-width: 620px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 6px 24px rgba(226, 149, 171, 0.1);
          transition: var(--transition-smooth);
        }

        .customer-service-card:hover {
          box-shadow: 0 10px 32px rgba(226, 149, 171, 0.16);
        }

        .customer-service-title {
          font-family: var(--font-sans);
          font-size: 1.85rem;
          font-weight: 700;
          color: #2C2520;
          margin-bottom: 0;
          letter-spacing: -0.01em;
        }

        .customer-service-divider {
          width: 48px;
          height: 2.5px;
          background-color: #2C2520;
          margin: 12px auto 16px;
          border-radius: 2px;
        }

        .customer-service-text {
          font-size: 1.15rem;
          line-height: 1.45;
          color: #2C2520;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .customer-service-subtext {
          font-size: 1.1rem;
          font-style: italic;
          color: #2C2520;
          margin-bottom: 1.75rem;
          font-weight: 400;
        }

        .customer-service-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #FFAEC0;
          color: #1E1B18;
          font-size: 0.88rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 0.95rem 2.8rem;
          border-radius: 14px;
          box-shadow: 0 4px 14px rgba(255, 174, 192, 0.45);
          transition: var(--transition-smooth);
          min-height: 44px;
          cursor: pointer;
        }

        .customer-service-btn:hover {
          background-color: #F89CB2;
          color: #000000;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 174, 192, 0.65);
        }

        .customer-service-btn:active {
          transform: translateY(0);
        }

        .customer-service-btn:focus-visible {
          outline: 2px solid #2C2520;
          outline-offset: 3px;
        }

        @media (max-width: 768px) {
          .customer-service-card {
            padding: 2.2rem 1.25rem;
          }
          .customer-service-title {
            font-size: 1.6rem;
          }
          .customer-service-text {
            font-size: 1.02rem;
          }
          .customer-service-subtext {
            font-size: 0.98rem;
          }
          .customer-service-btn {
            width: 100%;
            max-width: 280px;
            padding: 0.9rem 1.5rem;
          }
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


        /* Social nella scheda Vieni a Trovarci */
        .contact-social-row {
          margin-top: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .contact-social-label {
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
        }

        .contact-social-icons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .contact-social-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0.45rem 0.9rem;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          font-weight: 600;
          text-decoration: none;
          transition: var(--transition-smooth);
          border: 1.5px solid transparent;
        }

        .contact-social-btn--fb {
          background: #1877f215;
          color: #1877f2;
          border-color: #1877f230;
        }
        .contact-social-btn--fb:hover {
          background: #1877f2;
          color: #fff;
        }

        .contact-social-btn--ig {
          background: #e1306c15;
          color: #e1306c;
          border-color: #e1306c30;
        }
        .contact-social-btn--ig:hover {
          background: linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
          color: #fff;
          border-color: transparent;
        }

        .contact-social-btn--wa {
          background: #25d36615;
          color: #25d366;
          border-color: #25d36630;
        }
        .contact-social-btn--wa:hover {
          background: #25d366;
          color: #fff;
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
          max-height: 80px;
          object-fit: contain;
          display: block;
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

        .ultimi-arrivi-section {
          padding: 1.5rem var(--spacing-lg) 2rem;
        }

        .ultimi-arrivi-section .badge,
        .testimonials-section .badge,
        .about-text-column .badge {
          background-color: #E295AB;
          color: #FFFFFF;
          font-weight: 800;
        }

        .section-header-centered {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }

        .section-header-centered h2 {
          font-family: var(--font-sans);
          font-size: 2.2rem;
          font-weight: 700;
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
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          align-items: stretch;
        }

        .arrivo-card {
          background-color: var(--bg-primary);
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100%;
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
          object-fit: cover;
          object-position: center;
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
          .contact-card {
            grid-template-columns: 1fr;
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
          .footer-left,
          .footer-left-group {
            flex-direction: column;
            gap: var(--spacing-xs);
            align-items: center;
            text-align: center;
          }
          .footer-right,
          .footer-right-group {
            align-items: center;
            text-align: center;
            gap: var(--spacing-sm);
            width: 100%;
          }
          .footer-social-links {
            justify-content: center;
            width: 100%;
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

        /* Shop Benefits Section (Consegna, Cambi e Resi, Pagamenti) */
        .shop-benefits-section {
          padding: 3.5rem var(--spacing-lg) 2rem;
          margin-top: 1rem;
        }

        .shop-benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-xl);
          text-align: center;
          align-items: stretch;
        }

        .benefit-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2.2rem 1.5rem;
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          transition: var(--transition-smooth);
        }

        .benefit-item:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--accent-gold);
        }

        .benefit-icon-wrapper {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.2rem;
        }

        .benefit-icon-img {
          max-height: 70px;
          max-width: 95px;
          object-fit: contain;
          mix-blend-mode: multiply;
        }

        .benefit-title {
          font-family: var(--font-sans);
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }

        .benefit-text {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-secondary);
          max-width: 300px;
          margin: 0 auto;
        }

        .benefit-text strong {
          color: var(--text-primary);
          font-weight: 700;
        }

        @media (max-width: 860px) {
          .shop-benefits-section {
            padding: 2.5rem var(--spacing-md) 1rem;
          }
          .shop-benefits-grid {
            grid-template-columns: 1fr;
            gap: var(--spacing-lg);
            max-width: 440px;
            margin: 0 auto;
          }
          .benefit-item {
            padding: 2rem 1.25rem;
          }
        }

        /* Testimonials Section Styling */
        .testimonials-section {
          padding: 2rem 0 var(--spacing-xxl);
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
          .ultimi-arrivi-section {
            padding-bottom: var(--spacing-lg); /* era --spacing-xxl (4rem), ora 1.5rem */
          }
          .testimonials-section {
            padding-top: var(--spacing-lg); /* era --spacing-xxl (4rem), ora 1.5rem */
          }
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
