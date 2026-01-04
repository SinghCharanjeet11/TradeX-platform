/**
 * Watchlist Controller
 * HTTP handlers for watchlist and alerts endpoints
 */

import watchlistService from '../services/watchlistService.js'

/**
 * Get user's watchlist
 * @route GET /api/watchlist
 */
export const getWatchlist = async (req, res) => {
  try {
    const userId = req.user.id

    const watchlist = await watchlistService.getWatchlist(userId)

    res.json({
      success: true,
      data: watchlist
    })
  } catch (error) {
    console.error('[WatchlistController] Error getting watchlist:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch watchlist'
    })
  }
}

/**
 * Add asset to watchlist
 * @route POST /api/watchlist
 */
export const addToWatchlist = async (req, res) => {
  try {
    console.log('[WatchlistController] POST /api/watchlist called')
    console.log('[WatchlistController] User:', req.user?.id)
    console.log('[WatchlistController] Body:', req.body)
    
    const userId = req.user.id
    const { symbol, name, assetType } = req.body

    if (!symbol || !name || !assetType) {
      console.log('[WatchlistController] Missing required fields')
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      })
    }

    const watchlistItem = await watchlistService.addToWatchlist(userId, {
      symbol,
      name,
      assetType
    })

    console.log('[WatchlistController] Successfully added to watchlist:', watchlistItem)

    res.status(201).json({
      success: true,
      data: watchlistItem,
      message: 'Added to watchlist'
    })
  } catch (error) {
    console.error('[WatchlistController] Error adding to watchlist:', error)
    
    if (error.message === 'Asset already in watchlist') {
      return res.status(409).json({
        success: false,
        error: error.message
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to add to watchlist'
    })
  }
}

/**
 * Remove asset from watchlist
 * @route DELETE /api/watchlist/:id
 */
export const removeFromWatchlist = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    await watchlistService.removeFromWatchlist(userId, parseInt(id))

    res.json({
      success: true,
      message: 'Removed from watchlist'
    })
  } catch (error) {
    console.error('[WatchlistController] Error removing from watchlist:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to remove from watchlist'
    })
  }
}

/**
 * Check if asset is in watchlist
 * @route GET /api/watchlist/check/:symbol/:assetType
 */
export const checkWatchlist = async (req, res) => {
  try {
    const userId = req.user.id
    // Decode the symbol in case it contains URL-encoded characters (e.g., EUR%2FUSD for EUR/USD)
    const symbol = decodeURIComponent(req.params.symbol)
    const { assetType } = req.params

    const isInWatchlist = await watchlistService.isInWatchlist(userId, symbol, assetType)

    res.json({
      success: true,
      data: { isInWatchlist }
    })
  } catch (error) {
    console.error('[WatchlistController] Error checking watchlist:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check watchlist'
    })
  }
}

/**
 * Get user's price alerts
 * @route GET /api/watchlist/alerts
 */
export const getAlerts = async (req, res) => {
  try {
    const userId = req.user.id

    const alerts = await watchlistService.getAlerts(userId)

    res.json({
      success: true,
      data: alerts
    })
  } catch (error) {
    console.error('[WatchlistController] Error getting alerts:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    })
  }
}

/**
 * Create price alert
 * @route POST /api/watchlist/alerts
 */
export const createAlert = async (req, res) => {
  try {
    const userId = req.user.id
    const { symbol, name, assetType, condition, targetPrice, currentPrice } = req.body

    if (!symbol || !condition || !targetPrice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      })
    }

    const alert = await watchlistService.createAlert(userId, {
      symbol,
      name,
      assetType,
      condition,
      targetPrice: parseFloat(targetPrice),
      currentPrice: parseFloat(currentPrice)
    })

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Price alert created'
    })
  } catch (error) {
    console.error('[WatchlistController] Error creating alert:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create alert'
    })
  }
}

/**
 * Delete price alert
 * @route DELETE /api/watchlist/alerts/:id
 */
export const deleteAlert = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    await watchlistService.deleteAlert(userId, parseInt(id))

    res.json({
      success: true,
      message: 'Alert deleted'
    })
  } catch (error) {
    console.error('[WatchlistController] Error deleting alert:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert'
    })
  }
}
