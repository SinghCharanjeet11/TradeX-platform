import { useState } from 'react'
import { MdStar, MdDelete, MdTrendingUp, MdTrendingDown } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import useDashboardData from '../../hooks/useDashboardData'
import watchlistService from '../../services/watchlistService'
import portfolioService from '../../services/portfolioService'
import styles from './WatchlistCard.module.css'

function WatchlistCard() {
  const navigate = useNavigate()
  const { watchlist, removeWatchlistItem, refreshWatchlist } = useDashboardData()
  const [removing, setRemoving] = useState(null)

  const handleRemove = async (e, watchlistId) => {
    e.stopPropagation()
    
    if (removing) return

    try {
      setRemoving(watchlistId)
      
      // Optimistic update: remove item from UI immediately
      removeWatchlistItem(watchlistId)
      
      // Call API to delete (in background)
      await watchlistService.removeFromWatchlist(watchlistId)
      
      // No need to refresh - optimistic update already handled it
      // Background refresh will sync on next poll cycle
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      // On error, refresh to restore correct state from server
      await refreshWatchlist()
    } finally {
      setRemoving(null)
    }
  }

  if (watchlist.loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MdStar className={styles.headerIcon} />
            <h3>My Watchlist</h3>
          </div>
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading watchlist...</p>
        </div>
      </div>
    )
  }

  // Safely access watchlist data
  const watchlistData = watchlist.data || [];

  if (watchlistData.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MdStar className={styles.headerIcon} />
            <h3>My Watchlist</h3>
          </div>
        </div>
        <div className={styles.empty}>
          <MdStar className={styles.emptyIcon} />
          <p>No assets in your watchlist</p>
          <button className={styles.browseBtn} onClick={() => navigate('/markets')}>
            Browse Markets
          </button>
        </div>
      </div>
    )
  }

  // Show all items (scrollable list)
  const displayedItems = watchlistData

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <MdStar className={styles.headerIcon} />
          <h3>My Watchlist</h3>
          <span className={styles.count}>{watchlistData.length}</span>
        </div>
      </div>

      <div className={styles.list}>
        {displayedItems.map((item) => (
          <div key={item.id} className={styles.item}>
            <div className={styles.itemLeft}>
              <div className={styles.assetInfo}>
                <span className={styles.assetName}>{item.name}</span>
                <span className={styles.assetSymbol}>{item.symbol}</span>
              </div>
              <span className={styles.assetType}>{item.assetType}</span>
            </div>

            <div className={styles.itemRight}>
              <div className={styles.priceInfo}>
                <span className={styles.price}>
                  {portfolioService.formatCurrency(item.currentPrice || 0)}
                </span>
                {item.priceChange24h !== undefined && (
                  <span className={`${styles.change} ${item.priceChange24h >= 0 ? styles.positive : styles.negative}`}>
                    {item.priceChange24h >= 0 ? <MdTrendingUp /> : <MdTrendingDown />}
                    {Math.abs(item.priceChange24h).toFixed(2)}%
                  </span>
                )}
              </div>

              <button
                className={styles.removeBtn}
                onClick={(e) => handleRemove(e, item.id)}
                disabled={removing === item.id}
                title="Remove from watchlist"
              >
                <MdDelete />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WatchlistCard
