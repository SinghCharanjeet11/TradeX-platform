import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import styles from './Header.module.css'

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  
  const isSignIn = location.pathname === '/signin'
  const isRegister = location.pathname === '/register'
  const isAuthPage = isSignIn || isRegister || location.pathname === '/forgot-password' || location.pathname.startsWith('/reset-password')
  const userName = user?.username || 'User'

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/signin', { replace: true })
    } catch (error) {
      console.error('Logout error:', error)
      navigate('/signin', { replace: true })
    }
    setShowDropdown(false)
  }

  const handleEditProfile = () => {
    navigate('/settings')
    setShowDropdown(false)
  }

  const handleAccountInfo = () => {
    navigate('/settings')
    setShowDropdown(false)
  }

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
            <path d="M10 22L14 18L18 20L26 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H26V17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className={styles.logoText}>TradeX</span>
      </div>
      
      {isAuthenticated && !isAuthPage ? (
        <div className={styles.rightSection}>
          {/* Notification Button */}
          <button className={styles.iconBtn} title="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>

          {/* Account Dropdown */}
          <div className={styles.accountDropdown} ref={dropdownRef}>
            <button 
              className={styles.accountBtn}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className={styles.avatar}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className={styles.userName}>{userName}</span>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className={`${styles.chevron} ${showDropdown ? styles.chevronUp : ''}`}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {showDropdown && (
              <div className={styles.dropdownMenu}>
                <button className={styles.dropdownItem} onClick={handleEditProfile}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Profile
                </button>
                <button className={styles.dropdownItem} onClick={handleAccountInfo}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  Account Info
                </button>
                <div className={styles.dropdownDivider}></div>
                <button className={`${styles.dropdownItem} ${styles.logout}`} onClick={handleLogout}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.nav}>
          <button 
            className={`${styles.navBtn} ${isSignIn ? styles.primary : ''}`}
            onClick={() => navigate('/signin')}
          >
            Sign In
          </button>
          <button 
            className={`${styles.navBtn} ${isRegister ? styles.primary : ''}`}
            onClick={() => navigate('/register')}
          >
            Register
          </button>
        </div>
      )}
    </header>
  )
}

export default Header
