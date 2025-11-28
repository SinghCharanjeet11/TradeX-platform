/**
 * Portfolio Service
 * Aggregates portfolio data from multiple connected accounts
 * Handles calculations for total value, allocation, performance, etc.
 */

class PortfolioService {
  /**
   * Calculate total portfolio value across all connected accounts
   * @param {Array} accounts - Connected trading accounts
   * @returns {Object} Portfolio summary
   */
  async getPortfolioSummary(accounts) {
    if (!accounts || accounts.length === 0) {
      return this._getEmptyPortfolio()
    }

    try {
      // Fetch portfolio data from each connected account
      const portfolioPromises = accounts.map(account => 
        this._fetchAccountPortfolio(account)
      )
      
      const portfolios = await Promise.allSettled(portfolioPromises)
      
      // Filter successful responses
      const validPortfolios = portfolios
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)

      // Aggregate data
      const summary = this._aggregatePortfolios(validPortfolios)
      
      return summary
    } catch (error) {
      console.error('[PortfolioService] Error getting portfolio summary:', error)
      throw error
    }
  }

  /**
   * Get asset allocation breakdown
   * @param {Array} holdings - All holdings across accounts
   * @returns {Object} Asset allocation by type
   */
  getAssetAllocation(holdings) {
    const allocation = {
      crypto: 0,
      stocks: 0,
      forex: 0,
      commodities: 0
    }

    let totalValue = 0

    holdings.forEach(holding => {
      const value = holding.quantity * holding.currentPrice
      totalValue += value

      const type = this._getAssetType(holding.symbol)
      allocation[type] += value
    })

    // Convert to percentages
    Object.keys(allocation).forEach(key => {
      allocation[key] = totalValue > 0 
        ? (allocation[key] / totalValue) * 100 
        : 0
    })

    return {
      allocation,
      totalValue
    }
  }

  /**
   * Calculate portfolio performance over time
   * @param {String} userId - User ID
   * @param {String} timeframe - Time period (1D, 1W, 1M, 3M, 1Y, ALL)
   * @returns {Array} Historical portfolio values
   */
  async getPortfolioPerformance(userId, timeframe = '1M') {
    try {
      // In production, fetch from database
      // For now, generate mock data
      return this._generateMockPerformanceData(timeframe)
    } catch (error) {
      console.error('[PortfolioService] Error getting performance:', error)
      throw error
    }
  }

  /**
   * Get top performing and worst performing assets
   * @param {Array} holdings - All holdings
   * @returns {Object} Best and worst performers
   */
  getTopPerformers(holdings) {
    const holdingsWithPerformance = holdings.map(holding => ({
      ...holding,
      performance: this._calculatePerformance(holding)
    }))

    // Sort by performance
    const sorted = [...holdingsWithPerformance].sort(
      (a, b) => b.performance - a.performance
    )

    return {
      best: sorted.slice(0, 3),
      worst: sorted.slice(-3).reverse()
    }
  }

  /**
   * Calculate total profit/loss
   * @param {Array} holdings - All holdings
   * @returns {Object} Profit/loss data
   */
  calculateProfitLoss(holdings) {
    let totalInvested = 0
    let currentValue = 0

    holdings.forEach(holding => {
      totalInvested += holding.quantity * holding.avgBuyPrice
      currentValue += holding.quantity * holding.currentPrice
    })

    const profitLoss = currentValue - totalInvested
    const profitLossPercent = totalInvested > 0 
      ? (profitLoss / totalInvested) * 100 
      : 0

    return {
      totalInvested,
      currentValue,
      profitLoss,
      profitLossPercent
    }
  }

  // Private helper methods

  _getEmptyPortfolio() {
    return {
      totalValue: 0,
      change24h: 0,
      change24hPercent: 0,
      holdings: [],
      allocation: {
        crypto: 0,
        stocks: 0,
        forex: 0,
        commodities: 0
      },
      topPerformers: { best: [], worst: [] },
      profitLoss: {
        totalInvested: 0,
        currentValue: 0,
        profitLoss: 0,
        profitLossPercent: 0
      }
    }
  }

  async _fetchAccountPortfolio(account) {
    // In production, call actual exchange APIs
    // For now, return mock data based on platform
    return this._generateMockPortfolioData(account)
  }

  _aggregatePortfolios(portfolios) {
    let totalValue = 0
    let totalChange24h = 0
    const allHoldings = []

    portfolios.forEach(portfolio => {
      totalValue += portfolio.totalValue || 0
      totalChange24h += portfolio.change24h || 0
      allHoldings.push(...(portfolio.holdings || []))
    })

    const change24hPercent = totalValue > 0 
      ? (totalChange24h / totalValue) * 100 
      : 0

    const { allocation } = this.getAssetAllocation(allHoldings)
    const topPerformers = this.getTopPerformers(allHoldings)
    const profitLoss = this.calculateProfitLoss(allHoldings)

    return {
      totalValue,
      change24h: totalChange24h,
      change24hPercent,
      holdings: allHoldings,
      allocation,
      topPerformers,
      profitLoss,
      accountCount: portfolios.length
    }
  }

  _getAssetType(symbol) {
    // Simple heuristic - in production, use a proper asset database
    const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOGE']
    const forexPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD']
    const commodities = ['GOLD', 'SILVER', 'OIL', 'GAS']

    if (cryptoSymbols.some(s => symbol.includes(s))) return 'crypto'
    if (forexPairs.some(s => symbol.includes(s))) return 'forex'
    if (commodities.some(s => symbol.includes(s))) return 'commodities'
    return 'stocks'
  }

  _calculatePerformance(holding) {
    const invested = holding.quantity * holding.avgBuyPrice
    const current = holding.quantity * holding.currentPrice
    return invested > 0 ? ((current - invested) / invested) * 100 : 0
  }

  _generateMockPortfolioData(account) {
    // Mock data generator for demo purposes
    const mockHoldings = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 0.5,
        avgBuyPrice: 45000,
        currentPrice: 48000,
        change24h: 2.5
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        quantity: 5,
        avgBuyPrice: 2800,
        currentPrice: 3000,
        change24h: 3.2
      },
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        quantity: 10,
        avgBuyPrice: 175,
        currentPrice: 182,
        change24h: 1.8
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        quantity: 5,
        avgBuyPrice: 240,
        currentPrice: 235,
        change24h: -1.2
      }
    ]

    const totalValue = mockHoldings.reduce(
      (sum, h) => sum + (h.quantity * h.currentPrice), 
      0
    )

    return {
      accountId: account.id,
      platform: account.platform,
      totalValue,
      change24h: totalValue * 0.025, // 2.5% change
      holdings: mockHoldings
    }
  }

  _generateMockPerformanceData(timeframe) {
    const dataPoints = {
      '1D': 24,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '1Y': 365,
      'ALL': 730
    }

    const points = dataPoints[timeframe] || 30
    const data = []
    let baseValue = 50000

    for (let i = 0; i < points; i++) {
      const change = (Math.random() - 0.48) * 1000 // Slight upward bias
      baseValue += change
      
      data.push({
        timestamp: Date.now() - (points - i) * 24 * 60 * 60 * 1000,
        value: Math.max(baseValue, 10000) // Ensure positive
      })
    }

    return data
  }
}

export default new PortfolioService()
