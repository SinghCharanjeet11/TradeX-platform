/**
 * Orders Controller
 * Handles HTTP requests for trading orders
 */

import ordersService from '../services/ordersService.js'

export class OrdersController {
  /**
   * GET /api/orders
   * Get all orders with optional filters
   */
  async getOrders(req, res) {
    try {
      const userId = req.user.id
      const filters = {
        assetType: req.query.assetType,
        type: req.query.type,
        status: req.query.status,
        accountId: req.query.accountId,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      }

      const orders = await ordersService.getOrders(userId, filters)

      res.json({
        success: true,
        data: orders,
        count: orders.length
      })
    } catch (error) {
      console.error('[OrdersController] Error getting orders:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders'
      })
    }
  }

  /**
   * GET /api/orders/history
   * Get trade history (completed orders)
   */
  async getTradeHistory(req, res) {
    try {
      const userId = req.user.id
      const history = await ordersService.getTradeHistory(userId)

      res.json({
        success: true,
        data: history,
        count: history.length
      })
    } catch (error) {
      console.error('[OrdersController] Error getting trade history:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch trade history'
      })
    }
  }

  /**
   * GET /api/orders/open
   * Get open orders (pending)
   */
  async getOpenOrders(req, res) {
    try {
      const userId = req.user.id
      const openOrders = await ordersService.getOpenOrders(userId)

      res.json({
        success: true,
        data: openOrders,
        count: openOrders.length
      })
    } catch (error) {
      console.error('[OrdersController] Error getting open orders:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch open orders'
      })
    }
  }

  /**
   * GET /api/orders/analytics
   * Get trade analytics
   */
  async getAnalytics(req, res) {
    try {
      const userId = req.user.id
      const analytics = await ordersService.getTradeAnalytics(userId)

      res.json({
        success: true,
        data: analytics
      })
    } catch (error) {
      console.error('[OrdersController] Error getting analytics:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics'
      })
    }
  }

  /**
   * GET /api/orders/performance
   * Get performance data over time
   */
  async getPerformance(req, res) {
    try {
      const userId = req.user.id
      const period = req.query.period || '30d'
      const performance = await ordersService.getPerformanceData(userId, period)

      res.json({
        success: true,
        data: performance
      })
    } catch (error) {
      console.error('[OrdersController] Error getting performance:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch performance data'
      })
    }
  }

  /**
   * POST /api/orders/:id/cancel
   * Cancel an order
   */
  async cancelOrder(req, res) {
    try {
      const userId = req.user.id
      const orderId = parseInt(req.params.id)

      const cancelledOrder = await ordersService.cancelOrder(userId, orderId)

      res.json({
        success: true,
        data: cancelledOrder,
        message: 'Order cancelled successfully'
      })
    } catch (error) {
      console.error('[OrdersController] Error cancelling order:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to cancel order'
      })
    }
  }

  /**
   * POST /api/orders
   * Create a new order
   */
  async createOrder(req, res) {
    try {
      const userId = req.user.id
      const orderData = req.body

      const newOrder = await ordersService.createOrder(userId, orderData)

      res.status(201).json({
        success: true,
        data: newOrder,
        message: 'Order created successfully'
      })
    } catch (error) {
      console.error('[OrdersController] Error creating order:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create order'
      })
    }
  }
}

export default new OrdersController()
