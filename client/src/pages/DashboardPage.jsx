import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdAdd } from 'react-icons/md'
import TopBar from '../components/dashboard/TopBar'
import LoadingScreen from '../components/LoadingScreen'
import ConnectAccountModal from '../components/dashboard/ConnectAccountModal'
import ConnectedAccounts from '../components/dashboard/ConnectedAccounts'
import PortfolioSummaryCard from '../components/dashboard/PortfolioSummaryCard'
import BreakingNewsSection from '../components/news/BreakingNewsSection'
import ArticleModal from '../components/news/ArticleModal'
import WatchlistCard from '../components/dashboard/WatchlistCard'
import AlertsCard from '../components/dashboard/AlertsCard'
import RecommendationsCard from '../components/dashboard/RecommendationsCard'
import { useAuth } from '../contexts/AuthContext'
import { DashboardDataProvider } from '../contexts/DashboardDataContext'
import styles from './DashboardPage.module.css'

function DashboardPage() {
  console.log('[Dashboard] Rendering DashboardPage')
  
  const navigate = useNavigate()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState([])
  const [selectedArticle, setSelectedArticle] = useState(null)
  
  
  // Handle authentication - redirect if not authenticated after loading completes
  useEffect(() => {
    console.log('[Dashboard] Auth check:', { authLoading, isAuthenticated })
    if (!authLoading && !isAuthenticated) {
      console.log('[Dashboard] Not authenticated, redirecting to sign in...')
      navigate('/signin', { replace: true })
    }
  }, [authLoading, isAuthenticated, navigate])

  // Fetch connected accounts when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[Dashboard] Fetching connected accounts...')
      fetchConnectedAccounts()
    }
  }, [isAuthenticated])

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

  // Show loading screen while checking authentication
  if (authLoading) {
    console.log('[Dashboard] Showing loading screen')
    return <LoadingScreen />
  }

  // Don't render dashboard if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  console.log('[Dashboard] Rendering main dashboard, user:', user)

  return (
    <DashboardDataProvider>
      <div className={styles.dashboard}>
        <div className={styles.main}>
          <TopBar user={user} />
          
          <div className={styles.dashboardContent}>
            {/* Header */}
            <div className={styles.header}>
              <div>
                <h1 className={styles.pageTitle}>Dashboard Overview</h1>
                <p className={styles.subtitle}>Monitor your portfolio and market insights</p>
              </div>
          </div>
          
          {connectedAccounts.length > 0 ? (
            <>
              {/* Connected Accounts Section */}
              <div className={styles.section}>
                <ConnectedAccounts 
                  accounts={connectedAccounts}
                  onDisconnect={handleDisconnect}
                  onRefresh={handleRefresh}
                  onConnectNew={() => {
                    window.scrollTo({ top: 0, behavior: 'instant' })
                    setShowConnectModal(true)
                  }}
                />
              </div>

              {/* Portfolio Summary Section */}
              <div className={styles.section}>
                <PortfolioSummaryCard />
              </div>

              {/* Breaking News Section */}
              <div className={styles.section}>
                <BreakingNewsSection onArticleClick={setSelectedArticle} />
              </div>

              {/* AI Recommendations */}
              <div className={styles.section}>
                <RecommendationsCard />
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
              <p>Link your Binance account to view your portfolio and track real-time changes all in one place.</p>
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
      </div>

      <ConnectAccountModal 
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnect={handleConnect}
      />

      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </DashboardDataProvider>
  )
}

export default DashboardPage
