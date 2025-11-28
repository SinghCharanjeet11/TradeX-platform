/**
 * Orders Service
 * Business logic for trading orders and analytics
 */

import ordersRepository from '../repositories/ordersRepository.js'

export class OrdersService {
  /**
   * Get all orders with optional filters
   */
  async getOrders(userId, filters = {}) {
    try {
      const orders = await ordersRepository.getOrdersWithFilters(userId, filters)
      return orders
    } catch (error) {
      console.error('[OrdersService] Error getting orders:', error)
      throw error
    }
  }

  /**
   * Get trade history (completed orders only)
   */
  async getTradeHistory(userId) {
    try {
      const history = await ordersRepository.getTradeHistory(userId)
      return history
    } catch (error) {
      console.error('[OrdersService] Error getting trade history:', error)
      throw error
    }
  }

  /**
   * Get open orders (pending orders)
   */
  async getOpenOrders(userId) {
    try {
      const openOrders = await ordersRepository.getOpenOrders(userId)
      return openOrders
    } catch (error) {
      console.error('[OrdersService] Error getting open orders:', error)
      throw error
    }
  }

  /**
   * Calculate trade analytics
   */
  async getTradeAnalytics(userId) {
    try {
      const history = await ordersRepository.getTradeHistory(userId)

      if (history.length === 0) {
        return {
          totalTrades: 0,
          totalVolume: 0,
          winRate: 0,
          averageProfit: 0,
          totalProfit: 0,
          bestTrade: null,
          worstTrade: null,
          mostTradedAsset: null,
          profitableAssets: []
        }
      }

      // Calculate total trades and volume
      const totalTrades = history.length
      const totalVolume = history.reduce((sum, order) => sum + order.total, 0)

      // Group trades by symbol to calculate P&L
      const tradesBySymbol = {}
      history.forEach(order => {
        if (!tradesBySymbol[order.symbol]) {
          tradesBySymbol[order.symbol] = {
            symbol: order.symbol,
            name: order.name,
            buys: [],
            sells: [],
            totalBuyValue: 0,
            totalSellValue: 0,
            tradeCount: 0
          }
        }

        const asset = tradesBySymbol[order.symbol]
        asset.tradeCount++

        if (order.type === 'buy') {
          asset.buys.push(order)
          asset.totalBuyValue += order.total
        } else {
          asset.sells.push(order)
          asset.totalSellValue += order.total
        }
      })

      // Calculate profit/loss per asset
      const profitableAssets = Object.values(tradesBySymbol).map(asset => {
        const profit = asset.totalSellValue - asset.totalBuyValue
        const profitPercent = asset.totalBuyValue > 0 
          ? (profit / asset.totalBuyValue) * 100 
          : 0

        return {
          symbol: asset.symbol,
          name: asset.name,
          profit,
          profitPercent,
          tradeCount: asset.tradeCount,
          totalBuyValue: asset.totalBuyValue,
          totalSellValue: asset.totalSellValue
        }
      }).sort((a, b) => b.profit - a.profit)

      // Calculate win rate (trades with profit)
      const profitableTrades = profitableAssets.filter(asset => asset.profit > 0).length
      const winRate = totalTrades > 0 ? (profitableTrades / profitableAssets.length) * 100 : 0

      // Calculate total profit and average
      const totalProfit = profitableAssets.reduce((sum, asset) => sum + asset.profit, 0)
      const averageProfit = profitableAssets.length > 0 
        ? totalProfit / profitableAssets.length 
        : 0

      // Find best and worst trades
      const bestTrade = profitableAssets[0] || null
      const worstTrade = profitableAssets[profitableAssets.length - 1] || null

      // Find most traded asset
      const mostTradedAsset = profitableAssets.reduce((max, asset) => 
        asset.tradeCount > (max?.tradeCount || 0) ? asset : max
      , null)

      return {
        totalTrades,
        totalVolume,
        winRate: Math.round(winRate * 100) / 100,
        averageProfit: Math.round(averageProfit * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        bestTrade,
        worstTrade,
        mostTradedAsset,
        profitableAssets: profitableAssets.slice(0, 10) // Top 10
      }
    } catch (error) {
      console.error('[OrdersService] Error calculating analytics:', error)
      throw error
    }
  }

  /**
   * Get performance over time
   */
  async getPerformanceData(userId, period = '30d') {
    try {
      const history = await ordersRepository.getTradeHistory(userId)

      // Group by date
      const performanceByDate = {}
      let cumulativeProfit = 0

      history.forEach(order => {
        const date = new Date(order.timestamp).toISOString().split('T')[0]
        
        if (!performanceByDate[date]) {
          performanceByDate[date] = {
            date,
            trades: 0,
            volume: 0,
            profit: 0,
            cumulativeProfit: 0
          }
        }

        performanceByDate[date].trades++
        performanceByDate[date].volume += order.total

        // Simple P&L calculation (sell - buy)
        if (order.type === 'sell') {
          performanceByDate[date].profit += order.total * 0.05 // Assume 5% profit for demo
        }
      })

      // Convert to array and sort by date
      const performanceArray = Object.values(performanceByDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date))

      // Calculate cumulative profit
      performanceArray.forEach(day => {
        cumulativeProfit += day.profit
        day.cumulativeProfit = cumulativeProfit
      })

      return performanceArray
    } catch (error) {
      console.error('[OrdersService] Error getting performance data:', error)
      throw error
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(userId, orderId) {
    try {
      const cancelledOrder = await ordersRepository.cancelOrder(orderId, userId)
      return cancelledOrder
    } catch (error) {
      console.error('[OrdersService] Error cancelling order:', error)
      throw error
    }
  }

  /**
   * Create a new order
   */
  async createOrder(userId, orderData) {
    try {
      // Validate order data
      const orderType = orderData.orderType || orderData.type
      if (!orderData.symbol || !orderType || !orderData.quantity || !orderData.price) {
        throw new Error('Missing required order fields')
      }

      // Normalize the order type field
      orderData.orderType = orderType
      delete orderData.type

      // Calculate total
      orderData.total = orderData.quantity * orderData.price

      const newOrder = await ordersRepository.createOrder(userId, orderData)
      return newOrder
    } catch (error) {
      console.error('[OrdersService] Error creating order:', error)
      throw error
    }
  }
}

export default new OrdersService()
