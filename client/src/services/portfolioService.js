/**
 * Portfolio Service
 * Frontend service for fetching portfolio data
 */

import api from './api'

class PortfolioService {
  /**
   * Get complete portfolio summary
   * @returns {Promise<Object>} Portfolio summary data
   */
  async getPortfolioSummary() {
    try {
      const response = await api.get('/portfolio/summary')
      return response.data
    } catch (error) {
      console.error('[PortfolioService] Error fetching summary:', error)
      throw error
    }
  }

  /**
   * Get portfolio performance over time
   * @param {String} timeframe - Time period (1D, 1W, 1M, 3M, 1Y, ALL)
   * @returns {Promise<Array>} Performance data points
   */
  async getPortfolioPerformance(timeframe = '1M') {
    try {
      const response = await api.get('/portfolio/performance', {
        params: { timeframe }
      })
      return response.data
    } catch (error) {
      console.error('[PortfolioService] Error fetching performance:', error)
      throw error
    }
  }

  /**
   * Get asset allocation breakdown
   * @returns {Promise<Object>} Asset allocation data
   */
  async getAssetAllocation() {
    try {
      const response = await api.get('/portfolio/allocation')
      return response.data
    } catch (error) {
      console.error('[PortfolioService] Error fetching allocation:', error)
      throw error
    }
  }

  /**
   * Refresh portfolio data (removed - use refetch instead)
   * The refresh button now simply refetches data from the server
   * Users can use F5 or Ctrl+R to refresh the entire page
   */

  /**
   * Format currency value
   * @param {Number} value - Value to format
   * @param {String} currency - Currency code (default: USD)
   * @returns {String} Formatted currency string
   */
  formatCurrency(value, currency = 'USD') {
    if (value === null || value === undefined || isNaN(value)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(0)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  /**
   * Format percentage value
   * @param {Number} value - Percentage value
   * @param {Number} decimals - Number of decimal places
   * @returns {String} Formatted percentage string
   */
  formatPercentage(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00%'
    }
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(decimals)}%`
  }

  /**
   * Get color for percentage change
   * @param {Number} value - Percentage value
   * @returns {String} Color class name
   */
  getChangeColor(value) {
    if (value > 0) return 'positive'
    if (value < 0) return 'negative'
    return 'neutral'
  }
}

export default new PortfolioService()
