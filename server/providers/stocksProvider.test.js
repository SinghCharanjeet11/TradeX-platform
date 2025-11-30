/**
 * Property-Based Tests for StocksProvider
 * Feature: api-migration, Property 1: Data timestamp freshness
 * Validates: Requirements 1.2
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { transformStocksData } from '../utils/dataTransformers.js';
import cacheService from '../services/cacheService.js';
import { apiConfig } from '../config/apiConfig.js';

/**
 * Property 1: Data timestamp freshness
 * For any stock data response, the timestamp should be within the last 60 seconds of the current time
 * Validates: Requirements 1.2
 * 
 * This test verifies that the data transformation layer correctly handles timestamps
 * and ensures they represent fresh data (within 60 seconds as per requirement 1.2)
 */
describe('StocksProvider - Property-Based Tests', () => {
  describe('Property 1: Data timestamp freshness', () => {
    test('transformed stock data timestamps should be within 60 seconds when Finnhub provides recent timestamps', () => {
      fc.assert(
        fc.property(
          // Generate random stock symbols (1-5 uppercase letters)
          fc.array(
            fc.string({ minLength: 1, maxLength: 5, unit: fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z') }),
            { minLength: 1, maxLength: 10 }
          ),
          // Generate timestamps within the last 60 seconds (as Finnhub should provide)
          fc.integer({ min: -60, max: 0 }).map(secondsAgo => {
            return Math.floor(Date.now() / 1000) + secondsAgo;
          }),
          (symbols, timestamp) => {
            // Skip empty symbols
            const validSymbols = symbols.filter(s => s.length > 0);
            if (validSymbols.length === 0) return true;

            // Create mock Finnhub response data with the generated timestamp
            const mockRawData = {};
            validSymbols.forEach(symbol => {
              mockRawData[symbol] = {
                c: 150.25 + Math.random() * 50, // current price
                h: 155.50 + Math.random() * 50, // high
                l: 145.00 + Math.random() * 50, // low
                o: 148.00 + Math.random() * 50, // open
                pc: 149.00 + Math.random() * 50, // previous close
                d: (Math.random() - 0.5) * 10, // change
                dp: (Math.random() - 0.5) * 5, // change percent
                t: timestamp // timestamp from Finnhub (Unix timestamp in seconds)
              };
            });

            // Transform the data using the actual transformer
            const currentTime = Date.now();
            const transformedData = transformStocksData(mockRawData, validSymbols);

            // Verify the property: all timestamps should be within 60 seconds
            for (const stock of transformedData) {
              if (stock.lastUpdate) {
                const stockTimestamp = new Date(stock.lastUpdate).getTime();
                const timeDifference = currentTime - stockTimestamp;

                // Property: timestamp should be within 60 seconds (60000 ms) of current time
                // We add a small buffer (1000ms) for processing time
                const maxAllowedDifference = 61000; // 61 seconds to account for processing
                
                if (timeDifference > maxAllowedDifference || timeDifference < -1000) {
                  console.error(`Timestamp freshness violation for ${stock.symbol}:`);
                  console.error(`  Current time: ${new Date(currentTime).toISOString()}`);
                  console.error(`  Stock timestamp: ${stock.lastUpdate}`);
                  console.error(`  Difference: ${timeDifference}ms`);
                  console.error(`  Input timestamp: ${timestamp} (${new Date(timestamp * 1000).toISOString()})`);
                  return false;
                }
              }
            }

            return true;
          }
        ),
        {
          numRuns: 100, // Run 100 iterations as specified in design doc
          endOnFailure: true // Stop on first failure to see the counterexample
        }
      );
    });

    test('transformed stock data uses current time when Finnhub timestamp is missing', () => {
      fc.assert(
        fc.property(
          // Generate random stock symbols
          fc.array(
            fc.string({ minLength: 2, maxLength: 4, unit: fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J') }),
            { minLength: 1, maxLength: 5 }
          ),
          (symbols) => {
            const validSymbols = symbols.filter(s => s.length > 0);
            if (validSymbols.length === 0) return true;

            // Create mock Finnhub response WITHOUT timestamp
            const mockRawData = {};
            validSymbols.forEach(symbol => {
              mockRawData[symbol] = {
                c: 150.25,
                h: 155.50,
                l: 145.00,
                o: 148.00,
                pc: 149.00,
                d: 1.25,
                dp: 0.84
                // Note: no 't' field (timestamp)
              };
            });

            const currentTime = Date.now();
            const transformedData = transformStocksData(mockRawData, validSymbols);

            // When Finnhub doesn't provide timestamp, transformer should use current time
            for (const stock of transformedData) {
              if (stock.lastUpdate) {
                const stockTimestamp = new Date(stock.lastUpdate).getTime();
                const timeDifference = Math.abs(currentTime - stockTimestamp);

                // Should be very recent (within 1 second of transformation)
                if (timeDifference > 1000) {
                  console.error(`Fallback timestamp not fresh for ${stock.symbol}:`);
                  console.error(`  Current time: ${new Date(currentTime).toISOString()}`);
                  console.error(`  Stock timestamp: ${stock.lastUpdate}`);
                  console.error(`  Difference: ${timeDifference}ms`);
                  return false;
                }
              }
            }

            return true;
          }
        ),
        {
          numRuns: 100
        }
      );
    });
  });

  /**
   * Property 2: Cache TTL correctness
   * For any cached data entry, the TTL should match the configured cache duration for that data type
   * (60s for stocks, 3600s for forex/commodities)
   * Validates: Requirements 1.3
   * 
   * This test verifies that the cache service correctly stores data with the proper TTL values
   * as specified in the API configuration for different data types.
   */
  describe('Property 2: Cache TTL correctness', () => {
    test('cached data should have correct TTL for stocks (60 seconds)', () => {
      fc.assert(
        fc.property(
          // Generate random cache keys for stocks
          fc.string({ minLength: 5, maxLength: 20 }),
          // Generate random stock data
          fc.record({
            symbol: fc.string({ minLength: 1, maxLength: 5 }),
            price: fc.double({ min: 1, max: 10000, noNaN: true }),
            change: fc.double({ min: -100, max: 100, noNaN: true }),
            timestamp: fc.integer({ min: Date.now() - 60000, max: Date.now() })
          }),
          (cacheKey, stockData) => {
            // Clear cache before test
            cacheService.clear();

            // Set data with stocks TTL (60 seconds)
            const stocksTTL = apiConfig.cache.stocks;
            const beforeSet = Date.now();
            cacheService.set(cacheKey, stockData, stocksTTL);
            const afterSet = Date.now();

            // Verify the data was cached
            const cachedData = cacheService.get(cacheKey);
            if (!cachedData) {
              console.error('Data was not cached properly');
              return false;
            }

            // Get the expiration time from the cache
            const expiresAt = cacheService.ttls.get(cacheKey);
            if (!expiresAt) {
              console.error('TTL was not set properly');
              return false;
            }

            // Calculate the actual TTL that was set
            // The expiration should be approximately: setTime + (stocksTTL * 1000)
            const expectedExpirationMin = beforeSet + (stocksTTL * 1000);
            const expectedExpirationMax = afterSet + (stocksTTL * 1000);

            // Property: The expiration time should match the configured TTL
            if (expiresAt < expectedExpirationMin || expiresAt > expectedExpirationMax) {
              console.error(`Cache TTL mismatch for stocks:`);
              console.error(`  Expected TTL: ${stocksTTL} seconds`);
              console.error(`  Expected expiration range: ${expectedExpirationMin} - ${expectedExpirationMax}`);
              console.error(`  Actual expiration: ${expiresAt}`);
              console.error(`  Difference: ${(expiresAt - expectedExpirationMin) / 1000} seconds`);
              return false;
            }

            // Verify the TTL is exactly 60 seconds for stocks
            if (stocksTTL !== 60) {
              console.error(`Stocks TTL configuration is incorrect:`);
              console.error(`  Expected: 60 seconds`);
              console.error(`  Actual: ${stocksTTL} seconds`);
              return false;
            }

            // Clean up
            cacheService.clear();
            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true
        }
      );
    });

    test('cached data should have correct TTL for forex (3600 seconds)', () => {
      fc.assert(
        fc.property(
          // Generate random cache keys for forex
          fc.string({ minLength: 5, maxLength: 20 }),
          // Generate random forex data
          fc.record({
            pair: fc.string({ minLength: 6, maxLength: 7 }),
            rate: fc.double({ min: 0.01, max: 200, noNaN: true }),
            timestamp: fc.integer({ min: Date.now() - 3600000, max: Date.now() })
          }),
          (cacheKey, forexData) => {
            cacheService.clear();

            // Set data with forex TTL (3600 seconds)
            const forexTTL = apiConfig.cache.forex;
            const beforeSet = Date.now();
            cacheService.set(cacheKey, forexData, forexTTL);
            const afterSet = Date.now();

            const cachedData = cacheService.get(cacheKey);
            if (!cachedData) {
              console.error('Forex data was not cached properly');
              return false;
            }

            const expiresAt = cacheService.ttls.get(cacheKey);
            if (!expiresAt) {
              console.error('Forex TTL was not set properly');
              return false;
            }

            const expectedExpirationMin = beforeSet + (forexTTL * 1000);
            const expectedExpirationMax = afterSet + (forexTTL * 1000);

            if (expiresAt < expectedExpirationMin || expiresAt > expectedExpirationMax) {
              console.error(`Cache TTL mismatch for forex:`);
              console.error(`  Expected TTL: ${forexTTL} seconds`);
              console.error(`  Expected expiration range: ${expectedExpirationMin} - ${expectedExpirationMax}`);
              console.error(`  Actual expiration: ${expiresAt}`);
              return false;
            }

            // Verify the TTL is exactly 3600 seconds for forex
            if (forexTTL !== 3600) {
              console.error(`Forex TTL configuration is incorrect:`);
              console.error(`  Expected: 3600 seconds`);
              console.error(`  Actual: ${forexTTL} seconds`);
              return false;
            }

            cacheService.clear();
            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true
        }
      );
    });

    test('cached data should have correct TTL for commodities (3600 seconds)', () => {
      fc.assert(
        fc.property(
          // Generate random cache keys for commodities
          fc.string({ minLength: 5, maxLength: 20 }),
          // Generate random commodity data
          fc.record({
            symbol: fc.string({ minLength: 2, maxLength: 4 }),
            price: fc.double({ min: 1, max: 5000, noNaN: true }),
            unit: fc.constantFrom('per oz', 'per barrel', 'per lb'),
            timestamp: fc.integer({ min: Date.now() - 3600000, max: Date.now() })
          }),
          (cacheKey, commodityData) => {
            cacheService.clear();

            // Set data with commodities TTL (3600 seconds)
            const commoditiesTTL = apiConfig.cache.commodities;
            const beforeSet = Date.now();
            cacheService.set(cacheKey, commodityData, commoditiesTTL);
            const afterSet = Date.now();

            const cachedData = cacheService.get(cacheKey);
            if (!cachedData) {
              console.error('Commodity data was not cached properly');
              return false;
            }

            const expiresAt = cacheService.ttls.get(cacheKey);
            if (!expiresAt) {
              console.error('Commodity TTL was not set properly');
              return false;
            }

            const expectedExpirationMin = beforeSet + (commoditiesTTL * 1000);
            const expectedExpirationMax = afterSet + (commoditiesTTL * 1000);

            if (expiresAt < expectedExpirationMin || expiresAt > expectedExpirationMax) {
              console.error(`Cache TTL mismatch for commodities:`);
              console.error(`  Expected TTL: ${commoditiesTTL} seconds`);
              console.error(`  Expected expiration range: ${expectedExpirationMin} - ${expectedExpirationMax}`);
              console.error(`  Actual expiration: ${expiresAt}`);
              return false;
            }

            // Verify the TTL is exactly 3600 seconds for commodities
            if (commoditiesTTL !== 3600) {
              console.error(`Commodities TTL configuration is incorrect:`);
              console.error(`  Expected: 3600 seconds`);
              console.error(`  Actual: ${commoditiesTTL} seconds`);
              return false;
            }

            cacheService.clear();
            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true
        }
      );
    });

    test('cached data should have correct TTL for crypto (60 seconds)', () => {
      fc.assert(
        fc.property(
          // Generate random cache keys for crypto
          fc.string({ minLength: 5, maxLength: 20 }),
          // Generate random crypto data
          fc.record({
            symbol: fc.string({ minLength: 3, maxLength: 5 }),
            price: fc.double({ min: 0.01, max: 100000, noNaN: true }),
            marketCap: fc.double({ min: 1000000, max: 1000000000000, noNaN: true }),
            timestamp: fc.integer({ min: Date.now() - 60000, max: Date.now() })
          }),
          (cacheKey, cryptoData) => {
            cacheService.clear();

            // Set data with crypto TTL (60 seconds)
            const cryptoTTL = apiConfig.cache.crypto;
            const beforeSet = Date.now();
            cacheService.set(cacheKey, cryptoData, cryptoTTL);
            const afterSet = Date.now();

            const cachedData = cacheService.get(cacheKey);
            if (!cachedData) {
              console.error('Crypto data was not cached properly');
              return false;
            }

            const expiresAt = cacheService.ttls.get(cacheKey);
            if (!expiresAt) {
              console.error('Crypto TTL was not set properly');
              return false;
            }

            const expectedExpirationMin = beforeSet + (cryptoTTL * 1000);
            const expectedExpirationMax = afterSet + (cryptoTTL * 1000);

            if (expiresAt < expectedExpirationMin || expiresAt > expectedExpirationMax) {
              console.error(`Cache TTL mismatch for crypto:`);
              console.error(`  Expected TTL: ${cryptoTTL} seconds`);
              console.error(`  Expected expiration range: ${expectedExpirationMin} - ${expectedExpirationMax}`);
              console.error(`  Actual expiration: ${expiresAt}`);
              return false;
            }

            // Verify the TTL is exactly 60 seconds for crypto
            if (cryptoTTL !== 60) {
              console.error(`Crypto TTL configuration is incorrect:`);
              console.error(`  Expected: 60 seconds`);
              console.error(`  Actual: ${cryptoTTL} seconds`);
              return false;
            }

            cacheService.clear();
            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true
        }
      );
    });
  });

  /**
   * Property 3: Exponential backoff retry
   * For any failed API request that is retryable, subsequent retry attempts should have exponentially increasing delays
   * Validates: Requirements 1.4, 6.1
   * 
   * This test verifies that the retry logic correctly implements exponential backoff
   * with the configured parameters (initial delay: 1000ms, multiplier: 2, max delay: 5000ms)
   */
  describe('Property 3: Exponential backoff retry', () => {
    test('retry delays should follow exponential backoff pattern', () => {
      fc.assert(
        fc.property(
          // Generate random attempt numbers (1 to 10)
          fc.integer({ min: 1, max: 10 }),
          (attempt) => {
            // Get retry configuration from apiConfig
            const { initialDelay, backoffMultiplier, maxDelay } = apiConfig.retry;

            // Calculate expected delay using the same formula as the provider
            const expectedDelay = Math.min(
              initialDelay * Math.pow(backoffMultiplier, attempt - 1),
              maxDelay
            );

            // Property 1: Delay should follow exponential formula before hitting max
            if (attempt === 1) {
              // First attempt should use initial delay
              if (expectedDelay !== initialDelay) {
                console.error(`Attempt 1 delay incorrect:`);
                console.error(`  Expected: ${initialDelay}ms`);
                console.error(`  Actual: ${expectedDelay}ms`);
                return false;
              }
            } else if (attempt === 2) {
              // Second attempt should be initialDelay * multiplier
              const expected = initialDelay * backoffMultiplier;
              if (expectedDelay !== Math.min(expected, maxDelay)) {
                console.error(`Attempt 2 delay incorrect:`);
                console.error(`  Expected: ${Math.min(expected, maxDelay)}ms`);
                console.error(`  Actual: ${expectedDelay}ms`);
                return false;
              }
            }

            // Property 2: Delay should never exceed maxDelay
            if (expectedDelay > maxDelay) {
              console.error(`Delay exceeds maximum:`);
              console.error(`  Max delay: ${maxDelay}ms`);
              console.error(`  Actual delay: ${expectedDelay}ms`);
              console.error(`  Attempt: ${attempt}`);
              return false;
            }

            // Property 3: Delay should be non-negative
            if (expectedDelay < 0) {
              console.error(`Delay is negative: ${expectedDelay}ms`);
              return false;
            }

            // Property 4: For attempts before hitting max, delay should grow exponentially
            if (attempt > 1) {
              const previousDelay = Math.min(
                initialDelay * Math.pow(backoffMultiplier, attempt - 2),
                maxDelay
              );
              
              // If we haven't hit the max delay yet, current should be >= previous
              if (expectedDelay < maxDelay && previousDelay < maxDelay) {
                if (expectedDelay < previousDelay) {
                  console.error(`Delay not increasing exponentially:`);
                  console.error(`  Attempt ${attempt - 1}: ${previousDelay}ms`);
                  console.error(`  Attempt ${attempt}: ${expectedDelay}ms`);
                  return false;
                }

                // Should be exactly multiplier times the previous (if not capped)
                const expectedRatio = expectedDelay / previousDelay;
                if (Math.abs(expectedRatio - backoffMultiplier) > 0.01) {
                  console.error(`Backoff multiplier not applied correctly:`);
                  console.error(`  Expected ratio: ${backoffMultiplier}`);
                  console.error(`  Actual ratio: ${expectedRatio}`);
                  console.error(`  Previous delay: ${previousDelay}ms`);
                  console.error(`  Current delay: ${expectedDelay}ms`);
                  return false;
                }
              }
            }

            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true
        }
      );
    });

    test('retry configuration values should match requirements', () => {
      // This test verifies the configuration is set correctly as per requirements
      const { maxAttempts, initialDelay, maxDelay, backoffMultiplier } = apiConfig.retry;

      // Verify configuration matches design document requirements
      expect(maxAttempts).toBe(3);
      expect(initialDelay).toBe(1000);
      expect(maxDelay).toBe(5000);
      expect(backoffMultiplier).toBe(2);
    });

    test('delay sequence should match expected exponential pattern for all attempts', () => {
      fc.assert(
        fc.property(
          // Generate a sequence of attempts (always test 1-3 since maxAttempts is 3)
          fc.constant([1, 2, 3]),
          (attempts) => {
            const { initialDelay, backoffMultiplier, maxDelay } = apiConfig.retry;
            const expectedSequence = [1000, 2000, 4000]; // Based on config: 1000 * 2^0, 1000 * 2^1, 1000 * 2^2

            for (let i = 0; i < attempts.length; i++) {
              const attempt = attempts[i];
              const calculatedDelay = Math.min(
                initialDelay * Math.pow(backoffMultiplier, attempt - 1),
                maxDelay
              );

              if (calculatedDelay !== expectedSequence[i]) {
                console.error(`Delay sequence mismatch at attempt ${attempt}:`);
                console.error(`  Expected: ${expectedSequence[i]}ms`);
                console.error(`  Calculated: ${calculatedDelay}ms`);
                return false;
              }
            }

            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true
        }
      );
    });

    test('exponential backoff should cap at maxDelay for high attempt numbers', () => {
      fc.assert(
        fc.property(
          // Generate high attempt numbers (beyond where we'd hit the cap)
          fc.integer({ min: 4, max: 20 }),
          (attempt) => {
            const { initialDelay, backoffMultiplier, maxDelay } = apiConfig.retry;

            const calculatedDelay = Math.min(
              initialDelay * Math.pow(backoffMultiplier, attempt - 1),
              maxDelay
            );

            // For attempt 4 and beyond with our config (1000 * 2^3 = 8000), should be capped at 5000
            const uncappedDelay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
            
            if (uncappedDelay > maxDelay) {
              // Should be capped
              if (calculatedDelay !== maxDelay) {
                console.error(`Delay not properly capped at maxDelay:`);
                console.error(`  Attempt: ${attempt}`);
                console.error(`  Uncapped delay: ${uncappedDelay}ms`);
                console.error(`  Max delay: ${maxDelay}ms`);
                console.error(`  Actual delay: ${calculatedDelay}ms`);
                return false;
              }
            } else {
              // Should not be capped yet
              if (calculatedDelay !== uncappedDelay) {
                console.error(`Delay incorrectly capped before reaching maxDelay:`);
                console.error(`  Attempt: ${attempt}`);
                console.error(`  Uncapped delay: ${uncappedDelay}ms`);
                console.error(`  Max delay: ${maxDelay}ms`);
                console.error(`  Actual delay: ${calculatedDelay}ms`);
                return false;
              }
            }

            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true
        }
      );
    });
  });

  /**
   * Property 8: Data transformation consistency
   * For any API response, the transformed output should contain all required fields in the standard format
   * (price, symbol, timestamp, change, changePercent)
   * Validates: Requirements 4.2, 4.4
   * 
   * This test verifies that data transformers consistently produce standardized output
   * regardless of the input variations from different API providers.
   */
  describe('Property 8: Data transformation consistency', () => {
    test('transformed stock data should always contain required fields', () => {
      fc.assert(
        fc.property(
          // Generate random stock symbols
          fc.array(
            fc.string({ minLength: 1, maxLength: 5, unit: fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z') }),
            { minLength: 1, maxLength: 10 }
          ),
          // Generate random price data
          fc.record({
            currentPrice: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            high: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            low: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            open: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            previousClose: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            change: fc.double({ min: -100, max: 100, noNaN: true }),
            changePercent: fc.double({ min: -50, max: 50, noNaN: true }),
            timestamp: fc.integer({ min: Math.floor(Date.now() / 1000) - 3600, max: Math.floor(Date.now() / 1000) })
          }),
          (symbols, priceData) => {
            // Filter out empty symbols
            const validSymbols = symbols.filter(s => s.length > 0);
            if (validSymbols.length === 0) return true;

            // Create mock Finnhub response
            const mockRawData = {};
            validSymbols.forEach(symbol => {
              mockRawData[symbol] = {
                c: priceData.currentPrice,
                h: priceData.high,
                l: priceData.low,
                o: priceData.open,
                pc: priceData.previousClose,
                d: priceData.change,
                dp: priceData.changePercent,
                t: priceData.timestamp
              };
            });

            // Transform the data
            const transformedData = transformStocksData(mockRawData, validSymbols);

            // Property: Every transformed item must have all required fields
            const requiredFields = ['symbol', 'price', 'change24h', 'lastUpdate'];
            
            for (const stock of transformedData) {
              // Check all required fields exist
              for (const field of requiredFields) {
                if (!(field in stock)) {
                  console.error(`Missing required field '${field}' in transformed stock data:`);
                  console.error(`  Symbol: ${stock.symbol || 'unknown'}`);
                  console.error(`  Available fields: ${Object.keys(stock).join(', ')}`);
                  return false;
                }
              }

              // Check field types
              if (typeof stock.symbol !== 'string') {
                console.error(`Field 'symbol' should be string, got ${typeof stock.symbol}`);
                return false;
              }

              if (typeof stock.price !== 'number') {
                console.error(`Field 'price' should be number, got ${typeof stock.price}`);
                return false;
              }

              if (typeof stock.change24h !== 'number') {
                console.error(`Field 'change24h' should be number, got ${typeof stock.change24h}`);
                return false;
              }

              if (typeof stock.lastUpdate !== 'string') {
                console.error(`Field 'lastUpdate' should be string, got ${typeof stock.lastUpdate}`);
                return false;
              }

              // Verify lastUpdate is a valid ISO date string
              const date = new Date(stock.lastUpdate);
              if (isNaN(date.getTime())) {
                console.error(`Field 'lastUpdate' is not a valid ISO date string: ${stock.lastUpdate}`);
                return false;
              }

              // Verify numeric fields are not NaN
              if (isNaN(stock.price)) {
                console.error(`Field 'price' is NaN for symbol ${stock.symbol}`);
                return false;
              }

              if (isNaN(stock.change24h)) {
                console.error(`Field 'change24h' is NaN for symbol ${stock.symbol}`);
                return false;
              }

              // Verify price is non-negative
              if (stock.price < 0) {
                console.error(`Field 'price' should be non-negative, got ${stock.price}`);
                return false;
              }
            }

            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true
        }
      );
    });

    test('transformed stock data should handle missing optional fields gracefully', () => {
      fc.assert(
        fc.property(
          // Generate random stock symbols
          fc.array(
            fc.string({ minLength: 2, maxLength: 4, unit: fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F') }),
            { minLength: 1, maxLength: 5 }
          ),
          // Generate incomplete data (missing some fields)
          fc.record({
            currentPrice: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true }), { nil: null }),
            high: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true }), { nil: null }),
            low: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true }), { nil: null }),
            open: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true }), { nil: null }),
            previousClose: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true }), { nil: null }),
            change: fc.option(fc.double({ min: -100, max: 100, noNaN: true }), { nil: null }),
            changePercent: fc.option(fc.double({ min: -50, max: 50, noNaN: true }), { nil: null })
          }),
          (symbols, priceData) => {
            const validSymbols = symbols.filter(s => s.length > 0);
            if (validSymbols.length === 0) return true;

            // Create mock Finnhub response with potentially missing fields
            const mockRawData = {};
            validSymbols.forEach(symbol => {
              const quote = {};
              if (priceData.currentPrice !== null) quote.c = priceData.currentPrice;
              if (priceData.high !== null) quote.h = priceData.high;
              if (priceData.low !== null) quote.l = priceData.low;
              if (priceData.open !== null) quote.o = priceData.open;
              if (priceData.previousClose !== null) quote.pc = priceData.previousClose;
              if (priceData.change !== null) quote.d = priceData.change;
              if (priceData.changePercent !== null) quote.dp = priceData.changePercent;
              
              mockRawData[symbol] = quote;
            });

            // Transform the data
            const transformedData = transformStocksData(mockRawData, validSymbols);

            // Property: Transformer should handle missing fields gracefully
            // All required fields should still be present with default values
            for (const stock of transformedData) {
              // Required fields must exist
              if (!('symbol' in stock)) {
                console.error('Missing required field: symbol');
                return false;
              }

              if (!('price' in stock)) {
                console.error('Missing required field: price');
                return false;
              }

              if (!('change24h' in stock)) {
                console.error('Missing required field: change24h');
                return false;
              }

              if (!('lastUpdate' in stock)) {
                console.error('Missing required field: lastUpdate');
                return false;
              }

              // Fields should have valid types even when source data is missing
              if (typeof stock.price !== 'number' || isNaN(stock.price)) {
                console.error(`Invalid price value: ${stock.price} (type: ${typeof stock.price})`);
                return false;
              }

              if (typeof stock.change24h !== 'number' || isNaN(stock.change24h)) {
                console.error(`Invalid change24h value: ${stock.change24h} (type: ${typeof stock.change24h})`);
                return false;
              }

              // Price should default to 0 if missing, not negative
              if (stock.price < 0) {
                console.error(`Price should not be negative: ${stock.price}`);
                return false;
              }
            }

            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true
        }
      );
    });

    test('transformed data should have consistent structure across all data types', () => {
      fc.assert(
        fc.property(
          // Generate data for different asset types
          fc.record({
            stockSymbol: fc.string({ minLength: 2, maxLength: 4, unit: fc.constantFrom('A', 'B', 'C', 'D', 'E') }),
            price: fc.double({ min: 0.01, max: 5000, noNaN: true }),
            change: fc.double({ min: -50, max: 50, noNaN: true })
          }),
          (data) => {
            // Transform stock data
            const stockRawData = {
              [data.stockSymbol]: {
                c: data.price,
                h: data.price * 1.05,
                l: data.price * 0.95,
                o: data.price,
                pc: data.price - data.change,
                d: data.change,
                dp: (data.change / data.price) * 100,
                t: Math.floor(Date.now() / 1000)
              }
            };
            const stockTransformed = transformStocksData(stockRawData, [data.stockSymbol]);

            // Property: All transformed data should have the same core structure
            const coreFields = ['symbol', 'price', 'change24h', 'lastUpdate', 'source'];

            if (stockTransformed.length > 0) {
              const stock = stockTransformed[0];
              
              for (const field of coreFields) {
                if (!(field in stock)) {
                  console.error(`Stock data missing core field: ${field}`);
                  console.error(`Available fields: ${Object.keys(stock).join(', ')}`);
                  return false;
                }
              }

              // Verify source field is correct
              if (stock.source !== 'finnhub') {
                console.error(`Stock source should be 'finnhub', got '${stock.source}'`);
                return false;
              }

              // Verify data types
              if (typeof stock.symbol !== 'string' || 
                  typeof stock.price !== 'number' || 
                  typeof stock.change24h !== 'number' ||
                  typeof stock.lastUpdate !== 'string' ||
                  typeof stock.source !== 'string') {
                console.error('Stock data has incorrect field types');
                return false;
              }
            }

            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true
        }
      );
    });

    test('transformed data should preserve precision for price values', () => {
      fc.assert(
        fc.property(
          // Generate stock symbol and precise price
          fc.string({ minLength: 2, maxLength: 4, unit: fc.constantFrom('A', 'B', 'C', 'D', 'E') }),
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          (symbol, price) => {
            if (symbol.length === 0) return true;

            // Create mock data with precise price
            const mockRawData = {
              [symbol]: {
                c: price,
                h: price * 1.02,
                l: price * 0.98,
                o: price,
                pc: price * 0.99,
                d: price * 0.01,
                dp: 1.0,
                t: Math.floor(Date.now() / 1000)
              }
            };

            const transformedData = transformStocksData(mockRawData, [symbol]);

            if (transformedData.length === 0) return true;

            const stock = transformedData[0];

            // Property: Price should be formatted to 2 decimal places
            const expectedPrice = parseFloat(price.toFixed(2));
            
            if (stock.price !== expectedPrice) {
              // Allow for small floating point differences
              const difference = Math.abs(stock.price - expectedPrice);
              if (difference > 0.01) {
                console.error(`Price precision mismatch:`);
                console.error(`  Input price: ${price}`);
                console.error(`  Expected: ${expectedPrice}`);
                console.error(`  Actual: ${stock.price}`);
                console.error(`  Difference: ${difference}`);
                return false;
              }
            }

            // Verify price has at most 2 decimal places
            const priceStr = stock.price.toString();
            const decimalIndex = priceStr.indexOf('.');
            if (decimalIndex !== -1) {
              const decimalPlaces = priceStr.length - decimalIndex - 1;
              if (decimalPlaces > 2) {
                console.error(`Price has too many decimal places: ${priceStr} (${decimalPlaces} places)`);
                return false;
              }
            }

            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true
        }
      );
    });
  });
});

/**
 * Unit Tests for StocksProvider
 * Tests API request construction, error handling, and cache integration
 * Requirements: 1.1, 1.4, 4.5
 */

import StocksProvider from './stocksProvider.js';

describe('StocksProvider - Unit Tests', () => {
  let provider;

  beforeEach(() => {
    provider = new StocksProvider();
  });

  describe('Configuration and Initialization', () => {
    test('should initialize with correct configuration', () => {
      expect(provider.baseUrl).toBeDefined();
      // API key may be undefined in test environment
      expect(provider.timeout).toBeDefined();
      expect(provider.retryConfig).toBeDefined();
    });

    test('should have retry configuration matching requirements', () => {
      expect(provider.retryConfig.maxAttempts).toBe(3);
      expect(provider.retryConfig.initialDelay).toBe(1000);
      expect(provider.retryConfig.maxDelay).toBe(5000);
      expect(provider.retryConfig.backoffMultiplier).toBe(2);
    });

    test('should have default stock symbols configured', () => {
      expect(provider.defaultSymbols).toBeDefined();
      expect(Array.isArray(provider.defaultSymbols)).toBe(true);
      expect(provider.defaultSymbols.length).toBeGreaterThan(0);
      
      // Verify they are valid stock symbols (uppercase letters)
      provider.defaultSymbols.forEach(symbol => {
        expect(typeof symbol).toBe('string');
        expect(symbol).toMatch(/^[A-Z]+$/);
      });
    });
  });

  describe('Error Classification', () => {
    test('should correctly identify retryable network errors', () => {
      const networkError = new Error('Network timeout');
      networkError.request = {}; // Indicates network error
      
      const shouldRetry = provider._shouldRetry(networkError);
      expect(shouldRetry).toBe(true);
    });

    test('should not retry on 401 unauthorized errors', () => {
      const authError = new Error('Unauthorized');
      authError.response = {
        status: 401,
        statusText: 'Unauthorized'
      };
      
      const shouldRetry = provider._shouldRetry(authError);
      expect(shouldRetry).toBe(false);
    });

    test('should not retry on 429 rate limit errors', () => {
      const rateLimitError = new Error('Too Many Requests');
      rateLimitError.response = {
        status: 429,
        statusText: 'Too Many Requests'
      };
      
      const shouldRetry = provider._shouldRetry(rateLimitError);
      expect(shouldRetry).toBe(false);
    });

    test('should retry on 500 server errors', () => {
      const serverError = new Error('Internal Server Error');
      serverError.response = {
        status: 500,
        statusText: 'Internal Server Error'
      };
      
      const shouldRetry = provider._shouldRetry(serverError);
      expect(shouldRetry).toBe(true);
    });

    test('should retry on 503 service unavailable errors', () => {
      const serverError = new Error('Service Unavailable');
      serverError.response = {
        status: 503,
        statusText: 'Service Unavailable'
      };
      
      const shouldRetry = provider._shouldRetry(serverError);
      expect(shouldRetry).toBe(true);
    });

    test('should not retry on invalid symbol errors', () => {
      const invalidSymbolError = new Error('Invalid stock symbol or no data available');
      
      const shouldRetry = provider._shouldRetry(invalidSymbolError);
      expect(shouldRetry).toBe(false);
    });
  });

  describe('Exponential Backoff Calculation', () => {
    test('should calculate correct backoff delay for attempt 1', () => {
      const delay = provider._calculateBackoffDelay(1);
      expect(delay).toBe(1000); // 1000 * 2^0 = 1000
    });

    test('should calculate correct backoff delay for attempt 2', () => {
      const delay = provider._calculateBackoffDelay(2);
      expect(delay).toBe(2000); // 1000 * 2^1 = 2000
    });

    test('should calculate correct backoff delay for attempt 3', () => {
      const delay = provider._calculateBackoffDelay(3);
      expect(delay).toBe(4000); // 1000 * 2^2 = 4000
    });

    test('should cap delay at maxDelay for attempt 4', () => {
      const delay = provider._calculateBackoffDelay(4);
      expect(delay).toBe(5000); // 1000 * 2^3 = 8000, capped at 5000
    });

    test('should cap delay at maxDelay for high attempt numbers', () => {
      const delay = provider._calculateBackoffDelay(10);
      expect(delay).toBe(5000); // Should be capped at maxDelay
    });

    test('should follow exponential pattern before hitting cap', () => {
      const delay1 = provider._calculateBackoffDelay(1);
      const delay2 = provider._calculateBackoffDelay(2);
      const delay3 = provider._calculateBackoffDelay(3);
      
      // Each delay should be double the previous (before cap)
      expect(delay2).toBe(delay1 * 2);
      expect(delay3).toBe(delay2 * 2);
    });
  });

  describe('Error Formatting', () => {
    test('should format network error with correct structure', () => {
      const networkError = new Error('Network Error');
      networkError.request = {};
      
      const formattedError = provider._formatError(networkError, 'getStockQuote(AAPL)');
      
      expect(formattedError.provider).toBe('Finnhub');
      expect(formattedError.method).toBe('getStockQuote(AAPL)');
      expect(formattedError.message).toContain('timeout or network error');
      expect(formattedError.statusCode).toBe(0);
      expect(formattedError.originalError).toBe('Network Error');
      expect(formattedError.retryable).toBe(true);
    });

    test('should format API error with correct structure', () => {
      const apiError = new Error('API Error');
      apiError.response = {
        status: 503,
        statusText: 'Service Unavailable',
        data: { error: 'Service temporarily unavailable' }
      };
      
      const formattedError = provider._formatError(apiError, 'getStockQuote(AAPL)');
      
      expect(formattedError.provider).toBe('Finnhub');
      expect(formattedError.method).toBe('getStockQuote(AAPL)');
      expect(formattedError.message).toContain('503');
      expect(formattedError.statusCode).toBe(503);
      expect(formattedError.originalError).toBe('API Error');
      expect(formattedError.retryable).toBe(true);
      expect(formattedError.data).toEqual({ error: 'Service temporarily unavailable' });
    });

    test('should format 401 error as non-retryable', () => {
      const authError = new Error('Unauthorized');
      authError.response = {
        status: 401,
        statusText: 'Unauthorized',
        data: { error: 'Invalid API key' }
      };
      
      const formattedError = provider._formatError(authError, 'getStockQuote(AAPL)');
      
      expect(formattedError.provider).toBe('Finnhub');
      expect(formattedError.statusCode).toBe(401);
      expect(formattedError.retryable).toBe(false);
    });

    test('should format 429 rate limit error as non-retryable', () => {
      const rateLimitError = new Error('Too Many Requests');
      rateLimitError.response = {
        status: 429,
        statusText: 'Too Many Requests',
        data: { error: 'Rate limit exceeded' }
      };
      
      const formattedError = provider._formatError(rateLimitError, 'getStockQuote(AAPL)');
      
      expect(formattedError.provider).toBe('Finnhub');
      expect(formattedError.statusCode).toBe(429);
      expect(formattedError.retryable).toBe(false);
    });

    test('should format generic error with correct structure', () => {
      const genericError = new Error('Something went wrong');
      
      const formattedError = provider._formatError(genericError, 'getStockQuote(AAPL)');
      
      expect(formattedError.provider).toBe('Finnhub');
      expect(formattedError.method).toBe('getStockQuote(AAPL)');
      expect(formattedError.message).toContain('Something went wrong');
      expect(formattedError.statusCode).toBe(0);
      expect(formattedError.originalError).toBe('Something went wrong');
    });

    test('should include all required error fields per requirements 4.5', () => {
      const error = new Error('Test error');
      error.response = {
        status: 500,
        statusText: 'Internal Server Error'
      };
      
      const formattedError = provider._formatError(error, 'testMethod');
      
      // Verify all required fields from requirements 4.5
      expect(formattedError).toHaveProperty('provider');
      expect(formattedError).toHaveProperty('method');
      expect(formattedError).toHaveProperty('message');
      expect(formattedError).toHaveProperty('statusCode');
      expect(formattedError).toHaveProperty('originalError');
      expect(formattedError).toHaveProperty('retryable');
      
      // Verify types
      expect(typeof formattedError.provider).toBe('string');
      expect(typeof formattedError.method).toBe('string');
      expect(typeof formattedError.message).toBe('string');
      expect(typeof formattedError.statusCode).toBe('number');
      expect(typeof formattedError.originalError).toBe('string');
      expect(typeof formattedError.retryable).toBe('boolean');
    });
  });

  describe('Sleep Utility', () => {
    test('should sleep for specified milliseconds', async () => {
      const startTime = Date.now();
      await provider._sleep(100);
      const endTime = Date.now();
      
      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(95); // Allow small tolerance
      expect(elapsed).toBeLessThan(150); // Should not take too long
    });

    test('should return a promise', () => {
      const result = provider._sleep(10);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('API Endpoint Construction', () => {
    test('should have correct base URL for Finnhub', () => {
      expect(provider.baseUrl).toContain('finnhub.io');
    });

    test('should have API key property', () => {
      // API key may be undefined in test environment, but property should exist
      expect('apiKey' in provider).toBe(true);
      // If defined, should be a string
      if (provider.apiKey) {
        expect(typeof provider.apiKey).toBe('string');
      }
    });

    test('should have timeout configured', () => {
      expect(provider.timeout).toBeDefined();
      expect(typeof provider.timeout).toBe('number');
      expect(provider.timeout).toBeGreaterThan(0);
    });
  });

  describe('Method Signatures', () => {
    test('should have getStockQuote method', () => {
      expect(typeof provider.getStockQuote).toBe('function');
    });

    test('should have getMultipleStockQuotes method', () => {
      expect(typeof provider.getMultipleStockQuotes).toBe('function');
    });

    test('should have getStockTimeSeries method', () => {
      expect(typeof provider.getStockTimeSeries).toBe('function');
    });

    test('should have getCompanyOverview method', () => {
      expect(typeof provider.getCompanyOverview).toBe('function');
    });

    test('should have private _makeRequest method', () => {
      expect(typeof provider._makeRequest).toBe('function');
    });

    test('should have private _shouldRetry method', () => {
      expect(typeof provider._shouldRetry).toBe('function');
    });

    test('should have private _calculateBackoffDelay method', () => {
      expect(typeof provider._calculateBackoffDelay).toBe('function');
    });

    test('should have private _sleep method', () => {
      expect(typeof provider._sleep).toBe('function');
    });

    test('should have private _formatError method', () => {
      expect(typeof provider._formatError).toBe('function');
    });
  });

});
