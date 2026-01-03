import { MdArrowUpward, MdArrowDownward, MdTrendingUp, MdTrendingDown, MdLink } from 'react-icons/md'
import portfolioService from '../../services/portfolioService'
import styles from './HoldingsTable.module.css'

const ASSET_TYPE_BADGES = {
  crypto: { label: 'Crypto', color: '#f59e0b' },
  stocks: { label: 'Stock', color: '#3b82f6' },
  forex: { label: 'Forex', color: '#8b5cf6' },
  commodities: { label: 'Commodity', color: '#10b981' }
}

const SOURCE_BADGES = {
  binance: { label: 'Binance', color: '#f0b90b' }
}

function HoldingsTable({ 
  holdings, 
  onSort, 
  sortBy, 
  sortOrder,
  loading = false
}) {
  const handleSort = (column) => {
    if (onSort) onSort(column)
  }

  const getSortIcon = (column) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? <MdArrowUpward /> : <MdArrowDownward />
  }

  if (loading) {
    return (
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Type</th>
              <th>Source</th>
              <th>Quantity</th>
              <th>Current Price</th>
              <th>Total Value</th>
              <th>24h Change</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className={styles.skeletonRow}>
                <td colSpan="8">
                  <div className={styles.skeleton}></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th onClick={() => handleSort('symbol')} className={styles.sortable}>
              <div className={styles.headerCell}>
                Asset {getSortIcon('symbol')}
              </div>
            </th>
            <th onClick={() => handleSort('assetType')} className={styles.sortable}>
              <div className={styles.headerCell}>
                Type {getSortIcon('assetType')}
              </div>
            </th>
            <th onClick={() => handleSort('source')} className={styles.sortable}>
              <div className={styles.headerCell}>
                Source {getSortIcon('source')}
              </div>
            </th>
            <th onClick={() => handleSort('quantity')} className={styles.sortable}>
              <div className={styles.headerCell}>
                Quantity {getSortIcon('quantity')}
              </div>
            </th>
            <th onClick={() => handleSort('currentPrice')} className={styles.sortable}>
              <div className={styles.headerCell}>
                Current Price {getSortIcon('currentPrice')}
              </div>
            </th>
            <th onClick={() => handleSort('totalValue')} className={styles.sortable}>
              <div className={styles.headerCell}>
                Total Value {getSortIcon('totalValue')}
              </div>
            </th>
            <th onClick={() => handleSort('priceChange24h')} className={styles.sortable}>
              <div className={styles.headerCell}>
                24h Change {getSortIcon('priceChange24h')}
              </div>
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => (
            <HoldingRow 
              key={holding.id} 
              holding={holding}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HoldingRow({ holding }) {
  const badge = ASSET_TYPE_BADGES[holding.assetType]
  const sourceBadge = SOURCE_BADGES[holding.source] || { label: holding.source, color: '#6b7280' }
  const priceChange = holding.priceChange24h || holding.change24h || 0
  const isPositiveChange = priceChange >= 0

  return (
    <tr className={`${styles.row} ${styles.exchangeRow}`}>
      <td>
        <div className={styles.assetCell}>
          <div className={styles.assetInfo}>
            <span className={styles.symbol}>{holding.symbol}</span>
            <span className={styles.name}>{holding.name}</span>
          </div>
        </div>
      </td>
      <td>
        <span
          className={styles.badge}
          style={{ backgroundColor: `${badge?.color || '#6b7280'}20`, color: badge?.color || '#6b7280' }}
        >
          {badge?.label || holding.assetType}
        </span>
      </td>
      <td>
        <span
          className={styles.sourceBadge}
          style={{ backgroundColor: `${sourceBadge.color}20`, color: sourceBadge.color }}
        >
          <MdLink className={styles.linkIcon} />
          {holding.account || sourceBadge.label}
        </span>
      </td>
      <td>
        <span className={styles.quantity}>
          {typeof holding.quantity === 'number' 
            ? holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 }) 
            : holding.quantity}
        </span>
      </td>
      <td>
        <span className={styles.price}>
          {portfolioService.formatCurrency(holding.currentPrice)}
        </span>
      </td>
      <td>
        <span className={styles.totalValue}>
          {portfolioService.formatCurrency(holding.totalValue)}
        </span>
      </td>
      <td>
        <div className={`${styles.change} ${isPositiveChange ? styles.positive : styles.negative}`}>
          {isPositiveChange ? <MdTrendingUp /> : <MdTrendingDown />}
          <span>{portfolioService.formatPercentage(Math.abs(priceChange))}</span>
        </div>
      </td>
      <td>
        <span className={styles.syncedLabel} title="Synced from exchange">
          Synced
        </span>
      </td>
    </tr>
  )
}

export default HoldingsTable
