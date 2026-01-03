/**
 * Price Service
 * Frontend service for fetching and managing real-time price updates
 */

import api from './api'

class PriceService {
  constructor() {
    this.pollingInterval = null
    this.isPolling = false
    this.listeners = []
    this.consecutiveFailures = 0
    this.maxConsecutiveFailures = 3
  }

  /**
   * Get current prices for symbols
   * @param {Array<String>} symbols - Array of symbols
   * @returns {Promise<Object>} Price data
   */
  async getCurrentPrices(symbols) {
    try {
      const response = await api.get('/prices/current', {
        params: { symbols: symbols.join(',') }
      })
      return response.data
    } catch (error) {
      console.error('[PriceService] Error fetching current prices:', error)
      throw error
    }
  }

  /**
   * Trigger manual price refresh
   * @returns {Promise<Object>} Refresh result
   */
  async refreshPrices() {
    try {
      const response = await api.post('/prices/refresh')
      
      // Reset consecutive failures on success
      this.consecutiveFailures = 0
      
      // Notify listeners
      this._notifyListeners(response.data)
      
      return response.data
    } catch (error) {
      // Check if it's an authentication error
      if (error.message === 'Not authenticated' || error.message.includes('401')) {
        console.warn('[PriceService] Not authenticated, stopping polling')
        this.stopPolling()
        return null
      }
      
      console.error('[PriceService] Error refreshing prices:', error)
      throw error
    }
  }

  /**
   * Get price history for symbol
   * @param {String} symbol - Asset symbol
   * @param {String} assetType - Asset type
   * @param {Number} days - Number of days
   * @returns {Promise<Object>} Price history
   */
  async getPriceHistory(symbol, assetType, days = 30) {
    try {
      const response = await api.get(`/prices/history/${symbol}`, {
        params: { assetType, days }
      })
      return response.data
    } catch (error) {
      console.error('[PriceService] Error fetching price history:', error)
      throw error
    }
  }

  /**
   * Start polling for price updates
   * @param {Number} interval - Polling interval in milliseconds (default: 60000 = 1 minute)
   * @param {Function} callback - Callback function to execute on each update
   */
  startPolling(interval = 60000, callback = null) {
    if (this.isPolling) {
      console.log('[PriceService] Polling already active')
      return
    }

    console.log(`[PriceService] Starting price polling every ${interval}ms`)
    this.isPolling = true
    this.consecutiveFailures = 0
    this.maxConsecutiveFailures = 3

    // Add callback as listener if provided
    if (callback) {
      this.addListener(callback)
    }

    // Initial refresh with delay to ensure auth is ready
    setTimeout(() => {
      this.refreshPrices().catch(err => {
        console.error('[PriceService] Initial price refresh failed:', err?.message || 'Unknown error')
        this.consecutiveFailures++
      })
    }, 500)

    // Set up interval
    this.pollingInterval = setInterval(async () => {
      try {
        const result = await this.refreshPrices()
        
        // If result is null, it means we're not authenticated - stop polling
        if (result === null) {
          this.stopPolling()
          return
        }
        
        this.consecutiveFailures = 0 // Reset on success
      } catch (error) {
        this.consecutiveFailures++
        
        // Only log every 3rd failure to reduce console spam
        if (this.consecutiveFailures % 3 === 0) {
          console.error(`[PriceService] Polling refresh failed (${this.consecutiveFailures} consecutive failures):`, error?.message || 'Unknown error')
        }
        
        // Stop polling after too many failures
        if (this.consecutiveFailures >= this.maxConsecutiveFailures * 3) {
          console.error('[PriceService] Too many consecutive failures, stopping polling')
          this.stopPolling()
        }
      }
    }, interval)
  }

  /**
   * Stop polling for price updates
   */
  stopPolling() {
    if (!this.isPolling) {
      return
    }

    console.log('[PriceService] Stopping price polling')
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    
    this.isPolling = false
    this.listeners = []
  }

  /**
   * Add listener for price updates
   * @param {Function} callback - Callback function
   */
  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback)
    }
  }

  /**
   * Remove listener
   * @param {Function} callback - Callback function to remove
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback)
  }

  /**
   * Check if polling is active
   * @returns {Boolean} Polling status
   */
  isPollingActive() {
    return this.isPolling
  }

  // Private methods

  _notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('[PriceService] Error in listener callback:', error)
      }
    })
  }
}

export default new PriceService()
