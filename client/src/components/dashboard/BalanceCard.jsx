import { useState } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis, XAxis, CartesianGrid } from 'recharts'
import { MdAccountBalanceWallet, MdTrendingUp } from 'react-icons/md'
import styles from './BalanceCard.module.css'

// Market-specific portfolio data
const marketPortfolios = {
  Crypto: {
    balance: 24580,
    invested: 20000,
    profit: 4580,
    profitPercent: 22.9,
    color: '#10b981',
    data: [20000, 21500, 20800, 23000, 24580, 23200, 24580]
  },
  Stocks: {
    balance: 45230,
    invested: 40000,
    profit: 5230,
    profitPercent: 13.1,
    color: '#3b82f6',
    data: [40000, 41200, 42500, 43800, 45230, 44100, 45230]
  },
  Forex: {
    balance: 8450,
    invested: 8000,
    profit: 450,
    profitPercent: 5.6,
    color: '#f59e0b',
    data: [8000, 8100, 8050, 8200, 8450, 8300, 8450]
  },
  Commodities: {
    balance: 15680,
    invested: 15000,
    profit: 680,
    profitPercent: 4.5,
    color: '#8b5cf6',
    data: [15000, 15200, 15100, 15400, 15680, 15500, 15680]
  }
}

function BalanceCard({ marketType = 'Crypto' }) {
  const [timePeriod, setTimePeriod] = useState('24h')
  
  const periods = [
    { label: '1D', value: '24h' },
    { label: '7D', value: '7d' },
    { label: '1M', value: '30d' },
    { label: 'YTD', value: 'ytd' }
  ]

  const portfolio = marketPortfolios[marketType] || marketPortfolios.Crypto
  const isProfit = portfolio.profit >= 0
  
  // Generate chart data
  const chartData = portfolio.data.map((value, index) => ({
    value,
    time: index
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p>${payload[0].value.toLocaleString()}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={styles.card} data-market={marketType}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.iconWrapper} style={{ background: `${portfolio.color}20`, color: portfolio.color }}>
            <MdAccountBalanceWallet />
          </div>
          <h3>{marketType} Portfolio</h3>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.balanceInfo}>
          <div className={styles.mainBalance}>
            <div className={styles.balanceLabel}>Total Balance</div>
            <div className={styles.balanceAmount}>
              ${portfolio.balance.toLocaleString()}
            </div>
            <div className={`${styles.balanceChange} ${isProfit ? styles.profit : styles.loss}`}>
              <MdTrendingUp />
              {isProfit ? '+' : ''}{portfolio.profitPercent}% ({isProfit ? '+' : ''}${Math.abs(portfolio.profit).toLocaleString()})
            </div>
          </div>
        </div>

        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={`portfolio-gradient-${marketType}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={portfolio.color} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={portfolio.color} stopOpacity={0.05}/>
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
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                width={45}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: portfolio.color, strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={portfolio.color}
                strokeWidth={2.5}
                fill={`url(#portfolio-gradient-${marketType})`}
                dot={false}
                activeDot={{ r: 4, fill: portfolio.color, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Invested</div>
            <div className={styles.statValue}>
              ${portfolio.invested.toLocaleString()}
            </div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Return</div>
            <div className={`${styles.statValue} ${isProfit ? styles.profit : styles.loss}`} style={{ color: portfolio.color }}>
              {isProfit ? '+' : ''}{portfolio.profitPercent}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BalanceCard
