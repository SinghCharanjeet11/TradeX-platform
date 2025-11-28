import { useState, useEffect } from 'react'
import styles from './FearGreedCard.module.css'

function FearGreedCard({ marketType = 'Crypto' }) {
  const [fearGreedData, setFearGreedData] = useState(null)
  const [marketData, setMarketData] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredSegment, setHoveredSegment] = useState(null)
  const [animatedValue, setAnimatedValue] = useState(0)
  
  // Fetch real-time Fear & Greed Index and market dominance data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch Fear & Greed Index
        const fngResponse = await fetch('https://api.alternative.me/fng/?limit=1')
        const fngData = await fngResponse.json()
        
        // Fetch market dominance from CoinGecko
        const marketResponse = await fetch('https://api.coingecko.com/api/v3/global')
        const marketGlobal = await marketResponse.json()
        
        if (fngData && fngData.data && fngData.data[0]) {
          const indexData = fngData.data[0]
          setFearGreedData({
            value: parseInt(indexData.value),
            classification: indexData.value_classification,
            timestamp: new Date(parseInt(indexData.timestamp) * 1000).toLocaleDateString()
          })
        }
        
        if (marketGlobal && marketGlobal.data) {
          const dominance = marketGlobal.data.market_cap_percentage
          const totalMarketCap = marketGlobal.data.total_market_cap.usd
          
          // Create market composition with real data
          const composition = [
            { 
              name: 'Bitcoin', 
              value: dominance.btc ? dominance.btc.toFixed(1) : 40, 
              color: '#f7931a',
              marketCap: (totalMarketCap * (dominance.btc / 100)).toFixed(2)
            },
            { 
              name: 'Ethereum', 
              value: dominance.eth ? dominance.eth.toFixed(1) : 18, 
              color: '#627eea',
              marketCap: (totalMarketCap * (dominance.eth / 100)).toFixed(2)
            },
            { 
              name: 'BNB', 
              value: dominance.bnb ? dominance.bnb.toFixed(1) : 4, 
              color: '#f3ba2f',
              marketCap: (totalMarketCap * (dominance.bnb / 100)).toFixed(2)
            },
            { 
              name: 'Others', 
              value: (100 - (dominance.btc || 40) - (dominance.eth || 18) - (dominance.bnb || 4)).toFixed(1), 
              color: '#8b5cf6',
              marketCap: (totalMarketCap * ((100 - (dominance.btc || 40) - (dominance.eth || 18) - (dominance.bnb || 4)) / 100)).toFixed(2)
            }
          ]
          
          setMarketData(composition)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        // Fallback data
        setFearGreedData({
          value: 65,
          classification: 'Greed',
          timestamp: new Date().toLocaleDateString()
        })
        setMarketData([
          { name: 'Bitcoin', value: 48.5, color: '#f7931a', marketCap: '1.2T' },
          { name: 'Ethereum', value: 17.2, color: '#627eea', marketCap: '420B' },
          { name: 'BNB', value: 3.8, color: '#f3ba2f', marketCap: '95B' },
          { name: 'Others', value: 30.5, color: '#8b5cf6', marketCap: '750B' }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [])

  // Animate the Fear & Greed value
  useEffect(() => {
    if (!fearGreedData) return
    
    let start = 0
    const end = fearGreedData.value
    const duration = 2000
    const increment = end / (duration / 16)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setAnimatedValue(end)
        clearInterval(timer)
      } else {
        setAnimatedValue(Math.floor(start))
      }
    }, 16)
    
    return () => clearInterval(timer)
  }, [fearGreedData])

  // Generate semicircle segments with ACCURATE percentages
  const renderSemicircle = () => {
    const segments = []
    const radius = 95
    const innerRadius = 75
    const centerX = 120
    const centerY = 120
    
    let currentAngle = 0
    
    marketData.forEach((item, index) => {
      const percentage = parseFloat(item.value)
      const segmentAngle = (percentage / 100) * 180 // Convert percentage to angle
      const numSegments = Math.ceil(segmentAngle / 2) // Each segment is ~2 degrees
      
      for (let i = 0; i < numSegments; i++) {
        const angle = currentAngle + (i * 2)
        const nextAngle = currentAngle + ((i + 1) * 2)
        
        if (nextAngle > currentAngle + segmentAngle) break
        
        const startAngle = (angle - 180) * (Math.PI / 180)
        const endAngle = (nextAngle - 180) * (Math.PI / 180)
        
        const x1 = centerX + radius * Math.cos(startAngle)
        const y1 = centerY + radius * Math.sin(startAngle)
        const x2 = centerX + radius * Math.cos(endAngle)
        const y2 = centerY + radius * Math.sin(endAngle)
        const x3 = centerX + innerRadius * Math.cos(endAngle)
        const y3 = centerY + innerRadius * Math.sin(endAngle)
        const x4 = centerX + innerRadius * Math.cos(startAngle)
        const y4 = centerY + innerRadius * Math.sin(startAngle)
        
        const isHovered = hoveredSegment === item.name
        
        segments.push(
          <path
            key={`${index}-${i}`}
            d={`M ${x1},${y1} A ${radius},${radius} 0 0,1 ${x2},${y2} L ${x3},${y3} A ${innerRadius},${innerRadius} 0 0,0 ${x4},${y4} Z`}
            fill={item.color}
            opacity="0.85"
            stroke={isHovered ? '#ffffff' : 'none'}
            strokeWidth={isHovered ? '0.5' : '0'}
            onMouseEnter={() => setHoveredSegment(item.name)}
            onMouseLeave={() => setHoveredSegment(null)}
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          />
        )
      }
      
      currentAngle += segmentAngle
    })
    
    return segments
  }

  // Get sentiment color
  const getSentimentColor = (value) => {
    if (value <= 25) return '#ef4444'
    if (value <= 45) return '#f97316'
    if (value <= 55) return '#eab308'
    if (value <= 75) return '#84cc16'
    return '#10b981'
  }

  if (loading) {
    return (
      <div className={styles.card} data-market={marketType}>
        <div className={styles.header}>
          <h3 className={styles.title}>Fear & Greed Index</h3>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading real-time data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card} data-market={marketType}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Fear & Greed Index</h3>
          <p className={styles.subtitle}>Market Dominance & Sentiment</p>
        </div>
        {fearGreedData && (
          <div className={styles.badge} style={{ background: getSentimentColor(fearGreedData.value) }}>
            {animatedValue} - {fearGreedData.classification}
          </div>
        )}
      </div>
      
      <div className={styles.content}>
        {/* Left side - Market Composition with real percentages */}
        <div className={styles.composition}>
          {marketData.map((item, index) => (
            <div 
              key={index} 
              className={`${styles.compositionItem} ${hoveredSegment === item.name ? styles.active : ''}`}
              onMouseEnter={() => setHoveredSegment(item.name)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className={styles.compositionDot} style={{ background: item.color }}></div>
              <div className={styles.compositionInfo}>
                <span className={styles.compositionName}>{item.name}</span>
                <span className={styles.compositionMarketCap}>${item.marketCap}</span>
              </div>
              <span className={styles.compositionPercent}>{item.value}%</span>
            </div>
          ))}
        </div>

        {/* Right side - Semicircle Gauge with accurate proportions */}
        <div className={styles.gaugeContainer}>
          <svg className={styles.gaugeSvg} viewBox="0 0 240 135">
            {renderSemicircle()}
          </svg>
          
          <div className={styles.gaugeValue}>
            <div className={styles.indexValue} style={{ color: getSentimentColor(animatedValue) }}>
              {animatedValue}
            </div>
            <div className={styles.indexLabel}>Fear & Greed</div>
            <div className={styles.indexSubLabel}>{fearGreedData?.classification}</div>
          </div>

          {/* Hover Tooltip */}
          {hoveredSegment && (
            <div className={styles.hoverTooltip}>
              <strong>{hoveredSegment}</strong>
              <span>{marketData.find(m => m.name === hoveredSegment)?.value}% Market Dominance</span>
            </div>
          )}
        </div>
      </div>

      {/* Scale markers */}
      <div className={styles.scaleMarkers}>
        <div className={styles.scaleItem}>
          <span className={styles.scaleValue}>0</span>
          <span className={styles.scaleLabel}>Extreme Fear</span>
        </div>
        <div className={styles.scaleItem}>
          <span className={styles.scaleValue}>50</span>
          <span className={styles.scaleLabel}>Neutral</span>
        </div>
        <div className={styles.scaleItem}>
          <span className={styles.scaleValue}>100</span>
          <span className={styles.scaleLabel}>Extreme Greed</span>
        </div>
      </div>
    </div>
  )
}

export default FearGreedCard
