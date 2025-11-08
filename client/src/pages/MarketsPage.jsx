import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar'
import TopBar from '../components/dashboard/TopBar'
import BalanceCard from '../components/dashboard/BalanceCard'
import TopGainerCard from '../components/dashboard/TopGainerCard'
import FearGreedCard from '../components/dashboard/FearGreedCard'
import CryptoPricesTable from '../components/dashboard/CryptoPricesTable'
import LoadingScreen from '../components/LoadingScreen'
import marketService from '../services/marketService'
import styles from './DashboardPage.module.css'

function MarketsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeMarket, setActiveMarket] = useState('Crypto')
  const [marketData, setMarketData] = useState([])
  const [marketLoading, setMarketLoading] = useState(false)
  const [marketError, setMarketError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isCached, setIsCached] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('[Markets] Fetching user...')
        const { authAPI } = await import('../services/api')
        const response = await authAPI.getCurrentUser()
        console.log('[Markets] User fetched:', response.user)
        setUser(response.user)
        setLoading(false)
      } catch (error) {
        console.error('[Markets] Error fetching user:', error)
        navigate('/signin')
      }
    }

    fetchUser()
  }, [navigate])

  // Fetch market data based on active market
  const fetchMarketData = async (market) => {
    console.log(`[Markets] Fetching ${market} data...`)
    setMarketLoading(true)
    setMarketError(null)

    try {
      let response
      
      switch (market) {
        case 'Crypto':
          response = await marketService.getCryptoData()
          break
        case 'Stocks':
          response = await marketService.getStocksData()
          break
        case 'Forex':
          response = await marketService.getForexData()
          break
        case 'Commodities':
          response = await marketService.getCommoditiesData()
          break
        default:
          response = await marketService.getCryptoData()
      }

      console.log(`[Markets] ${market} response:`, response)
      
      if (response.success) {
        console.log(`[Markets] ${market} data loaded:`, response.data.length, 'items')
        setMarketData(response.data)
        setLastUpdate(new Date())
        setIsCached(response.metadata?.cached || false)
      } else {
        // API error but may have cached data
        if (response.data && response.data.length > 0) {
          setMarketData(response.data)
          setIsCached(true)
          setMarketError(null)
        } else {
          setMarketError(null)
        }
      }
    } catch (error) {
      console.error('Error fetching market data:', error)
      setMarketError(null)
    } finally {
      setMarketLoading(false)
    }
  }

  // Fetch data when market changes
  useEffect(() => {
    if (!loading) {
      fetchMarketData(activeMarket)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMarket, loading])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        fetchMarketData(activeMarket)
      }, 30000)

      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMarket, loading])

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
            <h1 className={styles.pageTitle}>{activeMarket} Market Insights!</h1>
            <span className={styles.updated}>
              {lastUpdate ? (
                <>
                  Updated {Math.floor((new Date() - lastUpdate) / 1000)}s ago
                  {isCached && <span className={styles.cachedBadge}> (Cached)</span>}
                </>
              ) : (
                'Loading...'
              )}
            </span>
          </div>
          
          <div className={styles.grid}>
            <BalanceCard marketType={activeMarket} />
            {activeMarket === 'Crypto' ? (
              <FearGreedCard marketType={activeMarket} />
            ) : (
              <TopGainerCard marketType={activeMarket} data={marketData} />
            )}
          </div>

          <CryptoPricesTable 
            marketType={activeMarket} 
            data={marketData}
            loading={marketLoading}
            error={marketError}
          />
        </div>
      </div>

      <button className={styles.goProBtn}>
        <span className={styles.goProText}>Go Pro</span>
        <span className={styles.goProSubtext}>Unlock real-time data and premium tools</span>
      </button>
    </div>
  )
}

export default MarketsPage
