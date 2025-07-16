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
    } else {
      delete this.defaultHeaders.Authorization;
    }
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
  },

  actividades: {
    getAll: () => apiClient.get('/api/v1/actividades'),
  },
};

export { apiClient };
export default apiClient;