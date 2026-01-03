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

  async getCryptoMarketData() {
    const cacheKey = 'market:crypto:list';
    try {
      const cachedData = this._getCachedData(cacheKey);
      if (cachedData) {
        console.log('[MarketService] Returning cached crypto data');
        return this._formatResponse(cachedData.data, true, cachedData.age);
      }
      console.log('[MarketService] Fetching fresh crypto data from CoinGecko (top 250)');
      const rawData = await this.cryptoProvider.getTopCryptocurrencies(250);
      const transformedData = transformCryptoData(rawData);
      this._setCachedData(cacheKey, transformedData, this.cacheTTL.crypto);
      return this._formatResponse(transformedData, false, 0);
    } catch (error) {
      console.error('[MarketService] Error fetching crypto data:', error.message);
      // Return fallback mock data when API fails and no cache exists
      const fallbackData = this._getCryptoFallbackData();
      console.log('[MarketService] Using fallback crypto data');
      return this._formatResponse(fallbackData, false, 0, true);
    }
  }

  _getCryptoFallbackData() {
    return [
      { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 97500, change24h: 2.15, volume24h: 45000000000, marketCap: 1920000000000, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', lastUpdate: new Date().toISOString(), source: 'fallback' },
      { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3450, change24h: 1.85, volume24h: 22000000000, marketCap: 415000000000, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', lastUpdate: new Date().toISOString(), source: 'fallback' },
      { id: 'tether', symbol: 'USDT', name: 'Tether', price: 1.00, change24h: 0.01, volume24h: 85000000000, marketCap: 140000000000, image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', lastUpdate: new Date().toISOString(), source: 'fallback' },
      { id: 'binancecoin', symbol: 'BNB', name: 'BNB', price: 685, change24h: 1.25, volume24h: 1800000000, marketCap: 99000000000, image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', lastUpdate: new Date().toISOString(), source: 'fallback' },
      { id: 'solana', symbol: 'SOL', name: 'Solana', price: 185, change24h: 3.45, volume24h: 4500000000, marketCap: 86000000000, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', lastUpdate: new Date().toISOString(), source: 'fallback' },
      { id: 'ripple', symbol: 'XRP', name: 'XRP', price: 2.25, change24h: 1.12, volume24h: 8500000000, marketCap: 128000000000, image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', lastUpdate: new Date().toISOString(), source: 'fallback' },
      { id: 'usd-coin', symbol: 'USDC', name: 'USDC', price: 1.00, change24h: 0.00, volume24h: 6500000000, marketCap: 42000000000, image: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png', lastUpdate: new Date().toISOString(), source: 'fallback' },
      { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0.95, change24h: 2.35, volume24h: 850000000, marketCap: 33500000000, image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', lastUpdate: new Date().toISOString(), source: 'fallback' },
      { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', price: 0.38, change24h: 4.25, volume24h: 3200000000, marketCap: 56000000000, image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', lastUpdate: new Date().toISOString(), source: 'fallback' },
      { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', price: 42, change24h: 2.85, volume24h: 650000000, marketCap: 17000000000, image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', lastUpdate: new Date().toISOString(), source: 'fallback' }
    ];
  }

  async getStocksMarketData() {
    const cacheKey = 'market:stocks:list';
    try {
      const cachedData = this._getCachedData(cacheKey);
      if (cachedData) {
        console.log('[MarketService] Returning cached stocks data');
        return this._formatResponse(cachedData.data, true, cachedData.age);
      }
      console.log('[MarketService] Using mock stocks data');
      const mockStocksData = [
        { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.', price: 178.25, change24h: 1.45, volume24h: 52300000, marketCap: 2800000000000, image: 'https://companiesmarketcap.com/img/company-logos/64/AAPL.webp', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'msft', symbol: 'MSFT', name: 'Microsoft Corporation', price: 412.80, change24h: 0.92, volume24h: 28100000, marketCap: 3100000000000, image: 'https://companiesmarketcap.com/img/company-logos/64/MSFT.webp', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'googl', symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.65, change24h: 1.23, volume24h: 31200000, marketCap: 1800000000000, image: 'https://companiesmarketcap.com/img/company-logos/64/GOOG.webp', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'amzn', symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.35, change24h: 1.12, volume24h: 41500000, marketCap: 1800000000000, image: 'https://companiesmarketcap.com/img/company-logos/64/AMZN.webp', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'tsla', symbol: 'TSLA', name: 'Tesla Inc.', price: 242.50, change24h: -2.15, volume24h: 95200000, marketCap: 770000000000, image: 'https://companiesmarketcap.com/img/company-logos/64/TSLA.webp', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'meta', symbol: 'META', name: 'Meta Platforms Inc.', price: 485.20, change24h: 2.34, volume24h: 18900000, marketCap: 1200000000000, image: 'https://companiesmarketcap.com/img/company-logos/64/META.webp', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.45, change24h: 3.21, volume24h: 42300000, marketCap: 2200000000000, image: 'https://companiesmarketcap.com/img/company-logos/64/NVDA.webp', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'jpm', symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 195.80, change24h: 0.87, volume24h: 12400000, marketCap: 570000000000, image: 'https://companiesmarketcap.com/img/company-logos/64/JPM.webp', lastUpdate: new Date().toISOString(), source: 'mock' }
      ];
      this._setCachedData(cacheKey, mockStocksData, this.cacheTTL.stocks);
      return this._formatResponse(mockStocksData, false, 0);
    } catch (error) {
      console.error('[MarketService] Error fetching stocks data:', error.message);
      return this._handleError(error, cacheKey, 'stocks');
    }
  }

  async getForexMarketData() {
    const cacheKey = 'market:forex:list';
    try {
      const cachedData = this._getCachedData(cacheKey);
      if (cachedData) {
        console.log('[MarketService] Returning cached forex data');
        return this._formatResponse(cachedData.data, true, cachedData.age);
      }
      console.log('[MarketService] Using mock forex data');
      const mockForexData = [
        { id: 'eurusd', symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0845, change24h: 0.15, volume24h: 1200000000000, marketCap: 0, bidPrice: 1.0843, askPrice: 1.0847, spread: 0.0004, image: 'https://flagcdn.com/w80/eu.png', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'gbpusd', symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: 1.2675, change24h: -0.22, volume24h: 850000000000, marketCap: 0, bidPrice: 1.2673, askPrice: 1.2677, spread: 0.0004, image: 'https://flagcdn.com/w80/gb.png', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'usdjpy', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: 149.85, change24h: 0.45, volume24h: 950000000000, marketCap: 0, bidPrice: 149.83, askPrice: 149.87, spread: 0.04, image: 'https://flagcdn.com/w80/us.png', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'audusd', symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', price: 0.6542, change24h: -0.18, volume24h: 420000000000, marketCap: 0, bidPrice: 0.6540, askPrice: 0.6544, spread: 0.0004, image: 'https://flagcdn.com/w80/au.png', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'usdcad', symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', price: 1.3625, change24h: 0.32, volume24h: 380000000000, marketCap: 0, bidPrice: 1.3623, askPrice: 1.3627, spread: 0.0004, image: 'https://flagcdn.com/w80/ca.png', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'usdchf', symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', price: 0.8845, change24h: 0.18, volume24h: 290000000000, marketCap: 0, bidPrice: 0.8843, askPrice: 0.8847, spread: 0.0004, image: 'https://flagcdn.com/w80/ch.png', lastUpdate: new Date().toISOString(), source: 'mock' }
      ];
      this._setCachedData(cacheKey, mockForexData, this.cacheTTL.forex);
      return this._formatResponse(mockForexData, false, 0);
    } catch (error) {
      console.error('[MarketService] Error fetching forex data:', error.message);
      return this._handleError(error, cacheKey, 'forex');
    }
  }

  async getCommoditiesMarketData() {
    const cacheKey = 'market:commodities:list';
    try {
      const cachedData = this._getCachedData(cacheKey);
      if (cachedData) {
        console.log('[MarketService] Returning cached commodities data');
        return this._formatResponse(cachedData.data, true, cachedData.age);
      }
      console.log('[MarketService] Using mock commodities data');
      const mockCommoditiesData = [
        { id: 'xau', symbol: 'XAU', name: 'Gold', price: 2045.50, change24h: 0.85, volume24h: 145000000000, marketCap: 12500000000000, unit: 'per oz', high24h: 2055.30, low24h: 2038.20, image: 'https://cdn-icons-png.flaticon.com/512/2529/2529508.png', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'xag', symbol: 'XAG', name: 'Silver', price: 24.15, change24h: 1.25, volume24h: 28000000000, marketCap: 1400000000000, unit: 'per oz', high24h: 24.45, low24h: 23.85, image: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'wti', symbol: 'WTI', name: 'Crude Oil (WTI)', price: 78.45, change24h: -1.35, volume24h: 185000000000, marketCap: 0, unit: 'per barrel', high24h: 80.20, low24h: 77.90, image: 'https://cdn-icons-png.flaticon.com/512/3104/3104405.png', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'ng', symbol: 'NG', name: 'Natural Gas', price: 2.85, change24h: 2.15, volume24h: 42000000000, marketCap: 0, unit: 'per MMBtu', high24h: 2.92, low24h: 2.78, image: 'https://cdn-icons-png.flaticon.com/512/2917/2917242.png', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'copper', symbol: 'HG', name: 'Copper', price: 3.85, change24h: 0.65, volume24h: 18000000000, marketCap: 0, unit: 'per lb', high24h: 3.92, low24h: 3.80, image: 'https://cdn-icons-png.flaticon.com/512/2917/2917242.png', lastUpdate: new Date().toISOString(), source: 'mock' },
        { id: 'platinum', symbol: 'XPT', name: 'Platinum', price: 925.40, change24h: -0.45, volume24h: 8500000000, marketCap: 0, unit: 'per oz', high24h: 932.10, low24h: 920.50, image: 'https://cdn-icons-png.flaticon.com/512/2529/2529508.png', lastUpdate: new Date().toISOString(), source: 'mock' }
      ];
      this._setCachedData(cacheKey, mockCommoditiesData, this.cacheTTL.commodities);
      return this._formatResponse(mockCommoditiesData, false, 0);
    } catch (error) {
      console.error('[MarketService] Error fetching commodities data:', error.message);
      return this._handleError(error, cacheKey, 'commodities');
    }
  }

  async getAssetDetails(marketType, symbol) {
    const cacheKey = `market:detail:${marketType}:${symbol}`;
    try {
      const cachedData = this._getCachedData(cacheKey);
      if (cachedData) {
        console.log(`[MarketService] Returning cached detail data for ${symbol}`);
        return this._formatResponse(cachedData.data, true, cachedData.age);
      }
      let detailData;
      if (marketType === 'crypto') {
        console.log(`[MarketService] Fetching detailed data for crypto ${symbol}`);
        const rawData = await this.cryptoProvider.getCryptocurrencyDetails(symbol);
        detailData = transformCryptoDetailData(rawData);
      } else {
        // For non-crypto assets, get data from the market list cache
        console.log(`[MarketService] Fetching detail data for ${marketType} ${symbol} from market list`);
        const cacheKeyMap = {
          'stocks': 'market:stocks:list',
          'stock': 'market:stocks:list',
          'forex': 'market:forex:list',
          'commodities': 'market:commodities:list',
          'commodity': 'market:commodities:list'
        };
        const listCacheKey = cacheKeyMap[marketType];
        
        if (!listCacheKey) {
          throw new Error(`Unknown market type: ${marketType}`);
        }
        
        // Try to get from cache first, if not fetch fresh data
        let marketData = this._getCachedData(listCacheKey);
        if (!marketData) {
          // Fetch fresh data
          let response;
          if (marketType === 'stocks' || marketType === 'stock') {
            response = await this.getStocksMarketData();
          } else if (marketType === 'forex') {
            response = await this.getForexMarketData();
          } else if (marketType === 'commodities' || marketType === 'commodity') {
            response = await this.getCommoditiesMarketData();
          }
          marketData = { data: response?.data || [] };
        }
        
        // Find the asset in the list
        const symbolLower = symbol.toLowerCase();
        const symbolUpper = symbol.toUpperCase();
        const asset = marketData.data.find(
          a => a.id === symbol || a.id === symbolLower || 
               a.symbol === symbolUpper || a.symbol === symbol ||
               a.symbol?.toLowerCase() === symbolLower
        );
        
        if (asset) {
          detailData = { ...asset };
        } else {
          throw new Error(`Asset ${symbol} not found in ${marketType} market data`);
        }
      }
      this._setCachedData(cacheKey, detailData, this.cacheTTL.crypto);
      return this._formatResponse(detailData, false, 0);
    } catch (error) {
      console.error(`[MarketService] Error fetching detail data for ${symbol}:`, error.message);
      return this._handleError(error, cacheKey, marketType);
    }
  }

  async getMarketChartData(marketType, symbol, days = 7) {
    // Normalize market type (stock -> stocks, commodity -> commodities for internal use)
    const normalizedMarketType = marketType === 'stock' ? 'stocks' : 
                                 marketType === 'commodity' ? 'commodities' : marketType;
    
    const cacheKey = `market:chart:${normalizedMarketType}:${symbol}:${days}`;
    try {
      console.log(`[MarketService] Chart request: ${normalizedMarketType} ${symbol} (${days} days)`);
      
      const cachedData = this._getCachedData(cacheKey);
      if (cachedData && cachedData.data && cachedData.data.symbol === symbol) {
        console.log(`[MarketService] Returning cached chart data for ${symbol}`);
        return this._formatResponse(cachedData.data, true, cachedData.age);
      } else if (cachedData) {
        this.cache.delete(cacheKey);
      }

      let chartData;

      if (normalizedMarketType === 'crypto') {
        try {
          const rawData = await this.cryptoProvider.getMarketChart(symbol, days);
          chartData = transformCryptoChartData(rawData, symbol);
          chartData.symbol = symbol;
        } catch (apiError) {
          console.error(`[MarketService] CoinGecko API error for ${symbol}:`, apiError.message);
          chartData = await this._generateFallbackChartData(symbol, days, null, normalizedMarketType);
        }
      } else if (normalizedMarketType === 'stocks' || normalizedMarketType === 'forex' || normalizedMarketType === 'commodities') {
        console.log(`[MarketService] Generating chart data for ${normalizedMarketType} ${symbol}`);
        chartData = await this._generateFallbackChartData(symbol, days, null, normalizedMarketType);
      } else {
        throw new Error(`Unknown market type: ${marketType}`);
      }

      this._setCachedData(cacheKey, chartData, this.cacheTTL.charts);
      return this._formatResponse(chartData, false, 0);
    } catch (error) {
      console.error(`[MarketService] Error fetching chart data for ${symbol}:`, error.message);
      const fallbackData = await this._generateFallbackChartData(symbol, days, null, 'crypto');
      return { success: true, data: fallbackData, metadata: { timestamp: new Date().toISOString(), cached: false, fallback: true } };
    }
  }

  async _generateFallbackChartData(symbol, days, currentPrice = null, marketType = 'crypto') {
    const numDays = days === 'max' ? 365 : parseInt(days);
    const points = Math.min(numDays * 24, 1000);
    const now = Date.now();
    
    let basePrice = currentPrice;
    
    if (!basePrice) {
      try {
        // Normalize market type for cache key lookup (stock -> stocks, commodity -> commodities)
        const normalizedMarketType = marketType === 'stock' ? 'stocks' : 
                                     marketType === 'commodity' ? 'commodities' : marketType;
        const cacheKeyMap = {
          'crypto': 'market:crypto:list',
          'stocks': 'market:stocks:list',
          'forex': 'market:forex:list',
          'commodities': 'market:commodities:list'
        };
        const cacheKey = cacheKeyMap[normalizedMarketType] || 'market:crypto:list';
        const cachedData = this._getCachedData(cacheKey);
        
        if (cachedData && cachedData.data) {
          const symbolLower = symbol.toLowerCase();
          const symbolUpper = symbol.toUpperCase();
          const asset = cachedData.data.find(
            a => a.id === symbol || a.id === symbolLower || a.symbol === symbolUpper || a.symbol === symbol
          );
          if (asset && asset.price) {
            basePrice = asset.price;
            console.log(`[MarketService] Found cached ${marketType} price for ${symbol}: ${basePrice}`);
          }
        }
      } catch (e) {
        console.warn(`[MarketService] Could not get cached price for ${symbol}:`, e.message);
      }
    }
    
    if (!basePrice) {
      const defaultPrices = {
        'bitcoin': 50000, 'ethereum': 3000, 'tether': 1, 'binancecoin': 300,
        'solana': 100, 'ripple': 0.5, 'cardano': 0.5, 'dogecoin': 0.1,
        'polkadot': 7, 'avalanche-2': 35,
        'aapl': 178.25, 'msft': 412.80, 'googl': 142.65, 'amzn': 178.35,
        'tsla': 242.50, 'meta': 485.20, 'nvda': 875.45, 'jpm': 195.80,
        'eurusd': 1.0845, 'gbpusd': 1.2675, 'usdjpy': 149.85, 'audusd': 0.6542,
        'usdcad': 1.3625, 'usdchf': 0.8845,
        'xau': 2045.50, 'xag': 24.15, 'wti': 78.45, 'ng': 2.85,
        'copper': 3.85, 'platinum': 925.40
      };
      basePrice = defaultPrices[symbol.toLowerCase()] || 100;
      console.log(`[MarketService] Using default price for ${marketType} ${symbol}: ${basePrice}`);
    }
    
    const volatilityMap = { 'crypto': 0.03, 'stock': 0.015, 'stocks': 0.015, 'forex': 0.005, 'commodity': 0.02, 'commodities': 0.02 };
    const volatility = volatilityMap[marketType] || 0.02;
    
    const prices = [];
    for (let i = 0; i < points; i++) {
      const timestamp = now - (points - i) * 3600000;
      const randomWalk = (Math.random() - 0.5) * volatility * 2;
      const trend = i / points * 0.05;
      const price = basePrice * (1 + trend + randomWalk);
      const volume = Math.random() * 1e9 + 5e8;
      
      let decimals = 2;
      if (basePrice < 1) decimals = 6;
      else if (basePrice < 10) decimals = 4;
      
      prices.push({
        timestamp,
        price: parseFloat(price.toFixed(decimals)),
        volume: parseFloat(volume.toFixed(0))
      });
    }
    
    return {
      symbol,
      prices,
      metadata: { generated: true, reason: marketType === 'crypto' ? 'API unavailable' : 'Mock data', basePrice, marketType }
    };
  }

  async getOHLCData(marketType, symbol, days = 7) {
    const cacheKey = `market:ohlc:${marketType}:${symbol}:${days}`;
    try {
      const cachedData = this._getCachedData(cacheKey);
      if (cachedData) {
        console.log(`[MarketService] Returning cached OHLC data for ${symbol}`);
        return this._formatResponse(cachedData.data, true, cachedData.age);
      }
      let ohlcData;
      if (marketType === 'crypto') {
        console.log(`[MarketService] Fetching OHLC data for crypto ${symbol}`);
        const rawData = await this.cryptoProvider.getOHLC(symbol, days);
        ohlcData = transformOHLCData(rawData, symbol);
      } else {
        throw new Error(`OHLC data not yet implemented for ${marketType}`);
      }
      this._setCachedData(cacheKey, ohlcData, this.cacheTTL.charts);
      return this._formatResponse(ohlcData, false, 0);
    } catch (error) {
      console.error(`[MarketService] Error fetching OHLC data for ${symbol}:`, error.message);
      return this._handleError(error, cacheKey, marketType);
    }
  }

  async getTopGainers(assetType, limit = 5) {
    try {
      let marketData;
      switch (assetType) {
        case 'crypto':
          const cryptoResponse = await this.getCryptoMarketData();
          marketData = cryptoResponse.data || [];
          break;
        case 'stock':
          const stockResponse = await this.getStocksMarketData();
          marketData = stockResponse.data || [];
          break;
        case 'forex':
          const forexResponse = await this.getForexMarketData();
          marketData = forexResponse.data || [];
          break;
        case 'commodity':
          const commodityResponse = await this.getCommoditiesMarketData();
          marketData = commodityResponse.data || [];
          break;
        default:
          return [];
      }
      return marketData.filter(asset => asset.change24h != null).sort((a, b) => (b.change24h || 0) - (a.change24h || 0)).slice(0, limit);
    } catch (error) {
      console.error(`[MarketService] Error getting top gainers for ${assetType}:`, error);
      return [];
    }
  }

  _getCachedData(key) {
    const cachedItem = this.cache.get(key);
    if (!cachedItem) return null;
    if (cachedItem.timestamp) {
      const age = Math.floor((Date.now() - cachedItem.timestamp) / 1000);
      return { data: cachedItem.data, age };
    }
    return { data: cachedItem, age: 0 };
  }

  _setCachedData(key, data, ttl) {
    const cacheItem = { data, timestamp: Date.now(), ttl };
    this.cache.set(key, cacheItem, ttl);
  }

  _formatResponse(data, cached = false, cacheAge = 0, fallback = false) {
    return {
      success: true,
      data,
      metadata: { timestamp: new Date().toISOString(), cached, cacheAge, count: Array.isArray(data) ? data.length : 1, fallback }
    };
  }

  _handleError(error, cacheKey, marketType) {
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return {
        success: false,
        error: { code: 'API_ERROR', message: 'Unable to fetch fresh market data, returning cached data', provider: error.provider || 'Unknown', cached: true },
        data: cachedData,
        metadata: { timestamp: new Date().toISOString(), cached: true, stale: true }
      };
    }
    return {
      success: false,
      error: { code: 'API_ERROR', message: error.message || 'Unable to fetch market data', provider: error.provider || 'Unknown', cached: false },
      data: [],
      metadata: { timestamp: new Date().toISOString() }
    };
  }
}

const marketService = new MarketService();
export default marketService;
