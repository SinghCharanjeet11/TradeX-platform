import { MdTrendingUp, MdTrendingDown, MdRefresh } from 'react-icons/md'
import portfolioService from '../../services/portfolioService'
import styles from './PortfolioSummaryCard.module.css'

function PortfolioSummaryCard({ portfolio, onRefresh, refreshing }) {
  if (!portfolio) {
    return (
      <div className={styles.card}>
        <div className={styles.emptyState}>
          <p>No portfolio data available</p>
          <p className={styles.hint}>Connect an account to see your portfolio</p>
        </div>
      </div>
    )
  }

  const {
    totalValue = 0,
    change24h = 0,
    change24hPercent = 0,
    profitLoss = {},
    accountCount = 0
  } = portfolio

  const isPositive = change24hPercent >= 0

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Total Portfolio Value</h3>
          <p className={styles.subtitle}>
            Across {accountCount} {accountCount === 1 ? 'account' : 'accounts'}
          </p>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh portfolio data"
        >
          <MdRefresh className={refreshing ? styles.spinning : ''} />
        </button>
      </div>

      <div className={styles.valueSection}>
        <h2 className={styles.totalValue}>
          {portfolioService.formatCurrency(totalValue)}
        </h2>
        
        <div className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
          {isPositive ? <MdTrendingUp /> : <MdTrendingDown />}
          <span className={styles.changeAmount}>
            {portfolioService.formatCurrency(Math.abs(change24h))}
          </span>
          <span className={styles.changePercent}>
            ({portfolioService.formatPercentage(change24hPercent)})
          </span>
          <span className={styles.timeframe}>24h</span>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Invested</span>
          <span className={styles.statValue}>
            {portfolioService.formatCurrency(profitLoss?.totalInvested || 0)}
          </span>
        </div>
        
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total P/L</span>
          <span className={`${styles.statValue} ${
            (profitLoss?.profitLoss || 0) >= 0 ? styles.positive : styles.negative
          }`}>
            {portfolioService.formatCurrency(profitLoss?.profitLoss || 0)}
          </span>
        </div>
        
        <div className={styles.stat}>
          <span className={styles.statLabel}>Return</span>
          <span className={`${styles.statValue} ${
            (profitLoss?.profitLossPercent || 0) >= 0 ? styles.positive : styles.negative
          }`}>
            {portfolioService.formatPercentage(profitLoss?.profitLossPercent || 0)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PortfolioSummaryCard
