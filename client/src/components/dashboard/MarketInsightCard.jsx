import { useState } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis, XAxis, CartesianGrid } from 'recharts'
import { MdTrendingUp, MdShowChart, MdAttachMoney, MdLocalGasStation } from 'react-icons/md'
import styles from './MarketInsightCard.module.css'

function MarketInsightCard({ marketType = 'Crypto', data = [] }) {
  const [timePeriod, setTimePeriod] = useState('24h')
  
  const periods = [
    { label: '1D', value: '24h' },
    { label: '7D', value: '7d' },
    { label: '1M', value: '30d' },
    { label: 'YTD', value: 'ytd' }
  ]

  // Generate insights based on market type
  const getInsight = () => {
    if (data.length === 0) return null

    switch (marketType) {
      case 'Crypto':
        // Top Gainer for Crypto
        const topGainer = data.reduce((max, item) => {
          const change = item.change24h || item.change || 0
          const maxChange = max.change24h || max.change || 0
          return change > maxChange ? item : max
        }, data[0])
        
        return {
          title: 'Top Gainer',
          icon: <MdTrendingUp />,
          asset: topGainer,
          metric: 'Gain',
          value: `+${(topGainer.change24h || topGainer.change || 0).toFixed(2)}%`,
          color: '#10b981'
        }

      case 'Stocks':
        // Most Active Stock (highest volume)
        const mostActive = data.reduce((max, item) => {
          const vol = item.volume24h || item.volume || 0
          const maxVol = max.volume24h || max.volume || 0
          return vol > maxVol ? item : max
        }, data[0])
        
        return {
          title: 'Most Active',
          icon: <MdShowChart />,
          asset: mostActive,
          metric: 'Volume',
          value: `$${((mostActive.volume24h || mostActive.volume || 0) / 1e9).toFixed(2)}B`,
          color: '#3b82f6'
        }

      case 'Forex':
        // Strongest Currency Pair
        const strongest = data.reduce((max, item) => {
          const change = Math.abs(item.change24h || item.change || 0)
          const maxChange = Math.abs(max.change24h || max.change || 0)
          return change > maxChange ? item : max
        }, data[0])
        
        return {
          title: 'Most Volatile',
          icon: <MdAttachMoney />,
          asset: strongest,
          metric: 'Movement',
          value: `${(strongest.change24h || strongest.change || 0) > 0 ? '+' : ''}${(strongest.change24h || strongest.change || 0).toFixed(2)}%`,
          color: '#f59e0b'
        }

      case 'Commodities':
        // Highest Priced Commodity
        const highest = data.reduce((max, item) => {
          const price = item.price || 0
          const maxPrice = max.price || 0
          return price > maxPrice ? item : max
        }, data[0])
        
        return {
          title: 'Premium Asset',
          icon: <MdLocalGasStation />,
          asset: highest,
          metric: 'Price',
          value: `$${(highest.price || 0).toLocaleString()}`,
          color: '#8b5cf6'
        }

      default:
        return null
    }
  }

  const insight = getInsight()

  if (!insight) {
    return (
      <div className={styles.card}>
        <div className={styles.emptyState}>
          <p>No data available</p>
        </div>
      </div>
    )
  }

  // Generate enhanced chart data with gradient
  const generateChartData = () => {
    const points = 30
    const change = insight.asset.change24h || insight.asset.change || 0
    const basePrice = insight.asset.price || 100
    const startPrice = basePrice / (1 + change / 100)
    
    return Array.from({ length: points }, (_, i) => {
      const progress = i / (points - 1)
      const trend = startPrice + (basePrice - startPrice) * progress
      const noise = (Math.random() - 0.5) * (basePrice * 0.015)
      return {
        value: trend + noise,
        time: i
      }
    })
  }

  const chartData = generateChartData()
  const isPositive = (insight.asset.change24h || insight.asset.change || 0) > 0

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p>${payload[0].value.toFixed(2)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={styles.card} data-market={marketType}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.iconWrapper} style={{ background: `${insight.color}20`, color: insight.color }}>
            {insight.icon}
          </div>
          <h3>{insight.title}</h3>
        </div>
        <div className={styles.periodSelector}>
          {periods.map(period => (
            <button
              key={period.value}
              className={`${styles.periodBtn} ${timePeriod === period.value ? styles.active : ''}`}
              onClick={() => setTimePeriod(period.value)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.assetInfo}>
          <div className={styles.assetName}>
            {insight.asset.image && (
              <img src={insight.asset.image} alt={insight.asset.symbol} className={styles.assetImage} />
            )}
            <div>
              <div className={styles.name}>{insight.asset.name}</div>
              <div className={styles.symbol}>{insight.asset.symbol}</div>
            </div>
          </div>
          
          <div className={styles.priceInfo}>
            <div className={styles.price}>
              ${typeof insight.asset.price === 'number' ? insight.asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
            </div>
            <div className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
              {isPositive ? '+' : ''}{(insight.asset.change24h || insight.asset.change || 0).toFixed(2)}%
            </div>
          </div>
        </div>

        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={`gradient-${marketType}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={insight.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={insight.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="time" 
                hide={true}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                width={50}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={insight.color}
                strokeWidth={2}
                fill={`url(#gradient-${marketType})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>{insight.metric}</div>
            <div className={styles.statValue} style={{ color: insight.color }}>
              {insight.value}
            </div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Market Cap</div>
            <div className={styles.statValue}>
              {insight.asset.marketCap && insight.asset.marketCap !== '-' 
                ? `$${typeof insight.asset.marketCap === 'number' ? (insight.asset.marketCap / 1e9).toFixed(2) + 'B' : insight.asset.marketCap}`
                : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarketInsightCard
