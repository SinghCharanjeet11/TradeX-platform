import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from '../dashboard/Sidebar'
import LoadingScreen from '../LoadingScreen'
import styles from './AuthenticatedLayout.module.css'

function AuthenticatedLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { isAuthenticated, loading } = useAuth()

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated) {
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
