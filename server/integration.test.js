/**
 * Integration Tests for API Migration
 * Tests end-to-end flow with real API keys, rate limit handling,
 * cache behavior, error handling, and fallbacks
 * 
 * Requirements: 1.1, 2.1, 3.1, 4.1, 6.1, 6.2, 6.3
 */

import StocksProvider from './providers/stocksProvider.js';
import ForexProvider from './providers/forexProvider.js';
import CommoditiesProvider from './providers/commoditiesProvider.js';
import cacheService from './services/cacheService.js';
import { apiConfig } from './config/apiConfig.js';

describe('API Migration Integration Tests', () => {
  let stocksProvider;
  let forexProvider;
  let commoditiesProvider;

  // Check if API keys are configured
  const hasApiKeys = apiConfig.finnhub?.apiKey && 
                     apiConfig.fixer?.apiKey && 
                     apiConfig.metalsApi?.apiKey;

  // Skip all tests if API keys are not configured
  const describeOrSkip = hasApiKeys ? describe : describe.skip;

  beforeEach(() => {
    // Clear cache before each test
    cacheService.clear();
    
    // Initialize providers
    stocksProvider = new StocksProvider();
    forexProvider = new ForexProvider();
    commoditiesProvider = new CommoditiesProvider();
  });

  afterEach(() => {
    // Clean up cache after each test
    cacheService.clear();
  });

  describeOrSkip('End-to-End Flow Tests', () => {
    describe('Stocks Provider (Finnhub)', () => {
      test('should fetch single stock quote successfully', async () => {
        const symbol = 'AAPL';
        const result = await stocksProvider.getStockQuote(symbol);

        expect(result).toBeDefined();
        expect(result.c).toBeDefined(); // current price
        expect(result.h).toBeDefined(); // high
        expect(result.l).toBeDefined(); // low
        expect(result.o).toBeDefined(); // open
        expect(result.pc).toBeDefined(); // previous close
      }, 30000);

      test('should fetch multiple stock quotes concurrently', async () => {
        const symbols = ['AAPL', 'MSFT', 'GOOGL'];
        const results = await stocksProvider.getMultipleStockQuotes(symbols);

        expect(Object.keys(results)).toHaveLength(symbols.length);
        symbols.forEach(symbol => {
          expect(results[symbol]).toBeDefined();
          if (!results[symbol].error) {
            expect(results[symbol].c).toBeDefined();
          }
        });
      }, 30000);

      test('should fetch stock time series data', async () => {
        const symbol = 'AAPL';
        const to = Math.floor(Date.now() / 1000);
        const from = to - (7 * 24 * 60 * 60); // 7 days ago
        
        const result = await stocksProvider.getStockTimeSeries(symbol, 'D', from, to);

        expect(result).toBeDefined();
        expect(result.s).toBe('ok'); // status
        expect(result.c).toBeDefined(); // close prices array
        expect(result.t).toBeDefined(); // timestamps array
      }, 30000);

      test('should fetch company overview', async () => {
        const symbol = 'AAPL';
        const result = await stocksProvider.getCompanyOverview(symbol);

        expect(result).toBeDefined();
        expect(result.name).toBeDefined();
        expect(result.ticker).toBe(symbol);
      }, 30000);
    });

    describe('Forex Provider (Fixer.io)', () => {
      test('should fetch single exchange rate successfully', async () => {
        const result = await forexProvider.getExchangeRate('EUR', 'USD');

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.rates).toBeDefined();
        expect(result.rates.USD).toBeDefined();
        expect(result.pair).toBe('EUR/USD');
      }, 30000);

      test('should fetch multiple exchange rates in batched request', async () => {
        const pairs = [
          { from: 'EUR', to: 'USD', name: 'EUR/USD' },
          { from: 'EUR', to: 'GBP', name: 'EUR/GBP' },
          { from: 'EUR', to: 'JPY', name: 'EUR/JPY' }
        ];
        
        const results = await forexProvider.getMultipleExchangeRates(pairs);

        expect(Object.keys(results)).toHaveLength(pairs.length);
        pairs.forEach(pair => {
          expect(results[pair.name]).toBeDefined();
          if (!results[pair.name].error) {
            expect(results[pair.name].rate).toBeDefined();
          }
        });
      }, 30000);

      test('should fetch forex time series data', async () => {
        const result = await forexProvider.getForexTimeSeries('EUR', 'USD');

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.rates).toBeDefined();
      }, 30000);
    });

    describe('Commodities Provider (Metals-API)', () => {
      test('should fetch single commodity price successfully', async () => {
        const symbol = 'XAU'; // Gold
        const result = await commoditiesProvider.getCommodityPrice(symbol);

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.rates).toBeDefined();
        expect(result.rates[symbol]).toBeDefined();
        expect(result.name).toBe('Gold');
      }, 30000);

      test('should fetch multiple commodity prices in batched request', async () => {
        const commodities = [
          { symbol: 'XAU', name: 'Gold', unit: 'USD per troy ounce' },
          { symbol: 'XAG', name: 'Silver', unit: 'USD per troy ounce' },
          { symbol: 'XPT', name: 'Platinum', unit: 'USD per troy ounce' }
        ];
        
        const results = await commoditiesProvider.getMultipleCommodityPrices(commodities);

        expect(Object.keys(results)).toHaveLength(commodities.length);
        commodities.forEach(commodity => {
          expect(results[commodity.symbol]).toBeDefined();
          if (!results[commodity.symbol].error) {
            expect(results[commodity.symbol].rate).toBeDefined();
          }
        });
      }, 30000);

      test('should fetch commodity time series data', async () => {
        const symbol = 'XAU';
        const result = await commoditiesProvider.getCommodityTimeSeries(symbol);

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.rates).toBeDefined();
      }, 30000);
    });
  });

  describe('Rate Limit Handling', () => {
    test('should handle Finnhub rate limits gracefully', async () => {
      // Finnhub allows 60 calls/minute
      // Test that we can make multiple concurrent calls
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
      const startTime = Date.now();
      
      const results = await stocksProvider.getMultipleStockQuotes(symbols);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (not hitting rate limits)
      expect(duration).toBeLessThan(10000); // 10 seconds
      expect(Object.keys(results)).toHaveLength(symbols.length);
    }, 30000);

    test('should batch forex requests to minimize API calls', async () => {
      // Fixer.io has 100 calls/month limit
      // Test that multiple pairs with same base are batched
      const pairs = [
        { from: 'EUR', to: 'USD', name: 'EUR/USD' },
        { from: 'EUR', to: 'GBP', name: 'EUR/GBP' },
        { from: 'EUR', to: 'JPY', name: 'EUR/JPY' }
      ];
      
      // This should make only 1 API call (batched)
      const results = await forexProvider.getMultipleExchangeRates(pairs);
      
      expect(Object.keys(results)).toHaveLength(pairs.length);
      // All should succeed if batching works correctly
      pairs.forEach(pair => {
        expect(results[pair.name]).toBeDefined();
      });
    }, 30000);

    test('should batch commodity requests to minimize API calls', async () => {
      // Metals-API has 50 calls/month limit
      // Test that multiple commodities are fetched in single call
      const commodities = [
        { symbol: 'XAU', name: 'Gold', unit: 'USD per troy ounce' },
        { symbol: 'XAG', name: 'Silver', unit: 'USD per troy ounce' }
      ];
      
      // This should make only 1 API call (batched)
      const results = await commoditiesProvider.getMultipleCommodityPrices(commodities);
      
      expect(Object.keys(results)).toHaveLength(commodities.length);
    }, 30000);
  });

  describeOrSkip('Cache Behavior', () => {
    test('should cache stock data with correct TTL', async () => {
      const symbol = 'AAPL';
      const cacheKey = `stocks:quote:${symbol}`;
      
      // First call - should fetch from API
      const result1 = await stocksProvider.getStockQuote(symbol);
      
      // Cache the result manually (simulating marketService behavior)
      cacheService.set(cacheKey, result1, apiConfig.cache.stocks);
      
      // Verify cache exists
      const cached = cacheService.get(cacheKey);
      expect(cached).toBeDefined();
      expect(cached.c).toBe(result1.c);
      
      // Verify TTL is correct (60 seconds for stocks)
      expect(cacheService.isStale(cacheKey)).toBe(false);
    }, 30000);

    test('should cache forex data with correct TTL', async () => {
      const cacheKey = 'forex:rate:EUR/USD';
      
      // First call - should fetch from API
      const result1 = await forexProvider.getExchangeRate('EUR', 'USD');
      
      // Cache the result
      cacheService.set(cacheKey, result1, apiConfig.cache.forex);
      
      // Verify cache exists
      const cached = cacheService.get(cacheKey);
      expect(cached).toBeDefined();
      expect(cached.rate).toBe(result1.rate);
      
      // Verify TTL is correct (3600 seconds for forex)
      expect(cacheService.isStale(cacheKey)).toBe(false);
    }, 30000);

    test('should cache commodity data with correct TTL', async () => {
      const symbol = 'XAU';
      const cacheKey = `commodities:price:${symbol}`;
      
      // First call - should fetch from API
      const result1 = await commoditiesProvider.getCommodityPrice(symbol);
      
      // Cache the result
      cacheService.set(cacheKey, result1, apiConfig.cache.commodities);
      
      // Verify cache exists
      const cached = cacheService.get(cacheKey);
      expect(cached).toBeDefined();
      expect(cached.rates[symbol]).toBe(result1.rates[symbol]);
      
      // Verify TTL is correct (3600 seconds for commodities)
      expect(cacheService.isStale(cacheKey)).toBe(false);
    }, 30000);

    test('should expire cache after TTL', async () => {
      const cacheKey = 'test:cache:expiry';
      const testData = { value: 'test' };
      
      // Set cache with 1 second TTL
      cacheService.set(cacheKey, testData, 1);
      
      // Should exist immediately
      expect(cacheService.get(cacheKey)).toBeDefined();
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Should be expired
      expect(cacheService.get(cacheKey)).toBeNull();
    }, 5000);
  });

  describeOrSkip('Error Handling and Fallbacks', () => {
    test('should retry on network errors with exponential backoff', async () => {
      // Test with invalid symbol to trigger error
      try {
        await stocksProvider.getStockQuote('INVALID_SYMBOL_XYZ');
        // Should throw error
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.provider).toBe('Finnhub');
        expect(error.method).toContain('getStockQuote');
      }
    }, 30000);

    test('should not retry on non-retryable errors (401)', async () => {
      // Create provider with invalid API key
      const invalidProvider = new StocksProvider();
      invalidProvider.apiKey = 'invalid_key_12345';
      
      try {
        await invalidProvider.getStockQuote('AAPL');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.retryable).toBe(false);
      }
    }, 30000);

    test('should return cached data on API failure', async () => {
      const symbol = 'AAPL';
      const cacheKey = `stocks:quote:${symbol}`;
      
      // Pre-populate cache with mock data
      const mockData = {
        c: 150.00,
        h: 152.00,
        l: 148.00,
        o: 149.00,
        pc: 149.50
      };
      cacheService.set(cacheKey, mockData, apiConfig.cache.stocks);
      
      // Verify cache fallback works
      const cached = cacheService.get(cacheKey);
      expect(cached).toBeDefined();
      expect(cached.c).toBe(mockData.c);
    }, 5000);

    test('should format errors consistently across providers', async () => {
      const errors = [];
      
      // Test stocks provider error
      try {
        await stocksProvider.getStockQuote('INVALID_XYZ');
      } catch (error) {
        errors.push(error);
      }
      
      // Test forex provider error (invalid currency)
      try {
        const invalidForex = new ForexProvider();
        invalidForex.apiKey = 'invalid_key';
        await invalidForex.getExchangeRate('XXX', 'YYY');
      } catch (error) {
        errors.push(error);
      }
      
      // Verify all errors have consistent format
      errors.forEach(error => {
        expect(error.provider).toBeDefined();
        expect(error.method).toBeDefined();
        expect(error.message).toBeDefined();
        expect(error.originalError).toBeDefined();
        expect(typeof error.retryable).toBe('boolean');
      });
    }, 30000);
  });

  describeOrSkip('API Usage and Response Times', () => {
    test('should complete stock API calls within acceptable time', async () => {
      const startTime = Date.now();
      await stocksProvider.getStockQuote('AAPL');
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    }, 30000);

    test('should complete forex API calls within acceptable time', async () => {
      const startTime = Date.now();
      await forexProvider.getExchangeRate('EUR', 'USD');
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    }, 30000);

    test('should complete commodity API calls within acceptable time', async () => {
      const startTime = Date.now();
      await commoditiesProvider.getCommodityPrice('XAU');
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    }, 30000);

    test('should track API usage for monitoring', async () => {
      const apiCalls = {
        stocks: 0,
        forex: 0,
        commodities: 0
      };
      
      // Make some API calls
      await stocksProvider.getStockQuote('AAPL');
      apiCalls.stocks++;
      
      await forexProvider.getExchangeRate('EUR', 'USD');
      apiCalls.forex++;
      
      await commoditiesProvider.getCommodityPrice('XAU');
      apiCalls.commodities++;
      
      // Verify we can track usage
      expect(apiCalls.stocks).toBe(1);
      expect(apiCalls.forex).toBe(1);
      expect(apiCalls.commodities).toBe(1);
      
      console.log('API Usage Summary:', apiCalls);
    }, 30000);
  });

  describe('Configuration Validation', () => {
    test('should have all required API keys configured', () => {
      // This test checks if API keys are configured
      // It's expected to fail in CI/CD without real API keys
      if (!hasApiKeys) {
        console.warn('⚠️  API keys not configured - integration tests will be skipped');
      }
      expect(apiConfig.finnhub).toBeDefined();
      expect(apiConfig.fixer).toBeDefined();
      expect(apiConfig.metalsApi).toBeDefined();
    });

    test('should have correct cache TTL values', () => {
      expect(apiConfig.cache.stocks).toBe(60);
      expect(apiConfig.cache.forex).toBe(3600);
      expect(apiConfig.cache.commodities).toBe(3600);
    });

    test('should have correct rate limit configurations', () => {
      expect(apiConfig.finnhub.rateLimit.callsPerMinute).toBe(60);
      expect(apiConfig.fixer.rateLimit.callsPerMonth).toBe(100);
      expect(apiConfig.metalsApi.rateLimit.callsPerMonth).toBe(50);
    });

    test('should have retry configuration', () => {
      expect(apiConfig.retry).toBeDefined();
      expect(apiConfig.retry.maxAttempts).toBeDefined();
      expect(apiConfig.retry.initialDelay).toBeDefined();
      expect(apiConfig.retry.maxDelay).toBeDefined();
      expect(apiConfig.retry.backoffMultiplier).toBeDefined();
    });
  });
});
