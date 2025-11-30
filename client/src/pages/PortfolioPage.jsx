import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdSearch, MdFileDownload, MdRefresh, MdFilterList } from 'react-icons/md'
import Sidebar from '../components/dashboard/Sidebar'
import TopBar from '../components/dashboard/TopBar'
import LoadingScreen from '../components/LoadingScreen'
import HoldingsTable from '../components/portfolio/HoldingsTable'
import PortfolioSummaryBar from '../components/portfolio/PortfolioSummaryBar'
import { useHoldings } from '../hooks/useHoldings'
import holdingsService from '../services/holdingsService'
import styles from './PortfolioPage.module.css'
import topBarStyles from '../components/dashboard/TopBar.module.css'

const ASSET_TYPES = [
  { value: 'all', label: 'All Assets' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'forex', label: 'Forex' },
  { value: 'commodities', label: 'Commodities' }
]

function PortfolioPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAssetType, setSelectedAssetType] = useState('all')
  const [exporting, setExporting] = useState(false)

  const {
    holdings,
    summary,
    loading,
    error,
    filters,
    updateFilters,
    refetch
  } = useHoldings({
    assetType: selectedAssetType,
    search: searchQuery
  })

  // Fetch user on mount
  useState(() => {
    const fetchUser = async () => {
      try {
        const { authAPI } = await import('../services/api')
        const response = await authAPI.getCurrentUser()
        setUser(response.user)
      } catch (error) {
        console.error('[Portfolio] Error fetching user:', error)
        navigate('/signin')
      }
    }
    fetchUser()
  }, [navigate])

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    updateFilters({ search: value })
  }

  const handleAssetTypeChange = (type) => {
    setSelectedAssetType(type)
    updateFilters({ assetType: type })
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      await holdingsService.exportToCSV(filters)
    } catch (error) {
      console.error('[Portfolio] Export error:', error)
      alert('Failed to export holdings')
    } finally {
      setExporting(false)
    }
  }

  const handleSort = (sortBy) => {
    const currentSortBy = filters.sortBy
    const currentSortOrder = filters.sortOrder || 'desc'

    // Toggle sort order if clicking same column
    const newSortOrder = currentSortBy === sortBy && currentSortOrder === 'desc' 
      ? 'asc' 
      : 'desc'

    updateFilters({ sortBy, sortOrder: newSortOrder })
  }

  if (loading && !holdings.length) {
    return <LoadingScreen />
  }

  const additionalActions = (
    <>
      <button
        className={topBarStyles.iconBtn}
        onClick={refetch}
        disabled={loading}
        title="Refresh holdings"
      >
        <MdRefresh className={loading ? styles.spinning : ''} />
      </button>

      <button
        className={topBarStyles.userBtn}
        onClick={handleExport}
        disabled={exporting}
        style={{ gap: '8px' }}
      >
        <MdFileDownload />
        <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
      </button>
    </>
  )

  return (
    <div className={styles.portfolioPage}>
      <Sidebar />

      <div className={styles.main}>
        <TopBar user={user} additionalActions={additionalActions} />

        <div className={styles.content}>
          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.pageTitle}>Portfolio</h1>
              <p className={styles.subtitle}>View and manage all your holdings</p>
            </div>
          </div>

          {/* Summary Bar */}
          {summary && <PortfolioSummaryBar summary={summary} />}

          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <MdSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by symbol or name..."
                value={searchQuery}
                onChange={handleSearch}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.assetTypeFilters}>
              {ASSET_TYPES.map((type) => (
                <button
                  key={type.value}
                  className={`${styles.filterBtn} ${
                    selectedAssetType === type.value ? styles.active : ''
                  }`}
                  onClick={() => handleAssetTypeChange(type.value)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Holdings Table */}
          {error ? (
            <div className={styles.error}>
              <p>Error loading holdings: {error}</p>
              <button onClick={refetch}>Try Again</button>
            </div>
          ) : holdings.length === 0 ? (
            <div className={styles.emptyState}>
              <MdFilterList className={styles.emptyIcon} />
              <h3>No holdings found</h3>
              <p>
                {searchQuery || selectedAssetType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Connect an account to see your holdings'}
              </p>
            </div>
          ) : (
            <HoldingsTable
              holdings={holdings}
              onSort={handleSort}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default PortfolioPage
