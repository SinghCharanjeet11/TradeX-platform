import { useState } from 'react'
import { MdStar, MdDelete, MdTrendingUp, MdTrendingDown, MdRemoveRedEye } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { useWatchlist } from '../../hooks/useWatchlist'
import portfolioService from '../../services/portfolioService'
import styles from './WatchlistCard.module.css'

function WatchlistCard() {
  const navigate = useNavigate()
  const { watchlist, loading, removeFromWatchlist } = useWatchlist()
  const [removing, setRemoving] = useState(null)

  const handleRemove = async (e, watchlistId) => {
    e.stopPropagation()
    
    if (removing) return

    try {
      setRemoving(watchlistId)
      await removeFromWatchlist(watchlistId)
    } catch (error) {
      console.error('Error removing from watchlist:', error)
    } finally {
      setRemoving(null)
    }
  }

  const handleViewAll = () => {
    navigate('/markets')
  }

  if (loading) {
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

  if (watchlist.length === 0) {
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
          <button className={styles.browseBtn} onClick={handleViewAll}>
            Browse Markets
          </button>
        </div>
      </div>
    )
  }

  // Show only first 5 items
  const displayedItems = watchlist.slice(0, 5)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <MdStar className={styles.headerIcon} />
          <h3>My Watchlist</h3>
          <span className={styles.count}>{watchlist.length}</span>
        </div>
        <button className={styles.viewAllBtn} onClick={handleViewAll}>
          <MdRemoveRedEye />
          View All
        </button>
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

      {watchlist.length > 5 && (
        <div className={styles.footer}>
          <button className={styles.showMoreBtn} onClick={handleViewAll}>
            Show {watchlist.length - 5} more assets
          </button>
        </div>
      )}
    </div>
  )
}

export default WatchlistCard
