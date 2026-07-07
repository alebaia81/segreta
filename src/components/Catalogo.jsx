import { useState } from 'react';
import { useCart } from '../context/CartContext';
import ProductCard from './ProductCard.tsx';

export default function Catalogo({ articoli }) {
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('TUTTI');

  // Estrarre le categorie uniche
  const categorie = ['TUTTI', ...new Set(articoli.filter(a => a.attivo).map(a => a.categoria))];

  const articoliFiltrati = selectedCategory === 'TUTTI'
    ? articoli.filter(a => a.attivo)
    : articoli.filter(a => a.attivo && a.categoria === selectedCategory);



  const handleAddToCart = (articolo, size) => {
    // Se l'articolo ha delle taglie definite e nessuna taglia è stata selezionata
    const taglieDisponibili = articolo.taglie ? articolo.taglie.split(',').map(s => s.trim()) : [];
    if (taglieDisponibili.length > 0 && !size) return; // gestito in ProductCard

    addToCart(articolo, size || 'Unica');
  };



  return (
    <section id="catalogo" className="catalogo-section container fade-in">
      <div className="catalogo-header">
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
          {articoliFiltrati.map(articolo => (
            <ProductCard
              key={articolo.id}
              articolo={articolo}
              onAddToCart={handleAddToCart}
            />
          ))}
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
          background-color: #E295AB;
          color: #fff;
          border-color: #E295AB;
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
          height: 100%;
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
          background-color: #ffffff;
          overflow: hidden;
        }

        .prodotto-image-blur-bg {
          display: none;
        }

        .prodotto-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
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
          background-color: #E295AB;
          color: #fff;
          font-size: 0.88rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.8rem;
          border-radius: var(--radius-sm);
          min-height: 44px;
          border: 1px solid #E295AB;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
        }

        .btn-add-to-cart:hover:not(:disabled) {
          background-color: transparent;
          color: #E295AB;
          border-color: #E295AB;
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
