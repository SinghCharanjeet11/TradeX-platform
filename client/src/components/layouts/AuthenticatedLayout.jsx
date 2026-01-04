import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from '../dashboard/Sidebar'
import LoadingScreen from '../LoadingScreen'
import styles from './AuthenticatedLayout.module.css'

function AuthenticatedLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const { isAuthenticated, loading, checkAuth } = useAuth()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const oauthParam = searchParams.get('oauth')
    const hasActiveSession = sessionStorage.getItem('sessionActive') === 'true'
    const justSignedIn = sessionStorage.getItem('justSignedIn') === 'true'
    
    // Clean up justSignedIn flag
    if (justSignedIn) {
      sessionStorage.removeItem('justSignedIn')
    }
    
    // Handle OAuth redirect
    if (oauthParam === 'true') {
      console.log('[AuthenticatedLayout] OAuth redirect detected')
      sessionStorage.setItem('sessionActive', 'true')
      
      // Remove oauth param from URL
      searchParams.delete('oauth')
      setSearchParams(searchParams, { replace: true })
      
      // Re-check auth and mark session ready
      checkAuth().finally(() => {
        setSessionReady(true)
      })
      return
    }
    
    // If we have an active session or just signed in, mark ready
    if (hasActiveSession || justSignedIn) {
      setSessionReady(true)
      return
    }
    
    // No session - will redirect to signin
    setSessionReady(true)
  }, [searchParams, setSearchParams, checkAuth])

  // Show loading while auth is checking or session not ready
  if (loading || !sessionReady) {
    return <LoadingScreen />
  }

  // Check if session is allowed
  const hasActiveSession = sessionStorage.getItem('sessionActive') === 'true'
  
  // If not authenticated, redirect to signin
  if (!isAuthenticated) {
    console.log('[AuthenticatedLayout] Not authenticated, redirecting to signin')
    sessionStorage.setItem('redirectAfterLogin', location.pathname)
    return <Navigate to="/signin" replace />
  }
  
  // If authenticated but no session flag, require fresh sign-in
  // This enforces the "must sign in when clicking links" requirement
  if (!hasActiveSession) {
    console.log('[AuthenticatedLayout] No active session flag, redirecting to signin')
    sessionStorage.setItem('redirectAfterLogin', location.pathname)
    return <Navigate to="/signin" replace />
  }

  return (
    <>
      {createPortal(
        <Sidebar onCollapse={setSidebarCollapsed} />,
        document.body
      )}
      <div className={`${styles.layoutContent} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        {children}
      </div>
    </>
  )
}

export default AuthenticatedLayout
