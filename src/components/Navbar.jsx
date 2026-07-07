import { useState } from 'react';
import { ShoppingBag, Menu, X, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Navbar({ onOpenCart, activeSection, setActiveSection, currentPath, setCurrentPath, searchQuery, setSearchQuery }) {
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'shop', label: 'Shop', path: '/shop' },
    { id: 'chi-sono', label: 'La Nostra Storia', path: '/', section: true }
  ];


  const handleNavClick = (item) => {
    setMobileMenuOpen(false);
    if (item.path === '/admin') {
      setCurrentPath('/admin');
    } else if (item.path === '/shop') {
      setCurrentPath('/shop');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (item.section) {
      // Voce con sezione ancora in-page (chi-sono)
      setCurrentPath('/');
      setActiveSection(item.id);
      setTimeout(() => {
        const element = document.getElementById(item.id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      setCurrentPath('/');
      setActiveSection(item.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  const handleLogoClick = () => {
    setCurrentPath('/');
    setActiveSection('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <nav className="navbar-container">
        <div className="container navbar-content">
          <button 
            className="navbar-brand" 
            onClick={handleLogoClick}
            aria-label="Segreta Style Home"
          >
            <img 
              src="/logo.png" 
              alt="Segreta Style Logo" 
              className="navbar-logo"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <span className="navbar-logo-text" style={{ display: 'none' }}>SEGRETA STYLE</span>
          </button>

          {/* Desktop Navigation */}
          <ul className="navbar-links-desktop">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-btn ${
                    (currentPath === item.path && item.path !== '/' ) ||
                    (item.path === '/' && !item.section && currentPath === '/' && activeSection === item.id) ||
                    (item.section && currentPath === '/' && activeSection === item.id)
                      ? 'active' 
                      : ''
                  }`}
                  onClick={() => handleNavClick(item)}
                  aria-current={
                    (currentPath === item.path && item.path !== '/') ||
                    (item.path === '/' && currentPath === '/' && activeSection === item.id)
                      ? 'page' 
                      : undefined
                  }
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="navbar-actions">
            {/* Search Input field that slides open */}
            <div className={`search-container-nav ${searchOpen ? 'open' : ''}`}>
              <input
                type="text"
                placeholder="Cerca prodotti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-nav"
                aria-label="Cerca nel catalogo"
              />
            </div>
            
            <button
              className={`search-toggle-btn ${searchOpen ? 'active' : ''}`}
              onClick={() => {
                setSearchOpen(!searchOpen);
                if (searchOpen) {
                  setSearchQuery(''); // Pulisce la ricerca alla chiusura
                }
              }}
              aria-label="Cerca prodotti"
            >
              {searchOpen ? <X size={20} /> : <Search size={22} strokeWidth={1.5} />}
            </button>

            {/* Pulsante carrello con area di tocco 44x44px */}
            <button
              className="cart-toggle-btn"
              onClick={onOpenCart}
              aria-label={`Carrello con ${cartCount} articoli`}
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="cart-badge-count fade-in">{cartCount}</span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Apri menu di navigazione"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Panel */}
      <div className={`mobile-nav-panel ${mobileMenuOpen ? 'open' : ''}`}>
        <ul className="mobile-nav-links">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                className={`mobile-nav-btn ${
                  (currentPath === item.path && item.path !== '/') ||
                  (item.path === '/' && currentPath === '/' && activeSection === item.id)
                    ? 'active'
                    : ''
                }`}
                onClick={() => handleNavClick(item)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .navbar-container {
          position: sticky;
          top: 0;
          z-index: 100;
          background-color: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-color);
          height: 110px;
          display: flex;
          align-items: center;
          transition: var(--transition-smooth);
        }
        
        .navbar-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          min-height: 93px;
        }

        .navbar-logo {
          max-height: 93px;
          object-fit: contain;
          transition: var(--transition-smooth);
        }

        .navbar-logo-text {
          font-family: var(--font-serif);
          font-size: 1.4rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: var(--text-primary);
        }

        .navbar-links-desktop {
          display: flex;
          list-style: none;
          gap: var(--spacing-lg);
        }

        .nav-btn {
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-secondary);
          position: relative;
          padding: var(--spacing-sm) 0;
          min-height: 44px;
        }

        .nav-btn::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 1px;
          background-color: var(--text-primary);
          transition: var(--transition-smooth);
          transform: translateX(-50%);
        }

        .nav-btn:hover {
          color: var(--text-primary);
        }

        .nav-btn:hover::after,
        .nav-btn.active::after {
          width: 100%;
        }

        .nav-btn.active {
          color: var(--text-primary);
          font-weight: 600;
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .cart-toggle-btn {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          color: var(--text-primary);
          border: 1px solid transparent;
        }

        .cart-toggle-btn:hover {
          background-color: var(--bg-tertiary);
          border-color: var(--border-color);
        }

        .search-container-nav {
          width: 0;
          overflow: hidden;
          transition: var(--transition-smooth);
          display: flex;
          align-items: center;
        }

        .search-container-nav.open {
          width: 180px;
          margin-right: var(--spacing-sm);
        }

        .search-input-nav {
          width: 100%;
          padding: 0.4rem 0.8rem;
          font-size: 0.85rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          outline: none;
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        .search-input-nav:focus {
          border-color: var(--accent-gold);
        }

        .search-toggle-btn {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          color: var(--text-primary);
          border: 1px solid transparent;
        }

        .search-toggle-btn:hover,
        .search-toggle-btn.active {
          background-color: var(--bg-tertiary);
          border-color: var(--border-color);
        }

        .cart-badge-count {
          position: absolute;
          top: 4px;
          right: 4px;
          background-color: var(--text-primary);
          color: var(--bg-secondary);
          font-size: 0.7rem;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-menu-toggle {
          display: none;
          width: 44px;
          height: 44px;
        }

        .mobile-nav-panel {
          position: fixed;
          top: 70px;
          left: 0;
          width: 100%;
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          z-index: 99;
          transform: translateY(-100%);
          opacity: 0;
          visibility: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-md);
        }

        .mobile-nav-panel.open {
          transform: translateY(0);
          opacity: 1;
          visibility: visible;
        }

        .mobile-nav-links {
          list-style: none;
          padding: var(--spacing-md) var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .mobile-nav-btn {
          width: 100%;
          justify-content: flex-start;
          padding: 0.8rem 0;
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-secondary);
          border-bottom: 1px solid rgba(0, 0, 0, 0.03);
          min-height: 44px;
        }

        .mobile-nav-btn.active {
          color: var(--text-primary);
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .navbar-links-desktop {
            display: none;
          }
          
          .mobile-menu-toggle {
            display: inline-flex;
          }
        }
      `}</style>
    </>
  );
}
