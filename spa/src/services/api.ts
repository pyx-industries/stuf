// TODO: Cleanup any type assertions

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface AuthContext {
  user?: {
    access_token?: string;
  };
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

class ApiService {
  private auth: AuthContext | null = null;

  setAuth(auth: AuthContext) {
    this.auth = auth;
  }

  async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
    try {
      const token = this.auth?.user?.access_token;
      const url = `${API_BASE_URL}${endpoint}`;
      
      // Always include Authorization header if we have a token
      const headers: any = {
        ...(token && { Authorization: `Bearer ${token}` })
      };

      // Merge in custom headers
      if (options.headers) {
        Object.assign(headers, options.headers);
      }
      
      // Set default Content-Type for JSON requests, but skip for FormData
      const isFormData = options.body instanceof FormData;
      if (!headers('Content-Type') && !isFormData) {
        headers['Content-Type'] = 'application/json';
      }
      
      // Remove any headers with null/undefined values that might confuse fetch()
      Object.keys(headers).forEach(key => {
        if (headers[key] === null || headers[key] === undefined) {
          delete headers[key];
        }
      });
      
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
  async uploadFile(file: File, collection: string, metadata: Record<string, any> = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    return this.request(`/api/files/${collection}`, {
      method: 'POST',
      body: formData
    });
  }

  async listFiles(collection: string) {
    return this.request(`/api/files/${collection}`);
  }

  async downloadFile(collection: string, objectName: string) {
    return this.request(`/api/files/${collection}/${objectName}`);
  }

  async getPresignedUrl(collection: string, objectName: string, expires: number = 3600) {
    return this.request(`/api/files/presigned/${collection}/${objectName}?expires=${expires}`);
  }

  async deleteFile(collection: string, objectName: string) {
    return this.request(`/api/files/${collection}/${objectName}`, {
      method: 'DELETE'
    });
  }
}

const apiService = new ApiService();
export default apiService;
