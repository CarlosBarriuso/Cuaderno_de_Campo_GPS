// API configuration and utilities for frontend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

/**
 * Create API client with default configuration
 */
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make HTTP request to API
   */
  async request(endpoint, options = {}) {
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
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT', 
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// API endpoints for different resources
export const api = {
  // Health check
  health: () => apiClient.get('/health'),
  
  // Authentication endpoints
  auth: {
    login: (credentials) => apiClient.post('/api/auth/login', credentials),
    logout: () => apiClient.post('/api/auth/logout'),
    refresh: () => apiClient.post('/api/auth/refresh'),
  },

  // Parcelas endpoints
  parcelas: {
    getAll: () => apiClient.get('/api/parcelas'),
    getById: (id) => apiClient.get(`/api/parcelas/${id}`),
    create: (data) => apiClient.post('/api/parcelas', data),
    update: (id, data) => apiClient.put(`/api/parcelas/${id}`, data),
    delete: (id) => apiClient.delete(`/api/parcelas/${id}`),
  },

  // Actividades endpoints
  actividades: {
    getAll: (parcelaId) => apiClient.get(`/api/actividades?parcela=${parcelaId}`),
    getById: (id) => apiClient.get(`/api/actividades/${id}`),
    create: (data) => apiClient.post('/api/actividades', data),
    update: (id, data) => apiClient.put(`/api/actividades/${id}`, data),
    delete: (id) => apiClient.delete(`/api/actividades/${id}`),
  },
};

export default apiClient;