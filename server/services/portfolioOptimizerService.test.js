import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import fc from 'fast-check';

// Mock dependencies before importing
const mockGetPortfolio = jest.fn();
const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();

jest.unstable_mockModule('./portfolioService.js', () => ({
  default: {
    getPortfolio: mockGetPortfolio
  }
}));

jest.unstable_mockModule('./cacheService.js', () => ({
  default: {
    get: mockCacheGet,
    set: mockCacheSet
  }
}));

// Import after mocking
const { default: portfolioOptimizerService } = await import('./portfolioOptimizerService.js');

describe('PortfolioOptimizerService', () => {
  beforeEach(() => {
    mockGetPortfolio.mockClear();
    mockCacheGet.mockClear();
    mockCacheSet.mockClear();
    
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(true);
  });

  describe('Property Tests', () => {
    test('Property 24: Portfolio optimization structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              assetType: fc.constantFrom('crypto', 'stock', 'forex', 'commodity'),
              quantity: fc.double({ min: 0.01, max: 100, noNaN: true }),
              currentValue: fc.double({ min: 100, max: 10000, noNaN: true }),
              profitLoss: fc.double({ min: -1000, max: 1000, noNaN: true })
            }),
            { minLength: 0, maxLength: 10 }
          ),
          async (userId, holdings) => {
            mockGetPortfolio.mockResolvedValue({ holdings });
            const optimization = await portfolioOptimizerService.optimizePortfolio(userId);
            
            expect(optimization).toHaveProperty('isOptimized');
            expect(optimization).toHaveProperty('message');
            expect(optimization).toHaveProperty('currentAllocation');
            expect(optimization).toHaveProperty('recommendedAllocation');
            expect(optimization).toHaveProperty('suggestions');
            expect(optimization).toHaveProperty('trades');
            
            expect(Array.isArray(optimization.currentAllocation)).toBe(true);
            expect(Array.isArray(optimization.recommendedAllocation)).toBe(true);
            
            optimization.currentAllocation.forEach(item => {
              expect(item).toHaveProperty('assetType');
              expect(item).toHaveProperty('value');
              expect(item).toHaveProperty('percentage');
              expect(typeof item.percentage).toBe('number');
            });
            
            optimization.recommendedAllocation.forEach(item => {
              expect(item).toHaveProperty('assetType');
              expect(item).toHaveProperty('value');
              expect(item).toHaveProperty('percentage');
              expect(typeof item.percentage).toBe('number');
            });
            
            // Suggestions array should always be present and be an array
            expect(Array.isArray(optimization.suggestions)).toBe(true);
            // Suggestions should have at least one item (even if it's just a message)
            // Note: Empty portfolio returns empty suggestions, which is valid
            if (holdings.length > 0) {
              expect(optimization.suggestions.length).toBeGreaterThan(0);
            }
            expect(Array.isArray(optimization.trades)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 25: Optimization trade generation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              assetType: fc.constantFrom('crypto', 'stock', 'forex', 'commodity'),
              quantity: fc.double({ min: 0.01, max: 100, noNaN: true }),
              currentValue: fc.double({ min: 500, max: 10000, noNaN: true }),
              profitLoss: fc.double({ min: -1000, max: 1000, noNaN: true })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (userId, holdings) => {
            mockGetPortfolio.mockResolvedValue({ holdings });
            const optimization = await portfolioOptimizerService.optimizePortfolio(userId);
            
            // If portfolio is not optimized and has trade recommendations
            if (!optimization.isOptimized && optimization.trades.length > 0) {
              optimization.trades.forEach(trade => {
                expect(trade).toHaveProperty('action');
                expect(['BUY', 'SELL']).toContain(trade.action);
                expect(trade).toHaveProperty('assetType');
                expect(trade).toHaveProperty('symbol');
                expect(trade).toHaveProperty('estimatedAmount');
                expect(trade).toHaveProperty('reason');
                expect(trade).toHaveProperty('priority');
                expect(['high', 'medium', 'low']).toContain(trade.priority);
                
                // Verify estimatedAmount is a valid positive number
                expect(typeof trade.estimatedAmount).toBe('number');
                expect(Number.isFinite(trade.estimatedAmount)).toBe(true);
                expect(trade.estimatedAmount).toBeGreaterThan(0);
                
                // Verify reason is a non-empty string
                expect(typeof trade.reason).toBe('string');
                expect(trade.reason.length).toBeGreaterThan(0);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    describe('Portfolio Analysis', () => {
      test('should return optimized message for empty portfolio', async () => {
        mockGetPortfolio.mockResolvedValue({ holdings: [] });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(result.isOptimized).toBe(true);
        expect(result.message).toContain('No portfolio to optimize');
        expect(result.currentAllocation).toEqual([]);
        expect(result.recommendedAllocation).toEqual([]);
        expect(result.trades).toEqual([]);
      });

      test('should analyze current allocation correctly', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 5000 },
          { symbol: 'ETH', assetType: 'crypto', currentValue: 3000 },
          { symbol: 'AAPL', assetType: 'stock', currentValue: 2000 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(result.currentAllocation).toHaveLength(2);
        const cryptoAllocation = result.currentAllocation.find(a => a.assetType === 'crypto');
        expect(cryptoAllocation).toBeDefined();
        expect(cryptoAllocation.value).toBe(8000);
        expect(cryptoAllocation.percentage).toBeCloseTo(80, 1);
        
        const stockAllocation = result.currentAllocation.find(a => a.assetType === 'stock');
        expect(stockAllocation).toBeDefined();
        expect(stockAllocation.value).toBe(2000);
        expect(stockAllocation.percentage).toBeCloseTo(20, 1);
      });

      test('should handle portfolio with single asset type', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 10000 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(result.currentAllocation).toHaveLength(1);
        expect(result.currentAllocation[0].assetType).toBe('crypto');
        expect(result.currentAllocation[0].percentage).toBe(100);
        expect(result.suggestions).toContain('Consider diversifying across multiple asset types to reduce risk');
      });

      test('should calculate allocation percentages correctly for multiple holdings', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 2000 },
          { symbol: 'ETH', assetType: 'crypto', currentValue: 2000 },
          { symbol: 'AAPL', assetType: 'stock', currentValue: 3000 },
          { symbol: 'GOOGL', assetType: 'stock', currentValue: 3000 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        const cryptoAllocation = result.currentAllocation.find(a => a.assetType === 'crypto');
        const stockAllocation = result.currentAllocation.find(a => a.assetType === 'stock');
        
        expect(cryptoAllocation.percentage).toBeCloseTo(40, 1);
        expect(stockAllocation.percentage).toBeCloseTo(60, 1);
        expect(cryptoAllocation.count).toBe(2);
        expect(stockAllocation.count).toBe(2);
      });

      test('should handle null portfolio gracefully', async () => {
        mockGetPortfolio.mockResolvedValue(null);
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(result.isOptimized).toBe(true);
        expect(result.message).toContain('No portfolio to optimize');
      });
    });

    describe('Optimization Algorithm', () => {
      test('should generate recommended allocation based on diversification', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 10000 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(result.recommendedAllocation.length).toBeGreaterThan(1);
        
        const cryptoRec = result.recommendedAllocation.find(a => a.assetType === 'crypto');
        const stockRec = result.recommendedAllocation.find(a => a.assetType === 'stock');
        const forexRec = result.recommendedAllocation.find(a => a.assetType === 'forex');
        const commodityRec = result.recommendedAllocation.find(a => a.assetType === 'commodity');
        
        expect(cryptoRec).toBeDefined();
        expect(stockRec).toBeDefined();
        expect(forexRec).toBeDefined();
        expect(commodityRec).toBeDefined();
        
        // Verify percentages add up to 100
        const totalPercentage = result.recommendedAllocation.reduce((sum, a) => sum + a.percentage, 0);
        expect(totalPercentage).toBeCloseTo(100, 0);
      });

      test('should detect when portfolio is within optimization threshold', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 4000 },
          { symbol: 'AAPL', assetType: 'stock', currentValue: 3500 },
          { symbol: 'EUR/USD', assetType: 'forex', currentValue: 1500 },
          { symbol: 'GLD', assetType: 'commodity', currentValue: 1000 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(result.isOptimized).toBe(true);
        expect(result.message).toContain('well-optimized');
      });

      test('should detect when portfolio needs optimization', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 9000 },
          { symbol: 'AAPL', assetType: 'stock', currentValue: 1000 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(result.isOptimized).toBe(false);
        expect(result.message).toContain('opportunities to optimize');
      });

      test('should generate meaningful suggestions for imbalanced portfolio', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 8000 },
          { symbol: 'AAPL', assetType: 'stock', currentValue: 2000 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(result.suggestions.length).toBeGreaterThan(0);
        expect(result.suggestions.some(s => s.includes('Reduce crypto'))).toBe(true);
        expect(result.suggestions.some(s => s.includes('Increase stock'))).toBe(true);
      });
    });

    describe('Trade Generation', () => {
      test('should generate trade recommendations for imbalanced portfolio', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 9000, profitLoss: 1000 },
          { symbol: 'AAPL', assetType: 'stock', currentValue: 1000, profitLoss: 100 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(result.isOptimized).toBe(false);
        expect(result.trades.length).toBeGreaterThan(0);
        
        const sellTrades = result.trades.filter(t => t.action === 'SELL');
        const buyTrades = result.trades.filter(t => t.action === 'BUY');
        expect(sellTrades.length).toBeGreaterThan(0);
        expect(buyTrades.length).toBeGreaterThan(0);
      });

      test('should prioritize trades by amount', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 9000, profitLoss: 1000 },
          { symbol: 'AAPL', assetType: 'stock', currentValue: 1000, profitLoss: 100 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        if (result.trades.length > 1) {
          const priorities = result.trades.map(t => t.priority);
          const highPriorityIndex = priorities.indexOf('high');
          const mediumPriorityIndex = priorities.indexOf('medium');
          
          if (highPriorityIndex !== -1 && mediumPriorityIndex !== -1) {
            expect(highPriorityIndex).toBeLessThan(mediumPriorityIndex);
          }
        }
      });

      test('should suggest selling worst performers first', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 5000, profitLoss: -500 },
          { symbol: 'ETH', assetType: 'crypto', currentValue: 5000, profitLoss: 500 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        const sellTrades = result.trades.filter(t => t.action === 'SELL' && t.assetType === 'crypto');
        if (sellTrades.length > 0) {
          // Should suggest selling BTC (worst performer) not ETH
          expect(sellTrades[0].symbol).toBe('BTC');
        }
      });

      test('should not generate trades for small differences', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 4100 },
          { symbol: 'AAPL', assetType: 'stock', currentValue: 3400 },
          { symbol: 'EUR/USD', assetType: 'forex', currentValue: 1500 },
          { symbol: 'GLD', assetType: 'commodity', currentValue: 1000 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        // Portfolio is close to optimal, should have minimal or no trades
        expect(result.trades.length).toBe(0);
      });

      test('should suggest appropriate symbols for buy trades', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 10000 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        const buyTrades = result.trades.filter(t => t.action === 'BUY');
        buyTrades.forEach(trade => {
          expect(trade.symbol).toBeDefined();
          expect(trade.symbol.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Well-Optimized Portfolio Handling', () => {
      test('should return well-optimized message for balanced portfolio', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 4000 },
          { symbol: 'AAPL', assetType: 'stock', currentValue: 3500 },
          { symbol: 'EUR/USD', assetType: 'forex', currentValue: 1500 },
          { symbol: 'GLD', assetType: 'commodity', currentValue: 1000 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(result.isOptimized).toBe(true);
        expect(result.message).toContain('well-optimized');
        expect(result.trades).toEqual([]);
      });

      test('should not generate trades for well-optimized portfolio', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 3900 },
          { symbol: 'AAPL', assetType: 'stock', currentValue: 3600 },
          { symbol: 'EUR/USD', assetType: 'forex', currentValue: 1500 },
          { symbol: 'GLD', assetType: 'commodity', currentValue: 1000 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(result.trades.length).toBe(0);
        expect(result.suggestions).toContain('Maintain current allocation');
      });

      test('should handle portfolio at exact ideal allocation', async () => {
        const holdings = [
          { symbol: 'BTC', assetType: 'crypto', currentValue: 4000 },
          { symbol: 'AAPL', assetType: 'stock', currentValue: 3500 },
          { symbol: 'EUR/USD', assetType: 'forex', currentValue: 1500 },
          { symbol: 'GLD', assetType: 'commodity', currentValue: 1000 }
        ];
        mockGetPortfolio.mockResolvedValue({ holdings });
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(result.isOptimized).toBe(true);
        expect(result.currentAllocation.length).toBe(4);
        expect(result.recommendedAllocation.length).toBeGreaterThanOrEqual(4);
      });
    });

    describe('Caching', () => {
      test('should use cache when available', async () => {
        const cachedResult = {
          isOptimized: true,
          message: 'Cached result',
          currentAllocation: [],
          recommendedAllocation: [],
          suggestions: [],
          trades: []
        };
        mockCacheGet.mockResolvedValue(cachedResult);
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(result).toEqual(cachedResult);
        expect(mockGetPortfolio).not.toHaveBeenCalled();
      });

      test('should cache optimization results', async () => {
        const holdings = [{ symbol: 'BTC', assetType: 'crypto', currentValue: 5000 }];
        mockGetPortfolio.mockResolvedValue({ holdings });
        await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(mockCacheSet).toHaveBeenCalledWith(
          'portfolio_optimization:1',
          expect.any(Object),
          3600
        );
      });

      test('should cache with correct TTL', async () => {
        const holdings = [{ symbol: 'BTC', assetType: 'crypto', currentValue: 5000 }];
        mockGetPortfolio.mockResolvedValue({ holdings });
        await portfolioOptimizerService.optimizePortfolio(1);
        
        const cacheCall = mockCacheSet.mock.calls[0];
        expect(cacheCall[2]).toBe(3600); // 1 hour TTL
      });
    });

    describe('Error Handling', () => {
      test('should handle portfolio service errors', async () => {
        mockGetPortfolio.mockRejectedValue(new Error('Portfolio service error'));
        
        await expect(portfolioOptimizerService.optimizePortfolio(1))
          .rejects.toThrow('Portfolio service error');
      });

      test('should handle missing holdings property', async () => {
        mockGetPortfolio.mockResolvedValue({});
        const result = await portfolioOptimizerService.optimizePortfolio(1);
        
        expect(result.isOptimized).toBe(true);
        expect(result.message).toContain('No portfolio to optimize');
      });
    });
  });
});
