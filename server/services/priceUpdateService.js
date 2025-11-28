/**
 * Price Update Service
 * Handles real-time price updates for holdings
 */

import { query } from '../config/database.js';
import holdingsRepository from '../repositories/holdingsRepository.js';

class PriceUpdateService {
  constructor() {
    this.updateInterval = null;
    this.isRunning = false;
  }

  /**
   * Get current prices for holdings
   * @param {Array<String>} symbols - Array of symbols
   * @returns {Promise<Object>} Price data by symbol
   */
  async getCurrentPrices(symbols) {
    try {
      // For now, return mock prices
      // In production, this would call external APIs (CoinGecko, Alpha Vantage, etc.)
      const prices = {};
      
      for (const symbol of symbols) {
        // Simulate price with small random change
        const basePrice = this._getBasePrice(symbol);
        const change = (Math.random() - 0.5) * 0.02; // ±1% change
        prices[symbol] = {
          price: basePrice * (1 + change),
          change24h: (Math.random() - 0.5) * 10, // ±5% 24h change
          lastUpdated: new Date()
        };
      }

      return prices;
    } catch (error) {
      console.error('[PriceUpdateService] Error getting current prices:', error);
      throw error;
    }
  }

  /**
   * Refresh prices for all holdings
   * @param {Number} userId - User ID (optional, if not provided updates all)
   * @returns {Promise<Number>} Number of holdings updated
   */
  async refreshPrices(userId = null) {
    try {
      let holdings;
      
      if (userId) {
        holdings = await holdingsRepository.getUserHoldings(userId);
      } else {
        // Get all holdings from all users
        const result = await query('SELECT DISTINCT symbol, asset_type FROM holdings');
        holdings = result.rows;
      }

      if (holdings.length === 0) {
        return 0;
      }

      // Get unique symbols
      const symbols = [...new Set(holdings.map(h => h.symbol))];
      
      // Get current prices
      const prices = await this.getCurrentPrices(symbols);

      // Update holdings with new prices
      let updateCount = 0;
      for (const holding of holdings) {
        const priceData = prices[holding.symbol];
        if (priceData) {
          await holdingsRepository.updateHoldingPrice(holding.id, priceData.price);
          
          // Store price history
          await this._storePriceHistory(holding.symbol, holding.assetType, priceData.price);
          updateCount++;
        }
      }

      console.log(`[PriceUpdateService] Updated ${updateCount} holdings`);
      return updateCount;
    } catch (error) {
      console.error('[PriceUpdateService] Error refreshing prices:', error);
      // Don't throw - we want to retry on next interval
      return 0;
    }
  }

  /**
   * Start automatic price updates
   * @param {Number} intervalMs - Update interval in milliseconds (default: 60000 = 1 minute)
   */
  startPolling(intervalMs = 60000) {
    if (this.isRunning) {
      console.log('[PriceUpdateService] Polling already running');
      return;
    }

    console.log(`[PriceUpdateService] Starting price polling every ${intervalMs}ms`);
    this.isRunning = true;

    // Initial update
    this.refreshPrices();

    // Set up interval
    this.updateInterval = setInterval(() => {
      this.refreshPrices();
    }, intervalMs);
  }

  /**
   * Stop automatic price updates
   */
  stopPolling() {
    if (!this.isRunning) {
      return;
    }

    console.log('[PriceUpdateService] Stopping price polling');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.isRunning = false;
  }

  /**
   * Get price history for symbol
   * @param {String} symbol - Asset symbol
   * @param {String} assetType - Asset type
   * @param {Number} days - Number of days of history
   * @returns {Promise<Array>} Price history
   */
  async getPriceHistory(symbol, assetType, days = 30) {
    try {
      const result = await query(
        `SELECT price, timestamp
         FROM price_history
         WHERE symbol = $1 AND asset_type = $2 AND timestamp >= NOW() - INTERVAL '${days} days'
         ORDER BY timestamp ASC`,
        [symbol, assetType]
      );

      return result.rows.map(row => ({
        price: parseFloat(row.price),
        timestamp: row.timestamp
      }));
    } catch (error) {
      console.error('[PriceUpdateService] Error getting price history:', error);
      throw error;
    }
  }

  // Private helper methods

  async _storePriceHistory(symbol, assetType, price) {
    try {
      await query(
        `INSERT INTO price_history (symbol, asset_type, price, timestamp)
         VALUES ($1, $2, $3, NOW())`,
        [symbol, assetType, price]
      );
    } catch (error) {
      console.error('[PriceUpdateService] Error storing price history:', error);
      // Don't throw - price history is not critical
    }
  }

  _getBasePrice(symbol) {
    // Mock base prices for common assets
    const basePrices = {
      'BTC': 45000,
      'ETH': 3000,
      'BNB': 400,
      'SOL': 100,
      'AAPL': 180,
      'TSLA': 250,
      'GOOGL': 140,
      'MSFT': 380,
      'EUR/USD': 1.08,
      'GOLD': 2000
    };

    return basePrices[symbol] || 100;
  }
}

export default new PriceUpdateService();
