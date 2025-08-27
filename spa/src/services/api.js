import { getToken, updateToken } from './keycloak';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  async request(endpoint, options = {}) {
    try {
      // Ensure token is fresh
      await updateToken();
      
      const token = getToken();
      const url = `${API_BASE_URL}${endpoint}`;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers
        },
        ...options
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Handle different content types
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return response;
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User endpoints
  async getUserInfo() {
    return this.request('/api/me');
  }

  async getHealth() {
    return this.request('/api/health');
  }

  // File endpoints
  async uploadFile(file, collection, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection', collection);
    formData.append('metadata', JSON.stringify(metadata));

    return this.request('/api/files/upload', {
      method: 'POST',
      headers: {}, // Don't set Content-Type for FormData
      body: formData
    });
  }

  async listFiles(collection) {
    return this.request(`/api/files/list/${collection}`);
  }

  async downloadFile(collection, objectName) {
    return this.request(`/api/files/download/${collection}/${objectName}`);
  }

  async getPresignedUrl(collection, objectName, expires = 3600) {
    return this.request(`/api/files/presigned/${collection}/${objectName}?expires=${expires}`);
  }
}

export default new ApiService();
