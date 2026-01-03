/**
 * Binance Exchange Integration Service
 * Fetches real portfolio data from Binance using encrypted credentials
 */
import binanceModule from 'binance-api-node'
const Binance = binanceModule.default
import connectedAccountsRepository from '../repositories/connectedAccountsRepository.js'

class BinanceService {
  constructor() {
    this.serverTimeOffset = 0
  }

  /**
   * Get server time offset to sync with Binance
   */
  async syncServerTime() {
    try {
      const client = Binance()
      const serverTime = await client.time()
      const localTime = Date.now()
      this.serverTimeOffset = serverTime - localTime
      console.log(`[BinanceService] Time offset: ${this.serverTimeOffset}ms`)
      return this.serverTimeOffset
    } catch (error) {
      console.error('[BinanceService] Error syncing server time:', error)
      return 0
    }
  }

  /**
   * Create Binance client with user credentials
   */
  async createClient(userId) {
    try {
      // Get decrypted credentials from database
      const credentials = await connectedAccountsRepository.getCredentials(userId, 'binance')
      
      if (!credentials) {
        throw new Error('Binance account not connected')
      }

      // Trim credentials to remove any whitespace
      const trimmedKey = credentials.apiKey?.trim()
      const trimmedSecret = credentials.apiSecret?.trim()

      // Sync time before creating client
      await this.syncServerTime()

      // Create Binance client with time offset
      const client = Binance({
        apiKey: trimmedKey,
        apiSecret: trimmedSecret,
        getTime: () => Date.now() + this.serverTimeOffset
      })

      return client
    } catch (error) {
      console.error('[BinanceService] Error creating client:', error)
      throw error
    }
  }

  /**
   * Get account balance from Binance
   */
  async getAccountBalance(userId) {
    try {
      const client = await this.createClient(userId)
      
      // Get account information
      const accountInfo = await client.accountInfo()
      
      // Filter out zero balances
      const balances = accountInfo.balances
        .filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
        .map(balance => ({
          asset: balance.asset,
          free: parseFloat(balance.free),
          locked: parseFloat(balance.locked),
          total: parseFloat(balance.free) + parseFloat(balance.locked)
        }))

      console.log(`[BinanceService] Found ${balances.length} assets for user ${userId}`)
      
      return {
        balances,
        updateTime: accountInfo.updateTime,
        canTrade: accountInfo.canTrade,
        canWithdraw: accountInfo.canWithdraw,
        canDeposit: accountInfo.canDeposit
      }
    } catch (error) {
      console.error('[BinanceService] Error getting account balance:', error)
      throw new Error('Failed to fetch Binance account balance')
    }
  }

  /**
   * Get current prices for all assets
   */
  async getPrices() {
    try {
      // Create client without credentials for public data
      const client = Binance()
      
      const prices = await client.prices()
      
      return prices
    } catch (error) {
      console.error('[BinanceService] Error getting prices:', error)
      throw error
    }
  }

  /**
   * Calculate portfolio value in USD
   */
  async getPortfolioValue(userId) {
    try {
      // Get balances and prices
      const [accountData, prices] = await Promise.all([
        this.getAccountBalance(userId),
        this.getPrices()
      ])

      const balances = accountData.balances
      let totalValueUSD = 0
      const holdings = []

      // Calculate value for each asset
      for (const balance of balances) {
        const { asset, total } = balance
        
        // Try to get USD price
        let priceUSD = 0
        let valueUSD = 0

        // Direct USDT/BUSD/USD pairs
        if (asset === 'USDT' || asset === 'BUSD' || asset === 'USD') {
          priceUSD = 1
          valueUSD = total
        } else {
          // Try different price pairs
          const pairUSDT = `${asset}USDT`
          const pairBUSD = `${asset}BUSD`
          
          if (prices[pairUSDT]) {
            priceUSD = parseFloat(prices[pairUSDT])
            valueUSD = total * priceUSD
          } else if (prices[pairBUSD]) {
            priceUSD = parseFloat(prices[pairBUSD])
            valueUSD = total * priceUSD
          }
        }

        if (valueUSD > 0.01) { // Only include assets worth more than $0.01
          holdings.push({
            asset,
            amount: total,
            priceUSD,
            valueUSD,
            free: balance.free,
            locked: balance.locked
          })
          
          totalValueUSD += valueUSD
        }
      }

      // Sort by value descending
      holdings.sort((a, b) => b.valueUSD - a.valueUSD)

      console.log(`[BinanceService] Portfolio value: $${totalValueUSD.toFixed(2)}`)

      return {
        totalValueUSD,
        holdings,
        updateTime: accountData.updateTime,
        accountStatus: {
          canTrade: accountData.canTrade,
          canWithdraw: accountData.canWithdraw,
          canDeposit: accountData.canDeposit
        }
      }
    } catch (error) {
      console.error('[BinanceService] Error calculating portfolio value:', error)
      throw error
    }
  }

  /**
   * Get 24h price change for assets
   */
  async get24hChange(symbols) {
    try {
      const client = Binance()
      
      if (!symbols || symbols.length === 0) {
        return {}
      }

      const changes = {}
      
      // Get 24h ticker for each symbol
      for (const symbol of symbols) {
        try {
          const ticker = await client.dailyStats({ symbol: `${symbol}USDT` })
          changes[symbol] = {
            priceChange: parseFloat(ticker.priceChange),
            priceChangePercent: parseFloat(ticker.priceChangePercent),
            highPrice: parseFloat(ticker.highPrice),
            lowPrice: parseFloat(ticker.lowPrice),
            volume: parseFloat(ticker.volume)
          }
        } catch (err) {
          // Symbol might not have USDT pair
          console.log(`[BinanceService] No 24h data for ${symbol}`)
        }
      }

      return changes
    } catch (error) {
      console.error('[BinanceService] Error getting 24h change:', error)
      return {}
    }
  }

  /**
   * Test connection with credentials
   */
  async testConnection(apiKey, apiSecret) {
    try {
      // Trim credentials to remove any whitespace
      const trimmedKey = apiKey?.trim()
      const trimmedSecret = apiSecret?.trim()

      if (!trimmedKey || !trimmedSecret) {
        return {
          success: false,
          message: 'API Key and Secret are required'
        }
      }

      console.log('[BinanceService] Testing connection with key:', trimmedKey.substring(0, 10) + '...')

      // Sync time before testing connection
      await this.syncServerTime()
      console.log('[BinanceService] Time synced, offset:', this.serverTimeOffset, 'ms')

      const client = Binance({
        apiKey: trimmedKey,
        apiSecret: trimmedSecret,
        getTime: () => Date.now() + this.serverTimeOffset
      })

      // Try to get account info
      const accountInfo = await client.accountInfo()
      
      console.log('[BinanceService] Connection successful! Account type:', accountInfo.accountType)
      
      return { success: true, message: 'Connection successful' }
    } catch (error) {
      console.error('[BinanceService] Connection test failed:', error)
      console.error('[BinanceService] Error code:', error.code)
      console.error('[BinanceService] Error message:', error.message)
      
      // Provide specific error messages based on error type
      let errorMessage = 'Invalid API credentials'
      
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Unable to connect to Binance. Please check your internet connection.'
      } else if (error.message && error.message.includes('Signature')) {
        errorMessage = 'API signature verification failed. Please ensure your API Key and Secret are correct and match each other.'
      } else if (error.message && error.message.includes('API-key')) {
        errorMessage = 'Invalid API Key format. Please check that you copied the entire API Key correctly.'
      } else if (error.message && error.message.includes('Timestamp')) {
        errorMessage = 'Server time synchronization error. Your computer clock may be significantly out of sync. Please sync your system time and try again.'
      } else if (error.message && error.message.includes('IP')) {
        errorMessage = 'IP address not whitelisted. Please check your Binance API settings.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return { 
        success: false, 
        message: errorMessage
      }
    }
  }
}

export default new BinanceService()
