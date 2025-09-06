const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.auth = null;
  }

  setAuth(auth) {
    this.auth = auth;
  }

  async request(endpoint, options = {}) {
    try {
      // Get fresh token from auth context
      const token = this.auth?.user?.access_token;
      const url = `${API_BASE_URL}${endpoint}`;
      
      // Debug logging
      console.log('API request - token exists:', !!token);
      console.log('API request - token preview:', token?.substring(0, 20));
      console.log('API request - options.headers:', options.headers);
      
      // Always include Authorization header if we have a token
      const headers = {
        ...(token && { Authorization: `Bearer ${token}` })
      };
      
      console.log('API request - headers after auth:', headers);
      
      // Merge in custom headers
      if (options.headers) {
        Object.assign(headers, options.headers);
      }
      
      console.log('API request - headers after merge:', headers);
      
      // Set default Content-Type for JSON requests, but skip for FormData
      const isFormData = options.body instanceof FormData;
      if (!headers.hasOwnProperty('Content-Type') && !isFormData) {
        headers['Content-Type'] = 'application/json';
      }
      
      // Remove any headers with null/undefined values that might confuse fetch()
      Object.keys(headers).forEach(key => {
        if (headers[key] === null || headers[key] === undefined) {
          delete headers[key];
        }
      });
      
      console.log('API request - final headers:', headers);
      
      const config = {
        headers,
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
      // Don't set any headers for FormData - let browser handle Content-Type
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

  async deleteFile(collection, objectName) {
    return this.request(`/api/files/${collection}/${objectName}`, {
      method: 'DELETE'
    });
  }
}

const apiService = new ApiService();
export default apiService;
