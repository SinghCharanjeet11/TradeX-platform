import { MdTrendingUp, MdTrendingDown } from 'react-icons/md'
import portfolioService from '../../services/portfolioService'
import styles from './PortfolioSummaryBar.module.css'

function PortfolioSummaryBar({ summary }) {
  if (!summary) return null

  const {
    totalValue,
    totalInvested,
    totalProfitLoss,
    totalProfitLossPercent,
    count
  } = summary

  const isProfitable = totalProfitLoss >= 0

  return (
    <div className={styles.summaryBar}>
      <div className={styles.summaryItem}>
        <span className={styles.label}>Total Holdings</span>
        <span className={styles.value}>{count}</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.summaryItem}>
        <span className={styles.label}>Total Value</span>
        <span className={styles.valueHighlight}>
          {portfolioService.formatCurrency(totalValue)}
        </span>
      </div>

      <div className={styles.divider} />

      <div className={styles.summaryItem}>
        <span className={styles.label}>Total Invested</span>
        <span className={styles.value}>
          {portfolioService.formatCurrency(totalInvested)}
        </span>
      </div>

      <div className={styles.divider} />

      <div className={styles.summaryItem}>
        <span className={styles.label}>Total P/L</span>
        <div className={`${styles.plValue} ${isProfitable ? styles.positive : styles.negative}`}>
          {isProfitable ? <MdTrendingUp /> : <MdTrendingDown />}
          <div className={styles.plDetails}>
            <span className={styles.plAmount}>
              {portfolioService.formatCurrency(Math.abs(totalProfitLoss))}
            </span>
            <span className={styles.plPercent}>
              ({portfolioService.formatPercentage(totalProfitLossPercent)})
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioSummaryBar
