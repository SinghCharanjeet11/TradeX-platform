import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from '../dashboard/Sidebar'
import LoadingScreen from '../LoadingScreen'
import styles from './AuthenticatedLayout.module.css'

function AuthenticatedLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sessionVerified, setSessionVerified] = useState(false)
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    // Check if user came from sign-in page (session was just verified)
    const justSignedIn = sessionStorage.getItem('justSignedIn')
    if (justSignedIn === 'true') {
      setSessionVerified(true)
      sessionStorage.removeItem('justSignedIn')
    }
    
    // Check if user came from OAuth callback (has oauth=true query param)
    const oauthParam = searchParams.get('oauth')
    if (oauthParam === 'true') {
      // Set session flags for OAuth login
      sessionStorage.setItem('sessionActive', 'true')
      setSessionVerified(true)
      // Remove the oauth param from URL
      searchParams.delete('oauth')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />
  }

  // Always require fresh sign-in when accessing protected routes directly
  // Unless user just signed in during this browser session
  if (!sessionVerified && !sessionStorage.getItem('sessionActive')) {
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
