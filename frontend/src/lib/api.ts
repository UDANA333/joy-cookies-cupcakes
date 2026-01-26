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

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface OrderData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  pickupDate: string;
  pickupTime: string;
  items: OrderItem[];
  total: number;
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
