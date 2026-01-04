import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from '../dashboard/Sidebar'
import LoadingScreen from '../LoadingScreen'
import styles from './AuthenticatedLayout.module.css'

function AuthenticatedLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  // Check OAuth param synchronously to avoid race condition
  const isOAuthRedirect = useMemo(() => {
    return searchParams.get('oauth') === 'true'
  }, [searchParams])

  // Check session flags synchronously
  const hasActiveSession = useMemo(() => {
    return sessionStorage.getItem('sessionActive') === 'true' || 
           sessionStorage.getItem('justSignedIn') === 'true'
  }, [])

  useEffect(() => {
    // Clean up justSignedIn flag after use
    const justSignedIn = sessionStorage.getItem('justSignedIn')
    if (justSignedIn === 'true') {
      sessionStorage.removeItem('justSignedIn')
    }
    
    // Handle OAuth redirect - set session flags and clean URL
    if (isOAuthRedirect) {
      sessionStorage.setItem('sessionActive', 'true')
      // Remove the oauth param from URL
      searchParams.delete('oauth')
      setSearchParams(searchParams, { replace: true })
    }
  }, [isOAuthRedirect, searchParams, setSearchParams])

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />
  }

  // Allow access if:
  // 1. User came from OAuth redirect (isOAuthRedirect)
  // 2. User has active session flag (hasActiveSession)
  // 3. User just signed in (justSignedIn flag - checked in hasActiveSession)
  const sessionAllowed = isOAuthRedirect || hasActiveSession

  // Always require fresh sign-in when accessing protected routes directly
  // Unless user just signed in during this browser session or came from OAuth
  if (!sessionAllowed) {
    // Store the intended destination
    sessionStorage.setItem('redirectAfterLogin', location.pathname)
    return <Navigate to="/signin" replace />
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated) {
    sessionStorage.setItem('redirectAfterLogin', location.pathname)
    return <Navigate to="/signin" replace />
  }

  return (
    <>
      {/* Sidebar rendered via portal to escape any transform context */}
      {createPortal(
        <Sidebar onCollapse={setSidebarCollapsed} />,
        document.body
      )}
      
      {/* Main content with margin to account for sidebar */}
      <div className={`${styles.layoutContent} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        {children}
      </div>
    </>
  )
}

export default AuthenticatedLayout
