import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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
  const { user, loading, isAuthenticated } = useAuth()
  const [activeMarket, setActiveMarket] = useState('Crypto')
  const [marketData, setMarketData] = useState([])
  const [marketLoading, setMarketLoading] = useState(false)
  const [marketError, setMarketError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isCached, setIsCached] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/signin', { replace: true })
    }
  }, [loading, isAuthenticated, navigate])

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
      console.log(`[Markets] ${market} response.data:`, response.data)
      console.log(`[Markets] ${market} response.data.length:`, response.data?.length)
      
      if (response.success) {
        console.log(`[Markets] ${market} data loaded:`, response.data.length, 'items')
        console.log(`[Markets] First 5 items:`, response.data.slice(0, 5))
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
      console.error('[Markets] Error fetching market data:', error)
      console.error('[Markets] Error details:', error.response?.data || error.message)
      setMarketError(error.message)
      setMarketData([]) // Clear data on error
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
      <div className={styles.main}>
        <TopBar user={user} activeMarket={activeMarket} onMarketChange={setActiveMarket} />
        
        <div className={styles.content}>
          <div className={`${styles.titleRow} ${styles[`titleRow${activeMarket}`]}`}>
            <h1 className={styles.pageTitle}>{activeMarket} Market Insights!</h1>
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
            lastUpdate={lastUpdate}
          />
        </div>
      </div>
    </div>
  )
}

export default MarketsPage

