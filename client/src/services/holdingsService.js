/**
 * Holdings Service
 * Frontend service for fetching holdings data
 */

import api from './api'

class HoldingsService {
  /**
   * Get all holdings with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Holdings data
   */
  async getHoldings(filters = {}) {
    try {
      const params = {}
      
      if (filters.assetType) params.assetType = filters.assetType
      if (filters.search) params.search = filters.search
      if (filters.sortBy) params.sortBy = filters.sortBy
      if (filters.sortOrder) params.sortOrder = filters.sortOrder

      const response = await api.get('/api/holdings', { params })
      return response.data
    } catch (error) {
      console.error('[HoldingsService] Error fetching holdings:', error)
      throw error
    }
  }

  /**
   * Get holdings grouped by type
   * @returns {Promise<Object>} Grouped holdings
   */
  async getHoldingsByType() {
    try {
      const response = await api.get('/api/holdings/by-type')
      return response.data
    } catch (error) {
      console.error('[HoldingsService] Error fetching holdings by type:', error)
      throw error
    }
  }

  /**
   * Get holding details
   * @param {Number} holdingId - Holding ID
   * @returns {Promise<Object>} Holding details
   */
  async getHoldingDetails(holdingId) {
    try {
      const response = await api.get(`/api/holdings/${holdingId}`)
      return response.data
    } catch (error) {
      console.error('[HoldingsService] Error fetching holding details:', error)
      throw error
    }
  }

  /**
   * Export holdings to CSV
   * @param {Object} filters - Filter options
   */
  async exportToCSV(filters = {}) {
    try {
      const params = {}
      
      if (filters.assetType) params.assetType = filters.assetType
      if (filters.search) params.search = filters.search

      const response = await api.get('/api/holdings/export/csv', {
        params,
        responseType: 'blob'
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `portfolio-holdings-${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[HoldingsService] Error exporting holdings:', error)
      throw error
    }
  }
}

export default new HoldingsService()
