/**
 * Watchlist Service
 * Frontend service for watchlist and alerts
 */

import api from './api'

class WatchlistService {
  async getWatchlist() {
    try {
      const response = await api.get('/api/watchlist')
      return response.data
    } catch (error) {
      console.error('[WatchlistService] Error fetching watchlist:', error)
      throw error
    }
  }

  async addToWatchlist(asset) {
    try {
      const response = await api.post('/api/watchlist', asset)
      return response.data
    } catch (error) {
      console.error('[WatchlistService] Error adding to watchlist:', error)
      throw error
    }
  }

  async removeFromWatchlist(watchlistId) {
    try {
      const response = await api.delete(`/api/watchlist/${watchlistId}`)
      return response.data
    } catch (error) {
      console.error('[WatchlistService] Error removing from watchlist:', error)
      throw error
    }
  }

  async isInWatchlist(symbol, assetType) {
    try {
      const response = await api.get(`/api/watchlist/check/${symbol}/${assetType}`)
      return response.data
    } catch (error) {
      console.error('[WatchlistService] Error checking watchlist:', error)
      return { success: false, data: { isInWatchlist: false } }
    }
  }

  async getAlerts() {
    try {
      const response = await api.get('/api/watchlist/alerts')
      return response.data
    } catch (error) {
      console.error('[WatchlistService] Error fetching alerts:', error)
      throw error
    }
  }

  async createAlert(alertData) {
    try {
      const response = await api.post('/api/watchlist/alerts', alertData)
      return response.data
    } catch (error) {
      console.error('[WatchlistService] Error creating alert:', error)
      throw error
    }
  }

  async deleteAlert(alertId) {
    try {
      const response = await api.delete(`/api/watchlist/alerts/${alertId}`)
      return response.data
    } catch (error) {
      console.error('[WatchlistService] Error deleting alert:', error)
      throw error
    }
  }
}

export default new WatchlistService()
