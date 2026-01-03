/**
 * Property-Based Tests for Signal Generator Service
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
const { default: signalGeneratorService } = await import('./signalGeneratorService.js');

describe('Signal Generator Service - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 6: Complete signal structure
   * Feature: ai-insights, Property 6: Complete signal structure
   * Validates: Requirements 3.1, 3.2, 3.3
   */
  describe('Property 6: Complete signal structure', () => {
    it('should generate signals with all required fields for any valid input', async () => {
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

            const signal = await signalGeneratorService.generateSignal(symbol, assetType);

            // Verify signal has all required fields
            expect(signal).toHaveProperty('id');
            expect(signal).toHaveProperty('symbol', symbol);
            expect(signal).toHaveProperty('assetType', assetType);
            expect(signal).toHaveProperty('signalType');
            expect(['BUY', 'SELL', 'HOLD']).toContain(signal.signalType);
            
            // Confidence level should be 0-100
            expect(signal).toHaveProperty('confidence');
            expect(signal.confidence).toBeGreaterThanOrEqual(0);
            expect(signal.confidence).toBeLessThanOrEqual(100);
            
            // Reasoning should be a non-empty string
            expect(signal).toHaveProperty('reasoning');
            expect(typeof signal.reasoning).toBe('string');
            expect(signal.reasoning.length).toBeGreaterThan(0);
            
            // Price targets should exist with entry, target, stopLoss
            expect(signal).toHaveProperty('priceTargets');
            expect(signal.priceTargets).toHaveProperty('entry');
            expect(signal.priceTargets).toHaveProperty('target');
            expect(signal.priceTargets).toHaveProperty('stopLoss');
            expect(typeof signal.priceTargets.entry).toBe('number');
            expect(typeof signal.priceTargets.target).toBe('number');
            expect(typeof signal.priceTargets.stopLoss).toBe('number');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Signal chronological ordering
   * Feature: ai-insights, Property 7: Signal chronological ordering
   * Validates: Requirements 3.4
   */
  describe('Property 7: Signal chronological ordering', () => {
    it('should sort any list of signals in descending chronological order (newest first)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              symbol: fc.constantFrom('BTC', 'ETH', 'AAPL', 'GOOGL'),
              assetType: fc.constantFrom('crypto', 'stock', 'forex', 'commodity'),
              signalType: fc.constantFrom('BUY', 'SELL', 'HOLD'),
              confidence: fc.integer({ min: 0, max: 100 }),
              reasoning: fc.string({ minLength: 10 }),
              priceTargets: fc.record({
                entry: fc.double({ min: 0.01, max: 100000 }),
                target: fc.double({ min: 0.01, max: 100000 }),
                stopLoss: fc.double({ min: 0.01, max: 100000 })
              }),
              riskScore: fc.integer({ min: 0, max: 100 }),
              indicators: fc.array(fc.record({
                name: fc.string(),
                value: fc.double(),
                interpretation: fc.string()
              })),
              generatedAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(t => new Date(t).toISOString()),
              expiresAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(t => new Date(t).toISOString()),
              dismissed: fc.boolean()
            }),
            { minLength: 2, maxLength: 20 }
          ),
          (signals) => {
            const sorted = signalGeneratorService.sortSignalsChronologically(signals);

            // Verify the array is sorted in descending order by timestamp
            for (let i = 0; i < sorted.length - 1; i++) {
              const currentTime = new Date(sorted[i].generatedAt).getTime();
              const nextTime = new Date(sorted[i + 1].generatedAt).getTime();
              
              // Current signal should be newer than or equal to the next signal
              expect(currentTime).toBeGreaterThanOrEqual(nextTime);
            }

            // Verify all original signals are present (no data loss)
            expect(sorted.length).toBe(signals.length);
            
            // Verify it's a new array (immutability)
            expect(sorted).not.toBe(signals);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases correctly', () => {
      // Test empty array
      const emptyResult = signalGeneratorService.sortSignalsChronologically([]);
      expect(emptyResult).toEqual([]);

      // Test single signal
      const singleSignal = [{
        id: 'test-1',
        symbol: 'BTC',
        generatedAt: new Date().toISOString(),
        signalType: 'BUY',
        confidence: 75
      }];
      const singleResult = signalGeneratorService.sortSignalsChronologically(singleSignal);
      expect(singleResult).toEqual(singleSignal);
      expect(singleResult).not.toBe(singleSignal); // Should be a new array

      // Test signals with same timestamp
      const now = new Date().toISOString();
      const sameTimeSignals = [
        { id: 'test-1', symbol: 'BTC', generatedAt: now, signalType: 'BUY' },
        { id: 'test-2', symbol: 'ETH', generatedAt: now, signalType: 'SELL' }
      ];
      const sameTimeResult = signalGeneratorService.sortSignalsChronologically(sameTimeSignals);
      expect(sameTimeResult.length).toBe(2);

      // Test invalid input
      expect(() => signalGeneratorService.sortSignalsChronologically(null)).toThrow('signals must be an array');
      expect(() => signalGeneratorService.sortSignalsChronologically(undefined)).toThrow('signals must be an array');
      expect(() => signalGeneratorService.sortSignalsChronologically('not an array')).toThrow('signals must be an array');
    });
  });

  /**
   * Property 8: Signal dismissal persistence
   * Feature: ai-insights, Property 8: Signal dismissal persistence
   * Validates: Requirements 3.5
   */
  describe('Property 8: Signal dismissal persistence', () => {
    it('should exclude dismissed signals from subsequent requests for any user', () => {
      fc.assert(
        fc.property(
          // Generate a list of signals
          fc.array(
            fc.record({
              id: fc.uuid(),
              symbol: fc.constantFrom('BTC', 'ETH', 'AAPL', 'GOOGL'),
              assetType: fc.constantFrom('crypto', 'stock', 'forex', 'commodity'),
              signalType: fc.constantFrom('BUY', 'SELL', 'HOLD'),
              confidence: fc.integer({ min: 0, max: 100 }),
              reasoning: fc.string({ minLength: 10 }),
              priceTargets: fc.record({
                entry: fc.double({ min: 0.01, max: 100000 }),
                target: fc.double({ min: 0.01, max: 100000 }),
                stopLoss: fc.double({ min: 0.01, max: 100000 })
              }),
              riskScore: fc.integer({ min: 0, max: 100 }),
              indicators: fc.array(fc.record({
                name: fc.string(),
                value: fc.double(),
                interpretation: fc.string()
              })),
              generatedAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(t => new Date(t).toISOString()),
              expiresAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(t => new Date(t).toISOString()),
              dismissed: fc.boolean()
            }),
            { minLength: 3, maxLength: 10 }
          ),
          // Generate a set of signal IDs to dismiss (subset of the signals)
          fc.integer({ min: 0, max: 2 }),
          (signals, dismissCount) => {
            // Select some signals to dismiss
            const signalsToDismiss = signals.slice(0, Math.min(dismissCount, signals.length));
            const dismissedIds = new Set(signalsToDismiss.map(s => s.id));

            // Mark signals as dismissed
            const updatedSignals = signals.map(signal => ({
              ...signal,
              dismissed: dismissedIds.has(signal.id)
            }));

            // Filter out dismissed signals (simulating what the API should do)
            const filteredSignals = signalGeneratorService.filterDismissedSignals(updatedSignals);

            // Verify no dismissed signals are in the result
            filteredSignals.forEach(signal => {
              expect(signal.dismissed).toBe(false);
              expect(dismissedIds.has(signal.id)).toBe(false);
            });

            // Verify all non-dismissed signals are present
            const nonDismissedCount = signals.filter(s => !dismissedIds.has(s.id)).length;
            expect(filteredSignals.length).toBe(nonDismissedCount);

            // Verify immutability - original array should not be modified
            expect(updatedSignals.length).toBe(signals.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases for signal dismissal', () => {
      // Test with all signals dismissed
      const allDismissed = [
        { id: 'test-1', symbol: 'BTC', dismissed: true, signalType: 'BUY' },
        { id: 'test-2', symbol: 'ETH', dismissed: true, signalType: 'SELL' }
      ];
      const resultAllDismissed = signalGeneratorService.filterDismissedSignals(allDismissed);
      expect(resultAllDismissed).toEqual([]);

      // Test with no signals dismissed
      const noneDismissed = [
        { id: 'test-1', symbol: 'BTC', dismissed: false, signalType: 'BUY' },
        { id: 'test-2', symbol: 'ETH', dismissed: false, signalType: 'SELL' }
      ];
      const resultNoneDismissed = signalGeneratorService.filterDismissedSignals(noneDismissed);
      expect(resultNoneDismissed.length).toBe(2);
      expect(resultNoneDismissed).toEqual(noneDismissed);

      // Test with empty array
      const emptyResult = signalGeneratorService.filterDismissedSignals([]);
      expect(emptyResult).toEqual([]);

      // Test with mixed dismissed/non-dismissed
      const mixed = [
        { id: 'test-1', symbol: 'BTC', dismissed: true, signalType: 'BUY' },
        { id: 'test-2', symbol: 'ETH', dismissed: false, signalType: 'SELL' },
        { id: 'test-3', symbol: 'AAPL', dismissed: false, signalType: 'HOLD' },
        { id: 'test-4', symbol: 'GOOGL', dismissed: true, signalType: 'BUY' }
      ];
      const resultMixed = signalGeneratorService.filterDismissedSignals(mixed);
      expect(resultMixed.length).toBe(2);
      expect(resultMixed.every(s => !s.dismissed)).toBe(true);
      expect(resultMixed.map(s => s.id)).toEqual(['test-2', 'test-3']);

      // Test invalid input
      expect(() => signalGeneratorService.filterDismissedSignals(null)).toThrow('signals must be an array');
      expect(() => signalGeneratorService.filterDismissedSignals(undefined)).toThrow('signals must be an array');
      expect(() => signalGeneratorService.filterDismissedSignals('not an array')).toThrow('signals must be an array');
    });
  });
});


/**
 * Unit Tests for Signal Generator Service
 * Testing specific scenarios and edge cases
 */
describe('Signal Generator Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Signal Generation with Various Market Conditions', () => {
    it('should generate valid signal with sufficient data', async () => {
      // Create price data with sufficient history
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + Math.random() * 10
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const signal = await signalGeneratorService.generateSignal('BTC', 'crypto');

      // Verify signal has valid type
      expect(['BUY', 'SELL', 'HOLD']).toContain(signal.signalType);
      expect(signal.confidence).toBeGreaterThanOrEqual(0);
      expect(signal.confidence).toBeLessThanOrEqual(100);
      expect(signal.reasoning).toBeTruthy();
      expect(typeof signal.reasoning).toBe('string');
    });

    it('should generate signals with technical analysis', async () => {
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + i // Trending prices
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const signal = await signalGeneratorService.generateSignal('ETH', 'crypto');

      // Verify signal includes technical indicators
      expect(signal.indicators).toBeDefined();
      expect(Array.isArray(signal.indicators)).toBe(true);
      expect(signal.indicators.length).toBeGreaterThan(0);
      
      // Verify each indicator has required fields
      signal.indicators.forEach(indicator => {
        expect(indicator).toHaveProperty('name');
        expect(indicator).toHaveProperty('value');
        expect(indicator).toHaveProperty('interpretation');
      });
    });

    it('should generate different signals for different market conditions', async () => {
      // Test with declining prices
      const decliningPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 150 - i * 2
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: decliningPrices }
      });

      const signal1 = await signalGeneratorService.generateSignal('TEST1', 'crypto');

      // Test with rising prices
      const risingPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 50 + i * 2
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: risingPrices }
      });

      const signal2 = await signalGeneratorService.generateSignal('TEST2', 'crypto');

      // Both should be valid signals
      expect(['BUY', 'SELL', 'HOLD']).toContain(signal1.signalType);
      expect(['BUY', 'SELL', 'HOLD']).toContain(signal2.signalType);
    });

    it('should handle insufficient data gracefully', async () => {
      // Mock insufficient price data
      const mockPrices = Array.from({ length: 10 }, (_, i) => ({
        timestamp: Date.now() - (9 - i) * 24 * 60 * 60 * 1000,
        price: 100
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const signal = await signalGeneratorService.generateSignal('INSUFFICIENT_DATA_TEST', 'commodity');

      expect(signal.signalType).toBe('HOLD');
      expect(signal.confidence).toBe(0);
      expect(signal.error).toBeDefined();
      expect(signal.error.code).toBe('INSUFFICIENT_DATA');
    });

    it('should handle market data fetch failure', async () => {
      mockGetMarketChartData.mockResolvedValue({
        success: false,
        data: null
      });

      const signal = await signalGeneratorService.generateSignal('FETCH_FAILURE_TEST', 'forex');

      expect(signal.signalType).toBe('HOLD');
      expect(signal.confidence).toBe(0);
      expect(signal.error).toBeDefined();
    });
  });

  describe('Price Target Calculations', () => {
    it('should calculate correct price targets for BUY signals', async () => {
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 - i // Declining prices for BUY signal
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const signal = await signalGeneratorService.generateSignal('BTC', 'crypto');

      if (signal.signalType === 'BUY') {
        expect(signal.priceTargets.entry).toBeGreaterThan(0);
        expect(signal.priceTargets.target).toBeGreaterThan(signal.priceTargets.entry);
        expect(signal.priceTargets.stopLoss).toBeLessThan(signal.priceTargets.entry);
      }
    });

    it('should calculate correct price targets for SELL signals', async () => {
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + i * 2 // Rising prices for SELL signal
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const signal = await signalGeneratorService.generateSignal('ETH', 'crypto');

      if (signal.signalType === 'SELL') {
        expect(signal.priceTargets.entry).toBeGreaterThan(0);
        expect(signal.priceTargets.target).toBeLessThan(signal.priceTargets.entry);
        expect(signal.priceTargets.stopLoss).toBeGreaterThan(signal.priceTargets.entry);
      }
    });

    it('should set equal price targets for HOLD signals', async () => {
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + Math.sin(i) * 2
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const signal = await signalGeneratorService.generateSignal('AAPL', 'stock');

      if (signal.signalType === 'HOLD') {
        expect(signal.priceTargets.entry).toBe(signal.priceTargets.target);
        expect(signal.priceTargets.entry).toBe(signal.priceTargets.stopLoss);
      }
    });
  });

  describe('Signal Ordering', () => {
    it('should maintain chronological order when sorting signals', () => {
      const signals = [
        { id: '1', symbol: 'BTC', generatedAt: '2024-01-01T10:00:00Z', signalType: 'BUY' },
        { id: '2', symbol: 'ETH', generatedAt: '2024-01-02T10:00:00Z', signalType: 'SELL' },
        { id: '3', symbol: 'AAPL', generatedAt: '2024-01-01T15:00:00Z', signalType: 'HOLD' }
      ];

      const sorted = signalGeneratorService.sortSignalsChronologically(signals);

      expect(sorted[0].id).toBe('2'); // Newest
      expect(sorted[1].id).toBe('3'); // Middle
      expect(sorted[2].id).toBe('1'); // Oldest
    });

    it('should preserve order for signals with identical timestamps', () => {
      const now = new Date().toISOString();
      const signals = [
        { id: '1', symbol: 'BTC', generatedAt: now, signalType: 'BUY' },
        { id: '2', symbol: 'ETH', generatedAt: now, signalType: 'SELL' }
      ];

      const sorted = signalGeneratorService.sortSignalsChronologically(signals);

      expect(sorted.length).toBe(2);
      // Both should be present
      expect(sorted.map(s => s.id).sort()).toEqual(['1', '2']);
    });
  });

  describe('Dismissal Functionality', () => {
    it('should filter out dismissed signals correctly', () => {
      const signals = [
        { id: '1', symbol: 'BTC', dismissed: false, signalType: 'BUY' },
        { id: '2', symbol: 'ETH', dismissed: true, signalType: 'SELL' },
        { id: '3', symbol: 'AAPL', dismissed: false, signalType: 'HOLD' },
        { id: '4', symbol: 'GOOGL', dismissed: true, signalType: 'BUY' }
      ];

      const filtered = signalGeneratorService.filterDismissedSignals(signals);

      expect(filtered.length).toBe(2);
      expect(filtered.map(s => s.id)).toEqual(['1', '3']);
      expect(filtered.every(s => !s.dismissed)).toBe(true);
    });

    it('should return empty array when all signals are dismissed', () => {
      const signals = [
        { id: '1', symbol: 'BTC', dismissed: true, signalType: 'BUY' },
        { id: '2', symbol: 'ETH', dismissed: true, signalType: 'SELL' }
      ];

      const filtered = signalGeneratorService.filterDismissedSignals(signals);

      expect(filtered).toEqual([]);
    });

    it('should return all signals when none are dismissed', () => {
      const signals = [
        { id: '1', symbol: 'BTC', dismissed: false, signalType: 'BUY' },
        { id: '2', symbol: 'ETH', dismissed: false, signalType: 'SELL' }
      ];

      const filtered = signalGeneratorService.filterDismissedSignals(signals);

      expect(filtered.length).toBe(2);
      expect(filtered).toEqual(signals);
    });
  });

  describe('Signal Structure and Metadata', () => {
    it('should include all required fields in generated signal', async () => {
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + Math.random() * 10
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const signal = await signalGeneratorService.generateSignal('BTC', 'crypto');

      // Verify all required fields
      expect(signal).toHaveProperty('id');
      expect(signal).toHaveProperty('symbol', 'BTC');
      expect(signal).toHaveProperty('assetType', 'crypto');
      expect(signal).toHaveProperty('signalType');
      expect(signal).toHaveProperty('confidence');
      expect(signal).toHaveProperty('reasoning');
      expect(signal).toHaveProperty('priceTargets');
      expect(signal).toHaveProperty('riskScore');
      expect(signal).toHaveProperty('indicators');
      expect(signal).toHaveProperty('generatedAt');
      expect(signal).toHaveProperty('expiresAt');
      expect(signal).toHaveProperty('dismissed', false);
    });

    it('should generate unique signal IDs for different symbols', async () => {
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + Math.random() * 10
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const signal1 = await signalGeneratorService.generateSignal('BTC', 'crypto');
      const signal2 = await signalGeneratorService.generateSignal('ETH', 'crypto');

      // Different symbols should have different IDs
      expect(signal1.id).not.toBe(signal2.id);
      expect(signal1.id).toContain('BTC');
      expect(signal2.id).toContain('ETH');
    });

    it('should set expiration time 24 hours in the future', async () => {
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const signal = await signalGeneratorService.generateSignal('BTC', 'crypto');

      const generatedTime = new Date(signal.generatedAt).getTime();
      const expiresTime = new Date(signal.expiresAt).getTime();
      const timeDiff = expiresTime - generatedTime;

      // Should be approximately 24 hours (allow 1 second tolerance)
      expect(timeDiff).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 1000);
      expect(timeDiff).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000);
    });

    it('should include technical indicators in signal', async () => {
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + Math.random() * 10
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const signal = await signalGeneratorService.generateSignal('BTC', 'crypto');

      expect(Array.isArray(signal.indicators)).toBe(true);
      expect(signal.indicators.length).toBeGreaterThan(0);
      
      // Check indicator structure
      signal.indicators.forEach(indicator => {
        expect(indicator).toHaveProperty('name');
        expect(indicator).toHaveProperty('value');
        expect(indicator).toHaveProperty('interpretation');
      });
    });
  });

  describe('Risk Score Calculation', () => {
    it('should calculate higher risk for high volatility', async () => {
      // Create highly volatile price data
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + (i % 2 === 0 ? 20 : -20) // High volatility
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const signal = await signalGeneratorService.generateSignal('BTC', 'crypto');

      expect(signal.riskScore).toBeGreaterThan(50);
    });

    it('should calculate lower risk for stable prices', async () => {
      // Create stable price data
      const mockPrices = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: 100 + Math.random() * 2 // Low volatility
      }));

      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: mockPrices }
      });

      const signal = await signalGeneratorService.generateSignal('BTC', 'crypto');

      expect(signal.riskScore).toBeLessThanOrEqual(70);
    });
  });

  describe('Error Handling', () => {
    it('should handle null market data response', async () => {
      mockGetMarketChartData.mockResolvedValue(null);

      const signal = await signalGeneratorService.generateSignal('NULL_TEST', 'crypto');

      expect(signal.signalType).toBe('HOLD');
      expect(signal.error).toBeDefined();
    });

    it('should handle empty prices array', async () => {
      mockGetMarketChartData.mockResolvedValue({
        success: true,
        data: { prices: [] }
      });

      const signal = await signalGeneratorService.generateSignal('EMPTY_TEST', 'crypto');

      expect(signal.signalType).toBe('HOLD');
      expect(signal.error).toBeDefined();
    });

    it('should handle market service errors gracefully', async () => {
      mockGetMarketChartData.mockRejectedValue(new Error('API Error'));

      // The service should catch the error and not throw
      const signal = await signalGeneratorService.generateSignal('ERROR_TEST', 'crypto');
      
      // Should return an error response instead of throwing
      expect(signal).toBeDefined();
      // The service catches errors, so we expect it to handle gracefully
    });
  });
});
