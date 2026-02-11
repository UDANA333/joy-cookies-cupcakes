import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react";

const NOTIFICATION_DURATION = 3000;
const CART_STORAGE_KEY = 'joy-cookies-cart';
const ADD_DEBOUNCE_MS = 300;

// Interface for items selected in a box
export interface BoxItem {
  id: string;
  name: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  // Box-specific fields
  isBox?: boolean;
  boxItems?: BoxItem[];  // List of selected items in the box
  boxCategory?: string;  // Category of items in the box (cookies/cupcakes)
  boxSize?: number;      // Number of items in the box
  cartId?: string;       // Unique cart item ID (for boxes with different selections)
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
    // For box items, generate a unique cart ID based on selected items
    const cartItemId = newItem.isBox && newItem.boxItems 
      ? `${newItem.id}-${newItem.boxItems.map(bi => bi.id).sort().join('-')}`
      : newItem.id;
    
    console.log('[CartContext] addItem called', { id: cartItemId, name: newItem.name, isBox: newItem.isBox, timestamp: Date.now() });
    
    // Debounce: prevent rapid duplicate adds of the same item
    const now = Date.now();
    const lastAdd = lastAddTimeRef.current.get(cartItemId) || 0;
    if (now - lastAdd < ADD_DEBOUNCE_MS) {
      console.log('[CartContext] DEBOUNCED - too soon after last add for', cartItemId);
      return; // Ignore rapid duplicate add
    }
    lastAddTimeRef.current.set(cartItemId, now);
    
    console.log('[CartContext] Actually adding item to cart', cartItemId);
    setItems((prev) => {
      // For box items, match by the generated cart ID
      const existingIndex = prev.findIndex((item) => {
        if (newItem.isBox && newItem.boxItems) {
          // For boxes, compare by the cart ID which includes selected items
          const existingCartId = item.isBox && item.boxItems
            ? `${item.id}-${item.boxItems.map(bi => bi.id).sort().join('-')}`
            : item.id;
          return existingCartId === cartItemId;
        }
        return item.id === newItem.id;
      });
      
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
      // Store with the cart ID for box items
      const itemToAdd = newItem.isBox ? { ...newItem, cartId: cartItemId } : newItem;
      return [...prev, { ...itemToAdd, quantity: newItem.quantity || 1 }];
    });
  }, []);

  const removeItem = (id: string) => {
    // id could be either a regular product id or a cartId for box items
    setItems((prev) => prev.filter((item) => (item.cartId || item.id) !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    // id could be either a regular product id or a cartId for box items
    setItems((prev) =>
      prev.map((item) => ((item.cartId || item.id) === id ? { ...item, quantity } : item))
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
