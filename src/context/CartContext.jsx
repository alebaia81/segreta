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

  const addToCart = (articolo, size) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.id === articolo.id && item.size === size
      );

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      }

      return [...prevItems, { ...articolo, size, quantity: 1 }];
    });
  };

  const removeFromCart = (articoloId, size) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => !(item.id === articoloId && item.size === size))
    );
  };

  const updateQuantity = (articoloId, size, newQty) => {
    if (newQty <= 0) {
      removeFromCart(articoloId, size);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === articoloId && item.size === size
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
