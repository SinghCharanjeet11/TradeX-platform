import { useState, useEffect } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis, XAxis, CartesianGrid } from 'recharts'
import { MdAccountBalanceWallet, MdTrendingUp, MdTrendingDown, MdAdd } from 'react-icons/md'
import { usePortfolio } from '../../hooks/usePortfolio'
import styles from './BalanceCard.module.css'

// Market colors for styling
const marketColors = {
  Crypto: '#10b981',
  Stocks: '#3b82f6',
  Forex: '#f59e0b',
  Commodities: '#8b5cf6'
}

function BalanceCard({ marketType = 'Crypto', onAddHolding }) {
  const { portfolio, loading, error } = usePortfolio()
  const [timePeriod, setTimePeriod] = useState('24h')
  
  const color = marketColors[marketType] || marketColors.Crypto

  // Check if user has any holdings/investments
  const hasInvestments = portfolio && portfolio.totalValue > 0

  // Calculate portfolio stats from real data
  const balance = portfolio?.totalValue || 0
  const invested = portfolio?.totalInvested || 0
  const profit = balance - invested
  const profitPercent = invested > 0 ? ((profit / invested) * 100) : 0
  const isProfit = profit >= 0

  // Generate chart data from performance history or use empty data
  const chartData = portfolio?.performanceHistory?.length > 0 
    ? portfolio.performanceHistory.map((point, index) => ({
        value: point.value,
        time: index
      }))
    : []

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

  // Empty state when no investments
  if (!loading && !hasInvestments) {
    return (
      <div className={styles.card} data-market={marketType}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.iconWrapper} style={{ background: `${color}20`, color: color }}>
              <MdAccountBalanceWallet />
            </div>
            <h3>{marketType} Portfolio</h3>
          </div>
        </div>

        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} style={{ background: `${color}15`, color: color }}>
            <MdAccountBalanceWallet />
          </div>
          <h4>No Investments Yet</h4>
          <p>Start building your portfolio by adding holdings or connecting an exchange account.</p>
          {onAddHolding && (
            <button className={styles.addButton} style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }} onClick={onAddHolding}>
              <MdAdd /> Add Holding
            </button>
          )}
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.card} data-market={marketType}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.iconWrapper} style={{ background: `${color}20`, color: color }}>
              <MdAccountBalanceWallet />
            </div>
            <h3>{marketType} Portfolio</h3>
          </div>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} style={{ borderColor: `${color}30`, borderTopColor: color }}></div>
          <p>Loading portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card} data-market={marketType}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.iconWrapper} style={{ background: `${color}20`, color: color }}>
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
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`${styles.balanceChange} ${isProfit ? styles.profit : styles.loss}`}>
              {isProfit ? <MdTrendingUp /> : <MdTrendingDown />}
              {isProfit ? '+' : ''}{profitPercent.toFixed(1)}% ({isProfit ? '+' : ''}${Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </div>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id={`portfolio-gradient-${marketType}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
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
                  cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color}
                  strokeWidth={2.5}
                  fill={`url(#portfolio-gradient-${marketType})`}
                  dot={false}
                  activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Invested</div>
            <div className={styles.statValue}>
              ${invested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Return</div>
            <div className={`${styles.statValue} ${isProfit ? styles.profit : styles.loss}`} style={{ color: color }}>
              {isProfit ? '+' : ''}{profitPercent.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BalanceCard
