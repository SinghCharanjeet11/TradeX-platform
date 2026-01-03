/**
 * PortfolioAllocationChart Component
 * Donut chart showing portfolio distribution by asset type
 */

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import styles from './PortfolioAllocationChart.module.css'

const PortfolioAllocationChart = ({ data = [], onSegmentClick, loading = false }) => {
  // Asset type colors matching design system
  const COLORS = {
    crypto: '#f59e0b',
    stocks: '#3b82f6',
    forex: '#8b5cf6',
    commodities: '#10b981'
  }

  // Calculate total value
  const totalValue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0)
  }, [data])

  // Filter out empty asset types
  const filteredData = useMemo(() => {
    return data.filter(item => item.value > 0)
  }, [data])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const assetType = data.assetType || ''
      const assetTypeStr = String(assetType)
      return (
        <div className={styles.tooltip}>
          <div 
            className={styles.tooltipColor} 
            style={{ backgroundColor: COLORS[assetType] }}
          />
          <div className={styles.tooltipContent}>
            <p className={styles.tooltipType}>
              {assetTypeStr.charAt(0).toUpperCase() + assetTypeStr.slice(1)}
            </p>
            <p className={styles.tooltipValue}>
              ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={styles.tooltipPercent}>
              {data.percentage.toFixed(1)}%
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  // Custom legend
  const renderLegend = (props) => {
    const { payload } = props
    return (
      <div className={styles.legend}>
        {payload.map((entry, index) => {
          const assetType = entry.payload?.assetType || entry.value || ''
          const assetTypeStr = String(assetType)
          return (
            <div 
              key={`legend-${index}`} 
              className={styles.legendItem}
              onClick={() => onSegmentClick && onSegmentClick(entry.payload.assetType)}
            >
              <div 
                className={styles.legendColor} 
                style={{ backgroundColor: entry.color }}
              />
              <span className={styles.legendText}>
                {assetTypeStr.charAt(0).toUpperCase() + assetTypeStr.slice(1)}
              </span>
              <span className={styles.legendPercent}>
                {entry.payload.percentage.toFixed(1)}%
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>Asset Allocation</h3>
        </div>
        <div className={styles.skeleton}>
          <div className={styles.skeletonChart}></div>
        </div>
      </div>
    )
  }

  if (filteredData.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>Asset Allocation</h3>
        </div>
        <div className={styles.emptyState}>
          <p>No allocation data</p>
          <span>Add holdings to see your portfolio distribution</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Asset Allocation</h3>
      </div>

      <div className={styles.chartWrapper}>
        <div style={{ position: 'relative', width: '100%', height: '260px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
                onClick={(data) => onSegmentClick && onSegmentClick(data.assetType)}
                style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
              >
                {filteredData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.assetType] || '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip 
                content={<CustomTooltip />}
                position={{ x: 0, y: 0 }}
                allowEscapeViewBox={{ x: true, y: true }}
                offset={20}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            <div style={{ fontSize: '13px', color: '#718096', marginBottom: '4px', fontWeight: '500' }}>
              Total Value
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        
        {/* Legend below chart */}
        <div className={styles.legend}>
          {filteredData.map((entry, index) => {
            const assetType = entry.assetType || ''
            const assetTypeStr = String(assetType)
            return (
              <div 
                key={`legend-${index}`} 
                className={styles.legendItem}
                onClick={() => onSegmentClick && onSegmentClick(entry.assetType)}
              >
                <div 
                  className={styles.legendColor} 
                  style={{ backgroundColor: COLORS[entry.assetType] || '#6b7280' }}
                />
                <span className={styles.legendText}>
                  {assetTypeStr.charAt(0).toUpperCase() + assetTypeStr.slice(1)}
                </span>
                <span className={styles.legendPercent}>
                  {entry.percentage.toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PortfolioAllocationChart
