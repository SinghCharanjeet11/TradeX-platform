import { usePredictions } from '../../hooks/useAIInsights'
import { MdTrendingUp, MdTrendingDown, MdShowChart } from 'react-icons/md'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import styles from './PricePredictionSection.module.css'

function PricePredictionSection({ symbol, assetType, currentPrice }) {
  const { predictions, loading, error } = usePredictions(symbol, assetType, ['24h', '7d', '30d'])

  if (loading) {
    return (
      <div className={styles.section}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading price predictions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.error}>
          <MdShowChart className={styles.errorIcon} />
          <p>Unable to load predictions</p>
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!predictions || !predictions.predictions || predictions.predictions.length === 0) {
    return (
      <div className={styles.section}>
        <div className={styles.noData}>
          <MdShowChart className={styles.noDataIcon} />
          <p>No predictions available</p>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const chartData = [
    { time: 'Now', price: currentPrice },
    ...predictions.predictions.map(p => ({
      time: p.timeHorizon,
      price: p.predictedPrice,
      min: p.priceRange.min,
      max: p.priceRange.max
    }))
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.chartTooltip}>
          <p className={styles.tooltipLabel}>{payload[0].payload.time}</p>
          <p className={styles.tooltipPrice}>${payload[0].value.toFixed(2)}</p>
          {payload[0].payload.min && (
            <p className={styles.tooltipRange}>
              Range: ${payload[0].payload.min.toFixed(2)} - ${payload[0].payload.max.toFixed(2)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <MdShowChart className={styles.headerIcon} />
        <h3>Price Predictions</h3>
      </div>

      {/* Mini Chart */}
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis 
              dataKey="time" 
              stroke="#4a5568"
              strokeWidth={2}
              tick={{ fill: '#4a5568', fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: '#4a5568', strokeWidth: 2 }}
              tickLine={{ stroke: '#4a5568', strokeWidth: 1 }}
            />
            <YAxis 
              stroke="#4a5568"
              strokeWidth={2}
              tick={{ fill: '#1a202c', fontSize: 12, fontWeight: 600 }}
              tickFormatter={(value) => {
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
              }}
              axisLine={{ stroke: '#4a5568', strokeWidth: 2 }}
              tickLine={{ stroke: '#4a5568', strokeWidth: 1 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#7c8cff" 
              strokeWidth={3}
              dot={{ fill: '#7c8cff', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Prediction Cards */}
      <div className={styles.predictionsGrid}>
        {predictions.predictions.map((prediction, index) => {
          const change = ((prediction.predictedPrice - currentPrice) / currentPrice) * 100
          const isPositive = change > 0

          return (
            <div key={index} className={styles.predictionCard}>
              <div className={styles.cardHeader}>
                <span className={styles.timeHorizon}>{prediction.timeHorizon}</span>
                <div className={`${styles.trend} ${isPositive ? styles.bullish : styles.bearish}`}>
                  {isPositive ? <MdTrendingUp /> : <MdTrendingDown />}
                  {isPositive ? '+' : ''}{change.toFixed(2)}%
                </div>
              </div>
              
              <div className={styles.predictedPrice}>
                ${prediction.predictedPrice.toFixed(2)}
              </div>
              
              <div className={styles.priceRange}>
                <span>Range:</span>
                <span>${prediction.priceRange.min.toFixed(2)} - ${prediction.priceRange.max.toFixed(2)}</span>
              </div>
              
              <div className={styles.confidence}>
                <div className={styles.confidenceLabel}>
                  <span>Confidence</span>
                  <span className={styles.confidenceValue}>{prediction.confidence}%</span>
                </div>
                <div className={styles.confidenceBar}>
                  <div 
                    className={styles.confidenceFill}
                    style={{ width: `${prediction.confidence}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Last Updated */}
      <div className={styles.footer}>
        <span className={styles.lastUpdated}>
          Last updated: {new Date(predictions.lastUpdated).toLocaleString()}
        </span>
        {predictions.historicalAccuracy && (
          <span className={styles.accuracy}>
            Historical Accuracy: {predictions.historicalAccuracy}%
          </span>
        )}
      </div>
    </div>
  )
}

export default PricePredictionSection
