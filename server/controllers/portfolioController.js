/**
 * Portfolio Controller
 * Handles HTTP requests for portfolio data
 */

import binanceService from '../services/binanceService.js'
import connectedAccountsRepository from '../repositories/connectedAccountsRepository.js'

/**
 * Get portfolio summary for authenticated user
 * @route GET /api/portfolio/summary
 */
export const getPortfolioSummary = async (req, res) => {
  try {
    const userId = req.user.id

    // Check if user has connected Binance account
    const hasAccount = await connectedAccountsRepository.hasConnectedAccount(userId, 'binance')
    
    if (!hasAccount) {
      return res.json({
        success: true,
        data: {
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
      })
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
      change: 0,
      amount: holding.amount
    }))

    const summary = {
      totalValue: portfolioData.totalValueUSD,
      totalInvested: portfolioData.totalValueUSD,
      totalProfitLoss: 0,
      totalProfitLossPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
      allocation,
      topPerformers,
      hasConnectedAccount: true,
      updateTime: portfolioData.updateTime
    }

    res.json({
      success: true,
      data: summary
    })
  } catch (error) {
    console.error('[PortfolioController] Error getting summary:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio summary'
    })
  }
}

/**
 * Get portfolio performance over time
 * @route GET /api/portfolio/performance
 */
export const getPortfolioPerformance = async (req, res) => {
  try {
    const userId = req.user.id
    const { timeframe = '1M' } = req.query

    // Mock performance data for now
    const performance = {
      timeframe,
      data: []
    }

    res.json({
      success: true,
      data: performance
    })
  } catch (error) {
    console.error('[PortfolioController] Error getting performance:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio performance'
    })
  }
}

/**
 * Get asset allocation breakdown
 * @route GET /api/portfolio/allocation
 */
export const getAssetAllocation = async (req, res) => {
  try {
    const userId = req.user.id

    // Check if user has connected Binance account
    const hasAccount = await connectedAccountsRepository.hasConnectedAccount(userId, 'binance')
    
    if (!hasAccount) {
      return res.json({
        success: true,
        data: {
          allocation: [],
          totalValue: 0
        }
      })
    }

    // Get portfolio from Binance
    const portfolioData = await binanceService.getPortfolioValue(userId)
    
    // Calculate allocation
    const allocation = portfolioData.holdings.map(holding => ({
      asset: holding.asset,
      value: holding.valueUSD,
      percentage: (holding.valueUSD / portfolioData.totalValueUSD) * 100
    }))

    res.json({
      success: true,
      data: {
        allocation,
        totalValue: portfolioData.totalValueUSD
      }
    })
  } catch (error) {
    console.error('[PortfolioController] Error getting allocation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch asset allocation'
    })
  }
}

/**
 * Refresh portfolio data from all connected accounts
 * @route POST /api/portfolio/refresh
 */
export const refreshPortfolio = async (req, res) => {
  try {
    const userId = req.user.id

    // Update last sync time
    await connectedAccountsRepository.updateLastSync(userId, 'binance')

    // Get fresh portfolio data
    const portfolioData = await binanceService.getPortfolioValue(userId)

    res.json({
      success: true,
      message: 'Portfolio data refreshed successfully',
      totalValue: portfolioData.totalValueUSD,
      holdingsCount: portfolioData.holdings.length
    })
  } catch (error) {
    console.error('[PortfolioController] Error refreshing portfolio:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to refresh portfolio'
    })
  }
}
