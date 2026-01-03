/**
 * Price Predictor Service
 * Generates price predictions for assets using historical data and simple algorithms
 */

import AIInsightsService from './aiInsightsService.js';
import marketService from './marketService.js';

class PricePredictorService extends AIInsightsService {
  constructor() {
    super('PricePredictorService');
    this.CACHE_TTL = 3600; // 1 hour in seconds
    this.PREDICTION_HORIZONS = ['24h', '7d', '30d'];
  }

  /**
   * Generate price predictions for an asset
   * @param {string} symbol - Asset symbol
   * @param {string} assetType - crypto, stock, forex, commodity
   * @param {Array<string>} timeHorizons - ['24h', '7d', '30d']
   * @returns {Promise<Object>} Price prediction data
   */
  async predictPrice(symbol, assetType, timeHorizons = this.PREDICTION_HORIZONS) {
    try {
      this.validateParams({ symbol, assetType }, ['symbol', 'assetType']);

      // Generate cache key
      const cacheKey = this.generateCacheKey('price-prediction', { symbol, assetType });

      // Check cache first
      const cached = this.getCached(cacheKey);
      if (cached && !this.isStale(cached.lastUpdated, 60)) {
        this.logInfo(`Returning cached prediction for ${symbol}`);
        return cached;
      }

      // Fetch historical data
      const historicalData = await this._fetchHistoricalData(symbol, assetType);
      
      if (!historicalData || historicalData.length < 10) {
        return this._insufficientDataResponse(symbol, assetType);
      }

      // Generate predictions for each time horizon
      const predictions = [];
      for (const horizon of timeHorizons) {
        const prediction = await this._generatePredictionForHorizon(
          symbol,
          assetType,
          horizon,
          historicalData
        );
        predictions.push(prediction);
      }

      // Calculate historical accuracy
      const historicalAccuracy = await this.getHistoricalAccuracy(symbol, assetType);

      const result = {
        symbol,
        assetType,
        predictions,
        historicalAccuracy,
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.setCached(cacheKey, result, this.CACHE_TTL);

      return result;

    } catch (error) {
      this.logError('Error generating price prediction', error);
      throw error;
    }
  }

  /**
   * Generate prediction for a specific time horizon
   * @private
   */
  async _generatePredictionForHorizon(symbol, assetType, timeHorizon, historicalData) {
    const currentPrice = historicalData[historicalData.length - 1].price;
    
    // Calculate simple moving average and trend
    const { sma, trend, volatility } = this._calculateTechnicalIndicators(historicalData);
    
    // Generate prediction based on trend and volatility
    const daysAhead = this._horizonToDays(timeHorizon);
    const trendFactor = trend * daysAhead * 0.01; // 1% per day trend impact
    const predictedPrice = currentPrice * (1 + trendFactor);
    
    // Calculate price range based on volatility
    const volatilityRange = currentPrice * volatility * Math.sqrt(daysAhead);
    const priceRange = {
      min: Math.max(0, predictedPrice - volatilityRange),
      max: predictedPrice + volatilityRange
    };

    // Calculate confidence
    const confidence = this.calculateConfidence({
      dataPoints: historicalData.length,
      minDataPoints: 30,
      dataAge: this._getDataAge(historicalData),
      maxAge: 24,
      volatility: volatility,
      maxVolatility: 0.5
    });

    return {
      timeHorizon,
      predictedPrice: Math.round(predictedPrice * 100) / 100,
      priceRange: {
        min: Math.round(priceRange.min * 100) / 100,
        max: Math.round(priceRange.max * 100) / 100
      },
      confidence,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate technical indicators from historical data
   * @private
   */
  _calculateTechnicalIndicators(historicalData) {
    const prices = historicalData.map(d => d.price);
    const n = prices.length;

    // Simple Moving Average (last 20 periods or all if less)
    const smaWindow = Math.min(20, n);
    const recentPrices = prices.slice(-smaWindow);
    const sma = recentPrices.reduce((sum, p) => sum + p, 0) / smaWindow;

    // Trend (percentage change from SMA to current)
    const currentPrice = prices[n - 1];
    const trend = (currentPrice - sma) / sma;

    // Volatility (standard deviation of returns)
    const returns = [];
    for (let i = 1; i < n; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);

    return { sma, trend, volatility };
  }

  /**
   * Convert time horizon to days
   * @private
   */
  _horizonToDays(horizon) {
    const mapping = {
      '24h': 1,
      '7d': 7,
      '30d': 30
    };
    return mapping[horizon] || 7;
  }

  /**
   * Get age of data in hours
   * @private
   */
  _getDataAge(historicalData) {
    if (!historicalData || historicalData.length === 0) {
      return 999;
    }
    const latestTimestamp = new Date(historicalData[historicalData.length - 1].timestamp);
    const now = new Date();
    return (now - latestTimestamp) / (1000 * 60 * 60); // hours
  }

  /**
   * Fetch historical data for the asset
   * @private
   */
  async _fetchHistoricalData(symbol, assetType) {
    try {
      // Fetch chart data (30 days for good prediction basis)
      const response = await marketService.getMarketChartData(assetType, symbol, 30);
      
      if (!response.success || !response.data || !response.data.prices) {
        this.logInfo(`No historical data available for ${symbol}`);
        return [];
      }

      // Transform to consistent format
      return response.data.prices.map(point => ({
        timestamp: point.timestamp,
        price: point.price
      }));

    } catch (error) {
      this.logError(`Error fetching historical data for ${symbol}`, error);
      return [];
    }
  }

  /**
   * Calculate confidence level for prediction
   * @param {Object} historicalData
   * @param {Object} prediction
   * @returns {number} - Confidence percentage (0-100)
   */
  calculateConfidence(historicalData, prediction) {
    // Use parent class method with appropriate factors
    return super.calculateConfidence(historicalData);
  }

  /**
   * Get historical accuracy for this asset
   * @param {string} symbol
   * @param {string} assetType
   * @returns {Promise<number>} - Accuracy percentage
   */
  async getHistoricalAccuracy(symbol, assetType) {
    // For now, return a baseline accuracy
    // In production, this would query a database of past predictions vs actual outcomes
    try {
      // Placeholder: return accuracy based on asset type
      const baselineAccuracy = {
        crypto: 65,
        stock: 70,
        forex: 68,
        commodity: 67
      };

      return baselineAccuracy[assetType] || 65;

    } catch (error) {
      this.logError('Error calculating historical accuracy', error);
      return 60; // Default baseline
    }
  }

  /**
   * Response for insufficient data
   * @private
   */
  _insufficientDataResponse(symbol, assetType) {
    return {
      symbol,
      assetType,
      predictions: [],
      historicalAccuracy: 0,
      lastUpdated: new Date().toISOString(),
      error: {
        code: 'INSUFFICIENT_DATA',
        message: 'Unable to generate reliable prediction due to insufficient historical data'
      }
    };
  }
}

// Export singleton instance
const pricePredictorService = new PricePredictorService();
export default pricePredictorService;
