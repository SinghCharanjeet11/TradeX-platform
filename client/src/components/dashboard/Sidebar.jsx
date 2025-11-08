import { useNavigate, useLocation } from 'react-router-dom'
import { MdDashboard, MdSwapHoriz, MdBarChart, MdAccountBalanceWallet, MdShowChart, MdSettings, MdNewspaper } from 'react-icons/md'
import styles from './Sidebar.module.css'

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { icon: MdDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: MdShowChart, label: 'Markets', path: '/markets' },
    { icon: MdNewspaper, label: 'News', path: '/news' },
    { icon: MdSwapHoriz, label: 'Exchange', path: '/exchange' },
    { icon: MdBarChart, label: 'Stats', path: '/stats' },
    { icon: MdAccountBalanceWallet, label: 'Wallet', path: '/wallet' },
    { icon: MdSettings, label: 'Settings', path: '/settings' },
  ]

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="8" stroke="#7c8cff" strokeWidth="2"/>
          <path d="M10 22L14 18L18 20L26 12" stroke="#7c8cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12H26V17" stroke="#7c8cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>TradeX</span>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <button
              key={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon className={styles.icon} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
