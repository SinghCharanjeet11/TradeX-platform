import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar'
import TopBar from '../components/dashboard/TopBar'
import LoadingScreen from '../components/LoadingScreen'
import styles from './DashboardPage.module.css'

function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeMarket, setActiveMarket] = useState('Crypto')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('[Dashboard] Fetching user...')
        const { authAPI } = await import('../services/api')
        const response = await authAPI.getCurrentUser()
        console.log('[Dashboard] User fetched:', response.user)
        setUser(response.user)
        setLoading(false)
      } catch (error) {
        console.error('[Dashboard] Error fetching user:', error)
        navigate('/signin')
      }
    }

    fetchUser()
  }, [navigate])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className={styles.dashboard}>
      <Sidebar />
      
      <div className={styles.main}>
        <TopBar user={user} activeMarket={activeMarket} onMarketChange={setActiveMarket} />
        
        <div className={styles.content}>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Dashboard Overview</h1>
          </div>
          
          <div className={styles.comingSoon}>
            <h2>Dashboard Coming Soon</h2>
            <p>We're building an amazing dashboard experience for you!</p>
            <p>In the meantime, check out the Markets section to view real-time market data.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
