import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react";

const NOTIFICATION_DURATION = 3000;
const CART_STORAGE_KEY = 'joy-cookies-cart';
const ADD_DEBOUNCE_MS = 300;

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
}

export interface CartNotification {
  message: string;
  description?: string;
  visible: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  notification: CartNotification;
  showNotification: (message: string, description?: string) => void;
  hideNotification: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Initialize cart from localStorage
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [notification, setNotification] = useState<CartNotification>({
    message: "",
    description: "",
    visible: false,
  });
  
  // Ref for timeout cleanup
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  // Track last add time per item to debounce rapid adds
  const lastAddTimeRef = useRef<Map<string, number>>(new Map());

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage might be full or disabled
    }
  }, [items]);

  const showNotification = useCallback((message: string, description?: string) => {
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ message, description, visible: true });
    // Auto-hide after duration
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, NOTIFICATION_DURATION);
  }, []);

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, visible: false }));
  }, []);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    console.log('[CartContext] addItem called', { id: newItem.id, name: newItem.name, timestamp: Date.now() });
    
    // Debounce: prevent rapid duplicate adds of the same item
    const now = Date.now();
    const lastAdd = lastAddTimeRef.current.get(newItem.id) || 0;
    if (now - lastAdd < ADD_DEBOUNCE_MS) {
      console.log('[CartContext] DEBOUNCED - too soon after last add for', newItem.id);
      return; // Ignore rapid duplicate add
    }
    lastAddTimeRef.current.set(newItem.id, now);
    
    console.log('[CartContext] Actually adding item to cart', newItem.id);
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.id === newItem.id
      );
      
      if (existingIndex > -1) {
        // IMPORTANT: Create a NEW object to avoid mutation!
        // Don't mutate prev[existingIndex].quantity directly
        const newQuantity = prev[existingIndex].quantity + (newItem.quantity || 1);
        console.log('[CartContext] Updated existing item, new quantity:', newQuantity);
        return prev.map((item, index) => 
          index === existingIndex 
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      
      console.log('[CartContext] Added new item to cart');
      return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
    });
  }, []);

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        notification,
        showNotification,
        hideNotification,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
