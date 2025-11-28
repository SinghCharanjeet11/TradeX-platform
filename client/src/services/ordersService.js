/**
 * Orders Service
 * API client for trading orders
 */

import api from './api'

const ordersService = {
  /**
   * Get all orders with filters
   */
  async getOrders(filters = {}) {
    try {
      const params = new URLSearchParams()
      
      if (filters.assetType) params.append('assetType', filters.assetType)
      if (filters.type) params.append('type', filters.type)
      if (filters.status) params.append('status', filters.status)
      if (filters.accountId) params.append('accountId', filters.accountId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await api.get(`/orders?${params.toString()}`)
      return {
        success: true,
        data: response.data.data,
        count: response.data.count
      }
    } catch (error) {
      console.error('[ordersService] Error getting orders:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch orders'
      }
    }
  },

  /**
   * Get trade history
   */
  async getTradeHistory() {
    try {
      const response = await api.get('/orders/history')
      return {
        success: true,
        data: response.data.data,
        count: response.data.count
      }
    } catch (error) {
      console.error('[ordersService] Error getting trade history:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch trade history'
      }
    }
  },

  /**
   * Get open orders
   */
  async getOpenOrders() {
    try {
      const response = await api.get('/orders/open')
      return {
        success: true,
        data: response.data.data,
        count: response.data.count
      }
    } catch (error) {
      console.error('[ordersService] Error getting open orders:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch open orders'
      }
    }
  },

  /**
   * Get trade analytics
   */
  async getAnalytics() {
    try {
      const response = await api.get('/orders/analytics')
      return {
        success: true,
        data: response.data.data
      }
    } catch (error) {
      console.error('[ordersService] Error getting analytics:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch analytics'
      }
    }
  },

  /**
   * Get performance data
   */
  async getPerformance(period = '30d') {
    try {
      const response = await api.get(`/orders/performance?period=${period}`)
      return {
        success: true,
        data: response.data.data
      }
    } catch (error) {
      console.error('[ordersService] Error getting performance:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch performance'
      }
    }
  },

  /**
   * Cancel an order
   */
  async cancelOrder(orderId) {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`)
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } catch (error) {
      console.error('[ordersService] Error cancelling order:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to cancel order'
      }
    }
  },

  /**
   * Create a new order
   */
  async createOrder(orderData) {
    try {
      const response = await api.post('/orders', orderData)
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } catch (error) {
      console.error('[ordersService] Error creating order:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create order'
      }
    }
  },

  /**
   * Format currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  },

  /**
   * Format date
   */
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

export default ordersService
