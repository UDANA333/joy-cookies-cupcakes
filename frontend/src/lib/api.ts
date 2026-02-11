// API service for backend communication
// Dynamically determine API URL based on current host (for mobile access via network IP)
function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // If accessing via network IP, use same IP for API
  const host = window.location.hostname;
  if (host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:3001/api`;
  }
  return 'http://localhost:3001/api';
}

const API_BASE_URL = getApiBaseUrl();

interface BoxItem {
  id: string;
  name: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  isBox?: boolean;
  boxItems?: BoxItem[];
}

interface PaymentDetails {
  transactionId: string;
  paymentMethod: string;
  payerEmail?: string;
  depositPaid: boolean;
}

interface OrderData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  pickupDate: string;
  pickupTime: string;
  items: OrderItem[];
  total: number;
  depositAmount?: number;
  remainingBalance?: number;
  paymentDetails?: PaymentDetails;
}

interface OrderResponse {
  success: boolean;
  orderNumber: string;
  message: string;
}

interface ContactData {
  name: string;
  email: string;
  message: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
}

interface ApiError {
  success: false;
  message: string;
}

// Submit order to backend
export async function submitOrder(orderData: OrderData): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as ApiError).message || 'Failed to submit order');
  }

  return data as OrderResponse;
}

// Get order by order number
export async function getOrder(orderNumber: string) {
  const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as ApiError).message || 'Order not found');
  }

  return data;
}

// Pay remaining balance for an order
export async function payRemainingBalance(
  orderNumber: string,
  paymentDetails: {
    transactionId: string;
    paymentMethod: string;
    payerEmail?: string;
  }
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}/pay-balance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentDetails),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as ApiError).message || 'Failed to process payment');
  }

  return data;
}

// Submit contact form
export async function submitContact(contactData: ContactData): Promise<ContactResponse> {
  const response = await fetch(`${API_BASE_URL}/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contactData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as ApiError).message || 'Failed to send message');
  }

  return data as ContactResponse;
}

// Product interface
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image_path: string;
  is_available: number;
  display_order: number;
  is_box?: number;
  box_category?: string | null;
  box_size?: number | null;
}

// Fetch available products from API
export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// ============================================
// SEASONAL THEMES API
// ============================================

export interface SeasonalTheme {
  id: string;
  name: string;
  slug: string;
  category_slug: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  icon: string;
  banner_text: string | null;
  banner_subtext: string | null;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SeasonalPreset {
  name: string;
  icon: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  banner_text: string;
  banner_subtext: string;
}

export interface ActiveSeasonalData {
  theme: SeasonalTheme | null;
  products: Product[];
}

// Fetch active seasonal theme with products (public)
export async function fetchActiveSeasonalTheme(): Promise<ActiveSeasonalData> {
  try {
    const response = await fetch(`${API_BASE_URL}/seasonal/active`);
    if (!response.ok) {
      throw new Error('Failed to fetch active seasonal theme');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching active seasonal theme:', error);
    return { theme: null, products: [] };
  }
}

// Fetch all seasonal themes (public)
export async function fetchSeasonalThemes(): Promise<SeasonalTheme[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/seasonal/themes`);
    if (!response.ok) {
      throw new Error('Failed to fetch seasonal themes');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching seasonal themes:', error);
    return [];
  }
}
