import api from '../config/api';
import { SupplementProduct, Order, SalesData, SupplementBrand, SupplementCategory } from '../types';

// ==================== PRODUCTS API ====================

export const productsApi = {
  // Get all products with optional filters
  getAll: async (filters?: {
    category?: string;
    brand?: string;
    search?: string;
    lowStock?: number;
    nearExpiry?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/products?${params.toString()}`);
    return response.data.products;
  },

  // Get single product
  getById: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data.product;
  },

  // Create new product
  create: async (productData: FormData | any) => {
    const response = await api.post('/products', productData, {
      headers: productData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data.product;
  },

  // Update product
  update: async (id: string, productData: FormData | Partial<SupplementProduct>) => {
    const response = await api.put(`/products/${id}`, productData, {
      headers: productData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data.product;
  },

  // Delete product
  delete: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Delete a specific unit from a product
  deleteUnit: async (productId: string, unitId: string) => {
    const response = await api.delete(`/products/${productId}/units/${unitId}`);
    return response.data;
  },
};

// ==================== ORDERS API ====================

export const ordersApi = {
  // Get all orders with optional filters
  getAll: async (filters?: {
    status?: 'pending' | 'fulfilled';
    soldBy?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/orders?${params.toString()}`);
    return response.data.orders;
  },

  // Get single order
  getById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data.order;
  },

  // Create new order
  create: async (orderData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    products: Array<{ productId: string; quantity: number }>;
    discountAmount?: number;
    soldBy: string;
    notes?: string;
    orderDate?: string;
  }) => {
    const response = await api.post('/orders', orderData);
    return response.data.order;
  },

  // Update order (mainly status)
  update: async (id: string, updateData: { status?: 'pending' | 'fulfilled'; notes?: string }) => {
    const response = await api.put(`/orders/${id}`, updateData);
    return response.data.order;
  },
};

// ==================== ANALYTICS API ====================

export const analyticsApi = {
  // Get sales data
  getSales: async (filters?: {
    period?: 'month' | 'year';
    value?: string;
    groupBy?: string;
    includeRevenue?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/analytics/sales?${params.toString()}`);
    return response.data.salesData;
  },

  // Get dashboard stats
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },
};

// ==================== INVENTORY API ====================

export const inventoryApi = {
  // Get inventory alerts
  getAlerts: async (filters?: {
    type?: 'expiry' | 'lowStock';
    months?: string; // comma-separated: "1,3,6"
    threshold?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/inventory/alerts?${params.toString()}`);
    return response.data;
  },

  // Update product quantity
  updateQuantity: async (id: string, quantity: number) => {
    const response = await api.put(`/inventory/${id}/quantity`, { quantity });
    return response.data.product;
  },
};

// ==================== METADATA API ====================

export const metadataApi = {
  // Get all categories
  getCategories: async () => {
    const response = await api.get('/metadata/categories');
    return response.data.categories;
  },

  // Get all brands
  getBrands: async () => {
    const response = await api.get('/metadata/brands');
    return response.data.brands;
  },

  // Create category
  createCategory: async (categoryData: {
    name: string;
    type: string;
    description?: string;
    image?: string;
  }) => {
    const response = await api.post('/metadata/categories', categoryData);
    return response.data.category;
  },

  // Create brand
  createBrand: async (brandData: {
    name: string;
    description?: string;
    logo?: string;
    image?: string;
  }) => {
    const response = await api.post('/metadata/brands', brandData);
    return response.data.brand;
  },
};

// ==================== USERS API ====================

export const usersApi = {
  // Get all users
  getAll: async () => {
    const response = await api.get('/users');
    return response.data.users;
  },

  // Signup
  signup: async (userData: FormData) => {
    const response = await api.post('/users/signup', userData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Login
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  },

  // Update user
  update: async (id: string, userData: { name?: string; email?: string; role?: string }) => {
    const response = await api.patch(`/users/${id}`, userData);
    return response.data.user;
  },

  // Delete user
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

