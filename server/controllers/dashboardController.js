/**
 * Dashboard Controller
 * Handles batch fetching of all dashboard data
 */

import binanceService from '../services/binanceService.js'
import connectedAccountsRepository from '../repositories/connectedAccountsRepository.js'
import watchlistService from '../services/watchlistService.js'
import recommendationService from '../services/recommendationService.js'

/**
 * Get all dashboard data in one request
 * @route GET /api/dashboard/all
 */
async function getDashboardData(req, res) {
  try {
    const userId = req.user.id
    const include = req.query.include?.split(',') || [
      'portfolio', 'watchlist', 'alerts', 'recommendations'
    ]

    const results = {}
    const timestamps = {}
    const errors = {}

    // Fetch all data in parallel
    const promises = []

    if (include.includes('portfolio')) {
      promises.push(
        (async () => {
          try {
            // Check if user has connected Binance account
            const hasAccount = await connectedAccountsRepository.hasConnectedAccount(userId, 'binance')
            
            if (!hasAccount) {
              results.portfolio = {
                totalValue: 0,
                totalInvested: 0,
                totalProfitLoss: 0,
                totalProfitLossPercent: 0,
                dayChange: 0,
                dayChangePercent: 0,
                allocation: [],
                topPerformers: [],
                hasConnectedAccount: false
              }
              timestamps.portfolio = new Date().toISOString()
              return
            }

            // Get portfolio from Binance
            const portfolioData = await binanceService.getPortfolioValue(userId)
            
            // Calculate allocation
            const allocation = portfolioData.holdings.slice(0, 10).map(holding => ({
              asset: holding.asset,
              value: holding.valueUSD,
              percentage: (holding.valueUSD / portfolioData.totalValueUSD) * 100
            }))

            // Get top performers (top 5 by value)
            const topPerformers = portfolioData.holdings.slice(0, 5).map(holding => ({
              symbol: holding.asset,
              name: holding.asset,
              value: holding.valueUSD,
              change: 0, // Would need historical data
              changePercent: 0
            }))

            results.portfolio = {
              totalValue: portfolioData.totalValueUSD,
              totalInvested: portfolioData.totalValueUSD, // Would need historical data
              totalProfitLoss: 0, // Would need historical data
              totalProfitLossPercent: 0,
              dayChange: 0, // Would need historical data
              dayChangePercent: 0,
              allocation,
              topPerformers,
              hasConnectedAccount: true
            }
            timestamps.portfolio = new Date().toISOString()
          } catch (err) {
            console.error('[Dashboard] Portfolio fetch error:', err.message)
            errors.portfolio = err.message
          }
        })()
      )
    }

    if (include.includes('watchlist')) {
      promises.push(
        watchlistService.getWatchlist(userId)
          .then(data => {
            results.watchlist = data
            timestamps.watchlist = new Date().toISOString()
          })
          .catch(err => {
            console.error('[Dashboard] Watchlist fetch error:', err.message)
            errors.watchlist = err.message
          })
      )
    }

    if (include.includes('alerts')) {
      promises.push(
        watchlistService.getAlerts(userId)
          .then(data => {
            results.alerts = data
            timestamps.alerts = new Date().toISOString()
          })
          .catch(err => {
            console.error('[Dashboard] Alerts fetch error:', err.message)
            errors.alerts = err.message
          })
      )
    }

    if (include.includes('recommendations')) {
      promises.push(
        recommendationService.generateRecommendations(userId, 5)
          .then(data => {
            results.recommendations = data.recommendations || []
            timestamps.recommendations = new Date().toISOString()
          })
          .catch(err => {
            console.error('[Dashboard] Recommendations fetch error:', err.message)
            errors.recommendations = err.message
          })
      )
    }

    // Wait for all promises to settle
    await Promise.allSettled(promises)

    res.json({
      success: true,
      data: results,
      timestamps,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('[Dashboard] Error fetching dashboard data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    })
  }
}

export default {
  getDashboardData
}
