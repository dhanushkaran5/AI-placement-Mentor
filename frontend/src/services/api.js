const ENV_API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = (ENV_API_URL && ENV_API_URL.trim() !== '') ? ENV_API_URL.replace(/\/$/, '') : 'http://localhost:5000/api';

const DEFAULT_TIMEOUT_MS = 12000;

/**
 * Fetch wrapper with timeout and robust error extraction
 */
const fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s. Backend server might be busy or starting up.`);
    }
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Backend server is currently offline or unreachable. Please ensure the backend server is running on port 5000.');
    }
    throw err;
  }
};

const getHeaders = (extraHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await res.text();
      data = { message: text };
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errorMessage = data?.error || data?.message || `Request failed with status ${res.status} (${res.statusText})`;
    const error = new Error(errorMessage);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data || {};
};

export const api = {
  baseUrl: BASE_URL,

  get: async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: getHeaders(options.headers)
    }, options.timeoutMs);
    return handleResponse(res);
  },

  post: async (endpoint, body, options = {}) => {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: getHeaders(options.headers),
      body: JSON.stringify(body)
    }, options.timeoutMs);
    return handleResponse(res);
  },

  put: async (endpoint, body, options = {}) => {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const res = await fetchWithTimeout(url, {
      method: 'PUT',
      headers: getHeaders(options.headers),
      body: JSON.stringify(body)
    }, options.timeoutMs);
    return handleResponse(res);
  },

  delete: async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const res = await fetchWithTimeout(url, {
      method: 'DELETE',
      headers: getHeaders(options.headers)
    }, options.timeoutMs);
    return handleResponse(res);
  },

  upload: async (endpoint, formData, options = {}) => {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: formData
    }, options.timeoutMs || 30000); // 30s timeout for file parsing
    return handleResponse(res);
  },

  checkHealth: async () => {
    try {
      const url = `${BASE_URL}/health`;
      const res = await fetchWithTimeout(url, { method: 'GET' }, 3000);
      return res.ok;
    } catch {
      return false;
    }
  }
};

export default api;
