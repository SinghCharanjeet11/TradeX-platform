import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import fc from 'fast-check';

// Mock dependencies before importing
const mockGetPortfolio = jest.fn();
const mockGetTopGainers = jest.fn();
const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();

jest.unstable_mockModule('./portfolioService.js', () => ({
  default: {
    getPortfolio: mockGetPortfolio
  }
}));

jest.unstable_mockModule('./marketService.js', () => ({
  default: {
    getTopGainers: mockGetTopGainers
  }
}));

jest.unstable_mockModule('./cacheService.js', () => ({
  default: {
    get: mockCacheGet,
    set: mockCacheSet
  }
}));

// Import after mocking
const { default: recommendationService } = await import('./recommendationService.js');

describe('RecommendationService', () => {
  beforeEach(() => {
    mockGetPortfolio.mockClear();
    mockGetTopGainers.mockClear();
    mockCacheGet.mockClear();
    mockCacheSet.mockClear();
    
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(true);
  });

  describe('Property Tests', () => {
    /**
     * Property 12: Recommendation count bounds
     * Feature: ai-insights, Property 12: Recommendation count bounds
     * Validates: Requirements 5.3
     * 
     * For any personalized recommendation response, the number of recommendations 
     * should be at least 3 and at most 10
     */
    test('Property 12: Recommendation count bounds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }), // userId
          fc.integer({ min: 1, max: 20 }), // requested limit
          async (userId, requestedLimit) => {
            // Mock portfolio with varying holdings
            const holdingsCount = userId % 5; // 0-4 holdings
            const mockHoldings = Array.from({ length: holdingsCount }, (_, i) => ({
              id: i + 1,
              symbol: `ASSET${i + 1}`,
              assetType: ['crypto', 'stock', 'forex'][i % 3],
              quantity: 10,
              currentValue: 1000,
              profitLoss: (i % 2 === 0) ? 100 : -50
            }));

            mockGetPortfolio.mockResolvedValue({
              holdings: mockHoldings
            });

            // Mock market data
            mockGetTopGainers.mockResolvedValue([
              {
                symbol: 'BTC',
                name: 'Bitcoin',
                price: 50000,
                change24h: 5.5,
                volume: 1000000
              }
            ]);

            // Generate recommendations
            const recommendations = await recommendationService.generateRecommendations(
              userId,
              requestedLimit
            );

            // Verify count bounds: at least 3, at most 10
            expect(recommendations.length).toBeGreaterThanOrEqual(3);
            expect(recommendations.length).toBeLessThanOrEqual(10);

            // Verify each recommendation has required structure
            recommendations.forEach(rec => {
              expect(rec).toHaveProperty('symbol');
              expect(rec).toHaveProperty('assetType');
              expect(rec).toHaveProperty('reason');
              expect(rec).toHaveProperty('title');
              expect(rec).toHaveProperty('description');
              expect(rec).toHaveProperty('confidence');
              expect(rec).toHaveProperty('actionType');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 13: Recommendation tracking
     * Feature: ai-insights, Property 13: Recommendation tracking
     * Validates: Requirements 5.4
     * 
     * For any recommendation that is acted upon, the system should record 
     * the action and outcome for future learning
     */
    test('Property 13: Recommendation tracking', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }), // userId
          fc.string({ minLength: 1, maxLength: 10 }), // symbol
          fc.constantFrom('viewed', 'added_to_watchlist', 'purchased', 'dismissed'), // action
          fc.option(fc.record({
            success: fc.boolean(),
            value: fc.float({ min: 0, max: 10000 })
          }), { nil: null }), // outcome
          async (userId, symbol, action, outcome) => {
            // Track the recommendation action
            const result = await recommendationService.trackRecommendationAction(
              userId,
              symbol,
              action,
              outcome
            );

            // Verify tracking data structure
            if (result) {
              expect(result).toHaveProperty('userId', userId);
              expect(result).toHaveProperty('symbol', symbol);
              expect(result).toHaveProperty('action', action);
              expect(result).toHaveProperty('outcome', outcome);
              expect(result).toHaveProperty('timestamp');
              expect(result.timestamp).toBeInstanceOf(Date);
            }

            // Tracking should never throw errors (fail silently)
            // This is verified by the test not throwing
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    describe('generateRecommendations', () => {
      test('should generate recommendations for user with portfolio', async () => {
        const userId = 1;
        const mockPortfolio = {
          holdings: [
            {
              symbol: 'BTC',
              assetType: 'crypto',
              quantity: 1,
              currentValue: 50000,
              profitLoss: 5000
            }
          ]
        };

        mockGetPortfolio.mockResolvedValue(mockPortfolio);
        mockGetTopGainers.mockResolvedValue([
          {
            symbol: 'ETH',
            name: 'Ethereum',
            price: 3000,
            change24h: 3.5,
            volume: 500000
          }
        ]);

        const recommendations = await recommendationService.generateRecommendations(userId, 5);

        expect(recommendations).toBeDefined();
        expect(Array.isArray(recommendations)).toBe(true);
        expect(recommendations.length).toBeGreaterThanOrEqual(3);
        expect(recommendations.length).toBeLessThanOrEqual(10);
      });

      test('should generate general recommendations for new users', async () => {
        const userId = 2;
        
        mockGetPortfolio.mockResolvedValue({
          holdings: []
        });

        mockGetTopGainers.mockResolvedValue([
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 50000,
            change24h: 5.5,
            volume: 1000000
          }
        ]);

        const recommendations = await recommendationService.generateRecommendations(userId, 5);

        expect(recommendations).toBeDefined();
        expect(recommendations.length).toBeGreaterThanOrEqual(3);
        expect(recommendations.length).toBeLessThanOrEqual(10);
        
        // Should include general market recommendations
        const hasGeneralRec = recommendations.some(
          rec => rec.reason === 'trending' || rec.reason === 'diversification'
        );
        expect(hasGeneralRec).toBe(true);
      });

      test('should respect count limits', async () => {
        const userId = 3;
        
        mockGetPortfolio.mockResolvedValue({
          holdings: []
        });

        mockGetTopGainers.mockResolvedValue([
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 50000,
            change24h: 5.5,
            volume: 1000000
          }
        ]);

        // Request 15 recommendations (above max)
        const recommendations = await recommendationService.generateRecommendations(userId, 15);

        // Should cap at 10
        expect(recommendations.length).toBeLessThanOrEqual(10);
      });

      test('should ensure minimum of 3 recommendations', async () => {
        const userId = 4;
        
        mockGetPortfolio.mockResolvedValue({
          holdings: []
        });

        // Mock empty market data
        mockGetTopGainers.mockResolvedValue([]);

        const recommendations = await recommendationService.generateRecommendations(userId, 1);

        // Should have at least 3 even if requested 1
        expect(recommendations.length).toBeGreaterThanOrEqual(3);
      });

      test('should use cache when available', async () => {
        const userId = 5;
        const cachedRecommendations = [
          {
            symbol: 'BTC',
            assetType: 'crypto',
            reason: 'cached',
            title: 'Cached recommendation',
            description: 'From cache',
            confidence: 80,
            actionType: 'explore',
            metadata: {}
          },
          {
            symbol: 'ETH',
            assetType: 'crypto',
            reason: 'cached',
            title: 'Cached recommendation 2',
            description: 'From cache',
            confidence: 75,
            actionType: 'explore',
            metadata: {}
          },
          {
            symbol: 'ADA',
            assetType: 'crypto',
            reason: 'cached',
            title: 'Cached recommendation 3',
            description: 'From cache',
            confidence: 70,
            actionType: 'explore',
            metadata: {}
          }
        ];

        mockCacheGet.mockResolvedValue(cachedRecommendations);

        const recommendations = await recommendationService.generateRecommendations(userId, 5);

        expect(recommendations).toEqual(cachedRecommendations);
        expect(mockGetPortfolio).not.toHaveBeenCalled();
      });

      test('should generate diversification recommendations', async () => {
        const userId = 6;
        const mockPortfolio = {
          holdings: [
            {
              symbol: 'BTC',
              assetType: 'crypto',
              quantity: 1,
              currentValue: 50000,
              profitLoss: 5000
            },
            {
              symbol: 'ETH',
              assetType: 'crypto',
              quantity: 10,
              currentValue: 30000,
              profitLoss: 3000
            }
          ]
        };

        mockGetPortfolio.mockResolvedValue(mockPortfolio);
        mockGetTopGainers.mockResolvedValue([
          {
            symbol: 'AAPL',
            name: 'Apple',
            price: 150,
            change24h: 2.5,
            volume: 100000
          }
        ]);

        const recommendations = await recommendationService.generateRecommendations(userId, 5);

        // Should suggest diversification into other asset types
        const hasDiversification = recommendations.some(
          rec => rec.reason === 'diversification'
        );
        expect(hasDiversification).toBe(true);
      });
    });

    describe('trackRecommendationAction', () => {
      test('should track recommendation action with outcome', async () => {
        const userId = 1;
        const symbol = 'BTC';
        const action = 'purchased';
        const outcome = { success: true, value: 50000 };

        const result = await recommendationService.trackRecommendationAction(
          userId,
          symbol,
          action,
          outcome
        );

        expect(result).toBeDefined();
        expect(result.userId).toBe(userId);
        expect(result.symbol).toBe(symbol);
        expect(result.action).toBe(action);
        expect(result.outcome).toEqual(outcome);
        expect(result.timestamp).toBeInstanceOf(Date);
      });

      test('should track recommendation action without outcome', async () => {
        const userId = 2;
        const symbol = 'ETH';
        const action = 'viewed';

        const result = await recommendationService.trackRecommendationAction(
          userId,
          symbol,
          action
        );

        expect(result).toBeDefined();
        expect(result.userId).toBe(userId);
        expect(result.symbol).toBe(symbol);
        expect(result.action).toBe(action);
        expect(result.outcome).toBeNull();
      });

      test('should not throw on tracking errors', async () => {
        const userId = 3;
        const symbol = 'BTC';
        const action = 'dismissed';

        // Should not throw even if there's an internal error
        await expect(
          recommendationService.trackRecommendationAction(userId, symbol, action)
        ).resolves.not.toThrow();
      });
    });

    describe('fallback behavior', () => {
      test('should handle portfolio service errors gracefully', async () => {
        const userId = 7;
        
        mockGetPortfolio.mockRejectedValue(new Error('Portfolio service error'));
        mockGetTopGainers.mockResolvedValue([
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 50000,
            change24h: 5.5,
            volume: 1000000
          }
        ]);

        await expect(
          recommendationService.generateRecommendations(userId, 5)
        ).rejects.toThrow();
      });

      test('should handle market service errors in general recommendations', async () => {
        const userId = 8;
        
        mockGetPortfolio.mockResolvedValue({
          holdings: []
        });

        mockGetTopGainers.mockRejectedValue(new Error('Market service error'));

        const recommendations = await recommendationService.generateRecommendations(userId, 5);

        // Should still return fallback recommendations
        expect(recommendations).toBeDefined();
        expect(recommendations.length).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
