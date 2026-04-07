import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'tradex_token'
const USER_KEY = 'tradex_user'
const TOKEN_EXPIRY_KEY = 'tradex_token_expiry'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const authCheckInProgress = useRef(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const isTokenExpired = () => {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiry) return true
    return Date.now() > parseInt(expiry)
  }

  const checkAuth = async () => {
    if (authCheckInProgress.current) return
    authCheckInProgress.current = true

    try {
      // Fast path: restore from localStorage instantly (no loading flash)
      const cachedUser = localStorage.getItem(USER_KEY)
      const token = localStorage.getItem(TOKEN_KEY)

      if (cachedUser && token && !isTokenExpired()) {
        setUser(JSON.parse(cachedUser))
        setIsAuthenticated(true)
        setLoading(false)

        // Verify with server in background silently
        authAPI.getCurrentUser().then(response => {
          if (response?.user) {
            setUser(response.user)
            localStorage.setItem(USER_KEY, JSON.stringify(response.user))
          } else {
            clearAuth()
          }
        }).catch(() => {
          // Server unreachable — keep using cached user until token expires
          console.log('[AuthContext] Server check failed — using cached session')
        })

        authCheckInProgress.current = false
        return
      }

      // No cached session — check with server
      console.log('[AuthContext] Checking authentication...')
      const response = await authAPI.getCurrentUser()
      if (response?.user) {
        console.log('[AuthContext] Authenticated as:', response.user.email)
        setUser(response.user)
        setIsAuthenticated(true)
        localStorage.setItem(USER_KEY, JSON.stringify(response.user))
      } else {
        clearAuth()
      }
    } catch (error) {
      console.log('[AuthContext] Not authenticated:', error.message)
      clearAuth()
    } finally {
      setLoading(false)
      authCheckInProgress.current = false
    }
  }

  const clearAuth = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
  }

  const login = async (credentials) => {
    const response = await authAPI.login(credentials)
    if (response.success) {
      setUser(response.user)
      setIsAuthenticated(true)
      // Store token + user + expiry (7 days) in localStorage
      if (response.token) {
        localStorage.setItem(TOKEN_KEY, response.token)
        localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + SEVEN_DAYS_MS))
      }
      localStorage.setItem(USER_KEY, JSON.stringify(response.user))
    }
    return response
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } finally {
      clearAuth()
      sessionStorage.removeItem('sessionActive')
      sessionStorage.removeItem('justSignedIn')
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
