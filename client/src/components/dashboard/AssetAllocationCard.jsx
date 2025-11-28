import { useMemo } from 'react'
import styles from './AssetAllocationCard.module.css'

const ASSET_COLORS = {
  crypto: '#f59e0b',
  stocks: '#3b82f6',
  forex: '#8b5cf6',
  commodities: '#10b981'
}

const ASSET_LABELS = {
  crypto: 'Cryptocurrency',
  stocks: 'Stocks',
  forex: 'Forex',
  commodities: 'Commodities'
}

function AssetAllocationCard({ allocation }) {
  const chartData = useMemo(() => {
    if (!allocation) return []

    return Object.entries(allocation)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        type: key,
        label: ASSET_LABELS[key],
        percentage: value,
        color: ASSET_COLORS[key]
      }))
      .sort((a, b) => b.percentage - a.percentage)
  }, [allocation])

  const totalPercentage = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.percentage, 0)
  }, [chartData])

  if (chartData.length === 0) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Asset Allocation</h3>
        <div className={styles.emptyState}>
          <p>No assets to display</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Asset Allocation</h3>
      
      <div className={styles.chartContainer}>
        <svg viewBox="0 0 200 200" className={styles.pieChart}>
          {chartData.map((item, index) => {
            const startAngle = chartData
              .slice(0, index)
              .reduce((sum, d) => sum + (d.percentage / 100) * 360, 0)
            
            const endAngle = startAngle + (item.percentage / 100) * 360
            
            return (
              <PieSlice
                key={item.type}
                startAngle={startAngle}
                endAngle={endAngle}
                color={item.color}
                label={item.label}
                percentage={item.percentage}
              />
            )
          })}
          
          {/* Center circle for donut effect */}
          <circle cx="100" cy="100" r="60" fill="#1a1d29" />
          
          {/* Center text */}
          <text
            x="100"
            y="95"
            textAnchor="middle"
            className={styles.centerText}
            fill="#8b92a7"
            fontSize="12"
          >
            Total
          </text>
          <text
            x="100"
            y="110"
            textAnchor="middle"
            className={styles.centerValue}
            fill="#fff"
            fontSize="16"
            fontWeight="600"
          >
            {totalPercentage.toFixed(0)}%
          </text>
        </svg>
      </div>

      <div className={styles.legend}>
        {chartData.map((item) => (
          <div key={item.type} className={styles.legendItem}>
            <div
              className={styles.legendColor}
              style={{ backgroundColor: item.color }}
            />
            <div className={styles.legendInfo}>
              <span className={styles.legendLabel}>{item.label}</span>
              <span className={styles.legendValue}>
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PieSlice({ startAngle, endAngle, color }) {
  const radius = 80
  const centerX = 100
  const centerY = 100

  const startRad = (startAngle - 90) * (Math.PI / 180)
  const endRad = (endAngle - 90) * (Math.PI / 180)

  const x1 = centerX + radius * Math.cos(startRad)
  const y1 = centerY + radius * Math.sin(startRad)
  const x2 = centerX + radius * Math.cos(endRad)
  const y2 = centerY + radius * Math.sin(endRad)

  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  const pathData = [
    `M ${centerX} ${centerY}`,
    `L ${x1} ${y1}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
    'Z'
  ].join(' ')

  return (
    <path
      d={pathData}
      fill={color}
      className={styles.pieSlice}
    />
  )
}

export default AssetAllocationCard
