import { MdTrendingUp, MdTrendingDown, MdTrendingFlat } from 'react-icons/md'
import styles from './SentimentIndicator.module.css'

function SentimentIndicator({ score, showLabel = true, showTooltip = true, size = 'medium' }) {
  if (score === undefined || score === null) {
    return null
  }

  const getSentimentType = () => {
    if (score > 0.3) return 'positive'
    if (score < -0.3) return 'negative'
    return 'neutral'
  }

  const getSentimentIcon = () => {
    const type = getSentimentType()
    if (type === 'positive') return <MdTrendingUp />
    if (type === 'negative') return <MdTrendingDown />
    return <MdTrendingFlat />
  }

  const getSentimentLabel = () => {
    const type = getSentimentType()
    if (type === 'positive') return 'Bullish'
    if (type === 'negative') return 'Bearish'
    return 'Neutral'
  }

  const getSentimentPercentage = () => {
    return Math.abs(score * 100).toFixed(0)
  }

  const sentimentType = getSentimentType()
  const tooltipText = `Market Sentiment: ${getSentimentLabel()} (${getSentimentPercentage()}% confidence)`

  return (
    <div
      className={`${styles.sentimentIndicator} ${styles[sentimentType]} ${styles[size]}`}
      title={showTooltip ? tooltipText : undefined}
    >
      <span className={styles.icon}>{getSentimentIcon()}</span>
      {showLabel && (
        <div className={styles.labelContainer}>
          <span className={styles.label}>{getSentimentLabel()}</span>
          <span className={styles.percentage}>{getSentimentPercentage()}%</span>
        </div>
      )}
    </div>
  )
}

export default SentimentIndicator
