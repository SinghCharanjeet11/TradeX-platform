import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdFileDownload, MdRefresh } from 'react-icons/md'
import TopBar from '../components/dashboard/TopBar'
import LoadingScreen from '../components/LoadingScreen'
import HoldingsTable from '../components/portfolio/HoldingsTable'
import PortfolioSummaryBar from '../components/portfolio/PortfolioSummaryBar'
import PortfolioPerformanceChart from '../components/portfolio/PortfolioPerformanceChart'
import PortfolioAllocationChart from '../components/portfolio/PortfolioAllocationChart'
import PortfolioOptimizationCard from '../components/portfolio/PortfolioOptimizationCard'
import PortfolioFilters from '../components/portfolio/PortfolioFilters'
import PaginationControls from '../components/portfolio/PaginationControls'
import { useAuth } from '../contexts/AuthContext'
import { useHoldings } from '../hooks/useHoldings'
import { usePerformance } from '../hooks/usePerformance'
import { useRealtime } from '../hooks/useRealtime'
import { useFilters } from '../hooks/useFilters'
import holdingsService from '../services/holdingsService'
import styles from './PortfolioPage.module.css'
import topBarStyles from '../components/dashboard/TopBar.module.css'

function PortfolioPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  
  // Export state
  const [exporting, setExporting] = useState(false)

  // Holdings hook with pagination
  const {
    holdings,
    summary,
    loading,
    error,
    pagination,
    changePage,
    changePageSize,
    refetch
  } = useHoldings({}, true, isAuthenticated)
  
  // Extract pagination values for easier use
  const currentPage = pagination.page
  const pageSize = pagination.pageSize
  const totalCount = pagination.totalItems

  // Performance data hook
  const {
    performanceData,
    allocationData,
    timeRange,
    setTimeRange,
    loading: performanceLoading
  } = usePerformance('30D', isAuthenticated)

  // Real-time price updates (60 seconds interval)
  const { lastUpdate, startPolling, stopPolling } = useRealtime(
    60000,
    isAuthenticated
  )

  // Filtering hook
  const {
    setSearchTerm,
    updateFilters,
    clearFilters,
    filteredHoldings,
    hasActiveFilters,
    filteredCount
  } = useFilters(holdings)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/signin', { replace: true })
    }
  }, [authLoading, isAuthenticated, navigate])

  // Start/stop real-time polling
  useEffect(() => {
    if (isAuthenticated) {
      startPolling(refetch)
    }
    return () => stopPolling()
  }, [isAuthenticated, startPolling, stopPolling, refetch])

  // Handlers
  const handleExport = async () => {
    try {
      setExporting(true)
      const dataToExport = filteredHoldings
      
      await holdingsService.exportToCSV(dataToExport)
    } catch (error) {
      console.error('[Portfolio] Export error:', error)
      alert('Failed to export holdings')
    } finally {
      setExporting(false)
    }
  }

  const handleAllocationClick = (assetType) => {
    updateFilters({ assetType })
  }

  if (authLoading || (loading && !holdings.length)) {
    return <LoadingScreen />
  }

  // Handle authentication errors
  if (error === 'authentication_required') {
    navigate('/signin')
    return null
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
        disabled={exporting || holdings.length === 0}
        style={{ gap: '8px' }}
      >
        <MdFileDownload />
        <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
      </button>
    </>
  )

  const displayHoldings = filteredHoldings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className={styles.portfolioPage}>
      <div className={styles.main}>
        <TopBar user={user} additionalActions={additionalActions} />

        <div className={styles.portfolioContent}>
          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.pageTitle}>Portfolio</h1>
              <p className={styles.subtitle}>
                View your connected exchange holdings
                {lastUpdate && (
                  <span className={styles.lastUpdate}>
                    {' • '}Last updated {Math.floor((new Date() - lastUpdate) / 1000)}s ago
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Summary Bar */}
          {summary && <PortfolioSummaryBar summary={summary} />}

          {/* Charts Section */}
          <div className={styles.chartsSection}>
            <div className={styles.chartCard}>
              <PortfolioPerformanceChart
                data={performanceData}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                loading={performanceLoading}
              />
            </div>
            <div className={styles.chartCard}>
              <PortfolioAllocationChart
                data={allocationData}
                onSegmentClick={handleAllocationClick}
                loading={performanceLoading}
              />
            </div>
          </div>

          {/* Portfolio Optimization */}
          <div className={styles.optimizationSection}>
            <PortfolioOptimizationCard />
          </div>

          {/* Filters */}
          <PortfolioFilters
            onFilterChange={updateFilters}
            onSearchChange={setSearchTerm}
            totalCount={totalCount}
            filteredCount={filteredCount}
            onClearFilters={clearFilters}
          />

          {/* Holdings Table */}
          {error ? (
            <div className={styles.error}>
              <p>Error loading holdings: {error}</p>
              <button onClick={refetch} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          ) : filteredHoldings.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📊</div>
              <h3>No holdings found</h3>
              <p>
                {hasActiveFilters
                  ? 'Try adjusting your filters or search terms'
                  : 'Connect your Binance account to see your holdings here'}
              </p>
              {!hasActiveFilters && (
                <button onClick={() => navigate('/settings')} className={styles.addButton}>
                  Connect Account
                </button>
              )}
            </div>
          ) : (
            <>
              <HoldingsTable
                holdings={displayHoldings}
                loading={loading}
              />

              {/* Pagination */}
              {filteredHoldings.length > 20 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredCount / pageSize)}
                  pageSize={pageSize}
                  totalItems={filteredCount}
                  onPageChange={changePage}
                  onPageSizeChange={changePageSize}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PortfolioPage
