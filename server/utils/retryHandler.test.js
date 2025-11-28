/**
 * Unit Tests for Retry Handler Utility
 * Feature: api-migration
 */

import { describe, test, expect, jest } from '@jest/globals';
import { 
  calculateBackoffDelay, 
  sleep, 
  withRetry, 
  shouldRetryDefault,
  createRetryConfig 
} from './retryHandler.js';

describe('RetryHandler - Unit Tests', () => {
  describe('calculateBackoffDelay', () => {
    test('should calculate correct delay for attempt 1', () => {
      const config = {
        initialDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2
      };
      
      const delay = calculateBackoffDelay(1, config);
      expect(delay).toBe(1000); // 1000 * 2^0 = 1000
    });

    test('should calculate correct delay for attempt 2', () => {
      const config = {
        initialDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2
      };
      
      const delay = calculateBackoffDelay(2, config);
      expect(delay).toBe(2000); // 1000 * 2^1 = 2000
    });

    test('should calculate correct delay for attempt 3', () => {
      const config = {
        initialDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2
      };
      
      const delay = calculateBackoffDelay(3, config);
      expect(delay).toBe(4000); // 1000 * 2^2 = 4000
    });

    test('should cap delay at maxDelay', () => {
      const config = {
        initialDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2
      };
      
      const delay = calculateBackoffDelay(4, config);
      expect(delay).toBe(5000); // 1000 * 2^3 = 8000, capped at 5000
    });

    test('should handle different backoff multipliers', () => {
      const config = {
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 3
      };
      
      expect(calculateBackoffDelay(1, config)).toBe(1000); // 1000 * 3^0 = 1000
      expect(calculateBackoffDelay(2, config)).toBe(3000); // 1000 * 3^1 = 3000
      expect(calculateBackoffDelay(3, config)).toBe(9000); // 1000 * 3^2 = 9000
    });
  });

  describe('sleep', () => {
    test('should resolve after specified time', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      
      // Allow some tolerance for timing
      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThan(200);
    });
  });

  describe('withRetry', () => {
    test('should return result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const shouldRetry = jest.fn();
      
      const result = await withRetry(fn, shouldRetry);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).not.toHaveBeenCalled();
    });

    test('should retry on retryable error', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');
      
      const shouldRetry = jest.fn().mockReturnValue(true);
      
      const config = {
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 50,
        backoffMultiplier: 2
      };
      
      const result = await withRetry(fn, shouldRetry, config);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(shouldRetry).toHaveBeenCalledTimes(1);
    });

    test('should not retry on non-retryable error', async () => {
      const error = new Error('Invalid API key');
      const fn = jest.fn().mockRejectedValue(error);
      const shouldRetry = jest.fn().mockReturnValue(false);
      
      await expect(withRetry(fn, shouldRetry)).rejects.toThrow('Invalid API key');
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledTimes(1);
    });

    test('should throw after max attempts', async () => {
      const error = new Error('Server error');
      const fn = jest.fn().mockRejectedValue(error);
      const shouldRetry = jest.fn().mockReturnValue(true);
      
      const config = {
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 50,
        backoffMultiplier: 2
      };
      
      await expect(withRetry(fn, shouldRetry, config)).rejects.toThrow('Server error');
      
      expect(fn).toHaveBeenCalledTimes(3);
      // shouldRetry is called for each failure to determine if we should retry
      // On the 3rd attempt, it's called but then throws because hasMoreAttempts is false
      expect(shouldRetry).toHaveBeenCalledTimes(3);
    });

    test('should pass attempt number to function', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');
      
      const shouldRetry = jest.fn().mockReturnValue(true);
      
      const config = {
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 50,
        backoffMultiplier: 2
      };
      
      await withRetry(fn, shouldRetry, config);
      
      expect(fn).toHaveBeenNthCalledWith(1, 1);
      expect(fn).toHaveBeenNthCalledWith(2, 2);
      expect(fn).toHaveBeenNthCalledWith(3, 3);
    });
  });

  describe('shouldRetryDefault', () => {
    test('should return true for network errors', () => {
      const error = new Error('Network error');
      error.request = {};
      error.response = undefined;
      
      expect(shouldRetryDefault(error)).toBe(true);
    });

    test('should return true for 5xx server errors', () => {
      const error = new Error('Server error');
      error.response = { status: 500 };
      
      expect(shouldRetryDefault(error)).toBe(true);
      
      error.response.status = 503;
      expect(shouldRetryDefault(error)).toBe(true);
      
      error.response.status = 599;
      expect(shouldRetryDefault(error)).toBe(true);
    });

    test('should return false for 4xx client errors', () => {
      const error = new Error('Client error');
      error.response = { status: 400 };
      
      expect(shouldRetryDefault(error)).toBe(false);
      
      error.response.status = 404;
      expect(shouldRetryDefault(error)).toBe(false);
      
      error.response.status = 429;
      expect(shouldRetryDefault(error)).toBe(false);
    });

    test('should return false for unknown errors', () => {
      const error = new Error('Unknown error');
      
      expect(shouldRetryDefault(error)).toBe(false);
    });
  });

  describe('createRetryConfig', () => {
    test('should return default config when no overrides', () => {
      const config = createRetryConfig();
      
      expect(config).toEqual({
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2
      });
    });

    test('should merge overrides with defaults', () => {
      const config = createRetryConfig({
        maxAttempts: 5,
        initialDelay: 2000
      });
      
      expect(config).toEqual({
        maxAttempts: 5,
        initialDelay: 2000,
        maxDelay: 5000,
        backoffMultiplier: 2
      });
    });

    test('should allow complete override', () => {
      const config = createRetryConfig({
        maxAttempts: 10,
        initialDelay: 500,
        maxDelay: 10000,
        backoffMultiplier: 3
      });
      
      expect(config).toEqual({
        maxAttempts: 10,
        initialDelay: 500,
        maxDelay: 10000,
        backoffMultiplier: 3
      });
    });
  });
});
