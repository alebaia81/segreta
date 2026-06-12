import { useCart } from '../context/CartContext';
import { X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

export default function Carrello({ isOpen, onClose, onCheckout }) {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();

  if (!isOpen) return null;

  return (
    <div className="cart-backdrop" onClick={onClose} aria-hidden="true">
      <aside 
        className="cart-drawer fade-in" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Carrello della spesa"
      >
        {/* Header del carrello */}
        <div className="cart-header">
          <h3>Il tuo Carrello</h3>
          <button 
            className="close-drawer-btn" 
            onClick={onClose}
            aria-label="Chiudi carrello"
          >
            <X size={24} />
          </button>
        </div>

        {cartItems.length > 0 && (
          <div className="shipping-progress-banner">
            {cartTotal < 50 ? (
              <>
                <p className="shipping-nudge-text">
                  Ti mancano solo <strong>€{(50 - cartTotal).toFixed(2)}</strong> per la <strong>SPEDIZIONE GRATUITA</strong>!
                </p>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${Math.min((cartTotal / 50) * 100, 100)}%` }}
                  ></div>
                </div>
              </>
            ) : (
              <p className="shipping-success-text">
                ✨ 🎉 <strong>Spedizione gratuita ottenuta!</strong>
              </p>
            )}
          </div>
        )}

        {/* Lista degli articoli */}
        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart-state">
              <p>Il tuo carrello è vuoto.</p>
              <button className="btn-primary" onClick={onClose}>
                Inizia lo Shopping
              </button>
            </div>
          ) : (
            <ul className="cart-items-list">
              {cartItems.map((item) => (
                <li key={`${item.id}-${item.size}`} className="cart-item">
                  <img
                    src={item.immagine_url.startsWith('http') || item.immagine_url.startsWith('blob:') ? item.immagine_url : (item.immagine_url.startsWith('/') ? item.immagine_url : `/${item.immagine_url}`)}
                    alt={item.titolo}
                    className="cart-item-image"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="cart-item-details">
                    <h4 className="cart-item-title">{item.titolo}</h4>
                    <p className="cart-item-meta">Taglia: <strong>{item.size}</strong></p>
                    <span className="cart-item-price">€{(item.prezzo * item.quantity).toFixed(2)}</span>

                    {/* Quantità & Rimozione */}
                    <div className="cart-item-actions">
                      <div className="qty-selector">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          aria-label="Riduci quantità di 1"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-number" aria-label={`Quantità: ${item.quantity}`}>{item.quantity}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          aria-label="Aumenta quantità di 1"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => removeFromCart(item.id, item.size)}
                        aria-label={`Rimuovi ${item.titolo} taglia ${item.size} dal carrello`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer del carrello con calcolo totale */}
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span>Totale Parziale:</span>
              <span className="cart-total-amount">€{cartTotal.toFixed(2)}</span>
            </div>
            <p className="shipping-info-text">Spedizione calcolata al checkout. Ritiro gratuito in negozio.</p>
            
            <button 
              className="btn-primary checkout-btn" 
              onClick={onCheckout}
            >
              Procedi al Checkout
              <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </button>
          </div>
        )}
      </aside>

      <style>{`
        .cart-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(44, 37, 32, 0.4);
          backdrop-filter: blur(4px);
          z-index: 150;
          display: flex;
          justify-content: flex-end;
        }

        .cart-drawer {
          width: 100%;
          max-width: 440px;
          height: 100%;
          background-color: var(--bg-secondary);
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .cart-header {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cart-header h3 {
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .close-drawer-btn {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          color: var(--text-primary);
        }

        .close-drawer-btn:hover {
          background-color: var(--bg-primary);
        }

        .cart-body {
          flex-grow: 1;
          overflow-y: auto;
          padding: var(--spacing-lg);
        }

        .empty-cart-state {
          text-align: center;
          padding: var(--spacing-xl) 0;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
        }

        .cart-items-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .cart-item {
          display: flex;
          gap: var(--spacing-md);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: var(--spacing-md);
        }

        .cart-item-image {
          width: 80px;
          height: 100px;
          object-fit: cover;
          border-radius: var(--radius-sm);
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-color);
        }

        .cart-item-details {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }

        .cart-item-title {
          font-size: 1rem;
          margin-bottom: 2px;
          color: var(--text-primary);
          font-family: var(--font-sans);
          font-weight: 600;
        }

        .cart-item-meta {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-sm);
        }

        .cart-item-price {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: var(--font-serif);
          margin-bottom: var(--spacing-sm);
        }

        .cart-item-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .qty-selector {
          display: flex;
          align-items: center;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          overflow: hidden;
          background-color: var(--bg-primary);
        }

        .qty-btn {
          width: 32px;
          height: 32px;
          background-color: transparent;
          color: var(--text-secondary);
        }

        .qty-btn:hover {
          background-color: var(--border-color);
          color: var(--text-primary);
        }

        .qty-number {
          padding: 0 var(--spacing-sm);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .remove-item-btn {
          width: 36px;
          height: 36px;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
        }

        .remove-item-btn:hover {
          color: var(--error);
          background-color: rgba(201, 42, 42, 0.05);
        }

        .cart-footer {
          padding: var(--spacing-lg);
          border-top: 1px solid var(--border-color);
          background-color: var(--bg-primary);
        }

        .cart-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .cart-total-amount {
          font-size: 1.35rem;
          font-family: var(--font-serif);
          font-weight: 700;
        }

        .shipping-info-text {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-md);
        }

        .checkout-btn {
          width: 100%;
        }

        .shipping-progress-banner {
          background-color: var(--accent-soft-gold);
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--border-color);
          text-align: center;
        }

        .shipping-nudge-text {
          font-size: 0.85rem;
          color: var(--text-primary);
          margin-bottom: var(--spacing-sm);
        }

        .progress-bar-bg {
          width: 100%;
          height: 6px;
          background-color: var(--border-color);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background-color: var(--accent-gold-hover);
          transition: width 0.4s ease;
          border-radius: var(--radius-full);
        }

        .shipping-success-text {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--success);
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
