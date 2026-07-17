import { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { CookieProvider } from './context/CookieContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Shop from './pages/Shop';
import AdminDashboard from './pages/AdminDashboard';
import Carrello from './components/Carrello';
import CheckoutPage from './pages/CheckoutPage';
import ThankYouPage from './pages/ThankYouPage';
import CookieBanner from './components/CookieBanner';

// Articoli predefiniti inseriti come seed se localStorage è vuoto
const ARTICOLI_SEED = [
  {
    id: 1,
    titolo: 'Abito Lungo Floreale Spring',
    descrizione: 'Abito lungo fresco e colorato, ideale per le serate estive. Fantasia floreale accesa.',
    prezzo: 39.90,
    immagine_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
    target: 'Donna',
    categoria: 'Abiti',
    taglie: 'S,M,L',
    attivo: true
  },
  {
    id: 2,
    titolo: 'Blusa Frizzante Pastel',
    descrizione: 'Blusa in cotone leggero con maniche a sbuffo, colore pastello alla moda.',
    prezzo: 24.90,
    immagine_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
    target: 'Donna',
    categoria: 'Camicie e Bluse',
    taglie: 'M,L',
    attivo: true
  },
  {
    id: 3,
    titolo: 'Jeans Skinny High Waste',
    descrizione: 'Jeans denim elasticizzato a vita alta, vestibilità perfetta che valorizza la silhouette.',
    prezzo: 34.90,
    immagine_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
    target: 'Donna',
    categoria: 'Pantaloni',
    taglie: 'S,M,L,XL',
    attivo: true
  },
  {
    id: 4,
    titolo: 'Giacca Kimono Chic',
    descrizione: 'Giacca stile kimono con ricami floreali, perfetta per arricchire un look casual.',
    prezzo: 45.00,
    immagine_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
    target: 'Donna',
    categoria: 'Giacche',
    taglie: 'Unica',
    attivo: true
  },
  {
    id: 5,
    titolo: 'T-Shirt Segreta Style',
    descrizione: 'T-shirt in cotone biologico con stampa logo e dettagli ricamati in filo dorato.',
    prezzo: 19.90,
    immagine_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    target: 'Donna',
    categoria: 'T-Shirt',
    taglie: 'S,M,L',
    attivo: true
  }
];

function MainApp() {
  // Leggiamo il percorso dal browser per supportare i link diretti (come /admin)
  const [currentPath, setCurrentPath] = useState(window.location.pathname === '/' ? '/' : window.location.pathname);
  const [activeSection, setActiveSection] = useState('home');

  // Aggiorniamo l'URL del browser quando cambiamo pagina internamente
  useEffect(() => {
    window.history.pushState({}, '', currentPath);
  }, [currentPath]);

  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Carica articoli da localStorage o seed iniziale
  const [articoli, setArticoli] = useState(() => {
    const saved = localStorage.getItem('segreta_articoli');
    if (saved) {
      return JSON.parse(saved);
    } else {
      localStorage.setItem('segreta_articoli', JSON.stringify(ARTICOLI_SEED));
      return ARTICOLI_SEED;
    }
  });

  // Recupera gli articoli aggiornati dal database all'avvio
  useEffect(() => {
    const fetchArticoli = async () => {
      try {
        const response = await fetch('/api/prodotti/shop');
        if (!response.ok) throw new Error('API Response not OK');
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          const parsedData = json.data.map(item => ({
            id: Number(item.id),
            titolo: String(item.titolo),
            descrizione: String(item.descrizione || ''),
            prezzo: parseFloat(item.prezzo) || 0,
            immagine_url: String(item.immagine_url || ''),
            target: String(item.target || 'Donna'),
            categoria: String(item.categoria || ''),
            taglie: String(item.taglie || ''),
            attivo: Boolean(Number(item.attivo))
          }));
          setArticoli(parsedData);
        }
      } catch (err) {
        console.warn('Connessione al database fallita. Caricamento articoli da cache locale.', err);
      }
    };
    fetchArticoli();
  }, []);

  // Salva articoli quando cambiano per mantenere aggiornata la cache offline
  useEffect(() => {
    localStorage.setItem('segreta_articoli', JSON.stringify(articoli));
  }, [articoli]);

  // Gestione aggiunta articolo da admin
  const handleAddArticolo = (nuovoArt) => {
    setArticoli(prev => [nuovoArt, ...prev]);
  };

  // Gestione attivazione/disattivazione da admin
  const handleToggleArticolo = (artId) => {
    setArticoli(prev => prev.map(art => 
      art.id === artId ? { ...art, attivo: !art.attivo } : art
    ));
  };

  // Naviga verso lo shop
  const handleNavigateToShop = () => {
    setCurrentPath('/shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Naviga verso la home
  const handleNavigateToHome = () => {
    setCurrentPath('/');
    setActiveSection('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cambio schermata di checkout
  const handleCheckoutTransition = () => {
    setCartOpen(false);
    setCurrentPath('/checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToShopping = () => {
    setCurrentPath('/');
    setActiveSection('catalogo');
    setTimeout(() => {
      const element = document.getElementById('catalogo');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const isAdminPath = currentPath === '/admin';
  const hideHeaderNav = currentPath === '/admin' || currentPath === '/checkout' || currentPath === '/thank-you';

  return (
    <>
      {!hideHeaderNav && (
        <div className="promo-banner-top" role="banner" aria-label="Offerta promozionale">
          <span>✨ SPEDIZIONE GRATUITA PER ORDINI SUPERIORI A 50€ ✨</span>
        </div>
      )}
      {!hideHeaderNav && (
        <Navbar
          onOpenCart={() => setCartOpen(true)}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          currentPath={currentPath}
          setCurrentPath={setCurrentPath}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      <main>
        {currentPath === '/' && (
          <Home 
            articoli={articoli.filter(art => 
              art.titolo.toLowerCase().includes(searchQuery.toLowerCase()) || 
              art.descrizione.toLowerCase().includes(searchQuery.toLowerCase()) ||
              art.categoria.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            onNavigateToShop={handleNavigateToShop}
            onNavigateToAdmin={() => setCurrentPath('/admin')}
          />
        )}

        {currentPath === '/shop' && (
          <Shop
            articoli={articoli.filter(art =>
              art.titolo.toLowerCase().includes(searchQuery.toLowerCase()) ||
              art.descrizione.toLowerCase().includes(searchQuery.toLowerCase()) ||
              art.categoria.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            onNavigateToHome={handleNavigateToHome}
            onNavigateToAdmin={() => setCurrentPath('/admin')}
          />
        )}
        {currentPath === '/admin' && (
          <AdminDashboard 
            articoli={articoli}
            onAddArticolo={handleAddArticolo}
            onToggleArticolo={handleToggleArticolo}
          />
        )}

        {currentPath === '/checkout' && (
          <CheckoutPage onBackToShopping={handleBackToShopping} setCurrentPath={setCurrentPath} />
        )}

        {currentPath === '/thank-you' && (
          <ThankYouPage onBackToShopping={handleBackToShopping} />
        )}
      </main>

      {!hideHeaderNav && (
        <Carrello
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          onCheckout={handleCheckoutTransition}
        />
      )}

      {/* Cookie Banner — visibile globalmente */}
      {!isAdminPath && <CookieBanner />}
    </>
  );
}

export default function App() {
  return (
    <CookieProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </CookieProvider>
  );
}
