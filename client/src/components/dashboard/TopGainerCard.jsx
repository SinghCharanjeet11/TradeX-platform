import { useState } from 'react'
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, CartesianGrid } from 'recharts'
import { MdTrendingUp } from 'react-icons/md'
import styles from './TopGainerCard.module.css'

function TopGainerCard({ marketType = 'Crypto', data = [] }) {
  const [timePeriod, setTimePeriod] = useState('24h')
  
  const periods = [
    { label: '1D', value: '24h' },
    { label: '7D', value: '7d' },
    { label: '1M', value: '30d' },
    { label: 'YTD', value: 'ytd' },
    { label: 'All', value: 'all' }
  ]

  // Market-specific colors
  const marketColors = {
    Crypto: '#10b981',
    Stocks: '#3b82f6',
    Forex: '#f59e0b',
    Commodities: '#8b5cf6'
  }

  const marketColor = marketColors[marketType] || marketColors.Crypto

  // Find the top gainer from the data
  const topGainer = data.length > 0 
    ? data.reduce((max, item) => {
        const change = item.change24h || item.change || 0
        const maxChange = max.change24h || max.change || 0
        return change > maxChange ? item : max
      }, data[0])
    : null

  // Fallback data if no real data is available
  const fallbackData = {
    Crypto: { 
      name: 'Bitcoin', 
      symbol: 'BTC', 
      price: 67245, 
      change24h: 2.15, 
      volume24h: 38400000000, 
      marketCap: 1320000000000,
      circulatingSupply: 19500000,
      image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
    },
    Stocks: { 
      name: 'Apple Inc.', 
      symbol: 'AAPL', 
      price: 178.25, 
      change24h: 1.45, 
      volume24h: 52300000, 
      marketCap: 2800000000000,
      pe_ratio: 28.5,
      dividend_yield: 0.52,
      image: 'https://logo.clearbit.com/apple.com'
    },
    Forex: { 
      name: 'EUR/USD', 
      symbol: 'EURUSD', 
      price: 1.0845, 
      change24h: 0.15, 
      volume24h: 1200000000000,
      bid: 1.0843,
      ask: 1.0847,
      spread: 0.0004,
      image: 'https://flagcdn.com/w80/eu.png'
    },
    Commodities: { 
      name: 'Gold', 
      symbol: 'XAU', 
      price: 2045.50, 
      change24h: 0.85, 
      volume24h: 145000000000,
      marketCap: 12500000000000,
      unit: 'per oz',
      high24h: 2055.30,
      low24h: 2038.20,
      image: 'https://cdn-icons-png.flaticon.com/512/2529/2529508.png'
    }
  }

  const displayGainer = topGainer || fallbackData[marketType] || fallbackData.Crypto

  // Generate chart data for visualization
  const generateChartData = () => {
    const points = 20
    const change = displayGainer.change24h || displayGainer.change || 0
    const basePrice = displayGainer.price || 100
    const startPrice = basePrice / (1 + change / 100)
    
    return Array.from({ length: points }, (_, i) => {
      const progress = i / (points - 1)
      const price = startPrice + (basePrice - startPrice) * progress
      const variance = (Math.random() - 0.5) * (basePrice * 0.02)
      return {
        value: price + variance
      }
    })
  }

  const chartData = generateChartData()
  const change = displayGainer.change24h || displayGainer.change || 0
  const isPositive = change >= 0

  // Get market-specific stats
  const getMarketStats = () => {
    switch (marketType) {
      case 'Crypto':
        return [
          { 
            label: 'Volume 24h', 
            value: displayGainer.volume24h ? `$${(displayGainer.volume24h / 1e9).toFixed(2)}B` : '-' 
          },
          { 
            label: 'Market Cap', 
            value: displayGainer.marketCap ? `$${(displayGainer.marketCap / 1e9).toFixed(2)}B` : '-' 
          }
        ]
      
      case 'Stocks':
        return [
          { 
            label: 'Volume 24h', 
            value: displayGainer.volume24h ? `${(displayGainer.volume24h / 1e6).toFixed(2)}M` : '-' 
          },
          { 
            label: 'P/E Ratio', 
            value: displayGainer.pe_ratio ? displayGainer.pe_ratio.toFixed(2) : '28.5' 
          }
        ]
      
      case 'Forex':
        return [
          { 
            label: 'Bid/Ask', 
            value: displayGainer.bid && displayGainer.ask 
              ? `${displayGainer.bid.toFixed(4)}/${displayGainer.ask.toFixed(4)}` 
              : `${(displayGainer.price * 0.9999).toFixed(4)}/${(displayGainer.price * 1.0001).toFixed(4)}`
          },
          { 
            label: 'Spread', 
            value: displayGainer.spread 
              ? displayGainer.spread.toFixed(4) 
              : '0.0004'
          }
        ]
      
      case 'Commodities':
        return [
          { 
            label: '24h High/Low', 
            value: displayGainer.high24h && displayGainer.low24h
              ? `$${displayGainer.high24h.toFixed(2)}/$${displayGainer.low24h.toFixed(2)}`
              : `$${(displayGainer.price * 1.02).toFixed(2)}/$${(displayGainer.price * 0.98).toFixed(2)}`
          },
          { 
            label: 'Unit', 
            value: displayGainer.unit || 'per oz'
          }
        ]
      
      default:
        return [
          { label: 'Volume 24h', value: '-' },
          { label: 'Market Cap', value: '-' }
        ]
    }
  }

  const stats = getMarketStats()

  return (
    <div className={styles.card} data-market={marketType}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <MdTrendingUp className={styles.icon} style={{ color: marketColor }} />
          <h3>Top Gainer</h3>
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
            {displayGainer.image ? (
              <img src={displayGainer.image} alt={displayGainer.symbol} className={styles.assetImage} />
            ) : (
              <div className={styles.assetIcon} style={{ background: `${marketColor}20`, color: marketColor }}>
                {displayGainer.symbol?.substring(0, 2) || '??'}
              </div>
            )}
            <div>
              <div className={styles.name}>{displayGainer.name}</div>
              <div className={styles.symbol}>{displayGainer.symbol}</div>
            </div>
          </div>
          
          <div className={styles.priceInfo}>
            <div className={styles.price}>
              ${typeof displayGainer.price === 'number' ? displayGainer.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
            </div>
            <div className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="index" 
                hide={true}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                width={50}
                domain={['auto', 'auto']}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={isPositive ? marketColor : '#ef4444'}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.stats}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.stat}>
              <div className={styles.statLabel}>{stat.label}</div>
              <div className={styles.statValue}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TopGainerCard
