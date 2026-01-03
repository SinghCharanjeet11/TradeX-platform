/**
 * Price Update Service
 * Handles real-time price updates for holdings and alerts
 */

import { query } from '../config/database.js';
import holdingsRepository from '../repositories/holdingsRepository.js';
import watchlistRepository from '../repositories/watchlistRepository.js';
import marketService from './marketService.js';

class PriceUpdateService {
  constructor() {
    this.updateInterval = null;
    this.isRunning = false;
  }

  /**
   * Get current prices for holdings
   * @param {Array<String>} symbols - Array of symbols
   * @param {String} assetType - Asset type (crypto, stock, forex, commodity)
   * @returns {Promise<Object>} Price data by symbol
   */
  async getCurrentPrices(symbols, assetType = 'crypto') {
    try {
      const prices = {};
      
      // Fetch real market data based on asset type
      let marketData;
      switch (assetType.toLowerCase()) {
        case 'crypto':
        case 'cryptocurrency':
          const cryptoResult = await marketService.getCryptoMarketData();
          marketData = cryptoResult.success ? cryptoResult.data : [];
          break;
        case 'stock':
        case 'stocks':
          const stocksResult = await marketService.getStocksMarketData();
          marketData = stocksResult.success ? stocksResult.data : [];
          break;
        case 'forex':
          const forexResult = await marketService.getForexMarketData();
          marketData = forexResult.success ? forexResult.data : [];
          break;
        case 'commodity':
        case 'commodities':
          const commoditiesResult = await marketService.getCommoditiesMarketData();
          marketData = commoditiesResult.success ? commoditiesResult.data : [];
          break;
        default:
          marketData = [];
      }

      // Map symbols to prices from market data
      for (const symbol of symbols) {
        const asset = marketData.find(item => 
          item.symbol === symbol || item.id === symbol
        );
        
        if (asset) {
          prices[symbol] = {
            price: asset.current_price || asset.price || this._getBasePrice(symbol),
            change24h: asset.price_change_percentage_24h || asset.change24h || 0,
            lastUpdated: new Date()
          };
        } else {
          // Fallback to base price if not found in market data
          prices[symbol] = {
            price: this._getBasePrice(symbol),
            change24h: 0,
            lastUpdated: new Date()
          };
        }
      }

      return prices;
    } catch (error) {
      console.error('[PriceUpdateService] Error getting current prices:', error);
      // Fallback to base prices on error
      const prices = {};
      for (const symbol of symbols) {
        prices[symbol] = {
          price: this._getBasePrice(symbol),
          change24h: 0,
          lastUpdated: new Date()
        };
      }
      return prices;
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
        const result = await query('SELECT DISTINCT id, symbol, asset_type FROM holdings');
        holdings = result.rows.map(row => ({
          id: row.id,
          symbol: row.symbol,
          assetType: row.asset_type
        }));
      }

      if (holdings.length === 0) {
        return 0;
      }

      // Group holdings by asset type
      const holdingsByType = {};
      holdings.forEach(holding => {
        const type = holding.assetType || 'crypto';
        if (!holdingsByType[type]) {
          holdingsByType[type] = [];
        }
        holdingsByType[type].push(holding);
      });

      // Update holdings with new prices (grouped by asset type for efficiency)
      let updateCount = 0;
      for (const [assetType, typeHoldings] of Object.entries(holdingsByType)) {
        const symbols = [...new Set(typeHoldings.map(h => h.symbol))];
        const prices = await this.getCurrentPrices(symbols, assetType);

        for (const holding of typeHoldings) {
          const priceData = prices[holding.symbol];
          if (priceData) {
            await holdingsRepository.updateHoldingPrice(holding.id, priceData.price);
            
            // Store price history
            await this._storePriceHistory(holding.symbol, holding.assetType, priceData.price);
            updateCount++;
          }
        }
      }

      // Also update alert prices
      await this.refreshAlertPrices();

      console.log(`[PriceUpdateService] Updated ${updateCount} holdings`);
      return updateCount;
    } catch (error) {
      console.error('[PriceUpdateService] Error refreshing prices:', error);
      // Don't throw - we want to retry on next interval
      return 0;
    }
  }

  /**
   * Refresh prices for all active alerts
   * @returns {Promise<Number>} Number of alerts updated
   */
  async refreshAlertPrices() {
    try {
      // Get all active alerts
      const alerts = await watchlistRepository.getAllActiveAlerts();
      
      if (alerts.length === 0) {
        return 0;
      }

      // Group alerts by asset type
      const alertsByType = {};
      alerts.forEach(alert => {
        const type = alert.assetType || 'crypto';
        if (!alertsByType[type]) {
          alertsByType[type] = [];
        }
        alertsByType[type].push(alert);
      });

      // Update alerts with new prices (grouped by asset type for efficiency)
      let updateCount = 0;
      for (const [assetType, typeAlerts] of Object.entries(alertsByType)) {
        const symbols = [...new Set(typeAlerts.map(a => a.symbol))];
        const prices = await this.getCurrentPrices(symbols, assetType);

        for (const alert of typeAlerts) {
          const priceData = prices[alert.symbol];
          if (priceData) {
            await watchlistRepository.updateAlert(alert.id, {
              currentPrice: priceData.price
            });
            updateCount++;
          }
        }
      }

      console.log(`[PriceUpdateService] Updated ${updateCount} alert prices`);
      return updateCount;
    } catch (error) {
      console.error('[PriceUpdateService] Error refreshing alert prices:', error);
      // Don't throw - we want to continue even if alert updates fail
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
