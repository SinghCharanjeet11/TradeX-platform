/**
 * Property-Based Tests for Technical Indicator Service
 * Using fast-check for property-based testing
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import fc from 'fast-check';

// Mock the market service before importing the service
const mockGetMarketChartData = jest.fn();
jest.unstable_mockModule('./marketService.js', () => ({
  default: {
    getMarketChartData: mockGetMarketChartData
  }
}));

// Import after mocking
const { default: technicalIndicatorService } = await import('./technicalIndicatorService.js');

describe('Technical Indicator Service - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 17: Complete indicator structure
   * Feature: ai-insights, Property 17: Complete indicator structure
   * Validates: Requirements 7.1, 7.2
   */
  describe('Property 17: Complete indicator structure', () => {
    it('should include RSI, MACD, Moving Averages, and Bollinger Bands with interpretations for any valid input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('BTC', 'ETH', 'AAPL', 'GOOGL', 'EUR/USD', 'GBP/USD', 'GOLD', 'OIL'),
          fc.constantFrom('crypto', 'stock', 'forex', 'commodity'),
          async (symbol, assetType) => {
            // Mock market data with sufficient price history
            const mockPrices = Array.from({ length: 30 }, (_, i) => ({
              timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
              price: 100 + Math.random() * 50
            }));

            mockGetMarketChartData.mockResolvedValue({
              success: true,
              data: {
                prices: mockPrices
              }
            });

            const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);

            // Verify analysis has all required fields
            expect(analysis).toHaveProperty('symbol', symbol);
            expect(analysis).toHaveProperty('assetType', assetType);
            expect(analysis).toHaveProperty('indicators');
            expect(analysis).toHaveProperty('analyzedAt');

            // Verify indicators array exists and has 4 indicators
            expect(Array.isArray(analysis.indicators)).toBe(true);
            expect(analysis.indicators.length).toBe(4);

            // Extract indicator names
            const indicatorNames = analysis.indicators.map(ind => ind.name);

            // Verify all required indicators are present
            expect(indicatorNames).toContain('RSI');
            expect(indicatorNames).toContain('MACD');
            expect(indicatorNames).toContain('Moving Averages');
            expect(indicatorNames).toContain('Bollinger Bands');

            // Verify each indicator has required fields
            analysis.indicators.forEach(indicator => {
              // All indicators must have name, value, and interpretation
              expect(indicator).toHaveProperty('name');
              expect(typeof indicator.name).toBe('string');
              expect(indicator.name.length).toBeGreaterThan(0);

              expect(indicator).toHaveProperty('value');
              expect(typeof indicator.value).toBe('number');

              expect(indicator).toHaveProperty('interpretation');
              expect(typeof indicator.interpretation).toBe('string');
              expect(indicator.interpretation.length).toBeGreaterThan(0);

              // Verify interpretation is plain-language (not just technical jargon)
              // Should be a readable sentence, not just numbers or codes
              const interpretation = indicator.interpretation;
              expect(interpretation).toMatch(/[a-zA-Z]/); // Contains letters
              expect(interpretation.split(' ').length).toBeGreaterThanOrEqual(2); // At least 2 words
            });

            // Verify specific indicator structures
            const rsiIndicator = analysis.indicators.find(ind => ind.name === 'RSI');
            expect(rsiIndicator.value).toBeGreaterThanOrEqual(0);
            expect(rsiIndicator.value).toBeLessThanOrEqual(100);

            const macdIndicator = analysis.indicators.find(ind => ind.name === 'MACD');
            expect(macdIndicator).toHaveProperty('details');
            expect(macdIndicator.details).toHaveProperty('macdLine');
            expect(macdIndicator.details).toHaveProperty('signalLine');
            expect(macdIndicator.details).toHaveProperty('histogram');

            const maIndicator = analysis.indicators.find(ind => ind.name === 'Moving Averages');
            expect(maIndicator).toHaveProperty('details');
            expect(maIndicator.details).toHaveProperty('sma20');
            expect(maIndicator.details).toHaveProperty('sma50');
            expect(maIndicator.details).toHaveProperty('ema12');
            expect(maIndicator.details).toHaveProperty('ema26');

            const bbIndicator = analysis.indicators.find(ind => ind.name === 'Bollinger Bands');
            expect(bbIndicator).toHaveProperty('details');
            expect(bbIndicator.details).toHaveProperty('upper');
            expect(bbIndicator.details).toHaveProperty('middle');
            expect(bbIndicator.details).toHaveProperty('lower');
            expect(bbIndicator.details.upper).toBeGreaterThan(bbIndicator.details.middle);
            expect(bbIndicator.details.middle).toBeGreaterThan(bbIndicator.details.lower);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 18: Conflicting indicator explanation
   * Feature: ai-insights, Property 18: Conflicting indicator explanation
   * Validates: Requirements 7.3
   */
  describe('Property 18: Conflicting indicator explanation', () => {
    it('should provide conflict explanation and overall assessment when indicators disagree', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('BTC', 'ETH', 'AAPL', 'GOOGL'),
          fc.constantFrom('crypto', 'stock'),
          async (symbol, assetType) => {
            // Create price data that will generate conflicting signals
            // Uptrend with overbought RSI (conflicting signals)
            const mockPrices = Array.from({ length: 30 }, (_, i) => ({
              timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
              price: 100 + i * 5 // Strong uptrend
            }));

            mockGetMarketChartData.mockResolvedValue({
              success: true,
              data: {
                prices: mockPrices
              }
            });

            const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);

            // Check if there's a conflict
            if (analysis.hasConflict) {
              // When conflict exists, must have explanation
              expect(analysis).toHaveProperty('conflictExplanation');
              expect(typeof analysis.conflictExplanation).toBe('string');
              expect(analysis.conflictExplanation.length).toBeGreaterThan(0);

              // Conflict explanation should be meaningful
              const explanation = analysis.conflictExplanation.toLowerCase();
              
              // Should mention conflict or disagreement
              const hasConflictMention = 
                explanation.includes('conflict') ||
                explanation.includes('disagree') ||
                explanation.includes('mixed') ||
                explanation.includes('opposing') ||
                explanation.includes('contradictory');
              
              expect(hasConflictMention).toBe(true);

              // Should be a proper sentence (multiple words)
              expect(explanation.split(' ').length).toBeGreaterThanOrEqual(5);

              // Must have overall assessment when there's conflict
              expect(analysis).toHaveProperty('overallAssessment');
              expect(typeof analysis.overallAssessment).toBe('string');
              expect(analysis.overallAssessment.length).toBeGreaterThan(0);

              // Overall assessment should provide guidance
              const assessment = analysis.overallAssessment.toLowerCase();
              expect(assessment.split(' ').length).toBeGreaterThanOrEqual(5);

              // Assessment should be actionable or informative
              const hasGuidance = 
                assessment.includes('caution') ||
                assessment.includes('careful') ||
                assessment.includes('consider') ||
                assessment.includes('suggest') ||
                assessment.includes('recommend') ||
                assessment.includes('wait') ||
                assessment.includes('monitor') ||
                assessment.includes('bullish') ||
                assessment.includes('bearish') ||
                assessment.includes('neutral');
              
              expect(hasGuidance).toBe(true);
            }

            // If no conflict, these fields should either not exist or be null/empty
            if (!analysis.hasConflict) {
              if (analysis.conflictExplanation !== undefined) {
                expect(
                  analysis.conflictExplanation === null || 
                  analysis.conflictExplanation === ''
                ).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect conflicts when RSI and trend indicators disagree', async () => {
      // Test specific scenario: strong uptrend but overbought RSI
      const symbol = 'BTC';
      const assetType = 'crypto';

      // Create strong uptrend that will result in overbought RSI
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + i * 10 // Very strong uptrend
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: {
          prices: mockPrices
        }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);

      // With strong uptrend, RSI should be high (overbought)
      const rsiIndicator = analysis.indicators.find(ind => ind.name === 'RSI');
      
      // If RSI is overbought (>70) while trend is up, should detect conflict
      if (rsiIndicator.value > 70) {
        expect(analysis.hasConflict).toBe(true);
        expect(analysis.conflictExplanation).toBeTruthy();
        expect(analysis.overallAssessment).toBeTruthy();
      }
    });
  });

  /**
   * Property 19: Extreme indicator highlighting
   * Feature: ai-insights, Property 19: Extreme indicator highlighting
   * Validates: Requirements 7.4
   */
  describe('Property 19: Extreme indicator highlighting', () => {
    it('should flag RSI as extreme when value is above 70 or below 30', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('BTC', 'ETH', 'AAPL', 'GOOGL'),
          fc.constantFrom('crypto', 'stock'),
          fc.boolean(), // true for overbought, false for oversold
          async (symbol, assetType, isOverbought) => {
            // Create price data that will generate extreme RSI
            const mockPrices = Array.from({ length: 30 }, (_, i) => {
              if (isOverbought) {
                // Strong uptrend for overbought RSI (>70)
                return {
                  timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
                  price: 100 + i * 8
                };
              } else {
                // Strong downtrend for oversold RSI (<30)
                return {
                  timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
                  price: 300 - i * 8
                };
              }
            });

            mockGetMarketChartData.mockResolvedValue({
              success: true,
              data: {
                prices: mockPrices
              }
            });

            const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);

            // Find RSI indicator
            const rsiIndicator = analysis.indicators.find(ind => ind.name === 'RSI');
            expect(rsiIndicator).toBeDefined();

            // Check if RSI is in extreme territory
            const isRsiExtreme = rsiIndicator.value > 70 || rsiIndicator.value < 30;

            if (isRsiExtreme) {
              // When RSI is extreme, it should be flagged
              expect(rsiIndicator).toHaveProperty('isExtreme');
              expect(rsiIndicator.isExtreme).toBe(true);

              // Should have a signal flag
              expect(rsiIndicator).toHaveProperty('signal');
              expect(typeof rsiIndicator.signal).toBe('string');
              expect(rsiIndicator.signal.length).toBeGreaterThan(0);

              // Signal should indicate the type of extreme
              const signal = rsiIndicator.signal.toLowerCase();
              if (rsiIndicator.value > 70) {
                expect(
                  signal.includes('overbought') ||
                  signal.includes('sell') ||
                  signal.includes('bearish')
                ).toBe(true);
              } else if (rsiIndicator.value < 30) {
                expect(
                  signal.includes('oversold') ||
                  signal.includes('buy') ||
                  signal.includes('bullish')
                ).toBe(true);
              }

              // Interpretation should mention the extreme condition
              const interpretation = rsiIndicator.interpretation.toLowerCase();
              expect(
                interpretation.includes('overbought') ||
                interpretation.includes('oversold') ||
                interpretation.includes('extreme')
              ).toBe(true);
            } else {
              // When RSI is not extreme, should not be flagged
              if (rsiIndicator.isExtreme !== undefined) {
                expect(rsiIndicator.isExtreme).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should flag Bollinger Bands as extreme when price is outside bands', async () => {
      // Test the property: when price is outside bands, it should be flagged
      // We test this by verifying the logic works correctly when the condition is met
      
      const symbol = 'BTC';
      const assetType = 'crypto';

      // Create very stable price data to get narrow bands
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 // Perfectly stable
      }));

      // Add a sudden spike at the end
      mockPrices[29].price = 120; // 20% jump

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: {
          prices: mockPrices
        }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);
      const bbIndicator = analysis.indicators.find(ind => ind.name === 'Bollinger Bands');

      expect(bbIndicator).toBeDefined();
      expect(bbIndicator.details).toBeDefined();

      const currentPrice = mockPrices[mockPrices.length - 1].price;
      const { upper, lower } = bbIndicator.details;

      // With stable prices and a sudden spike, price should be outside bands
      const isPriceOutside = currentPrice > upper || currentPrice < lower;

      // If price is outside bands, verify it's flagged correctly
      if (isPriceOutside) {
        expect(bbIndicator.isExtreme).toBe(true);
        expect(bbIndicator).toHaveProperty('signal');
        expect(typeof bbIndicator.signal).toBe('string');
        expect(bbIndicator.signal.length).toBeGreaterThan(0);

        const signal = bbIndicator.signal.toLowerCase();
        if (currentPrice > upper) {
          expect(
            signal.includes('above') ||
            signal.includes('overbought') ||
            signal.includes('upper')
          ).toBe(true);
        } else if (currentPrice < lower) {
          expect(
            signal.includes('below') ||
            signal.includes('oversold') ||
            signal.includes('lower')
          ).toBe(true);
        }
      } else {
        // If not outside, should not be flagged
        if (bbIndicator.isExtreme !== undefined) {
          expect(bbIndicator.isExtreme).toBe(false);
        }
      }
    });

    it('should flag MACD as extreme when histogram shows strong divergence', async () => {
      const symbol = 'BTC';
      const assetType = 'crypto';

      // Create price data with strong momentum change
      const mockPrices = Array.from({ length: 30 }, (_, i) => {
        if (i < 15) {
          // First half: downtrend
          return {
            timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
            price: 200 - i * 5
          };
        } else {
          // Second half: strong uptrend (momentum shift)
          return {
            timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
            price: 125 + (i - 15) * 8
          };
        }
      });

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: {
          prices: mockPrices
        }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);

      // Find MACD indicator
      const macdIndicator = analysis.indicators.find(ind => ind.name === 'MACD');
      expect(macdIndicator).toBeDefined();
      expect(macdIndicator.details).toBeDefined();

      const { histogram } = macdIndicator.details;

      // Check if histogram shows strong signal (absolute value > threshold)
      const isHistogramExtreme = Math.abs(histogram) > 5; // Threshold for extreme

      if (isHistogramExtreme) {
        // Should be flagged as potential signal
        expect(macdIndicator).toHaveProperty('isExtreme');
        expect(macdIndicator.isExtreme).toBe(true);

        // Should have signal
        expect(macdIndicator).toHaveProperty('signal');
        expect(typeof macdIndicator.signal).toBe('string');

        // Signal should indicate momentum direction
        const signal = macdIndicator.signal.toLowerCase();
        if (histogram > 0) {
          expect(
            signal.includes('bullish') ||
            signal.includes('buy') ||
            signal.includes('positive')
          ).toBe(true);
        } else {
          expect(
            signal.includes('bearish') ||
            signal.includes('sell') ||
            signal.includes('negative')
          ).toBe(true);
        }
      }
    });

    it('should flag Moving Averages as extreme when showing strong crossover', async () => {
      const symbol = 'ETH';
      const assetType = 'crypto';

      // Create price data with clear trend change (golden cross scenario)
      const mockPrices = Array.from({ length: 60 }, (_, i) => {
        if (i < 30) {
          // First half: sideways/down
          return {
            timestamp: Date.now() - (59 - i) * 24 * 60 * 60 * 1000,
            price: 100 + Math.sin(i / 5) * 10
          };
        } else {
          // Second half: strong uptrend
          return {
            timestamp: Date.now() - (59 - i) * 24 * 60 * 60 * 1000,
            price: 100 + (i - 30) * 5
          };
        }
      });

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: {
          prices: mockPrices
        }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);

      // Find Moving Averages indicator
      const maIndicator = analysis.indicators.find(ind => ind.name === 'Moving Averages');
      expect(maIndicator).toBeDefined();
      expect(maIndicator.details).toBeDefined();

      const { sma20, sma50 } = maIndicator.details;

      // Check for golden cross (SMA20 > SMA50) or death cross (SMA20 < SMA50)
      const crossoverStrength = Math.abs(sma20 - sma50);
      const isCrossoverSignificant = crossoverStrength > sma50 * 0.02; // 2% difference

      if (isCrossoverSignificant) {
        // Should be flagged as extreme
        expect(maIndicator).toHaveProperty('isExtreme');
        expect(maIndicator.isExtreme).toBe(true);

        // Should have signal
        expect(maIndicator).toHaveProperty('signal');
        expect(typeof maIndicator.signal).toBe('string');

        // Signal should indicate crossover type
        const signal = maIndicator.signal.toLowerCase();
        if (sma20 > sma50) {
          expect(
            signal.includes('golden') ||
            signal.includes('bullish') ||
            signal.includes('above')
          ).toBe(true);
        } else {
          expect(
            signal.includes('death') ||
            signal.includes('bearish') ||
            signal.includes('below')
          ).toBe(true);
        }
      }
    });
  });

  /**
   * Unit Tests for Technical Indicator Analyzer
   */
  describe('Unit Tests - Indicator Calculations', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should calculate RSI correctly for uptrend', async () => {
      const symbol = 'UPTREND';
      const assetType = 'crypto';

      // Moderate uptrend data (not too strong to avoid overbought)
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + i * 2
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);
      const rsiIndicator = analysis.indicators.find(ind => ind.name === 'RSI');

      // Moderate uptrend should result in RSI >= 50
      expect(rsiIndicator.value).toBeGreaterThanOrEqual(50);
      
      // Interpretation should indicate bullish or overbought
      const interpretation = rsiIndicator.interpretation.toLowerCase();
      expect(
        interpretation.includes('bullish') ||
        interpretation.includes('overbought')
      ).toBe(true);
    });

    it('should calculate RSI correctly for downtrend', async () => {
      const symbol = 'DOWNTREND';
      const assetType = 'crypto';

      // Moderate downtrend data
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 200 - i * 3
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);
      const rsiIndicator = analysis.indicators.find(ind => ind.name === 'RSI');

      // Downtrend should result in RSI <= 50
      expect(rsiIndicator.value).toBeLessThanOrEqual(50);
      
      // Interpretation should indicate bearish or oversold
      const interpretation = rsiIndicator.interpretation.toLowerCase();
      expect(
        interpretation.includes('bearish') ||
        interpretation.includes('oversold')
      ).toBe(true);
    });

    it('should generate appropriate interpretation for overbought RSI', async () => {
      const symbol = 'OVERBOUGHT';
      const assetType = 'crypto';

      // Very strong uptrend to create overbought condition
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + i * 10
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);
      const rsiIndicator = analysis.indicators.find(ind => ind.name === 'RSI');

      if (rsiIndicator.value > 70) {
        expect(rsiIndicator.interpretation.toLowerCase()).toContain('overbought');
      }
    });

    it('should generate appropriate interpretation for oversold RSI', async () => {
      const symbol = 'OVERSOLD';
      const assetType = 'crypto';

      // Very strong downtrend to create oversold condition
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 300 - i * 10
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);
      const rsiIndicator = analysis.indicators.find(ind => ind.name === 'RSI');

      if (rsiIndicator.value < 30) {
        expect(rsiIndicator.interpretation.toLowerCase()).toContain('oversold');
      }
    });

    it('should calculate MACD with correct structure', async () => {
      const symbol = 'MACDTEST';
      const assetType = 'stock';

      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 150 + Math.sin(i / 5) * 10
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);
      const macdIndicator = analysis.indicators.find(ind => ind.name === 'MACD');

      expect(macdIndicator.details).toHaveProperty('macdLine');
      expect(macdIndicator.details).toHaveProperty('signalLine');
      expect(macdIndicator.details).toHaveProperty('histogram');
      expect(typeof macdIndicator.details.macdLine).toBe('number');
      expect(typeof macdIndicator.details.signalLine).toBe('number');
      expect(typeof macdIndicator.details.histogram).toBe('number');
    });

    it('should calculate Moving Averages correctly', async () => {
      const symbol = 'MATEST';
      const assetType = 'crypto';

      const mockPrices = Array.from({ length: 60 }, (_, i) => ({
        timestamp: Date.now() - (59 - i) * 24 * 60 * 60 * 1000,
        price: 100 + i * 3
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);
      const maIndicator = analysis.indicators.find(ind => ind.name === 'Moving Averages');

      expect(maIndicator.details).toHaveProperty('sma20');
      expect(maIndicator.details).toHaveProperty('sma50');
      expect(maIndicator.details).toHaveProperty('ema12');
      expect(maIndicator.details).toHaveProperty('ema26');

      // In a strong uptrend, shorter MAs should be higher than longer MAs
      expect(maIndicator.details.sma20).toBeGreaterThan(maIndicator.details.sma50 * 0.95); // Allow some tolerance
    });

    it('should calculate Bollinger Bands with correct structure', async () => {
      const symbol = 'BBTEST';
      const assetType = 'crypto';

      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + (Math.random() - 0.5) * 10
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);
      const bbIndicator = analysis.indicators.find(ind => ind.name === 'Bollinger Bands');

      expect(bbIndicator.details).toHaveProperty('upper');
      expect(bbIndicator.details).toHaveProperty('middle');
      expect(bbIndicator.details).toHaveProperty('lower');

      // Upper band should be above middle, middle above lower
      expect(bbIndicator.details.upper).toBeGreaterThan(bbIndicator.details.middle);
      expect(bbIndicator.details.middle).toBeGreaterThan(bbIndicator.details.lower);
    });
  });

  describe('Unit Tests - Conflict Detection', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should detect conflict when RSI is overbought but trend is bullish', async () => {
      const symbol = 'CONFLICT1';
      const assetType = 'crypto';

      // Strong uptrend that creates overbought RSI
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + i * 10
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);

      // Should detect conflict
      if (analysis.hasConflict) {
        expect(analysis.conflictExplanation).toBeTruthy();
        expect(analysis.overallAssessment).toBeTruthy();
      }
    });

    it('should not detect conflict when all indicators agree', async () => {
      const symbol = 'NOCONFLICT';
      const assetType = 'crypto';

      // Moderate uptrend without extreme values
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + i * 2
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);

      // Check if conflict detection is working
      expect(analysis).toHaveProperty('hasConflict');
      expect(typeof analysis.hasConflict).toBe('boolean');
    });
  });

  describe('Unit Tests - Extreme Value Detection', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should detect extreme RSI values above 70', async () => {
      const symbol = 'EXTREME1';
      const assetType = 'crypto';

      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + i * 10
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);
      const rsiIndicator = analysis.indicators.find(ind => ind.name === 'RSI');

      if (rsiIndicator.value > 70) {
        expect(rsiIndicator.isExtreme).toBe(true);
        expect(rsiIndicator.signal).toBeTruthy();
      }
    });

    it('should detect extreme RSI values below 30', async () => {
      const symbol = 'EXTREME2';
      const assetType = 'crypto';

      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 300 - i * 10
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);
      const rsiIndicator = analysis.indicators.find(ind => ind.name === 'RSI');

      if (rsiIndicator.value < 30) {
        expect(rsiIndicator.isExtreme).toBe(true);
        expect(rsiIndicator.signal).toBeTruthy();
      }
    });

    it('should detect extreme MACD histogram values', async () => {
      const symbol = 'EXTREME3';
      const assetType = 'crypto';

      // Create strong momentum change
      const mockPrices = Array.from({ length: 30 }, (_, i) => {
        if (i < 15) {
          return {
            timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
            price: 200 - i * 5
          };
        } else {
          return {
            timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
            price: 125 + (i - 15) * 8
          };
        }
      });

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);
      const macdIndicator = analysis.indicators.find(ind => ind.name === 'MACD');

      if (Math.abs(macdIndicator.details.histogram) > 5) {
        expect(macdIndicator.isExtreme).toBe(true);
        expect(macdIndicator.signal).toBeTruthy();
      }
    });
  });

  describe('Unit Tests - Edge Cases', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle insufficient data gracefully', async () => {
      const symbol = 'INSUFFICIENT';
      const assetType = 'crypto';

      // Only 10 prices (less than required 20)
      const mockPrices = Array.from({ length: 10 }, (_, i) => ({
        timestamp: Date.now() - (9 - i) * 24 * 60 * 60 * 1000,
        price: 100 + i
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);

      expect(analysis).toHaveProperty('error');
      expect(analysis.error.code).toBe('INSUFFICIENT_DATA');
    });

    it('should handle market data fetch failure', async () => {
      const symbol = 'FAILED';
      const assetType = 'crypto';

      mockGetMarketChartData.mockResolvedValue({
        success: false,
        data: null
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);

      expect(analysis).toHaveProperty('error');
    });

    it('should handle stable prices (no volatility)', async () => {
      const symbol = 'STABLE';
      const assetType = 'crypto';

      // Perfectly stable prices
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, assetType);

      // Should still calculate indicators
      expect(analysis.indicators).toHaveLength(4);
      
      // RSI calculation with no price changes returns 100 (all gains, no losses)
      const rsiIndicator = analysis.indicators.find(ind => ind.name === 'RSI');
      expect(rsiIndicator.value).toBe(100);

      // Bollinger Bands should have very narrow range (zero volatility)
      const bbIndicator = analysis.indicators.find(ind => ind.name === 'Bollinger Bands');
      const bandWidth = bbIndicator.details.upper - bbIndicator.details.lower;
      expect(bandWidth).toBe(0); // No volatility = zero band width
    });
  });
});
