import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Header.module.css'

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const isSignIn = location.pathname === '/signin'
  const isRegister = location.pathname === '/register'

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="8" stroke="#7c8cff" strokeWidth="2"/>
          <path d="M8 22L13 17L18 20L28 10" stroke="#7c8cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 10H28V15" stroke="#7c8cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>TradeX</span>
      </div>
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
    </header>
  )
}

export default Header
