/**
 * Holdings Service
 * Business logic for portfolio holdings
 * Fetches data ONLY from connected exchange accounts (Binance)
 * Paper trading data is NOT included - that's handled separately
 */

import holdingsRepository from '../repositories/holdingsRepository.js'
import connectedAccountsRepository from '../repositories/connectedAccountsRepository.js'
import binanceService from './binanceService.js'

class HoldingsService {
  /**
   * Get all holdings with optional filters
   * ONLY fetches holdings from connected exchange accounts (Binance)
   * Does NOT include manual/paper trading holdings
   * @param {Number} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Holdings data with metadata
   */
  async getHoldings(userId, filters = {}) {
    try {
      const { assetType, search, sortBy, sortOrder } = filters

      // ONLY fetch holdings from connected exchange accounts
      // No manual holdings - those are for paper trading only
      let holdings = await this._fetchConnectedAccountHoldings(userId)

      // Apply asset type filter
      if (assetType && assetType !== 'all') {
        holdings = holdings.filter(h => h.assetType === assetType)
      }

      // Apply search filter
      if (search) {
        const lowerSearch = search.toLowerCase()
        holdings = holdings.filter(h =>
          h.symbol.toLowerCase().includes(lowerSearch) ||
          h.name.toLowerCase().includes(lowerSearch)
        )
      }

      // Apply sorting
      if (sortBy) {
        holdings = this._sortHoldings(holdings, sortBy, sortOrder)
      }

      // Calculate summary statistics
      const summary = this._calculateSummary(holdings)

      return {
        holdings,
        summary,
        count: holdings.length
      }
    } catch (error) {
      console.error('[HoldingsService] Error getting holdings:', error)
      throw error
    }
  }

  /**
   * Fetch holdings from all connected exchange accounts
   * @param {Number} userId - User ID
   * @returns {Promise<Array>} Holdings from connected accounts
   */
  async _fetchConnectedAccountHoldings(userId) {
    try {
      // Get all connected accounts for user
      const connectedAccounts = await connectedAccountsRepository.getByUserId(userId)
      
      if (!connectedAccounts || connectedAccounts.length === 0) {
        return []
      }

      const allHoldings = []

      // Fetch holdings from each connected account
      for (const account of connectedAccounts) {
        try {
          let accountHoldings = []
          
          switch (account.platform) {
            case 'binance':
              accountHoldings = await this._fetchBinanceHoldings(userId, account)
              break
            default:
              console.log(`[HoldingsService] Unsupported platform: ${account.platform}`)
          }

          allHoldings.push(...accountHoldings)
          
          // Update last sync time
          await connectedAccountsRepository.updateLastSync(userId, account.platform)
        } catch (err) {
          console.error(`[HoldingsService] Error fetching from ${account.platform}:`, err.message)
          // Continue with other accounts even if one fails
        }
      }

      return allHoldings
    } catch (error) {
      console.error('[HoldingsService] Error fetching connected account holdings:', error)
      return []
    }
  }

  /**
   * Fetch holdings from Binance account
   */
  async _fetchBinanceHoldings(userId, account) {
    try {
      const portfolioData = await binanceService.getPortfolioValue(userId)
      
      if (!portfolioData || !portfolioData.holdings) {
        return []
      }

      // Get 24h price changes
      const symbols = portfolioData.holdings.map(h => h.asset)
      const priceChanges = await binanceService.get24hChange(symbols)

      return portfolioData.holdings.map(holding => ({
        id: `binance-${holding.asset}`, // Virtual ID for exchange holdings
        symbol: holding.asset,
        name: this._getAssetName(holding.asset),
        assetType: 'crypto',
        quantity: holding.amount,
        avgBuyPrice: holding.priceUSD, // Use current price as avg (no purchase history from API)
        currentPrice: holding.priceUSD,
        totalValue: holding.valueUSD,
        profitLoss: 0, // Can't calculate without purchase history
        profitLossPercent: 0,
        priceChange24h: priceChanges[holding.asset]?.priceChangePercent || 0,
        source: 'binance',
        account: account.account_name || 'Binance',
        isExchangeHolding: true
      }))
    } catch (error) {
      console.error('[HoldingsService] Error fetching Binance holdings:', error)
      return []
    }
  }

  /**
   * Get human-readable name for crypto asset
   */
  _getAssetName(symbol) {
    const names = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'Binance Coin',
      'USDT': 'Tether',
      'USDC': 'USD Coin',
      'XRP': 'Ripple',
      'ADA': 'Cardano',
      'DOGE': 'Dogecoin',
      'SOL': 'Solana',
      'DOT': 'Polkadot',
      'MATIC': 'Polygon',
      'SHIB': 'Shiba Inu',
      'LTC': 'Litecoin',
      'AVAX': 'Avalanche',
      'LINK': 'Chainlink',
      'UNI': 'Uniswap',
      'ATOM': 'Cosmos',
      'XLM': 'Stellar',
      'ALGO': 'Algorand',
      'VET': 'VeChain',
      'FIL': 'Filecoin',
      'NEAR': 'NEAR Protocol',
      'APE': 'ApeCoin',
      'SAND': 'The Sandbox',
      'MANA': 'Decentraland',
      'BUSD': 'Binance USD'
    }
    return names[symbol] || symbol
  }

  /**
   * Get holdings grouped by asset type
   * ONLY includes holdings from connected exchange accounts (Binance)
   * @param {Number} userId - User ID
   * @returns {Promise<Object>} Holdings grouped by type
   */
  async getHoldingsByType(userId) {
    try {
      // Get all holdings (manual + exchange)
      const { holdings } = await this.getHoldings(userId, {})

      const grouped = {
        crypto: [],
        stocks: [],
        forex: [],
        commodities: []
      }

      holdings.forEach(holding => {
        if (grouped[holding.assetType]) {
          grouped[holding.assetType].push(holding)
        }
      })

      // Calculate summary for each type
      Object.keys(grouped).forEach(type => {
        grouped[type] = {
          holdings: grouped[type],
          summary: this._calculateSummary(grouped[type])
        }
      })

      return grouped
    } catch (error) {
      console.error('[HoldingsService] Error grouping holdings:', error)
      throw error
    }
  }

  /**
   * Get holding details by ID
   * @param {Number} holdingId - Holding ID
   * @returns {Promise<Object>} Holding details
   */
  async getHoldingDetails(holdingId) {
    try {
      const holding = await holdingsRepository.getHoldingById(holdingId)
      
      if (!holding) {
        throw new Error('Holding not found')
      }

      // Add additional calculated fields
      return {
        ...holding,
        investedAmount: holding.quantity * holding.avgBuyPrice,
        currentValue: holding.quantity * holding.currentPrice,
        profitLoss: (holding.quantity * holding.currentPrice) - (holding.quantity * holding.avgBuyPrice)
      }
    } catch (error) {
      console.error('[HoldingsService] Error getting holding details:', error)
      throw error
    }
  }

  /**
   * Create new holding
   * @param {Number} userId - User ID
   * @param {Object} holdingData - Holding data
   * @returns {Promise<Object>} Created holding
   */
  async createHolding(userId, holdingData) {
    try {
      // Validate holding data
      this.validateHoldingData(holdingData)

      // Check for duplicate
      const duplicate = await holdingsRepository.checkDuplicateHolding(
        userId,
        holdingData.symbol,
        holdingData.assetType
      )

      // If duplicate exists, merge instead of creating new
      if (duplicate) {
        console.log(`[HoldingsService] Duplicate found for ${holdingData.symbol}, merging...`)
        return await holdingsRepository.mergeHolding(
          duplicate,
          holdingData.quantity,
          holdingData.avgBuyPrice
        )
      }

      // Create new holding
      const holding = await holdingsRepository.createHolding(userId, holdingData)
      console.log(`[HoldingsService] Created holding: ${holding.symbol}`)
      return holding
    } catch (error) {
      console.error('[HoldingsService] Error creating holding:', error)
      throw error
    }
  }

  /**
   * Update existing holding
   * @param {Number} holdingId - Holding ID
   * @param {Number} userId - User ID
   * @param {Object} holdingData - Updated holding data
   * @returns {Promise<Object>} Updated holding
   */
  async updateHolding(holdingId, userId, holdingData) {
    try {
      // Validate holding data
      this.validateHoldingData(holdingData)

      // Check if holding exists
      const existing = await holdingsRepository.getHoldingById(holdingId)
      if (!existing) {
        throw new Error('Holding not found')
      }

      if (existing.userId !== userId) {
        throw new Error('Unauthorized: Holding does not belong to user')
      }

      // Update holding
      const updated = await holdingsRepository.updateHolding(holdingId, userId, holdingData)
      console.log(`[HoldingsService] Updated holding: ${updated.symbol}`)
      return updated
    } catch (error) {
      console.error('[HoldingsService] Error updating holding:', error)
      throw error
    }
  }

  /**
   * Delete holding
   * @param {Number} holdingId - Holding ID
   * @param {Number} userId - User ID
   * @returns {Promise<Boolean>} Success status
   */
  async deleteHolding(holdingId, userId) {
    try {
      // Check if holding exists and belongs to user
      const existing = await holdingsRepository.getHoldingById(holdingId)
      if (!existing) {
        throw new Error('Holding not found')
      }

      if (existing.userId !== userId) {
        throw new Error('Unauthorized: Holding does not belong to user')
      }

      // Delete holding
      const deleted = await holdingsRepository.deleteHolding(holdingId, userId)
      console.log(`[HoldingsService] Deleted holding ID: ${holdingId}`)
      return deleted
    } catch (error) {
      console.error('[HoldingsService] Error deleting holding:', error)
      throw error
    }
  }

  /**
   * Bulk delete holdings
   * @param {Array<Number>} holdingIds - Array of holding IDs
   * @param {Number} userId - User ID
   * @returns {Promise<Number>} Number of deleted holdings
   */
  async bulkDeleteHoldings(holdingIds, userId) {
    try {
      if (!Array.isArray(holdingIds) || holdingIds.length === 0) {
        throw new Error('Invalid holding IDs array')
      }

      // Delete holdings
      const deletedCount = await holdingsRepository.bulkDeleteHoldings(holdingIds, userId)
      console.log(`[HoldingsService] Bulk deleted ${deletedCount} holdings`)
      return deletedCount
    } catch (error) {
      console.error('[HoldingsService] Error bulk deleting holdings:', error)
      throw error
    }
  }

  /**
   * Get holdings with pagination
   * ONLY includes holdings from connected exchange accounts (Binance)
   * @param {Number} userId - User ID
   * @param {Object} filters - Filter options
   * @param {Number} page - Page number
   * @param {Number} pageSize - Items per page
   * @returns {Promise<Object>} Paginated holdings data
   */
  async getHoldingsPaginated(userId, filters = {}, page = 1, pageSize = 20) {
    try {
      // Get all holdings (manual + exchange) with filters
      const { holdings: allHoldings } = await this.getHoldings(userId, filters)
      
      // Calculate pagination
      const totalItems = allHoldings.length
      const totalPages = Math.ceil(totalItems / pageSize)
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      
      // Slice for current page
      const paginatedHoldings = allHoldings.slice(startIndex, endIndex)
      
      // Calculate summary for current page
      const summary = this._calculateSummary(paginatedHoldings)

      return {
        holdings: paginatedHoldings,
        summary,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages
        }
      }
    } catch (error) {
      console.error('[HoldingsService] Error getting paginated holdings:', error)
      throw error
    }
  }

  /**
   * Validate holding data
   * @param {Object} holdingData - Holding data to validate
   * @throws {Error} If validation fails
   */
  validateHoldingData(holdingData) {
    const errors = []

    // Symbol validation
    if (!holdingData.symbol || typeof holdingData.symbol !== 'string') {
      errors.push({ field: 'symbol', message: 'Symbol is required and must be a string' })
    } else if (holdingData.symbol.length < 1 || holdingData.symbol.length > 10) {
      errors.push({ field: 'symbol', message: 'Symbol must be 1-10 characters' })
    }

    // Name validation
    if (!holdingData.name || typeof holdingData.name !== 'string') {
      errors.push({ field: 'name', message: 'Name is required and must be a string' })
    } else if (holdingData.name.length < 1 || holdingData.name.length > 100) {
      errors.push({ field: 'name', message: 'Name must be 1-100 characters' })
    }

    // Asset type validation
    const validAssetTypes = ['crypto', 'stocks', 'forex', 'commodities']
    if (!holdingData.assetType || !validAssetTypes.includes(holdingData.assetType)) {
      errors.push({ field: 'assetType', message: 'Asset type must be one of: crypto, stocks, forex, commodities' })
    }

    // Quantity validation
    if (typeof holdingData.quantity !== 'number' || holdingData.quantity <= 0) {
      errors.push({ field: 'quantity', message: 'Quantity must be a positive number' })
    }

    // Average buy price validation
    if (typeof holdingData.avgBuyPrice !== 'number' || holdingData.avgBuyPrice <= 0) {
      errors.push({ field: 'avgBuyPrice', message: 'Average buy price must be a positive number' })
    }

    // Current price validation (optional)
    if (holdingData.currentPrice !== undefined && holdingData.currentPrice !== null) {
      if (typeof holdingData.currentPrice !== 'number' || holdingData.currentPrice <= 0) {
        errors.push({ field: 'currentPrice', message: 'Current price must be a positive number' })
      }
    }

    // Account validation (optional)
    if (holdingData.account && typeof holdingData.account !== 'string') {
      errors.push({ field: 'account', message: 'Account must be a string' })
    } else if (holdingData.account && holdingData.account.length > 50) {
      errors.push({ field: 'account', message: 'Account name must be 50 characters or less' })
    }

    // Notes validation (optional)
    if (holdingData.notes && typeof holdingData.notes !== 'string') {
      errors.push({ field: 'notes', message: 'Notes must be a string' })
    } else if (holdingData.notes && holdingData.notes.length > 500) {
      errors.push({ field: 'notes', message: 'Notes must be 500 characters or less' })
    }

    if (errors.length > 0) {
      const error = new Error('Validation failed')
      error.validationErrors = errors
      throw error
    }
  }

  /**
   * Export holdings to CSV format
   * @param {Number} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<String>} CSV string
   */
  async exportToCSV(userId, filters = {}) {
    try {
      const { holdings } = await this.getHoldings(userId, filters)

      const headers = [
        'Symbol',
        'Name',
        'Type',
        'Account',
        'Source',
        'Quantity',
        'Avg Buy Price',
        'Current Price',
        'Total Value',
        'Profit/Loss',
        'P/L %',
        'Last Updated'
      ]

      const rows = holdings.map(h => [
        h.symbol,
        h.name,
        h.assetType,
        h.account || 'default',
        h.source || 'manual',
        h.quantity,
        h.avgBuyPrice,
        h.currentPrice || h.avgBuyPrice,
        h.totalValue,
        h.profitLoss,
        h.profitLossPercent,
        h.updatedAt ? new Date(h.updatedAt).toLocaleString() : 'N/A'
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')

      return csvContent
    } catch (error) {
      console.error('[HoldingsService] Error exporting to CSV:', error)
      throw error
    }
  }

  // Private helper methods

  _sortHoldings(holdings, sortBy, sortOrder = 'desc') {
    const sorted = [...holdings].sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]

      // Handle string comparisons
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return sorted
  }

  _calculateSummary(holdings) {
    if (!holdings || holdings.length === 0) {
      return {
        totalValue: 0,
        totalInvested: 0,
        totalProfitLoss: 0,
        totalProfitLossPercent: 0,
        count: 0
      }
    }

    const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0)
    const totalInvested = holdings.reduce((sum, h) => sum + (h.quantity * h.avgBuyPrice), 0)
    const totalProfitLoss = totalValue - totalInvested
    const totalProfitLossPercent = totalInvested > 0 
      ? (totalProfitLoss / totalInvested) * 100 
      : 0

    return {
      totalValue,
      totalInvested,
      totalProfitLoss,
      totalProfitLossPercent,
      count: holdings.length
    }
  }
}

export default new HoldingsService()
