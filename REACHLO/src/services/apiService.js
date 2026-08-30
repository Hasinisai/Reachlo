import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/apiConfig';

const TOKEN_KEY = 'reachlo_token';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class ApiService {
  async getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...customHeaders,
    };

    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to load token from AsyncStorage', e);
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const headers = await this.getHeaders(options.headers || {});
    
    const config = {
      ...options,
      headers,
    };

    const isFormDataBody = config.body && (config.body instanceof FormData || typeof config.body.append === 'function');

    if (config.body && typeof config.body === 'object' && !isFormDataBody) {
      config.body = JSON.stringify(config.body);
    }

    if (isFormDataBody) {
      delete headers['Content-Type'];
    }

    try {
      const isFormData = config.body && (config.body instanceof FormData || config.body.append);
      const timeout = API_CONFIG.TIMEOUT ?? 10000;
      
      let response;
      if (isFormData) {
        // React Native fetch + AbortController + FormData often instantly fails on Android
        response = await fetch(url, config);
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        response = await fetch(url, { ...config, signal: controller.signal });
        clearTimeout(timeoutId);
      }

      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        const errorMessage = data?.detail || `Request failed with status: ${response.status}`;
        const err = new Error(errorMessage);
        err.status = response.status;
        throw err;
      }

      return data;
    } catch (error) {
      const message = error.name === 'AbortError'
        ? 'Request timed out. Please check your network or backend server.'
        : error.message || 'Network request failed';
      
      const isExpectedError = error.status && error.status >= 400 && error.status < 500;
      
      if (!isExpectedError) {
        console.error(`API Error on ${options.method || 'GET'} ${endpoint} (${url}):`, message);
      }
      
      const err = new Error(message);
      err.status = error.status;
      throw err;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiService = new ApiService();
export default apiService;
