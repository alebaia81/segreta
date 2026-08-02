/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve essere utilizzato all\'interno di un CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('segreta_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('segreta_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (articolo, size, color = null, customImage = null) => {
    const matchSconto = articolo.descrizione ? articolo.descrizione.match(/\[SCONTO:(\d+)\]/) : null;
    const scontoPercent = matchSconto ? parseInt(matchSconto[1]) : 0;
    const prezzoEffettivo = scontoPercent > 0 
      ? articolo.prezzo - (articolo.prezzo * scontoPercent) / 100 
      : articolo.prezzo;

    const articoloConPrezzoScontato = {
      ...articolo,
      prezzo: prezzoEffettivo,
      immagine_url: customImage || articolo.immagine_url
    };

    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.id === articoloConPrezzoScontato.id && item.size === size && (item.color || null) === (color || null)
      );

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      }

      return [...prevItems, { ...articoloConPrezzoScontato, size, color, quantity: 1 }];
    });
  };

  const removeFromCart = (articoloId, size, color = null) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => !(item.id === articoloId && item.size === size && (item.color || null) === (color || null)))
    );
  };

  const updateQuantity = (articoloId, size, newQty, color = null) => {
    if (newQty <= 0) {
      removeFromCart(articoloId, size, color);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === articoloId && item.size === size && (item.color || null) === (color || null)
          ? { ...item, quantity: newQty }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.prezzo * item.quantity,
    0
  );

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
