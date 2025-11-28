import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdSearch, MdNotifications, MdPerson, MdSettings, MdEdit, MdLogout } from 'react-icons/md'
import styles from './TopBar.module.css'

function TopBar({ user, activeMarket, onMarketChange, additionalActions }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  
  // Show search section only on Markets page (when activeMarket is provided)
  const showSearchSection = activeMarket !== undefined

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
      const { authAPI } = await import('../../services/api')
      await authAPI.logout()
      navigate('/signin')
    } catch (error) {
      console.error('Logout error:', error)
    }
    setShowDropdown(false)
  }

  const handleSettings = () => {
    navigate('/settings')
    setShowDropdown(false)
  }

  const handleEditProfile = () => {
    navigate('/settings')
    setShowDropdown(false)
  }

  const markets = ['Crypto', 'Stocks', 'Forex', 'Commodities']

  return (
    <div 
      className={`${styles.topBar} topBar`}
      data-page={showSearchSection ? 'markets' : 'other'}
      data-market={activeMarket}
    >
      {showSearchSection && (
        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <MdSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search markets..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className={styles.marketTabs}>
            {markets.map((market) => (
              <button
                key={market}
                className={`${styles.marketTab} ${activeMarket === market ? styles.active : ''}`}
                onClick={() => onMarketChange(market)}
                data-market={market}
              >
                {market}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className={styles.actions}>
        {additionalActions}
        <button className={styles.iconBtn} title="Notifications">
          <MdNotifications />
        </button>
        <div className={styles.userMenu} ref={dropdownRef}>
          <button 
            className={styles.userBtn}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <MdPerson />
            <span>{user?.username || 'User'}</span>
          </button>
          {showDropdown && (
            <div className={styles.dropdown}>
              <button onClick={handleSettings} className={styles.dropdownItem}>
                <MdSettings />
                <span>Settings</span>
              </button>
              <button onClick={handleEditProfile} className={styles.dropdownItem}>
                <MdEdit />
                <span>Edit Profile</span>
              </button>
              <div className={styles.dropdownDivider}></div>
              <button onClick={handleLogout} className={`${styles.dropdownItem} ${styles.logoutItem}`}>
                <MdLogout />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TopBar
