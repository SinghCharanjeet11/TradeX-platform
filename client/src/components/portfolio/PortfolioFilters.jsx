/**
 * PortfolioFilters Component
 * Advanced filtering and search for portfolio holdings
 */

import { useState, useEffect } from 'react'
import styles from './PortfolioFilters.module.css'

const PortfolioFilters = ({
  onFilterChange,
  onSearchChange,
  totalCount = 0,
  filteredCount = 0,
  onClearFilters
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [assetType, setAssetType] = useState('all')
  const [sortBy, setSortBy] = useState('totalValue')
  const [sortOrder, setSortOrder] = useState('desc')
  const [gainLossFilter, setGainLossFilter] = useState('all')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange && onSearchChange(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  // Notify parent of filter changes
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        assetType,
        sortBy,
        sortOrder,
        gainLossFilter
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetType, sortBy, sortOrder, gainLossFilter])

  const handleClearAll = () => {
    setSearchTerm('')
    setAssetType('all')
    setSortBy('totalValue')
    setSortOrder('desc')
    setGainLossFilter('all')
    onClearFilters && onClearFilters()
  }

  const hasActiveFilters = 
    searchTerm !== '' || 
    assetType !== 'all' || 
    gainLossFilter !== 'all' ||
    sortBy !== 'totalValue' ||
    sortOrder !== 'desc'

  return (
    <div className={styles.container}>
      {/* Search Bar */}
      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by symbol or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.clearSearchButton}
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className={styles.quickFilters}>
        {/* Asset Type Filter */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Asset Type</label>
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Assets</option>
            <option value="crypto">Crypto</option>
            <option value="stocks">Stocks</option>
            <option value="forex">Forex</option>
            <option value="commodities">Commodities</option>
          </select>
        </div>

        {/* Gain/Loss Filter */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Performance</label>
          <select
            value={gainLossFilter}
            onChange={(e) => setGainLossFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All</option>
            <option value="gainers">Gainers Only</option>
            <option value="losers">Losers Only</option>
          </select>
        </div>

        {/* Sort By */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="totalValue">Total Value</option>
            <option value="gainLoss">Gain/Loss</option>
            <option value="gainLossPercent">Gain/Loss %</option>
            <option value="symbol">Symbol</option>
            <option value="quantity">Quantity</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className={styles.filterGroup}>
          <button
            className={styles.sortOrderButton}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Advanced Toggle */}
        <button
          className={styles.advancedToggle}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className={styles.advancedFilters}>
          <div className={styles.advancedGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Min Value</label>
              <input
                type="number"
                placeholder="$0"
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Max Value</label>
              <input
                type="number"
                placeholder="No limit"
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Min Gain/Loss %</label>
              <input
                type="number"
                placeholder="-100%"
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Max Gain/Loss %</label>
              <input
                type="number"
                placeholder="+100%"
                className={styles.filterInput}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      <div className={styles.filterSummary}>
        <div className={styles.resultCount}>
          Showing {filteredCount} of {totalCount} holdings
        </div>
        {hasActiveFilters && (
          <button
            className={styles.clearFiltersButton}
            onClick={handleClearAll}
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  )
}

export default PortfolioFilters
