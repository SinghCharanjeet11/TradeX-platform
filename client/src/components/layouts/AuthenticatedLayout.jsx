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
  const [sessionValid, setSessionValid] = useState(false)
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
        setSessionValid(true)
      } else {
        // Check if session flag exists (set during sign-in/register/oauth)
        const hasSessionFlag = sessionStorage.getItem('sessionActive') === 'true'
        setSessionValid(hasSessionFlag)
      }
      
      setIsProcessing(false)
    }
    
    handleAuth()
  }, []) // Only run once on mount

  // Show loading while auth is checking or processing OAuth
  if (loading || isProcessing) {
    return <LoadingScreen />
  }

  // If not authenticated OR no session flag, redirect to signin
  // This ensures users must sign in fresh in each new tab/window
  if (!isAuthenticated || !sessionValid) {
    console.log('[AuthenticatedLayout] Access denied - authenticated:', isAuthenticated, 'sessionValid:', sessionValid)
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
