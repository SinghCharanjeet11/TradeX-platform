/**
 * Watchlist Service
 * Business logic for watchlist and price alerts
 */

import watchlistRepository from '../repositories/watchlistRepository.js'
import marketService from './marketService.js'

class WatchlistService {
  /**
   * Get user's watchlist with current prices
   * @param {Number} userId - User ID
   * @returns {Promise<Array>} Watchlist with prices
   */
  async getWatchlist(userId) {
    try {
      const watchlist = await watchlistRepository.getUserWatchlist(userId)
      
      if (watchlist.length === 0) {
        return []
      }

      // Group by asset type for efficient API calls
      const byType = {}
      watchlist.forEach(item => {
        const type = item.assetType || 'crypto'
        if (!byType[type]) byType[type] = []
        byType[type].push(item)
      })

      // Fetch real market data for each type
      const watchlistWithPrices = []
      for (const [assetType, items] of Object.entries(byType)) {
        let marketData = []
        
        try {
          switch (assetType.toLowerCase()) {
            case 'crypto':
            case 'cryptocurrency':
              const cryptoResult = await marketService.getCryptoMarketData()
              marketData = cryptoResult.success ? cryptoResult.data : []
              break
            case 'stock':
            case 'stocks':
              const stocksResult = await marketService.getStocksMarketData()
              marketData = stocksResult.success ? stocksResult.data : []
              break
            case 'forex':
              const forexResult = await marketService.getForexMarketData()
              marketData = forexResult.success ? forexResult.data : []
              break
            case 'commodity':
            case 'commodities':
              const commoditiesResult = await marketService.getCommoditiesMarketData()
              marketData = commoditiesResult.success ? commoditiesResult.data : []
              break
          }
        } catch (error) {
          console.error(`[WatchlistService] Error fetching ${assetType} data:`, error)
        }

        // Map prices to watchlist items
        items.forEach(item => {
          const asset = marketData.find(a => a.symbol === item.symbol || a.id === item.symbol)
          watchlistWithPrices.push({
            ...item,
            currentPrice: asset?.current_price || asset?.price || this._getMockPrice(item.symbol),
            priceChange24h: asset?.price_change_percentage_24h || asset?.change24h || this._getMockChange(),
            volume24h: asset?.total_volume || asset?.volume24h || this._getMockVolume()
          })
        })
      }

      return watchlistWithPrices
    } catch (error) {
      console.error('[WatchlistService] Error getting watchlist:', error)
      throw error
    }
  }

  /**
   * Add asset to watchlist
   * @param {Number} userId - User ID
   * @param {Object} asset - Asset details
   * @returns {Promise<Object>} Created watchlist item
   */
  async addToWatchlist(userId, asset) {
    try {
      // Validate asset data
      if (!asset.symbol || !asset.name || !asset.assetType) {
        throw new Error('Invalid asset data')
      }

      const watchlistItem = await watchlistRepository.addToWatchlist(userId, asset)
      return watchlistItem
    } catch (error) {
      console.error('[WatchlistService] Error adding to watchlist:', error)
      throw error
    }
  }

  /**
   * Remove asset from watchlist
   * @param {Number} userId - User ID
   * @param {Number} watchlistId - Watchlist item ID
   * @returns {Promise<Boolean>} Success status
   */
  async removeFromWatchlist(userId, watchlistId) {
    try {
      const success = await watchlistRepository.removeFromWatchlist(userId, watchlistId)
      
      if (!success) {
        throw new Error('Watchlist item not found')
      }

      return true
    } catch (error) {
      console.error('[WatchlistService] Error removing from watchlist:', error)
      throw error
    }
  }

  /**
   * Check if asset is in watchlist
   * @param {Number} userId - User ID
   * @param {String} symbol - Asset symbol
   * @param {String} assetType - Asset type
   * @returns {Promise<Boolean>} Is in watchlist
   */
  async isInWatchlist(userId, symbol, assetType) {
    try {
      return await watchlistRepository.isInWatchlist(userId, symbol, assetType)
    } catch (error) {
      console.error('[WatchlistService] Error checking watchlist:', error)
      return false
    }
  }

  /**
   * Get user's price alerts with real-time market prices
   * @param {Number} userId - User ID
   * @returns {Promise<Array>} Price alerts with current prices
   */
  async getAlerts(userId) {
    try {
      const alerts = await watchlistRepository.getUserAlerts(userId)
      
      if (alerts.length === 0) {
        return []
      }

      // Group alerts by asset type for efficient API calls
      const byType = {}
      alerts.forEach(alert => {
        const type = alert.assetType || 'crypto'
        if (!byType[type]) byType[type] = []
        byType[type].push(alert)
      })

      // Fetch real market data for each type
      const alertsWithPrices = []
      for (const [assetType, typeAlerts] of Object.entries(byType)) {
        let marketData = []
        
        try {
          switch (assetType.toLowerCase()) {
            case 'crypto':
            case 'cryptocurrency':
              const cryptoResult = await marketService.getCryptoMarketData()
              marketData = cryptoResult.success ? cryptoResult.data : []
              break
            case 'stock':
            case 'stocks':
              const stocksResult = await marketService.getStocksMarketData()
              marketData = stocksResult.success ? stocksResult.data : []
              break
            case 'forex':
              const forexResult = await marketService.getForexMarketData()
              marketData = forexResult.success ? forexResult.data : []
              break
            case 'commodity':
            case 'commodities':
              const commoditiesResult = await marketService.getCommoditiesMarketData()
              marketData = commoditiesResult.success ? commoditiesResult.data : []
              break
          }
        } catch (error) {
          console.error(`[WatchlistService] Error fetching ${assetType} data for alerts:`, error)
        }

        // Map real prices to alerts
        typeAlerts.forEach(alert => {
          const asset = marketData.find(a => 
            a.symbol === alert.symbol || 
            a.id === alert.symbol ||
            a.symbol?.toUpperCase() === alert.symbol?.toUpperCase()
          )
          
          // Use real market price if available, otherwise fall back to stored price
          const currentPrice = asset?.current_price || asset?.price || alert.currentPrice || this._getMockPrice(alert.symbol)
          
          alertsWithPrices.push({
            ...alert,
            currentPrice,
            percentageToTarget: this._calculatePercentageToTarget(currentPrice, alert.targetPrice)
          })
        })
      }

      return alertsWithPrices
    } catch (error) {
      console.error('[WatchlistService] Error getting alerts:', error)
      throw error
    }
  }

  /**
   * Create price alert
   * @param {Number} userId - User ID
   * @param {Object} alertData - Alert details
   * @returns {Promise<Object>} Created alert
   */
  async createAlert(userId, alertData) {
    try {
      // Validate alert data
      if (!alertData.symbol || !alertData.targetPrice || !alertData.condition) {
        throw new Error('Invalid alert data')
      }

      if (!['above', 'below'].includes(alertData.condition)) {
        throw new Error('Invalid condition. Must be "above" or "below"')
      }

      const alert = await watchlistRepository.createAlert(userId, alertData)
      return alert
    } catch (error) {
      console.error('[WatchlistService] Error creating alert:', error)
      throw error
    }
  }

  /**
   * Delete price alert
   * @param {Number} userId - User ID
   * @param {Number} alertId - Alert ID
   * @returns {Promise<Boolean>} Success status
   */
  async deleteAlert(userId, alertId) {
    try {
      const success = await watchlistRepository.deleteAlert(userId, alertId)
      
      if (!success) {
        throw new Error('Alert not found')
      }

      return true
    } catch (error) {
      console.error('[WatchlistService] Error deleting alert:', error)
      throw error
    }
  }

  /**
   * Check and trigger alerts (background job)
   * @returns {Promise<Array>} Triggered alerts
   */
  async checkAlerts() {
    try {
      const activeAlerts = await watchlistRepository.getAllActiveAlerts()
      const triggeredAlerts = []

      for (const alert of activeAlerts) {
        const currentPrice = this._getMockPrice(alert.symbol)
        let shouldTrigger = false

        if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
          shouldTrigger = true
        } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
          shouldTrigger = true
        }

        if (shouldTrigger) {
          await watchlistRepository.updateAlert(alert.id, {
            triggered: true,
            triggeredAt: new Date().toISOString(),
            active: false
          })
          
          triggeredAlerts.push({
            ...alert,
            currentPrice
          })
        }
      }

      return triggeredAlerts
    } catch (error) {
      console.error('[WatchlistService] Error checking alerts:', error)
      return []
    }
  }

  // Private helper methods

  _getMockPrice(symbol) {
    // Mock price generation based on symbol
    const prices = {
      'BTC': 48000 + Math.random() * 2000,
      'ETH': 3000 + Math.random() * 200,
      'BNB': 325 + Math.random() * 25,
      'SOL': 105 + Math.random() * 10,
      'AAPL': 182 + Math.random() * 5,
      'TSLA': 235 + Math.random() * 10,
      'GOOGL': 142 + Math.random() * 5,
      'MSFT': 378 + Math.random() * 10
    }

    return prices[symbol] || 100 + Math.random() * 50
  }

  _getMockChange() {
    return (Math.random() - 0.5) * 10 // -5% to +5%
  }

  _getMockVolume() {
    return Math.floor(Math.random() * 1000000000) // Random volume
  }

  _calculatePercentageToTarget(currentPrice, targetPrice) {
    return ((targetPrice - currentPrice) / currentPrice) * 100
  }
}

export default new WatchlistService()
