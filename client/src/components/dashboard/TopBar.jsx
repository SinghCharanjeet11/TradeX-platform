import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdSearch, MdNotifications, MdSettings, MdPerson } from 'react-icons/md'
import styles from './TopBar.module.css'

function TopBar({ user, activeMarket, onMarketChange }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const markets = ['Crypto', 'Stocks', 'Forex', 'Commodities']

  const handleLogout = async () => {
    try {
      const { authAPI } = await import('../../services/api')
      await authAPI.logout()
      navigate('/signin')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className={`${styles.topBar} topBar`}>
      <div className={styles.searchSection}>
        <div className={`${styles.searchBox} topBarSearch`}>
          <MdSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search markets, tickers, symbols"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={`${styles.marketTabs} marketTabs`}>
          {markets.map((market) => (
            <button
              key={market}
              className={`${styles.marketTab} ${activeMarket === market ? styles.active : ''}`}
              onClick={() => onMarketChange(market)}
            >
              {market}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.iconBtn}>
          <MdSettings />
        </button>
        <button className={styles.iconBtn}>
          <MdNotifications />
        </button>
        <div className={styles.userMenu}>
          <button className={styles.userBtn}>
            <MdPerson />
            <span>{user?.username || 'User'}</span>
          </button>
          <div className={styles.dropdown}>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopBar
