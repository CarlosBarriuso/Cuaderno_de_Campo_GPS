// API configuration and utilities for frontend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004'; // Using auth test server

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
    login: (credentials: any) => apiClient.post('/api/auth/login', credentials),
    logout: () => apiClient.post('/api/auth/logout'),
    refresh: () => apiClient.post('/api/auth/refresh'),
    status: () => apiClient.get('/api/auth/status'),
    me: () => apiClient.get('/api/auth/me'),
  },

  // Parcelas endpoints
  parcelas: {
    getAll: () => apiClient.get('/api/parcelas'),
    getById: (id: string) => apiClient.get(`/api/parcelas/${id}`),
    create: (data: any) => apiClient.post('/api/parcelas', data),
    update: (id: string, data: any) => apiClient.put(`/api/parcelas/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/parcelas/${id}`),
  },

  // Actividades endpoints
  actividades: {
    getAll: (parcelaId?: string) => apiClient.get(`/api/actividades${parcelaId ? `?parcela=${parcelaId}` : ''}`),
    getById: (id: string) => apiClient.get(`/api/actividades/${id}`),
    create: (data: any) => apiClient.post('/api/actividades', data),
    update: (id: string, data: any) => apiClient.put(`/api/actividades/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/actividades/${id}`),
  },

  // SIGPAC endpoints
  sigpac: {
    getByReference: (referencia: string) => apiClient.get(`/api/sigpac/${referencia}`),
    validateReference: (referencia: string) => apiClient.get(`/api/sigpac/validate/${referencia}`),
  },
};

export default apiClient;