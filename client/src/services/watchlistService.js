/**
 * Watchlist Service
 * Frontend service for watchlist and alerts
 */

import api from './api'

class WatchlistService {
  async getWatchlist() {
    try {
      const response = await api.get('/watchlist')
      return response.data
    } catch (error) {
      console.error('[WatchlistService] Error fetching watchlist:', error)
      throw error
    }
  }

  async addToWatchlist(asset) {
    try {
      console.log('[WatchlistService] POST /watchlist with:', asset)
      const response = await api.post('/watchlist', asset)
      console.log('[WatchlistService] Response:', response.data)
      return response.data
    } catch (error) {
      console.error('[WatchlistService] Error adding to watchlist:', error)
      console.error('[WatchlistService] Error response:', error.response?.data)
      console.error('[WatchlistService] Error status:', error.response?.status)
      throw error
    }
  }

  async removeFromWatchlist(watchlistId) {
    try {
      const response = await api.delete(`/watchlist/${watchlistId}`)
      return response.data
    } catch (error) {
      console.error('[WatchlistService] Error removing from watchlist:', error)
      throw error
    }
  }

  async isInWatchlist(symbol, assetType) {
    try {
      // URL-encode the symbol to handle special characters like '/' in forex pairs (EUR/USD)
      const encodedSymbol = encodeURIComponent(symbol)
      const response = await api.get(`/watchlist/check/${encodedSymbol}/${assetType}`)
      return response.data
    } catch (error) {
      console.error('[WatchlistService] Error checking watchlist:', error)
      return { success: false, data: { isInWatchlist: false } }
    }
  }

  async getAlerts() {
    try {
      const response = await api.get('/watchlist/alerts')
      return response.data
    } catch (error) {
      console.error('[WatchlistService] Error fetching alerts:', error)
      throw error
    }
  }

  async createAlert(alertData) {
    try {
      const response = await api.post('/watchlist/alerts', alertData)
      return response.data
    } catch (error) {
      console.error('[WatchlistService] Error creating alert:', error)
      throw error
    }
  }

  async deleteAlert(alertId) {
    try {
      const response = await api.delete(`/watchlist/alerts/${alertId}`)
      return response.data
    } catch (error) {
      console.error('[WatchlistService] Error deleting alert:', error)
      throw error
    }
  }
}

export default new WatchlistService()
