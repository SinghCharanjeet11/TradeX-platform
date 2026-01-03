/**
 * Signal Generator Service
 * Generates trading signals (BUY/SELL/HOLD) based on technical indicators
 */

import AIInsightsService from './aiInsightsService.js';
import marketService from './marketService.js';

class SignalGeneratorService extends AIInsightsService {
  constructor() {
    super('SignalGeneratorService');
    this.CACHE_TTL = 300; // 5 minutes in seconds
  }

  /**
   * Generate trading signal for an asset
   * @param {string} symbol - Asset symbol
   * @param {string} assetType - crypto, stock, forex, commodity
   * @param {Object} userPreferences - User preferences (optional)
   * @returns {Promise<Object>} Trading signal data
   */
  async generateSignal(symbol, assetType, userPreferences = {}) {
    try {
      this.validateParams({ symbol, assetType }, ['symbol', 'assetType']);

      // Generate cache key
      const cacheKey = this.generateCacheKey('trading-signal', { symbol, assetType });

      // Check cache first
      const cached = this.getCached(cacheKey);
      if (cached && !this.isStale(cached.generatedAt, 5)) {
        this.logInfo(`Returning cached signal for ${symbol}`);
        return cached;
      }

      // Fetch market data
      const marketData = await this._fetchMarketData(symbol, assetType);
      
      if (!marketData || !marketData.prices || marketData.prices.length < 20) {
        return this._insufficientDataResponse(symbol, assetType);
      }

      // Calculate technical indicators
      const indicators = this._calculateTechnicalIndicators(marketData.prices);

      // Determine signal type based on indicators
      const signalType = this._determineSignalType(indicators);

      // Calculate confidence
      const confidence = this._calculateSignalConfidence(indicators, signalType);

      // Calculate price targets
      const currentPrice = marketData.prices[marketData.prices.length - 1].price;
      const priceTargets = this._calculatePriceTargets(signalType, currentPrice, indicators);

      // Generate reasoning
      const reasoning = this._generateReasoning(signalType, indicators);

      // Calculate risk score
      const riskScore = this._calculateRiskScore(indicators);

      const result = {
        id: this._generateSignalId(symbol, assetType),
        symbol,
        assetType,
        signalType,
        confidence,
        reasoning,
        priceTargets,
        riskScore,
        indicators: this._formatIndicators(indicators),
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        dismissed: false
      };

      // Cache the result
      this.setCached(cacheKey, result, this.CACHE_TTL);

      return result;

    } catch (error) {
      this.logError('Error generating trading signal', error);
      throw error;
    }
  }

  /**
   * Fetch market data for signal generation
   * @private
   */
  async _fetchMarketData(symbol, assetType) {
    try {
      // Fetch 30 days of chart data for technical analysis
      const response = await marketService.getMarketChartData(assetType, symbol, 30);
      
      if (!response.success || !response.data || !response.data.prices) {
        this.logInfo(`No market data available for ${symbol}`);
        return null;
      }

      return response.data;

    } catch (error) {
      this.logError(`Error fetching market data for ${symbol}`, error);
      return null;
    }
  }

  /**
   * Calculate technical indicators
   * @private
   */
  _calculateTechnicalIndicators(prices) {
    const priceValues = prices.map(p => p.price);
    const n = priceValues.length;

    // RSI (Relative Strength Index)
    const rsi = this._calculateRSI(priceValues, 14);

    // MACD (Moving Average Convergence Divergence)
    const macd = this._calculateMACD(priceValues);

    // Moving Averages
    const sma20 = this._calculateSMA(priceValues, 20);
    const sma50 = this._calculateSMA(priceValues, Math.min(50, n));
    const ema12 = this._calculateEMA(priceValues, 12);
    const ema26 = this._calculateEMA(priceValues, 26);

    // Bollinger Bands
    const bollingerBands = this._calculateBollingerBands(priceValues, 20, 2);

    // Current price
    const currentPrice = priceValues[n - 1];

    // Volatility
    const volatility = this._calculateVolatility(priceValues);

    // Trend strength
    const trendStrength = this._calculateTrendStrength(priceValues);

    return {
      rsi,
      macd,
      sma20,
      sma50,
      ema12,
      ema26,
      bollingerBands,
      currentPrice,
      volatility,
      trendStrength
    };
  }

  /**
   * Calculate RSI (Relative Strength Index)
   * @private
   */
  _calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) {
      return 50; // Neutral if insufficient data
    }

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains = changes.slice(-period).map(c => c > 0 ? c : 0);
    const losses = changes.slice(-period).map(c => c < 0 ? Math.abs(c) : 0);

    const avgGain = gains.reduce((sum, g) => sum + g, 0) / period;
    const avgLoss = losses.reduce((sum, l) => sum + l, 0) / period;

    if (avgLoss === 0) {
      return 100;
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return Math.round(rsi * 100) / 100;
  }

  /**
   * Calculate MACD
   * @private
   */
  _calculateMACD(prices) {
    const ema12 = this._calculateEMA(prices, 12);
    const ema26 = this._calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;

    // For simplicity, we'll use a basic signal line calculation
    // In production, this would be a 9-period EMA of the MACD line
    const signalLine = macdLine * 0.9; // Simplified

    return {
      macdLine: Math.round(macdLine * 100) / 100,
      signalLine: Math.round(signalLine * 100) / 100,
      histogram: Math.round((macdLine - signalLine) * 100) / 100
    };
  }

  /**
   * Calculate Simple Moving Average
   * @private
   */
  _calculateSMA(prices, period) {
    if (prices.length < period) {
      period = prices.length;
    }

    const recentPrices = prices.slice(-period);
    const sum = recentPrices.reduce((acc, price) => acc + price, 0);
    return Math.round((sum / period) * 100) / 100;
  }

  /**
   * Calculate Exponential Moving Average
   * @private
   */
  _calculateEMA(prices, period) {
    if (prices.length < period) {
      return this._calculateSMA(prices, prices.length);
    }

    const multiplier = 2 / (period + 1);
    let ema = this._calculateSMA(prices.slice(0, period), period);

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return Math.round(ema * 100) / 100;
  }

  /**
   * Calculate Bollinger Bands
   * @private
   */
  _calculateBollingerBands(prices, period = 20, stdDev = 2) {
    const sma = this._calculateSMA(prices, period);
    const recentPrices = prices.slice(-Math.min(period, prices.length));

    // Calculate standard deviation
    const squaredDiffs = recentPrices.map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((sum, sq) => sum + sq, 0) / recentPrices.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: Math.round((sma + stdDev * standardDeviation) * 100) / 100,
      middle: sma,
      lower: Math.round((sma - stdDev * standardDeviation) * 100) / 100
    };
  }

  /**
   * Calculate volatility
   * @private
   */
  _calculateVolatility(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Calculate trend strength
   * @private
   */
  _calculateTrendStrength(prices) {
    if (prices.length < 2) {
      return 0;
    }

    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = (lastPrice - firstPrice) / firstPrice;

    return Math.round(change * 10000) / 100; // Percentage
  }

  /**
   * Determine signal type based on indicators
   * @private
   */
  _determineSignalType(indicators) {
    let buySignals = 0;
    let sellSignals = 0;

    // RSI signals
    if (indicators.rsi < 30) {
      buySignals += 2; // Oversold - strong buy signal
    } else if (indicators.rsi < 40) {
      buySignals += 1;
    } else if (indicators.rsi > 70) {
      sellSignals += 2; // Overbought - strong sell signal
    } else if (indicators.rsi > 60) {
      sellSignals += 1;
    }

    // MACD signals
    if (indicators.macd.histogram > 0) {
      buySignals += 1;
    } else if (indicators.macd.histogram < 0) {
      sellSignals += 1;
    }

    // Moving average crossover
    if (indicators.ema12 > indicators.ema26) {
      buySignals += 1;
    } else if (indicators.ema12 < indicators.ema26) {
      sellSignals += 1;
    }

    // Price vs SMA
    if (indicators.currentPrice > indicators.sma20) {
      buySignals += 1;
    } else if (indicators.currentPrice < indicators.sma20) {
      sellSignals += 1;
    }

    // Bollinger Bands
    if (indicators.currentPrice < indicators.bollingerBands.lower) {
      buySignals += 1; // Price below lower band - potential buy
    } else if (indicators.currentPrice > indicators.bollingerBands.upper) {
      sellSignals += 1; // Price above upper band - potential sell
    }

    // Determine final signal
    const signalDifference = buySignals - sellSignals;

    if (signalDifference >= 2) {
      return 'BUY';
    } else if (signalDifference <= -2) {
      return 'SELL';
    } else {
      return 'HOLD';
    }
  }

  /**
   * Calculate signal confidence
   * @private
   */
  _calculateSignalConfidence(indicators, signalType) {
    let confidence = 50; // Base confidence

    // RSI contribution
    if (signalType === 'BUY' && indicators.rsi < 30) {
      confidence += 15;
    } else if (signalType === 'SELL' && indicators.rsi > 70) {
      confidence += 15;
    } else if (signalType === 'BUY' && indicators.rsi < 40) {
      confidence += 10;
    } else if (signalType === 'SELL' && indicators.rsi > 60) {
      confidence += 10;
    }

    // MACD contribution
    if (signalType === 'BUY' && indicators.macd.histogram > 0) {
      confidence += 10;
    } else if (signalType === 'SELL' && indicators.macd.histogram < 0) {
      confidence += 10;
    }

    // Trend strength contribution
    if (signalType === 'BUY' && indicators.trendStrength > 5) {
      confidence += 10;
    } else if (signalType === 'SELL' && indicators.trendStrength < -5) {
      confidence += 10;
    }

    // Volatility penalty (high volatility reduces confidence)
    if (indicators.volatility > 0.05) {
      confidence -= 10;
    }

    // HOLD signals have lower confidence
    if (signalType === 'HOLD') {
      confidence = Math.min(confidence, 60);
    }

    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  /**
   * Calculate price targets (entry, target, stop-loss)
   * @private
   */
  _calculatePriceTargets(signalType, currentPrice, indicators) {
    const volatility = indicators.volatility;
    const atr = currentPrice * volatility; // Approximate ATR

    let entry, target, stopLoss;

    if (signalType === 'BUY') {
      entry = Math.round(currentPrice * 100) / 100;
      target = Math.round((currentPrice + atr * 2) * 100) / 100; // 2x ATR profit target
      stopLoss = Math.round((currentPrice - atr * 1.5) * 100) / 100; // 1.5x ATR stop loss
    } else if (signalType === 'SELL') {
      entry = Math.round(currentPrice * 100) / 100;
      target = Math.round((currentPrice - atr * 2) * 100) / 100; // 2x ATR profit target
      stopLoss = Math.round((currentPrice + atr * 1.5) * 100) / 100; // 1.5x ATR stop loss
    } else {
      // HOLD - no specific targets
      entry = Math.round(currentPrice * 100) / 100;
      target = Math.round(currentPrice * 100) / 100;
      stopLoss = Math.round(currentPrice * 100) / 100;
    }

    return {
      entry: Math.max(0, entry),
      target: Math.max(0, target),
      stopLoss: Math.max(0, stopLoss)
    };
  }

  /**
   * Generate reasoning for the signal
   * @private
   */
  _generateReasoning(signalType, indicators) {
    const reasons = [];

    if (signalType === 'BUY') {
      if (indicators.rsi < 30) {
        reasons.push('RSI indicates oversold conditions');
      } else if (indicators.rsi < 40) {
        reasons.push('RSI shows potential buying opportunity');
      }

      if (indicators.macd.histogram > 0) {
        reasons.push('MACD shows bullish momentum');
      }

      if (indicators.currentPrice < indicators.bollingerBands.lower) {
        reasons.push('Price is below lower Bollinger Band');
      }

      if (indicators.ema12 > indicators.ema26) {
        reasons.push('Short-term EMA is above long-term EMA');
      }

      if (indicators.trendStrength > 5) {
        reasons.push('Strong upward trend detected');
      }

      if (reasons.length === 0) {
        reasons.push('Multiple technical indicators suggest a buying opportunity');
      }
    } else if (signalType === 'SELL') {
      if (indicators.rsi > 70) {
        reasons.push('RSI indicates overbought conditions');
      } else if (indicators.rsi > 60) {
        reasons.push('RSI shows potential selling opportunity');
      }

      if (indicators.macd.histogram < 0) {
        reasons.push('MACD shows bearish momentum');
      }

      if (indicators.currentPrice > indicators.bollingerBands.upper) {
        reasons.push('Price is above upper Bollinger Band');
      }

      if (indicators.ema12 < indicators.ema26) {
        reasons.push('Short-term EMA is below long-term EMA');
      }

      if (indicators.trendStrength < -5) {
        reasons.push('Strong downward trend detected');
      }

      if (reasons.length === 0) {
        reasons.push('Multiple technical indicators suggest a selling opportunity');
      }
    } else {
      reasons.push('Technical indicators are mixed');
      reasons.push('Market conditions suggest waiting for clearer signals');
    }

    return reasons.join('. ') + '.';
  }

  /**
   * Calculate risk score
   * @private
   */
  _calculateRiskScore(indicators) {
    let riskScore = 50; // Base risk

    // High volatility increases risk
    if (indicators.volatility > 0.05) {
      riskScore += 20;
    } else if (indicators.volatility > 0.03) {
      riskScore += 10;
    }

    // Extreme RSI increases risk
    if (indicators.rsi > 80 || indicators.rsi < 20) {
      riskScore += 15;
    }

    // Price near Bollinger Band extremes increases risk
    const bandWidth = indicators.bollingerBands.upper - indicators.bollingerBands.lower;
    const pricePosition = (indicators.currentPrice - indicators.bollingerBands.lower) / bandWidth;
    
    if (pricePosition > 0.9 || pricePosition < 0.1) {
      riskScore += 10;
    }

    return Math.max(0, Math.min(100, Math.round(riskScore)));
  }

  /**
   * Format indicators for response
   * @private
   */
  _formatIndicators(indicators) {
    return [
      {
        name: 'RSI',
        value: indicators.rsi,
        interpretation: this._interpretRSI(indicators.rsi)
      },
      {
        name: 'MACD',
        value: indicators.macd.histogram,
        interpretation: this._interpretMACD(indicators.macd)
      },
      {
        name: 'SMA (20)',
        value: indicators.sma20,
        interpretation: this._interpretSMA(indicators.currentPrice, indicators.sma20)
      },
      {
        name: 'Bollinger Bands',
        value: indicators.currentPrice,
        interpretation: this._interpretBollingerBands(indicators.currentPrice, indicators.bollingerBands)
      }
    ];
  }

  /**
   * Interpret RSI
   * @private
   */
  _interpretRSI(rsi) {
    if (rsi < 30) {
      return 'Oversold - potential buy signal';
    } else if (rsi > 70) {
      return 'Overbought - potential sell signal';
    } else if (rsi < 50) {
      return 'Slightly bearish';
    } else if (rsi > 50) {
      return 'Slightly bullish';
    } else {
      return 'Neutral';
    }
  }

  /**
   * Interpret MACD
   * @private
   */
  _interpretMACD(macd) {
    if (macd.histogram > 0) {
      return 'Bullish momentum';
    } else if (macd.histogram < 0) {
      return 'Bearish momentum';
    } else {
      return 'Neutral momentum';
    }
  }

  /**
   * Interpret SMA
   * @private
   */
  _interpretSMA(currentPrice, sma) {
    const diff = ((currentPrice - sma) / sma) * 100;
    
    if (diff > 5) {
      return 'Price significantly above average - bullish';
    } else if (diff < -5) {
      return 'Price significantly below average - bearish';
    } else if (diff > 0) {
      return 'Price above average';
    } else if (diff < 0) {
      return 'Price below average';
    } else {
      return 'Price at average';
    }
  }

  /**
   * Interpret Bollinger Bands
   * @private
   */
  _interpretBollingerBands(currentPrice, bands) {
    if (currentPrice > bands.upper) {
      return 'Price above upper band - potentially overbought';
    } else if (currentPrice < bands.lower) {
      return 'Price below lower band - potentially oversold';
    } else if (currentPrice > bands.middle) {
      return 'Price in upper half of bands';
    } else if (currentPrice < bands.middle) {
      return 'Price in lower half of bands';
    } else {
      return 'Price at middle band';
    }
  }

  /**
   * Generate unique signal ID
   * @private
   */
  _generateSignalId(symbol, assetType) {
    const timestamp = Date.now();
    return `signal_${assetType}_${symbol}_${timestamp}`;
  }

  /**
   * Response for insufficient data
   * @private
   */
  _insufficientDataResponse(symbol, assetType) {
    return {
      id: this._generateSignalId(symbol, assetType),
      symbol,
      assetType,
      signalType: 'HOLD',
      confidence: 0,
      reasoning: 'Insufficient market data to generate reliable trading signal',
      priceTargets: {
        entry: 0,
        target: 0,
        stopLoss: 0
      },
      riskScore: 100,
      indicators: [],
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      dismissed: false,
      error: {
        code: 'INSUFFICIENT_DATA',
        message: 'Unable to generate reliable signal due to insufficient market data'
      }
    };
  }

  /**
   * Sort signals chronologically (newest first)
   * @param {Array} signals - Array of signal objects
   * @returns {Array} Sorted signals in descending order by timestamp
   */
  sortSignalsChronologically(signals) {
    if (!Array.isArray(signals)) {
      throw new Error('signals must be an array');
    }

    return [...signals].sort((a, b) => {
      const timeA = new Date(a.generatedAt).getTime();
      const timeB = new Date(b.generatedAt).getTime();
      return timeB - timeA; // Descending order (newest first)
    });
  }

  /**
   * Filter out dismissed signals
   * @param {Array} signals - Array of signal objects
   * @returns {Array} Signals that have not been dismissed
   */
  filterDismissedSignals(signals) {
    if (!Array.isArray(signals)) {
      throw new Error('signals must be an array');
    }

    return signals.filter(signal => !signal.dismissed);
  }
}

// Export singleton instance
const signalGeneratorService = new SignalGeneratorService();
export default signalGeneratorService;
