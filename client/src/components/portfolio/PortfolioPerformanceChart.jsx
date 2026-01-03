/**
 * PortfolioPerformanceChart Component
 * Line chart showing portfolio value over time with time range selector
 */

import { useMemo } from 'react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import styles from './PortfolioPerformanceChart.module.css'

const PortfolioPerformanceChart = ({ 
  data = [], 
  timeRange = '30D', 
  onTimeRangeChange, 
  loading = false 
}) => {
  const timeRanges = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'MAX']

  // Determine if portfolio is in profit or loss
  const isProfit = useMemo(() => {
    if (data.length === 0) return true
    const firstValue = data[0]?.value || 0
    const lastValue = data[data.length - 1]?.value || 0
    return lastValue >= firstValue
  }, [data])

  // Format currency for Y-axis
  const formatCurrency = (value) => {
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
  }

  // Format date for X-axis
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    return `${month} ${day}`
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipDate}>{formatDate(data.date)}</p>
          <p className={styles.tooltipValue}>
            ${data.value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {data.changePercent !== undefined && (
            <p className={data.changePercent >= 0 ? styles.tooltipPositive : styles.tooltipNegative}>
              {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
            </p>
          )}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>Performance</h3>
          <div className={styles.timeRangeButtons}>
            {timeRanges.map(range => (
              <button
                key={range}
                className={`${styles.timeRangeButton} ${range === timeRange ? styles.active : ''}`}
                disabled
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.skeleton}>
          <div className={styles.skeletonChart}></div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>Performance</h3>
          <div className={styles.timeRangeButtons}>
            {timeRanges.map(range => (
              <button
                key={range}
                className={`${styles.timeRangeButton} ${range === timeRange ? styles.active : ''}`}
                onClick={() => onTimeRangeChange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.emptyState}>
          <p>No performance data available</p>
          <span>Add holdings to see your portfolio performance over time</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Performance</h3>
        <div className={styles.timeRangeButtons}>
          {timeRanges.map(range => (
            <button
              key={range}
              className={`${styles.timeRangeButton} ${range === timeRange ? styles.active : ''}`}
              onClick={() => onTimeRangeChange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={isProfit ? '#10b981' : '#ef4444'} 
                  stopOpacity={0.3}
                />
                <stop 
                  offset="95%" 
                  stopColor={isProfit ? '#10b981' : '#ef4444'} 
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="rgba(0, 0, 0, 0.08)" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#4a5568"
              strokeWidth={2}
              style={{ fontSize: '12px', fontWeight: '500' }}
              axisLine={{ stroke: '#4a5568', strokeWidth: 2 }}
              tickLine={{ stroke: '#4a5568', strokeWidth: 1 }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              stroke="#4a5568"
              strokeWidth={2}
              style={{ fontSize: '12px', fontWeight: '600' }}
              axisLine={{ stroke: '#4a5568', strokeWidth: 2 }}
              tickLine={{ stroke: '#4a5568', strokeWidth: 1 }}
              width={70}
              tickCount={6}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isProfit ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default PortfolioPerformanceChart
