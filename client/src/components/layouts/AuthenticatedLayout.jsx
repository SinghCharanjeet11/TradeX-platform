import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from '../dashboard/Sidebar'
import LoadingScreen from '../LoadingScreen'
import styles from './AuthenticatedLayout.module.css'

function AuthenticatedLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)
  const { isAuthenticated, loading, checkAuth } = useAuth()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const handleAuth = async () => {
      const oauthParam = searchParams.get('oauth')
      
      // Handle OAuth redirect - set session flag and clean URL
      if (oauthParam === 'true') {
        console.log('[AuthenticatedLayout] OAuth redirect detected')
        sessionStorage.setItem('sessionActive', 'true')
        
        // Remove oauth param from URL
        searchParams.delete('oauth')
        setSearchParams(searchParams, { replace: true })
        
        // Re-check auth to ensure cookie is read
        await checkAuth()
      }
      
      setIsProcessing(false)
    }
    
    handleAuth()
  }, []) // Only run once on mount

  // Show loading while auth is checking or processing OAuth
  if (loading || isProcessing) {
    return <LoadingScreen />
  }

  // If not authenticated, redirect to signin
  if (!isAuthenticated) {
    console.log('[AuthenticatedLayout] Not authenticated, redirecting to signin')
    sessionStorage.setItem('redirectAfterLogin', location.pathname)
    return <Navigate to="/signin" replace />
  }

  // User is authenticated - allow access
  // Also set sessionActive flag so they stay logged in
  if (!sessionStorage.getItem('sessionActive')) {
    sessionStorage.setItem('sessionActive', 'true')
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
