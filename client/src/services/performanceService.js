/**
 * Performance Service
 * Frontend service for fetching portfolio performance and analytics data
 */

import api from './api'

class PerformanceService {
  /**
   * Get performance data for time range
   * @param {String} timeRange - Time range (7D, 30D, 90D, 1Y, ALL)
   * @returns {Promise<Object>} Performance data
   */
  async getPerformanceData(timeRange = '30D') {
    try {
      const response = await api.get('/portfolio/performance', {
        params: { timeRange }
      })
      return response.data
    } catch (error) {
      console.error('[PerformanceService] Error fetching performance data:', error)
      throw error
    }
  }

  /**
   * Get asset allocation data
   * @returns {Promise<Object>} Allocation data
   */
  async getAllocationData() {
    try {
      const response = await api.get('/portfolio/allocation')
      return response.data
    } catch (error) {
      console.error('[PerformanceService] Error fetching allocation data:', error)
      throw error
    }
  }

  /**
   * Get portfolio summary statistics
   * @returns {Promise<Object>} Summary statistics
   */
  async getPortfolioSummary() {
    try {
      const response = await api.get('/portfolio/summary')
      return response.data
    } catch (error) {
      console.error('[PerformanceService] Error fetching portfolio summary:', error)
      throw error
    }
  }

  /**
   * Get historical portfolio value
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Historical value data
   */
  async getHistoricalValue(startDate, endDate) {
    try {
      const response = await api.get('/portfolio/history', {
        params: { startDate, endDate }
      })
      return response.data
    } catch (error) {
      console.error('[PerformanceService] Error fetching historical value:', error)
      throw error
    }
  }

  /**
   * Create daily snapshot (manual trigger)
   * @returns {Promise<Object>} Created snapshot
   */
  async createSnapshot() {
    try {
      const response = await api.post('/portfolio/snapshot')
      return response.data
    } catch (error) {
      console.error('[PerformanceService] Error creating snapshot:', error)
      throw error
    }
  }

  /**
   * Refresh performance data
   * Convenience method to refresh all performance-related data
   * @param {String} timeRange - Time range for performance chart
   * @returns {Promise<Object>} All performance data
   */
  async refreshPerformance(timeRange = '30D') {
    try {
      const [performance, allocation, summary] = await Promise.all([
        this.getPerformanceData(timeRange),
        this.getAllocationData(),
        this.getPortfolioSummary()
      ])

      return {
        performance: performance.data,
        allocation: allocation.data,
        summary: summary.data
      }
    } catch (error) {
      console.error('[PerformanceService] Error refreshing performance:', error)
      throw error
    }
  }
}

export default new PerformanceService()
