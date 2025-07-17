// Simple API configuration for immediate testing
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  setAuthToken(token) {
    if (token) {
      this.defaultHeaders.Authorization = `Bearer ${token}`;
      console.log('🔑 Token set in API client:', token.substring(0, 20) + '...');
    } else {
      delete this.defaultHeaders.Authorization;
      console.log('🔑 Token cleared from API client');
    }
    console.log('📝 Current headers:', this.defaultHeaders);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    console.log('🌐 Making API request:', {
      url,
      method: config.method || 'GET',
      headers: config.headers
    });

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

  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }
}

const apiClient = new ApiClient();

export const api = {
  setAuthToken: (token) => apiClient.setAuthToken(token),
  health: () => apiClient.get('/health'),
  
  auth: {
    status: () => apiClient.get('/api/v1/auth/status'),
    me: () => apiClient.get('/api/v1/auth/me'),
  },

  parcelas: {
    getAll: () => apiClient.get('/api/v1/parcelas'),
    create: (data) => apiClient.post('/api/v1/parcelas/', data),
    update: (id, data) => apiClient.request(`/api/v1/parcelas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => apiClient.request(`/api/v1/parcelas/${id}`, {
      method: 'DELETE',
    }),
    findByLocation: (coordinates) => apiClient.post('/api/v1/parcelas/find-by-location', coordinates),
  },

  actividades: {
    getAll: () => apiClient.get('/api/v1/actividades'),
    create: (data) => apiClient.post('/api/v1/actividades/', data),
    update: (id, data) => apiClient.request(`/api/v1/actividades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => apiClient.request(`/api/v1/actividades/${id}`, {
      method: 'DELETE',
    }),
    getStats: () => apiClient.get('/api/v1/actividades/stats'),
  },
};

export { apiClient };
export default api;