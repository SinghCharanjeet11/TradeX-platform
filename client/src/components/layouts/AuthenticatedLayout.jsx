import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from '../dashboard/Sidebar'
import LoadingScreen from '../LoadingScreen'
import styles from './AuthenticatedLayout.module.css'

function AuthenticatedLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sessionVerified, setSessionVerified] = useState(false)
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    // Check if user came from sign-in page (session was just verified)
    const justSignedIn = sessionStorage.getItem('justSignedIn')
    if (justSignedIn === 'true') {
      setSessionVerified(true)
      sessionStorage.removeItem('justSignedIn')
    }
  }, [])

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
