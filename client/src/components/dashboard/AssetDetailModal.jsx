import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { MdClose, MdShowChart, MdAutoAwesome } from 'react-icons/md'
import marketService from '../../services/marketService'
import ErrorBoundary from '../ErrorBoundary'
import PricePredictionSection from '../insights/PricePredictionSection'
import SentimentSection from '../insights/SentimentSection'
import TradingSignalSection from '../insights/TradingSignalSection'
import TechnicalIndicatorsSection from '../insights/TechnicalIndicatorsSection'
import styles from './AssetDetailModal.module.css'

function AssetDetailModal({ asset, onClose, marketType = 'crypto' }) {
  const [chartPeriod, setChartPeriod] = useState('7D')
  const [activeTab, setActiveTab] = useState('chart')
  const [chartData, setChartData] = useState([])
  const [detailedAsset, setDetailedAsset] = useState(asset)
  const [error, setError] = useState(null)
  
  const periods = ['1D', '7D', '1M', '3M']
  const tabs = [
    { id: 'chart', label: 'Chart', icon: MdShowChart },
    { id: 'ai', label: 'AI Insights', icon: MdAutoAwesome }
  ]
  
  // Prevent body scroll and hide TopBar when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.body.classList.add('modal-open')
    
    // Scroll modal container to top when opened
    const modalRoot = document.getElementById('modal-root')
    if (modalRoot) {
      modalRoot.scrollTop = 0
    }
    
    return () => {
      document.body.style.overflow = 'unset'
      document.body.classList.remove('modal-open')
    }
  }, [])
  
  if (!asset) return null
  
  // Get modal root element
  const modalRoot = document.getElementById('modal-root')
  if (!modalRoot) return null

  // Map period to days
  const periodToDays = {
    '1D': 1,
    '7D': 7,
    '1M': 30,
    '3M': 90,
    '1Y': 365,
    'ALL': 'max'
  }

  // Format date for chart labels based on period
  const formatChartDate = (date, period) => {
    if (period === '1D') {
      // Show hours for 1 day
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (period === '7D') {
      // Show day and time for 7 days
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (period === '1M') {
      // Show month and day for 1 month
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (period === '3M') {
      // Show month and day for 3 months (same format but will be sampled less)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      // Show month and day for other periods
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Fetch detailed asset data and chart data
  useEffect(() => {
    const fetchData = async () => {
      setError(null)
      
      try {
        // Determine the correct identifier to use for API calls
        // For crypto, use 'id' (e.g., 'bitcoin'), for others use 'symbol' (e.g., 'BTC')
        const identifier = marketType === 'crypto' ? (asset.id || asset.symbol) : asset.symbol
        
        console.log(`[AssetDetailModal] ===== FETCHING ASSET DATA =====`)
        console.log(`[AssetDetailModal] Asset object:`, {
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          price: asset.price
        })
        console.log(`[AssetDetailModal] Market Type: ${marketType}`)
        console.log(`[AssetDetailModal] Using Identifier: ${identifier}`)
        console.log(`[AssetDetailModal] Chart Period: ${chartPeriod}`)
        
        // Fetch detailed asset information
        try {
          const detailsResponse = await marketService.getAssetDetails(marketType, identifier)
          if (detailsResponse.success && detailsResponse.data) {
            console.log(`[AssetDetailModal] Received detailed asset data:`, {
              id: detailsResponse.data.id,
              symbol: detailsResponse.data.symbol,
              name: detailsResponse.data.name,
              price: detailsResponse.data.price
            })
            // Merge with original asset to ensure we have all data
            setDetailedAsset({ ...asset, ...detailsResponse.data })
          } else {
            // Use original asset data if API fails
            console.warn('[AssetDetailModal] No detailed data returned, using original asset')
            setDetailedAsset(asset)
          }
        } catch (detailsError) {
          console.warn('[AssetDetailModal] Could not fetch detailed asset info, using basic data:', detailsError)
          // Continue with basic asset data
          setDetailedAsset(asset)
        }

        // Fetch chart data
        const days = periodToDays[chartPeriod]
        console.log(`[AssetDetailModal] Fetching chart data: ${marketType}/${identifier} for ${days} days`)
        const chartResponse = await marketService.getChartData(marketType, identifier, days)
        
        console.log(`[AssetDetailModal] Chart response:`, {
          success: chartResponse.success,
          hasPrices: !!chartResponse.data?.prices,
          priceCount: chartResponse.data?.prices?.length || 0,
          symbol: chartResponse.data?.symbol,
          firstPrice: chartResponse.data?.prices?.[0],
          lastPrice: chartResponse.data?.prices?.[chartResponse.data?.prices?.length - 1]
        })
        
        if (chartResponse.success && chartResponse.data && chartResponse.data.prices) {
          // Transform chart data for recharts
          let transformedData = chartResponse.data.prices.map((item, index) => {
            const price = item.price
            const date = new Date(item.timestamp)
            return {
              time: index,
              timestamp: item.timestamp,
              dateLabel: formatChartDate(date, chartPeriod),
              price: price,
              volume: item.volume || 0,
              // Calculate simple moving averages
              ma7: price, // Simplified - in production, calculate actual MA
              ma25: price
            }
          })
          
          // Sample data for 3M period to improve chart readability
          // CoinGecko returns ~2160 hourly points for 90 days, which is too dense
          // Sample to ~720 points (every 3rd point) for better visualization
          if (chartPeriod === '3M' && transformedData.length > 1000) {
            const sampleRate = Math.ceil(transformedData.length / 720)
            transformedData = transformedData.filter((_, index) => index % sampleRate === 0)
            console.log(`[AssetDetailModal] Sampled 3M data from ${chartResponse.data.prices.length} to ${transformedData.length} points`)
          }
          
          console.log(`[AssetDetailModal] Final transformed data:`, {
            count: transformedData.length,
            firstPoint: transformedData[0],
            lastPoint: transformedData[transformedData.length - 1]
          })
          
          setChartData(transformedData)
          
          // Show warning if using fallback data
          if (chartResponse.metadata?.fallback) {
            setError('Using simulated data - market data temporarily unavailable')
          }
        } else {
          // Generate fallback chart data
          console.warn('[AssetDetailModal] No chart data received, generating fallback')
          setChartData(generateFallbackChartData())
          setError('Using simulated data - market data temporarily unavailable')
        }
      } catch (err) {
        console.error('[AssetDetailModal] Error fetching asset data:', err)
        // Generate fallback chart data
        setChartData(generateFallbackChartData())
        setError('Market data temporarily unavailable - showing simulated data')
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.id, chartPeriod, marketType])

  // Generate fallback chart data if API fails
  const generateFallbackChartData = () => {
    const points = chartPeriod === '1D' ? 24 : chartPeriod === '7D' ? 168 : 720
    const basePrice = asset.price || 100
    const change = asset.change24h || asset.change || 0
    const startPrice = basePrice / (1 + change / 100)
    const now = Date.now()
    
    return Array.from({ length: points }, (_, i) => {
      const progress = i / (points - 1)
      const trend = startPrice + (basePrice - startPrice) * progress
      const noise = (Math.random() - 0.5) * (basePrice * 0.03)
      const price = trend + noise
      const volume = (Math.random() * 1e9) + 5e8
      const timestamp = now - (points - i) * 3600000 // Go back in time hourly
      const date = new Date(timestamp)
      
      return {
        time: i,
        timestamp,
        dateLabel: formatChartDate(date, chartPeriod),
        price: price,
        volume: volume,
        ma7: price * (1 + (Math.random() - 0.5) * 0.01),
        ma25: price * (1 + (Math.random() - 0.5) * 0.02)
      }
    })
  }

  const isPositive = (detailedAsset.change24h || asset.change24h || asset.change || 0) > 0

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipDate}>{data.dateLabel}</p>
          <p className={styles.tooltipPrice}>${payload[0].value.toFixed(2)}</p>
          <p className={styles.tooltipVolume}>Vol: ${(data.volume / 1e9).toFixed(2)}B</p>
        </div>
      )
    }
    return null
  }

  // Render modal using React Portal
  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.assetInfo}>
            {detailedAsset.image && <img src={detailedAsset.image} alt={detailedAsset.symbol} className={styles.assetImage} />}
            <div>
              <h2 className={styles.assetName}>{detailedAsset.name}</h2>
              <span className={styles.assetSymbol}>{detailedAsset.symbol}</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <MdClose />
          </button>
        </div>

        {/* Price Info */}
        <div className={styles.priceSection}>
          <div className={styles.currentPrice}>
            <span className={styles.priceLabel}>Current Price</span>
            <span className={styles.price}>${detailedAsset.price?.toLocaleString()}</span>
          </div>
          <div className={styles.priceChange}>
            <span className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
              {isPositive ? '+' : ''}{(detailedAsset.change24h || asset.change24h || asset.change || 0).toFixed(2)}%
            </span>
            <span className={styles.changeLabel}>24h Change</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className={styles.tabIcon} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'chart' && (
          <div key={`chart-${asset.symbol}-${asset.id}-${chartPeriod}`}>
            {/* Error/Warning Message */}
            {error && (
              <div className={styles.warningBanner}>
                <span>⚠️ {error}</span>
              </div>
            )}
            
            {/* Chart Period Selector */}
            <div className={styles.chartControls}>
              <div className={styles.periodSelector}>
                {periods.map(period => (
                  <button
                    key={period}
                    className={`${styles.periodBtn} ${chartPeriod === period ? styles.active : ''}`}
                    onClick={() => setChartPeriod(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Chart */}
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={450}>
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#cbd5e0" 
                    strokeOpacity={0.3}
                    vertical={true}
                    horizontal={true}
                  />
                  <XAxis 
                    dataKey="dateLabel"
                    stroke="#4a5568"
                    strokeWidth={2}
                    tick={{ fill: '#4a5568', fontSize: 12, fontWeight: 500 }}
                    tickLine={{ stroke: '#4a5568', strokeWidth: 1 }}
                    axisLine={{ stroke: '#4a5568', strokeWidth: 2 }}
                    interval="preserveStartEnd"
                    minTickGap={chartPeriod === '3M' ? 80 : 50}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    label={{ 
                      value: 'Time', 
                      position: 'insideBottom', 
                      offset: -50,
                      style: { fill: '#4a5568', fontWeight: 600, fontSize: 13 }
                    }}
                  />
                  <YAxis 
                    stroke="#4a5568"
                    strokeWidth={2}
                    tick={{ fill: '#1a202c', fontSize: 13, fontWeight: 600 }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) {
                        return `$${(value / 1000000).toFixed(1)}M`
                      } else if (value >= 1000) {
                        return `$${(value / 1000).toFixed(1)}K`
                      } else if (value >= 1) {
                        return `$${value.toFixed(2)}`
                      } else if (value > 0) {
                        return `$${value.toFixed(6)}`
                      }
                      return `$${value.toFixed(2)}`
                    }}
                    width={80}
                    domain={['auto', 'auto']}
                    tickCount={8}
                    axisLine={{ stroke: '#4a5568', strokeWidth: 2 }}
                    tickLine={{ stroke: '#4a5568', strokeWidth: 1 }}
                    label={{ 
                      value: 'Price (USD)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: '#4a5568', fontWeight: 600, fontSize: 13 }
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    fill="url(#priceGradient)" 
                    stroke={isPositive ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ma7" 
                    stroke="#7c8cff" 
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ma25" 
                    stroke="#f59e0b" 
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="5 5"
                  />
                </ComposedChart>
              </ResponsiveContainer>
              
              <div className={styles.chartLegend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendLine} style={{ background: isPositive ? '#10b981' : '#ef4444' }}></div>
                  <span>Price</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendLine} style={{ background: '#7c8cff', height: '2px' }}></div>
                  <span>MA(7)</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendLine} style={{ background: '#f59e0b', height: '2px' }}></div>
                  <span>MA(25)</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Market Cap</span>
                <span className={styles.statValue}>
                  ${detailedAsset.marketCap ? (detailedAsset.marketCap / 1e9).toFixed(2) + 'B' : '-'}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Volume 24h</span>
                <span className={styles.statValue}>
                  ${detailedAsset.volume24h ? (detailedAsset.volume24h / 1e9).toFixed(2) + 'B' : '-'}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Circulating Supply</span>
                <span className={styles.statValue}>
                  {detailedAsset.circulatingSupply 
                    ? (detailedAsset.circulatingSupply / 1e6).toFixed(2) + 'M ' + detailedAsset.symbol
                    : '-'}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>24h High/Low</span>
                <span className={styles.statValue}>
                  ${detailedAsset.high24h?.toFixed(2) || '-'} / ${detailedAsset.low24h?.toFixed(2) || '-'}
                </span>
              </div>
              {detailedAsset.ath && (
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>All-Time High</span>
                  <span className={styles.statValue}>
                    ${detailedAsset.ath.toFixed(2)}
                  </span>
                </div>
              )}
              {detailedAsset.marketCapRank && (
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Market Cap Rank</span>
                  <span className={styles.statValue}>
                    #{detailedAsset.marketCapRank}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className={styles.aiTab} key={`ai-${asset.symbol}-${asset.id}`}>
            <div className={styles.aiInsightsGrid}>
              {(() => {
                // Normalize asset type for API (stocks -> stock, commodities -> commodity)
                const normalizedAssetType = marketType === 'stocks' ? 'stock' : 
                                           marketType === 'commodities' ? 'commodity' : marketType;
                // For crypto, use id (e.g., 'bitcoin') for API calls; for others use symbol
                const assetIdentifier = marketType === 'crypto' 
                  ? (detailedAsset.id || asset.id || detailedAsset.symbol || asset.symbol)
                  : (detailedAsset.symbol || asset.symbol);
                
                return (
                  <>
                    <ErrorBoundary>
                      <PricePredictionSection 
                        key={`prediction-${asset.symbol}`}
                        symbol={assetIdentifier}
                        assetType={normalizedAssetType}
                        currentPrice={detailedAsset.price || asset.price}
                      />
                    </ErrorBoundary>
                    
                    <ErrorBoundary>
                      <SentimentSection 
                        key={`sentiment-${asset.symbol}`}
                        symbol={detailedAsset.symbol || asset.symbol}
                      />
                    </ErrorBoundary>
                    
                    <ErrorBoundary>
                      <TradingSignalSection 
                        key={`signal-${asset.symbol}`}
                        symbol={assetIdentifier}
                        assetType={normalizedAssetType}
                        currentPrice={detailedAsset.price || asset.price}
                      />
                    </ErrorBoundary>
                    
                    <ErrorBoundary>
                      <TechnicalIndicatorsSection 
                        key={`indicators-${asset.symbol}`}
                        symbol={assetIdentifier}
                        assetType={normalizedAssetType}
                      />
                    </ErrorBoundary>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>,
    modalRoot
  )
}

export default AssetDetailModal
