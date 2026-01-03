import { useState, useEffect } from 'react'
import { MdStar, MdStarBorder } from 'react-icons/md'
import watchlistService from '../../services/watchlistService'
import styles from './WatchlistButton.module.css'

function WatchlistButton({ asset, onToggle }) {
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkWatchlistStatus()
  }, [asset.symbol, asset.assetType])

  const checkWatchlistStatus = async () => {
    try {
      setChecking(true)
      const response = await watchlistService.isInWatchlist(asset.symbol, asset.assetType)
      if (response.success) {
        setIsInWatchlist(response.data.isInWatchlist)
      }
    } catch (error) {
      console.error('Error checking watchlist:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleToggle = async (e) => {
    e.stopPropagation()
    
    if (loading) return

    try {
      setLoading(true)

      if (isInWatchlist) {
        // Find the watchlist item to remove
        // Note: In production, you'd need the watchlist item ID
        // For now, we'll trigger a refetch
        setIsInWatchlist(false)
        if (onToggle) onToggle(false)
      } else {
        console.log('[WatchlistButton] Adding to watchlist:', {
          symbol: asset.symbol,
          name: asset.name,
          assetType: asset.assetType
        })
        
        const response = await watchlistService.addToWatchlist({
          symbol: asset.symbol,
          name: asset.name,
          assetType: asset.assetType
        })

        console.log('[WatchlistButton] Response:', response)

        if (response.success) {
          setIsInWatchlist(true)
          if (onToggle) onToggle(true)
        } else {
          console.error('[WatchlistButton] Failed to add:', response.error)
          throw new Error(response.error || 'Failed to add to watchlist')
        }
      }
    } catch (error) {
      console.error('[WatchlistButton] Error toggling watchlist:', error)
      alert(`Failed to add to watchlist: ${error.message}`)
      // Revert on error
      setIsInWatchlist(!isInWatchlist)
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <button className={styles.button} disabled>
        <MdStarBorder className={styles.icon} />
      </button>
    )
  }

  return (
    <button
      className={`${styles.button} ${isInWatchlist ? styles.active : ''}`}
      onClick={handleToggle}
      disabled={loading}
      title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {isInWatchlist ? (
        <MdStar className={`${styles.icon} ${styles.filled}`} />
      ) : (
        <MdStarBorder className={styles.icon} />
      )}
    </button>
  )
}

export default WatchlistButton
