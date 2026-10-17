import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard.jsx';
import Footer from '../components/Footer.jsx';
import './Shop.css';

const INITIAL_VISIBLE_COUNT = 16;
const LOAD_MORE_STEP = 16;

/**
 * Pagina Shop — /shop
 * Catalogo completo con filtri per categoria.
 * SEO: meta tag differenziati da Home (catalogo + shopping).
 */
export default function Shop({ articoli, onNavigateToHome, onNavigateToAdmin, onOpenProduct }) {
  const { addToCart } = useCart();

  const [selectedCategory, setSelectedCategory] = useState('TUTTI');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // --- Meta tag SEO specifici per /shop ---
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Shop Online | Collezioni Abbigliamento Piacenza e Cremona — Segreta Style";

    // Description
    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (metaDesc) {
      metaDesc.setAttribute('content', "Esplora lo shop online di Segreta Style: abbigliamento donna per Piacenza e Cremona. Acquista online e finalizza tramite WhatsApp con Greta.");
    }

    // OG
    const updateOG = (property, content) => {
      const el = document.querySelector(`meta[property="${property}"]`);
      if (el) el.setAttribute('content', content);
    };
    updateOG('og:title', "Shop Online | Collezioni Abbigliamento Donna Piacenza e Cremona — Segreta Style");
    updateOG('og:description', "Scopri le mie collezioni di abbigliamento donna. Ordina e personalizza via WhatsApp con me.");
    updateOG('og:url', 'https://www.segretastylemonticelli.it/shop');

    return () => {
      document.title = prevTitle;
      if (metaDesc) metaDesc.setAttribute('content', prevDesc);
      updateOG('og:title', "Segreta Style | Abbigliamento Moda Donna a Monticelli d'Ongina");
      updateOG('og:description', "Scopri la moda accessibile e divertente selezionata da Greta Righi nel centro storico di Monticelli d'Ongina. Spedizioni in tutta Italia e ritiro in negozio.");
      updateOG('og:url', 'https://www.segretastylemonticelli.it/');
    };
  }, []);

  const DEFAULT_PRESET_CATEGORIES = [
    'ABITI',
    'GONNE',
    'MAGLIERIA',
    'CAMICE-BLUSE',
    'T-SHIRT-FELPE',
    'JEANS',
    'PANTALONI',
    'CAPPOTTI-GIACCHE',
    'SCARPE',
    'BORSE'
  ];

  const normalizeCategory = (cat) => {
    if (!cat) return '';
    const c = cat.toUpperCase().trim();
    if (c === 'GONNE' || c === 'GONNA') return 'GONNE';
    if (c === 'ABITI' || c === 'ABITO' || c === 'ABITI-BLUES' || c === 'ABITI-BLUSE') return 'ABITI';
    if (c === 'MAGLIERIA' || c === 'MAGLIA' || c === 'MAGLIE' || c === 'MAGLIONE' || c === 'MAGLIONI' || c === 'MAGLIERIA-MAGLIE') return 'MAGLIERIA';
    if (c === 'CAMICIE E BLUSE' || c === 'CAMICIE' || c === 'CAMICE-BLUES' || c === 'CAMICIE-BLUSE' || c === 'CAMICIA' || c === 'BLUSA') return 'CAMICE-BLUSE';
    if (c === 'T-SHIRT' || c === 'FELPE' || c === 'T-SHIRT E FELPE' || c === 'TSHIRT') return 'T-SHIRT-FELPE';
    if (c === 'GIACCHE' || c === 'GIACCHE E CAPPOTTI' || c === 'CAPPOTTI & GIACCHE' || c === 'GIACCA' || c === 'CAPPOTTO') return 'CAPPOTTI-GIACCHE';
    if (c === 'JEAN' || c === 'JEANS') return 'JEANS';
    if (c === 'PANTALONE' || c === 'PANTALONI') return 'PANTALONI';
    if (c === 'SCARPA' || c === 'SCARPE') return 'SCARPE';
    if (c === 'BORSA' || c === 'BORSE') return 'BORSE';
    return c;
  };

  const articoliAttivi = (articoli || []).filter(a => a && a.attivo !== false && a.attivo !== 0);
  const articoliTarget = articoliAttivi.filter(a => !a.target || String(a.target).trim().toLowerCase() === 'donna');

  // Recupera categorie personalizzate salvate ed estrai quelle presenti nei prodotti
  const savedCustomCats = (() => {
    try {
      const saved = localStorage.getItem('segreta_custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();

  const categoriesFromProducts = Array.from(
    new Set(articoliTarget.map(a => normalizeCategory(a.categoria)).filter(Boolean))
  );

  const categorie = ['TUTTI', ...Array.from(new Set([
    ...DEFAULT_PRESET_CATEGORIES,
    ...savedCustomCats.map(c => normalizeCategory(c)),
    ...categoriesFromProducts
  ]))];

  const articoliFiltrati = selectedCategory === 'TUTTI'
    ? articoliTarget
    : articoliTarget.filter(a => {
        const catA = normalizeCategory(a.categoria);
        const catSel = normalizeCategory(selectedCategory);
        const rawA = String(a.categoria || '').trim().toUpperCase();
        const rawSel = String(selectedCategory || '').trim().toUpperCase();
        return catA === catSel || rawA === rawSel;
      });

  const articoliVisibili = articoliFiltrati.slice(0, visibleCount);
  const hasMore = visibleCount < articoliFiltrati.length;

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + LOAD_MORE_STEP);
  };

  return (
    <div className="shop-page fade-in">

      {/* Shop Header */}
      <header className="shop-hero">
        <div className="container shop-hero-content">
          <h1>IL MIO SHOP</h1>
          <div className="accent-line" style={{ margin: '1rem auto 1.25rem' }}></div>
          <p className="shop-hero-subtitle">
            Tutti i capi disponibili, aggiornati in tempo reale. Trova la categoria adatta ed esplora le novità.
          </p>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="shop-filter-wrapper container" style={{ marginTop: '2rem' }}>
        <div className="shop-filter-bar" role="group" aria-label="Filtra per categoria">
          {categorie.map(cat => (
            <button
              key={cat}
              className={`shop-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
              aria-pressed={selectedCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <section className="container shop-grid-section" aria-label="Prodotti dello shop" style={{ marginTop: '1rem' }}>

        {articoliFiltrati.length === 0 ? (
          <div className="shop-empty">
            <p>Nessun articolo disponibile in questa categoria al momento.</p>
            <button className="btn-secondary" onClick={() => handleCategoryChange('TUTTI')}>
              Vedi tutti i prodotti
            </button>
          </div>
        ) : (
          <>
            <div className="shop-prodotti-grid">
              {articoliVisibili.map((articolo, index) => (
                <ProductCard
                  key={articolo.id}
                  articolo={articolo}
                  cardIndex={index}
                  onAddToCart={(art, size, color, customImg) => addToCart(art, size, color, customImg)}
                  onCardClick={(artId) => onOpenProduct && onOpenProduct(artId || articolo.id)}
                />
              ))}
            </div>

            {hasMore && (
              <div className="shop-load-more-wrapper">
                <button
                  type="button"
                  className="shop-load-more-btn"
                  onClick={handleLoadMore}
                >
                  Mostra altri capi (+{Math.min(LOAD_MORE_STEP, articoliFiltrati.length - visibleCount)})
                </button>
                <span className="shop-load-more-info">
                  Visualizzati {articoliVisibili.length} di {articoliFiltrati.length} capi
                </span>
              </div>
            )}
          </>
        )}
      </section>

      <Footer 
        onLogoClick={onNavigateToHome} 
        onNavigateToAdmin={onNavigateToAdmin} 
      />
    </div>
  );
}
