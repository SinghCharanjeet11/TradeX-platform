import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdAdd } from 'react-icons/md'
import Sidebar from '../components/dashboard/Sidebar'
import TopBar from '../components/dashboard/TopBar'
import LoadingScreen from '../components/LoadingScreen'
import ConnectAccountModal from '../components/dashboard/ConnectAccountModal'
import ConnectedAccounts from '../components/dashboard/ConnectedAccounts'
import PortfolioSummaryCard from '../components/dashboard/PortfolioSummaryCard'
import AssetAllocationCard from '../components/dashboard/AssetAllocationCard'
import PerformanceChart from '../components/dashboard/PerformanceChart'
import TopPerformersCard from '../components/dashboard/TopPerformersCard'
import WatchlistCard from '../components/dashboard/WatchlistCard'
import AlertsCard from '../components/dashboard/AlertsCard'
import { usePortfolio } from '../hooks/usePortfolio'
import styles from './DashboardPage.module.css'

function DashboardPage() {
  console.log('[Dashboard] Rendering DashboardPage')
  
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState([])
  const [error, setError] = useState(null)
  
  // Use portfolio hook for portfolio data - with error handling
  const { 
    portfolio, 
    loading: portfolioLoading, 
    error: portfolioError,
    refreshing, 
    refreshPortfolio 
  } = usePortfolio()

  // Log portfolio errors
  useEffect(() => {
    if (portfolioError) {
      console.error('[Dashboard] Portfolio error:', portfolioError)
    }
  }, [portfolioError])

  // Log when component mounts
  useEffect(() => {
    console.log('[Dashboard] Component mounted')
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('[Dashboard] Fetching user...')
        const { authAPI } = await import('../services/api')
        const response = await authAPI.getCurrentUser()
        console.log('[Dashboard] User fetched:', response.user)
        setUser(response.user)
        
        // Fetch connected accounts
        await fetchConnectedAccounts()
        
        setLoading(false)
      } catch (error) {
        console.error('[Dashboard] Error fetching user:', error)
        setError(error.message)
        setLoading(false)
        // Don't navigate away, show error instead
        // navigate('/signin')
      }
    }

    fetchUser()
  }, [navigate])

  const fetchConnectedAccounts = async () => {
    try {
      const { authAPI } = await import('../services/api')
      const response = await authAPI.getConnectedAccounts()
      if (response.accounts) {
        setConnectedAccounts(response.accounts)
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching connected accounts:', error)
      // Set mock data for demo purposes
      setConnectedAccounts([])
    }
  }

  const handleConnect = async (platform, accountData) => {
    console.log('Connected to platform:', platform)
    console.log('Account data:', accountData)
    
    // Add the new account to the list
    if (accountData) {
      setConnectedAccounts(prev => [...prev, accountData])
    } else {
      // Fallback: refresh from API
      await fetchConnectedAccounts()
    }
  }

  // Prevent body scroll and scroll to top when modal is open
  useEffect(() => {
    if (showConnectModal) {
      // Scroll to top immediately
      window.scrollTo({ top: 0, behavior: 'instant' })
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showConnectModal])

  const handleDisconnect = async (platform) => {
    try {
      const { authAPI } = await import('../services/api')
      await authAPI.disconnectExternalAccount(platform)
      setConnectedAccounts(prev => prev.filter(acc => acc.platform !== platform))
    } catch (error) {
      console.error('[Dashboard] Error disconnecting account:', error)
    }
  }

  const handleRefresh = async (accountId) => {
    try {
      const { authAPI } = await import('../services/api')
      await authAPI.refreshAccountData(accountId)
      await fetchConnectedAccounts()
    } catch (error) {
      console.error('[Dashboard] Error refreshing account:', error)
    }
  }

  if (loading) {
    console.log('[Dashboard] Showing loading screen')
    return <LoadingScreen />
  }

  if (error) {
    console.log('[Dashboard] Showing error:', error)
    return (
      <div style={{ padding: '50px', color: 'white', background: '#1a1d29', minHeight: '100vh' }}>
        <h1>Error Loading Dashboard</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    )
  }

  console.log('[Dashboard] Rendering main dashboard, user:', user)

  return (
    <div className={styles.dashboard}>
      <Sidebar />
      
      <div className={styles.main}>
        <TopBar user={user} />
        
        <div className={styles.content}>
          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.pageTitle}>Dashboard Overview</h1>
              <p className={styles.subtitle}>Monitor your portfolio and market insights</p>
            </div>
            <button 
              className={styles.connectBtn}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'instant' })
                setShowConnectModal(true)
              }}
            >
              <MdAdd /> Connect Account
            </button>
          </div>
          
          {connectedAccounts.length > 0 ? (
            <>
              {/* Connected Accounts Section */}
              <div className={styles.section}>
                <ConnectedAccounts 
                  accounts={connectedAccounts}
                  onDisconnect={handleDisconnect}
                  onRefresh={handleRefresh}
                />
              </div>

              {/* Portfolio Summary Section */}
              <div className={styles.section}>
                <PortfolioSummaryCard 
                  portfolio={portfolio || {}}
                  onRefresh={refreshPortfolio}
                  refreshing={refreshing}
                />
              </div>

              {/* Charts Grid */}
              <div className={styles.chartsGrid}>
                <div className={styles.chartItem}>
                  <PerformanceChart />
                </div>
                <div className={styles.chartItem}>
                  <AssetAllocationCard allocation={portfolio?.allocation} />
                </div>
              </div>

              {/* Top Performers */}
              <div className={styles.section}>
                <TopPerformersCard topPerformers={portfolio?.topPerformers} />
              </div>

              {/* Watchlist and Alerts Grid */}
              <div className={styles.chartsGrid}>
                <div className={styles.chartItem}>
                  <WatchlistCard />
                </div>
                <div className={styles.chartItem}>
                  <AlertsCard />
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔗</div>
              <h2>Connect Your Trading Accounts</h2>
              <p>Link your Binance, Coinbase, or Robinhood accounts to view your portfolio and track real-time changes all in one place.</p>
              <button 
                className={styles.connectBtnLarge}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'instant' })
                  setShowConnectModal(true)
                }}
              >
                <MdAdd /> Connect Your First Account
              </button>
            </div>
          )}
        </div>
      </div>

      <ConnectAccountModal 
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnect={handleConnect}
      />
    </div>
  )
}

export default DashboardPage
