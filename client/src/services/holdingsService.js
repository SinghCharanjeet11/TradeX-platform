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

      const response = await api.get('/holdings', { params })
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
      const response = await api.get('/holdings/by-type')
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
   * Create new holding
   * @param {Object} holdingData - Holding data
   * @returns {Promise<Object>} Created holding
   */
  async createHolding(holdingData) {
    try {
      const response = await api.post('/holdings', holdingData)
      return response.data
    } catch (error) {
      console.error('[HoldingsService] Error creating holding:', error)
      throw error
    }
  }

  /**
   * Update existing holding
   * @param {Number} holdingId - Holding ID
   * @param {Object} holdingData - Updated holding data
   * @returns {Promise<Object>} Updated holding
   */
  async updateHolding(holdingId, holdingData) {
    try {
      const response = await api.put(`/holdings/${holdingId}`, holdingData)
      return response.data
    } catch (error) {
      console.error('[HoldingsService] Error updating holding:', error)
      throw error
    }
  }

  /**
   * Delete holding
   * @param {Number} holdingId - Holding ID
   * @returns {Promise<Object>} Success response
   */
  async deleteHolding(holdingId) {
    try {
      const response = await api.delete(`/holdings/${holdingId}`)
      return response.data
    } catch (error) {
      console.error('[HoldingsService] Error deleting holding:', error)
      throw error
    }
  }

  /**
   * Bulk delete holdings
   * @param {Array<Number>} holdingIds - Array of holding IDs
   * @returns {Promise<Object>} Success response
   */
  async bulkDeleteHoldings(holdingIds) {
    try {
      const response = await api.delete('/holdings/bulk', {
        data: { holdingIds }
      })
      return response.data
    } catch (error) {
      console.error('[HoldingsService] Error bulk deleting holdings:', error)
      throw error
    }
  }

  /**
   * Get holdings with pagination
   * @param {Object} filters - Filter options
   * @param {Number} page - Page number
   * @param {Number} pageSize - Items per page
   * @returns {Promise<Object>} Paginated holdings data
   */
  async getHoldingsPaginated(filters = {}, page = 1, pageSize = 20) {
    try {
      const params = {
        page,
        pageSize
      }
      
      if (filters.assetType) params.assetType = filters.assetType
      if (filters.search) params.search = filters.search
      if (filters.sortBy) params.sortBy = filters.sortBy
      if (filters.sortOrder) params.sortOrder = filters.sortOrder

      const response = await api.get('/holdings', { params })
      return response.data
    } catch (error) {
      console.error('[HoldingsService] Error fetching paginated holdings:', error)
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

      const response = await api.get('/holdings/export/csv', {
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
