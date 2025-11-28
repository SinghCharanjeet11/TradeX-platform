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

      // Use mock data for stocks (Alpha Vantage free tier is too slow)
      console.log('[MarketService] Using mock stocks data (Alpha Vantage free tier rate limits)');
      const mockStocksData = [
        {
          id: 'aapl',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          price: 178.25,
          change24h: 1.45,
          volume24h: 52300000,
          marketCap: 2800000000000,
          image: 'https://logo.clearbit.com/apple.com',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'msft',
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          price: 412.80,
          change24h: 0.92,
          volume24h: 28100000,
          marketCap: 3100000000000,
          image: 'https://logo.clearbit.com/microsoft.com',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'googl',
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          price: 142.65,
          change24h: 1.23,
          volume24h: 31200000,
          marketCap: 1800000000000,
          image: 'https://logo.clearbit.com/google.com',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'amzn',
          symbol: 'AMZN',
          name: 'Amazon.com Inc.',
          price: 178.35,
          change24h: 1.12,
          volume24h: 41500000,
          marketCap: 1800000000000,
          image: 'https://logo.clearbit.com/amazon.com',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'tsla',
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          price: 242.50,
          change24h: -2.15,
          volume24h: 95200000,
          marketCap: 770000000000,
          image: 'https://logo.clearbit.com/tesla.com',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'meta',
          symbol: 'META',
          name: 'Meta Platforms Inc.',
          price: 485.20,
          change24h: 2.34,
          volume24h: 18900000,
          marketCap: 1200000000000,
          image: 'https://logo.clearbit.com/meta.com',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'nvda',
          symbol: 'NVDA',
          name: 'NVIDIA Corporation',
          price: 875.45,
          change24h: 3.21,
          volume24h: 42300000,
          marketCap: 2200000000000,
          image: 'https://logo.clearbit.com/nvidia.com',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'jpm',
          symbol: 'JPM',
          name: 'JPMorgan Chase & Co.',
          price: 195.80,
          change24h: 0.87,
          volume24h: 12400000,
          marketCap: 570000000000,
          image: 'https://logo.clearbit.com/jpmorganchase.com',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        }
      ];

      // Cache the mock data
      this._setCachedData(cacheKey, mockStocksData, this.cacheTTL.stocks);

      return this._formatResponse(mockStocksData, false, 0);

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

      // Use mock data for forex (Alpha Vantage free tier is too slow)
      console.log('[MarketService] Using mock forex data (Alpha Vantage free tier rate limits)');
      const mockForexData = [
        {
          id: 'eurusd',
          symbol: 'EUR/USD',
          name: 'Euro / US Dollar',
          price: 1.0845,
          change24h: 0.15,
          volume24h: 1200000000000,
          marketCap: 0,
          bidPrice: 1.0843,
          askPrice: 1.0847,
          spread: 0.0004,
          image: 'https://flagcdn.com/w80/eu.png',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'gbpusd',
          symbol: 'GBP/USD',
          name: 'British Pound / US Dollar',
          price: 1.2675,
          change24h: -0.22,
          volume24h: 850000000000,
          marketCap: 0,
          bidPrice: 1.2673,
          askPrice: 1.2677,
          spread: 0.0004,
          image: 'https://flagcdn.com/w80/gb.png',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'usdjpy',
          symbol: 'USD/JPY',
          name: 'US Dollar / Japanese Yen',
          price: 149.85,
          change24h: 0.45,
          volume24h: 950000000000,
          marketCap: 0,
          bidPrice: 149.83,
          askPrice: 149.87,
          spread: 0.04,
          image: 'https://flagcdn.com/w80/us.png',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'audusd',
          symbol: 'AUD/USD',
          name: 'Australian Dollar / US Dollar',
          price: 0.6542,
          change24h: -0.18,
          volume24h: 420000000000,
          marketCap: 0,
          bidPrice: 0.6540,
          askPrice: 0.6544,
          spread: 0.0004,
          image: 'https://flagcdn.com/w80/au.png',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'usdcad',
          symbol: 'USD/CAD',
          name: 'US Dollar / Canadian Dollar',
          price: 1.3625,
          change24h: 0.32,
          volume24h: 380000000000,
          marketCap: 0,
          bidPrice: 1.3623,
          askPrice: 1.3627,
          spread: 0.0004,
          image: 'https://flagcdn.com/w80/ca.png',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'usdchf',
          symbol: 'USD/CHF',
          name: 'US Dollar / Swiss Franc',
          price: 0.8845,
          change24h: 0.18,
          volume24h: 290000000000,
          marketCap: 0,
          bidPrice: 0.8843,
          askPrice: 0.8847,
          spread: 0.0004,
          image: 'https://flagcdn.com/w80/ch.png',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        }
      ];

      // Cache the mock data
      this._setCachedData(cacheKey, mockForexData, this.cacheTTL.forex);

      return this._formatResponse(mockForexData, false, 0);

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

      // Use mock data for commodities (Alpha Vantage free tier is too slow)
      console.log('[MarketService] Using mock commodities data (Alpha Vantage free tier rate limits)');
      const mockCommoditiesData = [
        {
          id: 'xau',
          symbol: 'XAU',
          name: 'Gold',
          price: 2045.50,
          change24h: 0.85,
          volume24h: 145000000000,
          marketCap: 12500000000000,
          unit: 'per oz',
          high24h: 2055.30,
          low24h: 2038.20,
          image: 'https://cdn-icons-png.flaticon.com/512/2529/2529508.png',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'xag',
          symbol: 'XAG',
          name: 'Silver',
          price: 24.15,
          change24h: 1.25,
          volume24h: 28000000000,
          marketCap: 1400000000000,
          unit: 'per oz',
          high24h: 24.45,
          low24h: 23.85,
          image: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'wti',
          symbol: 'WTI',
          name: 'Crude Oil (WTI)',
          price: 78.45,
          change24h: -1.35,
          volume24h: 185000000000,
          marketCap: 0,
          unit: 'per barrel',
          high24h: 80.20,
          low24h: 77.90,
          image: 'https://cdn-icons-png.flaticon.com/512/3104/3104405.png',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'ng',
          symbol: 'NG',
          name: 'Natural Gas',
          price: 2.85,
          change24h: 2.15,
          volume24h: 42000000000,
          marketCap: 0,
          unit: 'per MMBtu',
          high24h: 2.92,
          low24h: 2.78,
          image: 'https://cdn-icons-png.flaticon.com/512/2917/2917242.png',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'copper',
          symbol: 'HG',
          name: 'Copper',
          price: 3.85,
          change24h: 0.65,
          volume24h: 18000000000,
          marketCap: 0,
          unit: 'per lb',
          high24h: 3.92,
          low24h: 3.80,
          image: 'https://cdn-icons-png.flaticon.com/512/2917/2917242.png',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        },
        {
          id: 'platinum',
          symbol: 'XPT',
          name: 'Platinum',
          price: 925.40,
          change24h: -0.45,
          volume24h: 8500000000,
          marketCap: 0,
          unit: 'per oz',
          high24h: 932.10,
          low24h: 920.50,
          image: 'https://cdn-icons-png.flaticon.com/512/2529/2529508.png',
          lastUpdate: new Date().toISOString(),
          source: 'mock'
        }
      ];

      // Cache the mock data
      this._setCachedData(cacheKey, mockCommoditiesData, this.cacheTTL.commodities);

      return this._formatResponse(mockCommoditiesData, false, 0);

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
    const cachedItem = this.cache.get(key);
    if (!cachedItem) {
      return null;
    }

    // Check if cache has metadata (timestamp)
    if (cachedItem.timestamp) {
      const age = Math.floor((Date.now() - cachedItem.timestamp) / 1000);
      return {
        data: cachedItem.data,
        age
      };
    }

    // Legacy cache without timestamp
    return {
      data: cachedItem,
      age: 0
    };
  }

  /**
   * Set data in cache with timestamp
   * @private
   */
  _setCachedData(key, data, ttl) {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl
    };
    this.cache.set(key, cacheItem, ttl);
    console.log(`[MarketService] Cached ${key} with TTL ${ttl}s`);
  }

  /**
   * Check if cached data is stale (past TTL but still in cache)
   * @private
   */
  _isCacheStale(key, ttl) {
    const cachedItem = this.cache.get(key);
    if (!cachedItem || !cachedItem.timestamp) {
      return false;
    }

    const age = Math.floor((Date.now() - cachedItem.timestamp) / 1000);
    return age > ttl;
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
