import { MdTrendingUp, MdTrendingDown } from 'react-icons/md'
import portfolioService from '../../services/portfolioService'
import useDashboardData from '../../hooks/useDashboardData'
import styles from './TopPerformersCard.module.css'

function TopPerformersCard() {
  const { portfolio } = useDashboardData()
  
  const topPerformers = portfolio.data?.topPerformers

  if (!topPerformers || (!topPerformers.best?.length && !topPerformers.worst?.length)) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Top Performers</h3>
        <div className={styles.emptyState}>
          <p>No holdings to display</p>
        </div>
      </div>
    )
  }

  const { best = [], worst = [] } = topPerformers

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Top Performers</h3>

      {best.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <MdTrendingUp className={styles.iconPositive} />
            <h4 className={styles.sectionTitle}>Best Performers</h4>
          </div>
          
          <div className={styles.list}>
            {best.map((holding, index) => (
              <AssetItem key={index} holding={holding} isPositive={true} />
            ))}
          </div>
        </div>
      )}

      {worst.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <MdTrendingDown className={styles.iconNegative} />
            <h4 className={styles.sectionTitle}>Worst Performers</h4>
          </div>
          
          <div className={styles.list}>
            {worst.map((holding, index) => (
              <AssetItem key={index} holding={holding} isPositive={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AssetItem({ holding, isPositive }) {
  const currentValue = holding.quantity * holding.currentPrice
  const performance = holding.performance || 0

  return (
    <div className={styles.assetItem}>
      <div className={styles.assetInfo}>
        <div className={styles.assetSymbol}>{holding.symbol}</div>
        <div className={styles.assetName}>{holding.name}</div>
      </div>
      
      <div className={styles.assetStats}>
        <div className={styles.assetValue}>
          {portfolioService.formatCurrency(currentValue)}
        </div>
        <div className={`${styles.assetPerformance} ${isPositive ? styles.positive : styles.negative}`}>
          {portfolioService.formatPercentage(performance)}
        </div>
      </div>
    </div>
  )
}

export default TopPerformersCard
