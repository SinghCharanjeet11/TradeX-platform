import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const authCheckInProgress = useRef(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    // Prevent multiple simultaneous auth checks
    if (authCheckInProgress.current) {
      console.log('[AuthContext] Auth check already in progress, skipping')
      return
    }

    authCheckInProgress.current = true
    
    try {
      console.log('[AuthContext] Checking authentication...')
      const response = await authAPI.getCurrentUser()
      console.log('[AuthContext] Authenticated as:', response.user.email)
      setUser(response.user)
      setIsAuthenticated(true)
    } catch (error) {
      console.log('[AuthContext] Not authenticated')
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
      authCheckInProgress.current = false
    }
  }

  const login = async (credentials) => {
    const response = await authAPI.login(credentials)
    if (response.success) {
      setUser(response.user)
      setIsAuthenticated(true)
    }
    return response
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      // Clear session flags so user must sign in again
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
