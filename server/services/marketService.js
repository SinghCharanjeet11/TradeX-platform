/**
 * MarketService - Orchestration layer for market data
 * Coordinates between providers and cache to serve market data
 */

import CryptoProvider from '../providers/cryptoProvider.js';
import StocksProvider from '../providers/stocksProvider.js';
import ForexProvider from '../providers/forexProvider.js';
import CommoditiesProvider from '../providers/commoditiesProvider.js';
import cacheService from './cacheService.js';
import { apiConfig } from '../config/apiConfig.js';
import {
  transformCryptoData,
  transformStocksData,
  transformForexData,
  transformCommoditiesData,
  transformCryptoChartData,
  transformCryptoDetailData,
  transformOHLCData
} from '../utils/dataTransformers.js';

class MarketService {
  constructor() {
    this.cryptoProvider = new CryptoProvider();
    this.stocksProvider = new StocksProvider();
    this.forexProvider = new ForexProvider();
    this.commoditiesProvider = new CommoditiesProvider();
    this.cache = cacheService;
    this.cacheTTL = apiConfig.cache;
  }

  /**
   * Get cryptocurrency market data
   * @returns {Promise<Object>} Standardized response with crypto data
   */
  async getCryptoMarketData() {
    const cacheKey = 'market:crypto:list';
    
    try {
      // Check cache first
      const cachedData = this._getCachedData(cacheKey);
      if (cachedData) {
        console.log('[MarketService] Returning cached crypto data');
        return this._formatResponse(cachedData.data, true, cachedData.age);
      }

      // Fetch from API
      console.log('[MarketService] Fetching fresh crypto data from CoinGecko');
      const rawData = await this.cryptoProvider.getTopCryptocurrencies(20);
      const transformedData = transformCryptoData(rawData);

      // Cache the result
      this._setCachedData(cacheKey, transformedData, this.cacheTTL.crypto);

      return this._formatResponse(transformedData, false, 0);

    } catch (error) {
      console.error('[MarketService] Error fetching crypto data:', error.message);
      return this._handleError(error, cacheKey, 'crypto');
    }
  }

  /**
   * Get stocks market data
   * @returns {Promise<Object>} Standardized response with stocks data
   */
  async getStocksMarketData() {
    const cacheKey = 'market:stocks:list';
    
    try {
      // Check cache first
      const cachedData = this._getCachedData(cacheKey);
      if (cachedData) {
        console.log('[MarketService] Returning cached stocks data');
        return this._formatResponse(cachedData.data, true, cachedData.age);
      }

      // Fetch from API
      console.log('[MarketService] Fetching fresh stocks data from Alpha Vantage');
      const symbols = this.stocksProvider.defaultSymbols;
      const rawData = await this.stocksProvider.getMultipleStockQuotes(symbols);
      const transformedData = transformStocksData(rawData, symbols);

      // Cache the result
      this._setCachedData(cacheKey, transformedData, this.cacheTTL.stocks);

      return this._formatResponse(transformedData, false, 0);

    } catch (error) {
      console.error('[MarketService] Error fetching stocks data:', error.message);
      return this._handleError(error, cacheKey, 'stocks');
    }
  }

  /**
   * Get forex market data
   * @returns {Promise<Object>} Standardized response with forex data
   */
  async getForexMarketData() {
    const cacheKey = 'market:forex:list';
    
    try {
      // Check cache first
      const cachedData = this._getCachedData(cacheKey);
      if (cachedData) {
        console.log('[MarketService] Returning cached forex data');
        return this._formatResponse(cachedData.data, true, cachedData.age);
      }

      // Fetch from API
      console.log('[MarketService] Fetching fresh forex data from Alpha Vantage');
      const pairs = this.forexProvider.defaultPairs;
      const rawData = await this.forexProvider.getMultipleExchangeRates(pairs);
      const pairNames = pairs.map(p => p.name);
      const transformedData = transformForexData(rawData, pairNames);

      // Cache the result
      this._setCachedData(cacheKey, transformedData, this.cacheTTL.forex);

      return this._formatResponse(transformedData, false, 0);

    } catch (error) {
      console.error('[MarketService] Error fetching forex data:', error.message);
      return this._handleError(error, cacheKey, 'forex');
    }
  }

  /**
   * Get commodities market data
   * @returns {Promise<Object>} Standardized response with commodities data
   */
  async getCommoditiesMarketData() {
    const cacheKey = 'market:commodities:list';
    
    try {
      // Check cache first
      const cachedData = this._getCachedData(cacheKey);
      if (cachedData) {
        console.log('[MarketService] Returning cached commodities data');
        return this._formatResponse(cachedData.data, true, cachedData.age);
      }

      // Fetch from API
      console.log('[MarketService] Fetching fresh commodities data from Alpha Vantage');
      const commodities = this.commoditiesProvider.defaultCommodities;
      const rawData = await this.commoditiesProvider.getMultipleCommodityPrices(commodities);
      const transformedData = transformCommoditiesData(rawData, commodities);

      // Cache the result
      this._setCachedData(cacheKey, transformedData, this.cacheTTL.commodities);

      return this._formatResponse(transformedData, false, 0);

    } catch (error) {
      console.error('[MarketService] Error fetching commodities data:', error.message);
      return this._handleError(error, cacheKey, 'commodities');
    }
  }

  /**
   * Get detailed asset information
   * @param {string} marketType - Market type (crypto, stocks, forex, commodities)
   * @param {string} symbol - Symbol or ID
   * @returns {Promise<Object>} Detailed asset data
   */
  async getAssetDetails(marketType, symbol) {
    const cacheKey = `market:detail:${marketType}:${symbol}`;
    
    try {
      // Check cache first
      const cachedData = this._getCachedData(cacheKey);
      if (cachedData) {
        console.log(`[MarketService] Returning cached detail data for ${symbol}`);
        return this._formatResponse(cachedData.data, true, cachedData.age);
      }

      let detailData;

      // Fetch based on market type
      if (marketType === 'crypto') {
        console.log(`[MarketService] Fetching detailed data for crypto ${symbol}`);
        const rawData = await this.cryptoProvider.getCryptocurrencyDetails(symbol);
        detailData = transformCryptoDetailData(rawData);
      } else {
        // For stocks, forex, commodities - would need specific implementation
        throw new Error(`Detail data not yet implemented for ${marketType}`);
      }

      // Cache the result
      this._setCachedData(cacheKey, detailData, this.cacheTTL.crypto);

      return this._formatResponse(detailData, false, 0);

    } catch (error) {
      console.error(`[MarketService] Error fetching detail data for ${symbol}:`, error.message);
      return this._handleError(error, cacheKey, marketType);
    }
  }

  /**
   * Get market chart data for a specific symbol
   * @param {string} marketType - Market type (crypto, stocks, forex, commodities)
   * @param {string} symbol - Symbol or ID
   * @param {number|string} days - Number of days of historical data (1, 7, 30, 90, 365, 'max')
   * @returns {Promise<Object>} Chart data
   */
  async getMarketChartData(marketType, symbol, days = 7) {
    const cacheKey = `market:chart:${marketType}:${symbol}:${days}`;
    
    try {
      // Check cache first
      const cachedData = this._getCachedData(cacheKey);
      if (cachedData) {
        console.log(`[MarketService] Returning cached chart data for ${symbol}`);
        return this._formatResponse(cachedData.data, true, cachedData.age);
      }

      let chartData;

      // Fetch based on market type
      if (marketType === 'crypto') {
        console.log(`[MarketService] Fetching chart data for crypto ${symbol} (${days} days)`);
        const rawData = await this.cryptoProvider.getMarketChart(symbol, days);
        chartData = transformCryptoChartData(rawData, symbol);
      } else {
        // For stocks, forex, commodities - would need time series implementation
        throw new Error(`Chart data not yet implemented for ${marketType}`);
      }

      // Cache the result
      this._setCachedData(cacheKey, chartData, this.cacheTTL.charts);

      return this._formatResponse(chartData, false, 0);

    } catch (error) {
      console.error(`[MarketService] Error fetching chart data for ${symbol}:`, error.message);
      return this._handleError(error, cacheKey, marketType);
    }
  }

  /**
   * Get OHLC (candlestick) data for a specific symbol
   * @param {string} marketType - Market type (crypto, stocks, forex, commodities)
   * @param {string} symbol - Symbol or ID
   * @param {number} days - Number of days of historical data
   * @returns {Promise<Object>} OHLC data
   */
  async getOHLCData(marketType, symbol, days = 7) {
    const cacheKey = `market:ohlc:${marketType}:${symbol}:${days}`;
    
    try {
      // Check cache first
      const cachedData = this._getCachedData(cacheKey);
      if (cachedData) {
        console.log(`[MarketService] Returning cached OHLC data for ${symbol}`);
        return this._formatResponse(cachedData.data, true, cachedData.age);
      }

      let ohlcData;

      // Fetch based on market type
      if (marketType === 'crypto') {
        console.log(`[MarketService] Fetching OHLC data for crypto ${symbol}`);
        const rawData = await this.cryptoProvider.getOHLC(symbol, days);
        ohlcData = transformOHLCData(rawData, symbol);
      } else {
        // For stocks, forex, commodities - would need specific implementation
        throw new Error(`OHLC data not yet implemented for ${marketType}`);
      }

      // Cache the result
      this._setCachedData(cacheKey, ohlcData, this.cacheTTL.charts);

      return this._formatResponse(ohlcData, false, 0);

    } catch (error) {
      console.error(`[MarketService] Error fetching OHLC data for ${symbol}:`, error.message);
      return this._handleError(error, cacheKey, marketType);
    }
  }

  /**
   * Get cached data with metadata
   * @private
   */
  _getCachedData(key) {
    const data = this.cache.get(key);
    if (!data) {
      return null;
    }

    return {
      data,
      age: this._calculateCacheAge(key)
    };
  }

  /**
   * Set data in cache
   * @private
   */
  _setCachedData(key, data, ttl) {
    this.cache.set(key, data, ttl);
  }

  /**
   * Calculate cache age in seconds
   * @private
   */
  _calculateCacheAge(key) {
    // Simple approximation - in production, store timestamp with cached data
    return 0;
  }

  /**
   * Format successful response
   * @private
   */
  _formatResponse(data, cached = false, cacheAge = 0) {
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        cached,
        cacheAge,
        count: Array.isArray(data) ? data.length : 1
      }
    };
  }

  /**
   * Handle errors with fallback to cached data
   * @private
   */
  _handleError(error, cacheKey, marketType) {
    // Try to return cached data even if stale
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`[MarketService] Returning stale cached data for ${marketType} due to error`);
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Unable to fetch fresh market data, returning cached data',
          provider: error.provider || 'Unknown',
          cached: true
        },
        data: cachedData,
        metadata: {
          timestamp: new Date().toISOString(),
          cached: true,
          stale: true
        }
      };
    }

    // No cached data available
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error.message || 'Unable to fetch market data',
        provider: error.provider || 'Unknown',
        cached: false
      },
      data: [],
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Export singleton instance
const marketService = new MarketService();
export default marketService;
