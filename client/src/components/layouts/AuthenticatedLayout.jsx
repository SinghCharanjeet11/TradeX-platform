import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from '../dashboard/Sidebar'
import LoadingScreen from '../LoadingScreen'
import styles from './AuthenticatedLayout.module.css'

function AuthenticatedLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Wait for AuthContext loading to finish
  if (loading) {
    return <LoadingScreen />
  }

  // Only check: is user authenticated?
  // If not, redirect to signin
  if (!isAuthenticated) {
    console.log('[AuthenticatedLayout] Access denied - not authenticated')
    sessionStorage.setItem('redirectAfterLogin', location.pathname)
    return <Navigate to="/signin" replace />
  }

  // User is authenticated - grant access
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
