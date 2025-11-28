import { useState, useMemo } from 'react'
import { usePortfolioPerformance } from '../../hooks/usePortfolio'
import portfolioService from '../../services/portfolioService'
import styles from './PerformanceChart.module.css'

const TIMEFRAMES = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'ALL' }
]

function PerformanceChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M')
  const { performance, loading } = usePortfolioPerformance(selectedTimeframe)

  const chartData = useMemo(() => {
    if (!performance || !Array.isArray(performance) || performance.length === 0) return null

    const values = performance.map(p => p.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue

    const firstValue = values[0]
    const lastValue = values[values.length - 1]
    const change = lastValue - firstValue
    const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0

    return {
      points: performance,
      minValue,
      maxValue,
      range,
      change,
      changePercent,
      isPositive: change >= 0
    }
  }, [performance])

  const generatePath = () => {
    if (!chartData) return ''

    const { points, minValue, range } = chartData
    const width = 100
    const height = 60
    const padding = 5

    const pathPoints = points.map((point, index) => {
      const x = (index / (points.length - 1)) * width
      const y = height - padding - ((point.value - minValue) / range) * (height - padding * 2)
      return `${x},${y}`
    })

    return `M ${pathPoints.join(' L ')}`
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Portfolio Performance</h3>
          {chartData && (
            <div className={`${styles.change} ${chartData.isPositive ? styles.positive : styles.negative}`}>
              <span className={styles.changeValue}>
                {portfolioService.formatCurrency(Math.abs(chartData.change))}
              </span>
              <span className={styles.changePercent}>
                ({portfolioService.formatPercentage(chartData.changePercent)})
              </span>
            </div>
          )}
        </div>

        <div className={styles.timeframes}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              className={`${styles.timeframeBtn} ${
                selectedTimeframe === tf.value ? styles.active : ''
              }`}
              onClick={() => setSelectedTimeframe(tf.value)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chartContainer}>
        {loading ? (
          <div className={styles.loading}>Loading chart...</div>
        ) : chartData ? (
          <svg
            viewBox="0 0 100 60"
            className={styles.chart}
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <line x1="0" y1="15" x2="100" y2="15" className={styles.gridLine} />
            <line x1="0" y1="30" x2="100" y2="30" className={styles.gridLine} />
            <line x1="0" y1="45" x2="100" y2="45" className={styles.gridLine} />

            {/* Area under curve */}
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop
                  offset="0%"
                  stopColor={chartData.isPositive ? '#22c55e' : '#ef4444'}
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor={chartData.isPositive ? '#22c55e' : '#ef4444'}
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            <path
              d={`${generatePath()} L 100,60 L 0,60 Z`}
              fill="url(#chartGradient)"
            />

            {/* Line */}
            <path
              d={generatePath()}
              fill="none"
              stroke={chartData.isPositive ? '#22c55e' : '#ef4444'}
              strokeWidth="0.5"
              className={styles.chartLine}
            />
          </svg>
        ) : (
          <div className={styles.emptyState}>No data available</div>
        )}
      </div>

      {chartData && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>High</span>
            <span className={styles.statValue}>
              {portfolioService.formatCurrency(chartData.maxValue)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Low</span>
            <span className={styles.statValue}>
              {portfolioService.formatCurrency(chartData.minValue)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceChart
