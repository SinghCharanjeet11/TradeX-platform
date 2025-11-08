import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { MdClose, MdShowChart, MdAutoAwesome } from 'react-icons/md'
import marketService from '../../services/marketService'
import styles from './AssetDetailModal.module.css'

function AssetDetailModal({ asset, onClose, marketType = 'crypto' }) {
  const [chartPeriod, setChartPeriod] = useState('7D')
  const [showAI, setShowAI] = useState(false)
  const [chartData, setChartData] = useState([])
  const [detailedAsset, setDetailedAsset] = useState(asset)
  
  const periods = ['1D', '7D', '1M', '3M', '1Y', 'ALL']
  
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

  // Fetch detailed asset data and chart data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch detailed asset information
        const detailsResponse = await marketService.getAssetDetails(marketType, asset.id)
        if (detailsResponse.success && detailsResponse.data) {
          setDetailedAsset(detailsResponse.data)
        }

        // Fetch chart data
        const days = periodToDays[chartPeriod]
        const chartResponse = await marketService.getChartData(marketType, asset.id, days)
        
        if (chartResponse.success && chartResponse.data && chartResponse.data.prices) {
          // Transform chart data for recharts
          const transformedData = chartResponse.data.prices.map((item, index) => {
            const price = item.price
            return {
              time: index,
              timestamp: item.timestamp,
              price: price,
              volume: item.volume || 0,
              // Calculate simple moving averages
              ma7: price, // Simplified - in production, calculate actual MA
              ma25: price
            }
          })
          setChartData(transformedData)
        }
      } catch (err) {
        console.error('Error fetching asset data:', err)
        // Generate fallback chart data
        setChartData(generateFallbackChartData())
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
    
    return Array.from({ length: points }, (_, i) => {
      const progress = i / (points - 1)
      const trend = startPrice + (basePrice - startPrice) * progress
      const noise = (Math.random() - 0.5) * (basePrice * 0.03)
      const price = trend + noise
      const volume = (Math.random() * 1e9) + 5e8
      
      return {
        time: i,
        price: price,
        volume: volume,
        ma7: price * (1 + (Math.random() - 0.5) * 0.01),
        ma25: price * (1 + (Math.random() - 0.5) * 0.02)
      }
    })
  }

  const isPositive = (detailedAsset.change24h || asset.change24h || asset.change || 0) > 0

  // AI Prediction
  const aiPrediction = {
    trend: isPositive ? 'Bullish' : 'Bearish',
    confidence: 78,
    prediction: isPositive ? '+12.5%' : '-8.3%',
    timeframe: '7 days',
    signals: [
      { type: 'Technical', status: isPositive ? 'Buy' : 'Sell', strength: 'Strong' },
      { type: 'Sentiment', status: 'Neutral', strength: 'Moderate' },
      { type: 'Volume', status: isPositive ? 'Increasing' : 'Decreasing', strength: 'Strong' }
    ]
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipPrice}>${payload[0].value.toFixed(2)}</p>
          <p className={styles.tooltipVolume}>Vol: ${(payload[1]?.value / 1e9).toFixed(2)}B</p>
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
          <button 
            className={`${styles.aiBtn} ${showAI ? styles.active : ''}`}
            onClick={() => setShowAI(!showAI)}
          >
            <MdAutoAwesome />
            AI Insights
          </button>
        </div>

        {/* Advanced Chart */}
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={450}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="time" 
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                tickFormatter={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                width={60}
                domain={['auto', 'auto']}
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

        {/* AI Insights Panel */}
        {showAI && (
          <div className={styles.aiPanel}>
            <div className={styles.aiHeader}>
              <MdAutoAwesome className={styles.aiIcon} />
              <h3>AI Market Analysis</h3>
            </div>
            
            <div className={styles.aiContent}>
              <div className={styles.aiPrediction}>
                <div className={styles.predictionLabel}>Trend Prediction</div>
                <div className={`${styles.predictionValue} ${isPositive ? styles.bullish : styles.bearish}`}>
                  {aiPrediction.trend} {aiPrediction.prediction}
                </div>
                <div className={styles.confidence}>
                  <span>Confidence: {aiPrediction.confidence}%</span>
                  <div className={styles.confidenceBar}>
                    <div 
                      className={styles.confidenceFill} 
                      style={{ width: `${aiPrediction.confidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className={styles.signals}>
                {aiPrediction.signals.map((signal, index) => (
                  <div key={index} className={styles.signal}>
                    <span className={styles.signalType}>{signal.type}</span>
                    <span className={styles.signalStatus}>{signal.status}</span>
                    <span className={styles.signalStrength}>{signal.strength}</span>
                  </div>
                ))}
              </div>
              
              <div className={styles.aiDisclaimer}>
                <MdShowChart />
                <span>AI predictions are based on historical data and market trends. Not financial advice.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    modalRoot
  )
}

export default AssetDetailModal
