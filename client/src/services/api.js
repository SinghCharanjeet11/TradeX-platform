import axios from 'axios'

// Get API URL from environment variable
// VITE_API_URL must be set at build time for production
// Fallback to production API URL if env var is not set and we're on the production domain
const getApiUrl = () => {
  // First, try the environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Fallback: if we're on the production frontend domain, use the production API
  if (typeof window !== 'undefined' && window.location.hostname === 'tradex-platform.onrender.com') {
    return 'https://tradex-api-zsyj.onrender.com'
  }
  
  // Default: empty string (relative URLs for local development with proxy)
  return ''
}

const API_URL = getApiUrl()

// Debug logging for production troubleshooting
if (import.meta.env.MODE !== 'development') {
  console.log('[API] Mode:', import.meta.env.MODE)
  console.log('[API] VITE_API_URL:', import.meta.env.VITE_API_URL)
  console.log('[API] Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A')
  console.log('[API] Using API_URL:', API_URL)
}

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add CSRF token
api.interceptors.request.use(
  (config) => {
    // Get CSRF token from cookie
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1]
    
    if (csrfToken && config.method !== 'get') {
      config.headers['X-CSRF-Token'] = csrfToken
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Suppress 401 errors for /auth/me endpoint (expected when not logged in)
      if (error.response.status === 401 && error.config.url === '/auth/me') {
        return Promise.reject(new Error('Not authenticated'))
      }
      // Server responded with error
      const message = error.response.data?.error || 'An error occurred'
      return Promise.reject(new Error(message))
    } else if (error.request) {
      // Request made but no response
      return Promise.reject(new Error('Unable to connect to server'))
    } else {
      return Promise.reject(error)
    }
  }
)

// Auth API functions
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword })
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  connectExternalAccount: async (accountData) => {
    const response = await api.post('/auth/connect-account', accountData)
    return response.data
  },

  getConnectedAccounts: async () => {
    const response = await api.get('/auth/connected-accounts')
    return response.data
  },

  disconnectExternalAccount: async (platform) => {
    const response = await api.delete(`/auth/disconnect-account/${platform}`)
    return response.data
  },

  refreshAccountData: async (accountId) => {
    const response = await api.post(`/auth/connected-accounts/${accountId}/refresh`)
    return response.data
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData)
    return response.data
  },

  updateSecurity: async (securityData) => {
    const response = await api.post('/auth/change-password', {
      currentPassword: securityData.currentPassword,
      newPassword: securityData.newPassword
    })
    return response.data
  },

  deleteAccount: async () => {
    const response = await api.delete('/auth/account')
    return response.data
  },
}

export default api
