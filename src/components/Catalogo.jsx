import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Check } from 'lucide-react';

export default function Catalogo({ articoli }) {
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [selectedSizes, setSelectedSizes] = useState({}); // articoloId -> size
  const [addedAnimation, setAddedAnimation] = useState({}); // articoloId -> boolean

  // Estrarre le categorie uniche
  const categorie = ['Tutti', ...new Set(articoli.filter(a => a.attivo).map(a => a.categoria))];

  const articoliFiltrati = selectedCategory === 'Tutti'
    ? articoli.filter(a => a.attivo)
    : articoli.filter(a => a.attivo && a.categoria === selectedCategory);

  const handleSelectSize = (articoloId, size) => {
    setSelectedSizes(prev => ({
      ...prev,
      [articoloId]: size
    }));
  };

  const handleAddToCart = (articolo) => {
    const size = selectedSizes[articolo.id];
    
    // Se l'articolo ha delle taglie definite e nessuna taglia è stata selezionata
    const taglieDisponibili = articolo.taglie ? articolo.taglie.split(',').map(s => s.trim()) : [];
    if (taglieDisponibili.length > 0 && !size) {
      alert('Per favore, seleziona una taglia prima di aggiungere al carrello.');
      return;
    }

    addToCart(articolo, size || 'Unica');
    
    // Animazione di successo
    setAddedAnimation(prev => ({ ...prev, [articolo.id]: true }));
    setTimeout(() => {
      setAddedAnimation(prev => ({ ...prev, [articolo.id]: false }));
    }, 1500);
  };



  return (
    <section id="catalogo" className="catalogo-section container fade-in">
      <div className="catalogo-header">
        <span className="badge">Collezione 2026</span>
        <h2>Esplora i Nostri Capi</h2>
        <div className="accent-line"></div>
        <p className="catalogo-subtitle">
          Una selezione curata di capi freschi, colorati ed eleganti per esprimere al meglio la tua personalità.
        </p>
      </div>

      {/* Categoria Filter Bar */}
      <div className="filter-bar" aria-label="Filtra per categoria">
        {categorie.map(categoria => (
          <button
            key={categoria}
            className={`filter-btn ${selectedCategory === categoria ? 'active' : ''}`}
            onClick={() => setSelectedCategory(categoria)}
            aria-pressed={selectedCategory === categoria}
          >
            {categoria}
          </button>
        ))}
      </div>

      {/* Prodotti Grid */}
      {articoliFiltrati.length === 0 ? (
        <div className="no-products">
          <p>Nessun articolo disponibile in questa categoria al momento.</p>
        </div>
      ) : (
        <div className="prodotti-grid">
          {articoliFiltrati.map(articolo => {
            const taglieList = articolo.taglie ? articolo.taglie.split(',').map(s => s.trim()) : [];
            const selectedSize = selectedSizes[articolo.id];
            const isAdded = addedAnimation[articolo.id];

            return (
              <article key={articolo.id} className="prodotto-card">
                <div className="prodotto-image-wrapper">
                  <img
                    src={articolo.immagine_url.startsWith('http') || articolo.immagine_url.startsWith('blob:') ? articolo.immagine_url : (articolo.immagine_url.startsWith('/') ? articolo.immagine_url : `/${articolo.immagine_url}`)}
                    alt=""
                    className="prodotto-image-blur-bg"
                    aria-hidden="true"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <img
                    src={articolo.immagine_url.startsWith('http') || articolo.immagine_url.startsWith('blob:') ? articolo.immagine_url : (articolo.immagine_url.startsWith('/') ? articolo.immagine_url : `/${articolo.immagine_url}`)}
                    alt={articolo.titolo}
                    className="prodotto-image"
                    onError={(e) => {
                      // Fallback se l'immagine non esiste
                      e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  {articolo.categoria && (
                    <span className="prodotto-category-tag">{articolo.categoria}</span>
                  )}
                </div>

                <div className="prodotto-details">
                  <h3 className="prodotto-title">{articolo.titolo}</h3>
                  <p className="prodotto-description">{articolo.descrizione}</p>
                  
                  <div className="prodotto-price-row">
                    <span className="prodotto-price">€{parseFloat(articolo.prezzo).toFixed(2)}</span>
                  </div>

                  {/* Taglie Selector con Accessibilità (Target > 24px) */}
                  {taglieList.length > 0 && (
                    <div className="prodotto-sizes-container">
                      <span className="sizes-label">Seleziona Taglia:</span>
                      <div className="sizes-row" role="group" aria-label={`Taglie per ${articolo.titolo}`}>
                        {taglieList.map(size => {
                          const isSelected = selectedSize === size;
                          return (
                            <button
                              key={size}
                              type="button"
                              className={`size-btn ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleSelectSize(articolo.id, size)}
                              aria-pressed={isSelected}
                              aria-label={`Taglia ${size}`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pulsante Aggiungi al Carrello */}
                  <button
                    className={`btn-add-to-cart ${isAdded ? 'success' : ''}`}
                    onClick={() => handleAddToCart(articolo)}
                    disabled={isAdded}
                    aria-label={`Aggiungi ${articolo.titolo} al carrello`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={18} style={{ marginRight: '8px' }} />
                        Aggiunto
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={18} style={{ marginRight: '8px' }} />
                        Aggiungi al Carrello
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}



      <style>{`
        .catalogo-section {
          padding: var(--spacing-xl) var(--spacing-lg);
          background-color: var(--bg-secondary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          margin-bottom: var(--spacing-xxl);
        }

        .catalogo-header {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }

        .catalogo-header h2 {
          margin-top: var(--spacing-xs);
          font-size: 2.2rem;
          color: var(--text-primary);
        }

        .accent-line {
          width: 60px;
          height: 2px;
          background-color: var(--accent-gold);
          margin: var(--spacing-sm) auto var(--spacing-md);
        }

        .catalogo-subtitle {
          max-width: 600px;
          margin: 0 auto;
          color: var(--text-secondary);
        }

        .filter-bar {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xl);
        }

        .filter-btn {
          padding: 0.6rem 1.2rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
          background-color: var(--bg-primary);
          min-height: 40px; /* Accessibile */
        }

        .filter-btn:hover {
          border-color: var(--accent-gold);
          color: var(--text-primary);
        }

        .filter-btn.active {
          background-color: var(--text-primary);
          color: var(--bg-secondary);
          border-color: var(--text-primary);
        }

        .no-products {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--text-secondary);
        }

        .prodotti-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--spacing-xl);
        }

        .prodotto-card {
          background-color: var(--bg-primary);
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          transition: var(--transition-smooth);
        }

        .prodotto-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-md);
          border-color: var(--accent-gold);
        }

        .prodotto-image-wrapper {
          position: relative;
          width: 100%;
          padding-top: 125%; /* 4:5 Aspect Ratio per l'abbigliamento */
          background-color: var(--bg-tertiary);
          overflow: hidden;
        }

        .prodotto-image-blur-bg {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          filter: blur(20px) brightness(0.95);
          opacity: 0.55;
          transform: scale(1.1);
          pointer-events: none;
        }

        .prodotto-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          z-index: 1;
          transition: var(--transition-smooth);
        }

        .prodotto-card:hover .prodotto-image {
          transform: scale(1.03);
        }

        .prodotto-category-tag {
          position: absolute;
          top: var(--spacing-sm);
          left: var(--spacing-sm);
          background-color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          padding: 0.2rem 0.6rem;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          z-index: 10;
        }

        .prodotto-details {
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .prodotto-title {
          font-size: 1.25rem;
          margin-bottom: var(--spacing-xs);
          color: var(--text-primary);
        }

        .prodotto-description {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-md);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .prodotto-price-row {
          margin-top: auto;
          margin-bottom: var(--spacing-md);
        }

        .prodotto-price {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: var(--font-serif);
        }

        .prodotto-sizes-container {
          margin-bottom: var(--spacing-md);
        }

        .sizes-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .sizes-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .size-btn {
          min-width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
          background-color: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
        }

        .size-btn:hover {
          border-color: var(--text-primary);
          background-color: var(--bg-tertiary);
        }

        .size-btn.selected {
          background-color: var(--text-primary);
          color: var(--bg-secondary);
          border-color: var(--text-primary);
        }

        .btn-add-to-cart {
          width: 100%;
          background-color: var(--text-primary);
          color: var(--bg-secondary);
          font-size: 0.88rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.8rem;
          border-radius: var(--radius-sm);
          min-height: 44px; /* WCAG 2.2 touch target */
          border: 1px solid var(--text-primary);
        }

        .btn-add-to-cart:hover:not(:disabled) {
          background-color: transparent;
          color: var(--text-primary);
        }

        .btn-add-to-cart.success {
          background-color: var(--success);
          border-color: var(--success);
          color: var(--bg-secondary);
          cursor: default;
        }


      `}</style>
    </section>
  );
}
