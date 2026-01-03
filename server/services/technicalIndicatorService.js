/**
 * Technical Indicator Service
 * Analyzes technical indicators with AI interpretation
 */

import AIInsightsService from './aiInsightsService.js';
import marketService from './marketService.js';

class TechnicalIndicatorService extends AIInsightsService {
  constructor() {
    super('TechnicalIndicatorService');
    this.CACHE_TTL = 300; // 5 minutes
  }

  /**
   * Analyze technical indicators for an asset
   * @param {string} symbol - Asset symbol
   * @param {string} assetType - crypto, stock, forex, commodity
   * @returns {Promise<Object>} Technical indicator analysis
   */
  async analyzeTechnicalIndicators(symbol, assetType) {
    try {
      this.validateParams({ symbol, assetType }, ['symbol', 'assetType']);

      const cacheKey = this.generateCacheKey('technical-indicators', { symbol, assetType });
      const cached = this.getCached(cacheKey);
      
      if (cached && !this.isStale(cached.analyzedAt, 5)) {
        this.logInfo(`Returning cached indicators for ${symbol}`);
        return cached;
      }

      const marketData = await this._fetchMarketData(symbol, assetType);
      
      if (!marketData || !marketData.prices || marketData.prices.length < 20) {
        return this._insufficientDataResponse(symbol, assetType);
      }

      const indicators = this._calculateIndicators(marketData.prices);
      const interpretations = this._generateInterpretations(indicators);
      const conflicts = this._detectConflicts(interpretations);
      const extremes = this._detectExtremes(indicators);

      const result = {
        symbol,
        assetType,
        indicators: [
          {
            name: 'RSI',
            value: indicators.rsi,
            interpretation: interpretations.rsi,
            isExtreme: extremes.rsi,
            ...(extremes.rsi && { signal: this._generateRSISignal(indicators.rsi) })
          },
          {
            name: 'MACD',
            value: indicators.macd.histogram,
            details: indicators.macd,
            interpretation: interpretations.macd,
            isExtreme: extremes.macd,
            ...(extremes.macd && { signal: this._generateMACDSignal(indicators.macd.histogram) })
          },
          {
            name: 'Moving Averages',
            value: indicators.currentPrice,
            details: {
              sma20: indicators.sma20,
              sma50: indicators.sma50,
              ema12: indicators.ema12,
              ema26: indicators.ema26
            },
            interpretation: interpretations.movingAverages,
            isExtreme: extremes.movingAverages,
            ...(extremes.movingAverages && { signal: extremes.movingAveragesSignal })
          },
          {
            name: 'Bollinger Bands',
            value: indicators.currentPrice,
            details: indicators.bollingerBands,
            interpretation: interpretations.bollingerBands,
            isExtreme: extremes.bollingerBands,
            ...(extremes.bollingerBands && { signal: this._generateBollingerSignal(indicators.currentPrice, indicators.bollingerBands) })
          }
        ],
        hasConflict: conflicts.hasConflict,
        ...(conflicts.hasConflict && {
          conflictExplanation: conflicts.explanation,
          overallAssessment: conflicts.overallAssessment
        }),
        analyzedAt: new Date().toISOString()
      };

      this.setCached(cacheKey, result, this.CACHE_TTL);
      return result;

    } catch (error) {
      this.logError('Error analyzing technical indicators', error);
      throw error;
    }
  }

  async _fetchMarketData(symbol, assetType) {
    try {
      const response = await marketService.getMarketChartData(assetType, symbol, 30);
      return response.success && response.data ? response.data : null;
    } catch (error) {
      this.logError(`Error fetching market data for ${symbol}`, error);
      return null;
    }
  }

  _calculateIndicators(prices) {
    const priceValues = prices.map(p => p.price);
    const n = priceValues.length;

    return {
      rsi: this._calculateRSI(priceValues, 14),
      macd: this._calculateMACD(priceValues),
      sma20: this._calculateSMA(priceValues, 20),
      sma50: this._calculateSMA(priceValues, Math.min(50, n)),
      ema12: this._calculateEMA(priceValues, 12),
      ema26: this._calculateEMA(priceValues, 26),
      bollingerBands: this._calculateBollingerBands(priceValues, 20, 2),
      currentPrice: priceValues[n - 1],
      volatility: this._calculateVolatility(priceValues)
    };
  }

  _calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains = changes.slice(-period).map(c => c > 0 ? c : 0);
    const losses = changes.slice(-period).map(c => c < 0 ? Math.abs(c) : 0);

    const avgGain = gains.reduce((sum, g) => sum + g, 0) / period;
    const avgLoss = losses.reduce((sum, l) => sum + l, 0) / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return Math.round((100 - (100 / (1 + rs))) * 100) / 100;
  }

  _calculateMACD(prices) {
    const ema12 = this._calculateEMA(prices, 12);
    const ema26 = this._calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    const signalLine = macdLine * 0.9;

    return {
      macdLine: Math.round(macdLine * 100) / 100,
      signalLine: Math.round(signalLine * 100) / 100,
      histogram: Math.round((macdLine - signalLine) * 100) / 100
    };
  }

  _calculateSMA(prices, period) {
    if (prices.length < period) period = prices.length;
    const recentPrices = prices.slice(-period);
    const sum = recentPrices.reduce((acc, price) => acc + price, 0);
    return Math.round((sum / period) * 100) / 100;
  }

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

  _calculateBollingerBands(prices, period = 20, stdDev = 2) {
    const sma = this._calculateSMA(prices, period);
    const recentPrices = prices.slice(-Math.min(period, prices.length));

    const squaredDiffs = recentPrices.map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((sum, sq) => sum + sq, 0) / recentPrices.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: Math.round((sma + stdDev * standardDeviation) * 100) / 100,
      middle: sma,
      lower: Math.round((sma - stdDev * standardDeviation) * 100) / 100
    };
  }

  _calculateVolatility(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  _generateInterpretations(indicators) {
    return {
      rsi: this._interpretRSI(indicators.rsi),
      macd: this._interpretMACD(indicators.macd),
      movingAverages: this._interpretMovingAverages(indicators),
      bollingerBands: this._interpretBollingerBands(indicators.currentPrice, indicators.bollingerBands)
    };
  }

  _interpretRSI(rsi) {
    if (rsi < 30) return 'Oversold conditions suggest potential buying opportunity';
    if (rsi > 70) return 'Overbought conditions suggest potential selling opportunity';
    if (rsi < 45) return 'Slightly bearish momentum';
    if (rsi > 55) return 'Slightly bullish momentum';
    return 'Neutral momentum, no clear directional bias';
  }

  _interpretMACD(macd) {
    if (macd.histogram > 0) return 'Bullish momentum as MACD is above signal line';
    if (macd.histogram < 0) return 'Bearish momentum as MACD is below signal line';
    return 'Neutral momentum';
  }

  _interpretMovingAverages(indicators) {
    const { currentPrice, sma20, ema12, ema26 } = indicators;
    const signals = [];

    if (ema12 > ema26) signals.push('bullish');
    else if (ema12 < ema26) signals.push('bearish');

    if (currentPrice > sma20) signals.push('above 20-day average');
    else signals.push('below 20-day average');

    const trend = signals.includes('bullish') ? 'Bullish' : signals.includes('bearish') ? 'Bearish' : 'Neutral';
    return `${trend} trend with price ${signals[signals.length - 1]}`;
  }

  _interpretBollingerBands(currentPrice, bands) {
    const position = (currentPrice - bands.lower) / (bands.upper - bands.lower);
    
    if (currentPrice > bands.upper) return 'Price above upper band suggests overbought conditions';
    if (currentPrice < bands.lower) return 'Price below lower band suggests oversold conditions';
    if (position > 0.7) return 'Price in upper band range, approaching resistance';
    if (position < 0.3) return 'Price in lower band range, approaching support';
    return 'Price trading within normal range';
  }

  _detectConflicts(interpretations) {
    const signals = [];
    
    if (interpretations.rsi.includes('Oversold') || interpretations.rsi.includes('bullish')) {
      signals.push('bullish');
    } else if (interpretations.rsi.includes('Overbought') || interpretations.rsi.includes('bearish')) {
      signals.push('bearish');
    }

    if (interpretations.macd.includes('Bullish')) signals.push('bullish');
    else if (interpretations.macd.includes('Bearish')) signals.push('bearish');

    if (interpretations.movingAverages.includes('Bullish')) signals.push('bullish');
    else if (interpretations.movingAverages.includes('Bearish')) signals.push('bearish');

    const bullishCount = signals.filter(s => s === 'bullish').length;
    const bearishCount = signals.filter(s => s === 'bearish').length;

    if (bullishCount > 0 && bearishCount > 0) {
      return {
        hasConflict: true,
        explanation: `Mixed signals detected: ${bullishCount} bullish and ${bearishCount} bearish indicators`,
        overallAssessment: bullishCount > bearishCount ? 'Cautiously bullish - proceed with caution due to mixed signals' : 
                          bearishCount > bullishCount ? 'Cautiously bearish - consider waiting for clearer confirmation' : 
                          'Neutral stance recommended - wait for clearer directional signals'
      };
    }

    return {
      hasConflict: false,
      explanation: 'Indicators are aligned',
      overallAssessment: bullishCount > bearishCount ? 'Bullish trend confirmed' : 
                        bearishCount > bullishCount ? 'Bearish trend confirmed' : 
                        'Neutral market conditions'
    };
  }

  _detectExtremes(indicators) {
    // Check for moving average crossover
    const { sma20, sma50 } = indicators;
    const crossoverStrength = Math.abs(sma20 - sma50);
    const isCrossoverSignificant = crossoverStrength > sma50 * 0.02; // 2% difference
    
    let movingAveragesSignal = null;
    if (isCrossoverSignificant) {
      if (sma20 > sma50) {
        movingAveragesSignal = 'Golden cross detected - bullish signal with short-term average above long-term';
      } else {
        movingAveragesSignal = 'Death cross detected - bearish signal with short-term average below long-term';
      }
    }

    return {
      rsi: indicators.rsi > 70 || indicators.rsi < 30,
      macd: Math.abs(indicators.macd.histogram) > 5,
      movingAverages: isCrossoverSignificant,
      movingAveragesSignal,
      bollingerBands: indicators.currentPrice > indicators.bollingerBands.upper || 
                      indicators.currentPrice < indicators.bollingerBands.lower
    };
  }

  _generateRSISignal(rsi) {
    if (rsi > 70) {
      return 'Overbought - potential sell signal';
    } else if (rsi < 30) {
      return 'Oversold - potential buy signal';
    }
    return '';
  }

  _generateMACDSignal(histogram) {
    if (histogram > 0) {
      return 'Strong bullish momentum - positive histogram indicates buying pressure';
    } else {
      return 'Strong bearish momentum - negative histogram indicates selling pressure';
    }
  }

  _generateBollingerSignal(currentPrice, bands) {
    if (currentPrice > bands.upper) {
      return 'Price above upper band - overbought signal, potential reversal';
    } else if (currentPrice < bands.lower) {
      return 'Price below lower band - oversold signal, potential bounce';
    }
    return '';
  }

  _insufficientDataResponse(symbol, assetType) {
    return {
      symbol,
      assetType,
      indicators: [],
      conflicts: { detected: false },
      analyzedAt: new Date().toISOString(),
      error: {
        code: 'INSUFFICIENT_DATA',
        message: 'Insufficient market data for technical analysis'
      }
    };
  }
}

const technicalIndicatorService = new TechnicalIndicatorService();
export default technicalIndicatorService;
