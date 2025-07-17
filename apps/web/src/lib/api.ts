// API configuration and utilities for frontend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; // Using FastAPI backend

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Create API client with default configuration
 */
class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null) {
    if (token) {
      this.defaultHeaders.Authorization = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders.Authorization;
    }
  }

  /**
   * Make HTTP request to API
   */
  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * POST request
   */
  async post(endpoint: string, data?: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put(endpoint: string, data?: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export the client instance for direct access
export { apiClient };

// API endpoints for different resources
export const api = {
  // Add setAuthToken method to api object
  setAuthToken: (token: string | null) => apiClient.setAuthToken(token),
  // Health check
  health: () => apiClient.get('/health'),
  
  // Authentication endpoints
  auth: {
    login: (credentials: any) => apiClient.post('/api/v1/auth/login', credentials),
    logout: () => apiClient.post('/api/v1/auth/logout'),
    refresh: () => apiClient.post('/api/v1/auth/refresh'),
    status: () => apiClient.get('/api/v1/auth/status'),
    me: () => apiClient.get('/api/v1/auth/me'),
  },

  // Subscription endpoints
  subscription: {
    plans: () => apiClient.get('/api/v1/subscription/plans'),
    current: () => apiClient.get('/api/v1/subscription/current'),
    upgrade: (planId: string) => apiClient.post('/api/v1/subscription/upgrade', { plan_id: planId }),
    cancel: () => apiClient.post('/api/v1/subscription/cancel'),
    usage: () => apiClient.get('/api/v1/subscription/usage'),
    billingHistory: (limit?: number) => apiClient.get(`/api/v1/subscription/billing/history${limit ? `?limit=${limit}` : ''}`),
  },

  // Parcelas endpoints
  parcelas: {
    getAll: () => apiClient.get('/api/v1/parcelas'),
    getById: (id: string) => apiClient.get(`/api/v1/parcelas/${id}`),
    create: (data: any) => apiClient.post('/api/v1/parcelas', data),
    update: (id: string, data: any) => apiClient.put(`/api/v1/parcelas/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/v1/parcelas/${id}`),
  },

  // Actividades endpoints
  actividades: {
    getAll: (parcelaId?: string) => apiClient.get(`/api/v1/actividades${parcelaId ? `?parcela=${parcelaId}` : ''}`),
    getById: (id: string) => apiClient.get(`/api/v1/actividades/${id}`),
    create: (data: any) => apiClient.post('/api/v1/actividades', data),
    update: (id: string, data: any) => apiClient.put(`/api/v1/actividades/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/v1/actividades/${id}`),
  },

  // SIGPAC endpoints
  sigpac: {
    getByReference: (referencia: string) => apiClient.get(`/api/v1/sigpac/${referencia}`),
    validateReference: (referencia: string) => apiClient.get(`/api/v1/sigpac/validate/${referencia}`),
  },

};

export default apiClient;