import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  MdDashboard, 
  MdNewspaper, 
  MdSchool,
  MdSettings,
  MdMenu,
  MdChevronLeft,
  MdTrendingUp,
  MdAccountBalanceWallet
} from 'react-icons/md'
import styles from './Sidebar.module.css'

function Sidebar({ onCollapse }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Notify parent when collapse state changes
  useEffect(() => {
    if (onCollapse) {
      onCollapse(isCollapsed)
    }
  }, [isCollapsed, onCollapse])

  const menuItems = [
    { icon: MdDashboard, label: 'Dashboard', path: '/dashboard', description: 'Overview & insights' },
    { icon: MdAccountBalanceWallet, label: 'Portfolio', path: '/portfolio', description: 'Your holdings' },
    { icon: MdTrendingUp, label: 'Markets', path: '/markets', description: 'Live prices' },
    { icon: MdSchool, label: 'Paper Trading', path: '/paper-trading', description: 'Practice trading' },
    { icon: MdNewspaper, label: 'News', path: '/news', badge: 3, description: 'Latest updates' },
  ]

  return (
    <aside 
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
      style={{
        position: 'fixed',
        left: '0px',
        top: '0px',
        bottom: '0px',
        height: '100vh',
        zIndex: 1000,
        transform: 'none',
        willChange: 'auto'
      }}
    >
      {/* Header with Logo and Collapse/Expand Button */}
      <div className={styles.header}>
        {isCollapsed ? (
          /* Collapsed state: Show expand button */
          <button 
            className={styles.expandBtn}
            onClick={() => setIsCollapsed(false)}
            title="Expand sidebar"
          >
            <MdMenu />
          </button>
        ) : (
          /* Expanded state: Show logo and collapse button */
          <>
            <div className={styles.logoWrapper}>
              <div className={styles.logoIcon}>
                <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                  <path d="M10 22L14 18L18 20L26 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H26V17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className={styles.logoText}>TradeX</span>
            </div>
            <button 
              className={styles.collapseBtn}
              onClick={() => setIsCollapsed(true)}
              title="Collapse sidebar"
            >
              <MdChevronLeft />
            </button>
          </>
        )}
      </div>

      {/* Main Navigation */}
      <nav className={styles.nav}>
        {!isCollapsed && <div className={styles.sectionLabel}>Menu</div>}
        <div className={styles.navSection}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <button
                key={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={styles.iconWrapper}>
                  <Icon className={styles.icon} />
                </div>
                {!isCollapsed && (
                  <div className={styles.navTextWrapper}>
                    <span className={styles.navLabel}>{item.label}</span>
                    <span className={styles.navDescription}>{item.description}</span>
                  </div>
                )}
                {item.badge && item.badge > 0 && (
                  <span className={styles.badge}>{item.badge}</span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom Section - Settings & Profile */}
      <div className={styles.bottomSection}>
        {!isCollapsed && <div className={styles.sectionLabel}>Account</div>}
        <button 
          className={`${styles.navItem} ${location.pathname === '/settings' ? styles.active : ''}`}
          onClick={() => navigate('/settings')}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <div className={styles.iconWrapper}>
            <MdSettings className={styles.icon} />
          </div>
          {!isCollapsed && (
            <div className={styles.navTextWrapper}>
              <span className={styles.navLabel}>Settings</span>
              <span className={styles.navDescription}>Preferences</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
