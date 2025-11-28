import { MdArrowUpward, MdArrowDownward, MdTrendingUp, MdTrendingDown } from 'react-icons/md'
import portfolioService from '../../services/portfolioService'
import styles from './HoldingsTable.module.css'

const ASSET_TYPE_BADGES = {
  crypto: { label: 'Crypto', color: '#f59e0b' },
  stocks: { label: 'Stock', color: '#3b82f6' },
  forex: { label: 'Forex', color: '#8b5cf6' },
  commodities: { label: 'Commodity', color: '#10b981' }
}

function HoldingsTable({ holdings, onSort, sortBy, sortOrder }) {
  const handleSort = (column) => {
    onSort(column)
  }

  const getSortIcon = (column) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? <MdArrowUpward /> : <MdArrowDownward />
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
            <th onClick={() => handleSort('accountName')} className={styles.sortable}>
              <div className={styles.headerCell}>
                Account {getSortIcon('accountName')}
              </div>
            </th>
            <th onClick={() => handleSort('quantity')} className={styles.sortable}>
              <div className={styles.headerCell}>
                Quantity {getSortIcon('quantity')}
              </div>
            </th>
            <th onClick={() => handleSort('avgBuyPrice')} className={styles.sortable}>
              <div className={styles.headerCell}>
                Avg Price {getSortIcon('avgBuyPrice')}
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
            <th onClick={() => handleSort('profitLoss')} className={styles.sortable}>
              <div className={styles.headerCell}>
                Profit/Loss {getSortIcon('profitLoss')}
              </div>
            </th>
            <th onClick={() => handleSort('change24h')} className={styles.sortable}>
              <div className={styles.headerCell}>
                24h Change {getSortIcon('change24h')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => (
            <HoldingRow key={holding.id} holding={holding} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HoldingRow({ holding }) {
  const badge = ASSET_TYPE_BADGES[holding.assetType]
  const isProfitable = holding.profitLoss >= 0
  const isPositiveChange = holding.change24h >= 0

  return (
    <tr className={styles.row}>
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
          style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
        >
          {badge.label}
        </span>
      </td>
      <td>
        <span className={styles.account}>{holding.accountName}</span>
      </td>
      <td>
        <span className={styles.quantity}>{holding.quantity.toLocaleString()}</span>
      </td>
      <td>
        <span className={styles.price}>
          {portfolioService.formatCurrency(holding.avgBuyPrice)}
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
        <div className={`${styles.profitLoss} ${isProfitable ? styles.positive : styles.negative}`}>
          <div className={styles.plAmount}>
            {portfolioService.formatCurrency(Math.abs(holding.profitLoss))}
          </div>
          <div className={styles.plPercent}>
            {portfolioService.formatPercentage(holding.profitLossPercent)}
          </div>
        </div>
      </td>
      <td>
        <div className={`${styles.change} ${isPositiveChange ? styles.positive : styles.negative}`}>
          {isPositiveChange ? <MdTrendingUp /> : <MdTrendingDown />}
          <span>{portfolioService.formatPercentage(Math.abs(holding.change24h))}</span>
        </div>
      </td>
    </tr>
  )
}

export default HoldingsTable
