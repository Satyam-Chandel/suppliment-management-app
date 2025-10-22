export type SupplementType = "whey-protein" | "creatine" | "peanut-butter" | "pre-workout" | "other";

export interface SupplementCategory {
  id: string;
  name: string;
  image: string;
  description: string;
  type: string;
}

export interface SupplementBrand {
  id: string;
  name: string;
  description: string;
  logo?: string;
  image?: string;
}

export interface ProductUnit {
  _id?: string;
  serialNumber: string;
  expiryDate: string;
  status: 'available' | 'sold' | 'expired' | 'damaged';
  soldDate?: string;
  orderId?: string;
}

export interface SupplementProduct {
  id: string;
  name: string;
  brand: string;
  type: SupplementType;
  flavor: string;
  weight: string;
  price: number;
  costPrice: number;
  quantity: number;
  units?: ProductUnit[];
  expiryDate?: string; // Deprecated, kept for backward compatibility
  image?: string;
  description?: string;
  dateAdded?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  products: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: 'pending' | 'fulfilled';
  orderDate: string;
  soldBy: string; // Added soldBy field
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface SalesData {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  month: string;
}