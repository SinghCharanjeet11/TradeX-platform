/**
 * Property-Based Tests for Error Handler Utility
 * Feature: api-migration
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { formatError, isRetryable, classifyError } from './errorHandler.js';

/**
 * Property 9: Error format consistency
 * For any error from any provider (stocks, forex, commodities), 
 * the error object should have the same structure (provider, method, message, statusCode)
 * Validates: Requirements 4.5
 * 
 * **Feature: api-migration, Property 9: Error format consistency**
 */
describe('ErrorHandler - Property-Based Tests', () => {
  describe('Property 9: Error format consistency', () => {
    test('formatError should return consistent structure for all providers and error types', () => {
      fc.assert(
        fc.property(
          // Generate provider names
          fc.constantFrom('Finnhub', 'Fixer.io', 'Metals-API'),
          // Generate method names
          fc.string({ minLength: 5, maxLength: 30 }),
          // Generate different error types
          fc.oneof(
            // Network error (no response)
            fc.record({
              message: fc.string({ minLength: 10, maxLength: 100 }),
              request: fc.constant({}),
              response: fc.constant(undefined)
            }),
            // HTTP error with response
            fc.record({
              message: fc.string({ minLength: 10, maxLength: 100 }),
              response: fc.record({
                status: fc.integer({ min: 400, max: 599 }),
                statusText: fc.constantFrom('Bad Request', 'Unauthorized', 'Not Found', 'Internal Server Error', 'Service Unavailable'),
                data: fc.object()
              })
            }),
            // Generic error
            fc.record({
              message: fc.string({ minLength: 10, maxLength: 100 })
            })
          ),
          (provider, methodName, errorData) => {
            // Create error object
            const error = new Error(errorData.message);
            if (errorData.request) error.request = errorData.request;
            if (errorData.response) error.response = errorData.response;

            // Format the error
            const formatted = formatError(error, provider, methodName);

            // Verify consistent structure
            expect(formatted).toHaveProperty('provider');
            expect(formatted).toHaveProperty('method');
            expect(formatted).toHaveProperty('message');
            expect(formatted).toHaveProperty('statusCode');
            expect(formatted).toHaveProperty('originalError');
            expect(formatted).toHaveProperty('retryable');

            // Verify types
            expect(typeof formatted.provider).toBe('string');
            expect(typeof formatted.method).toBe('string');
            expect(typeof formatted.message).toBe('string');
            expect(typeof formatted.statusCode).toBe('number');
            expect(typeof formatted.originalError).toBe('string');
            expect(typeof formatted.retryable).toBe('boolean');

            // Verify values match input
            expect(formatted.provider).toBe(provider);
            expect(formatted.method).toBe(methodName);
            expect(formatted.originalError).toBe(errorData.message);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('formatError should set correct statusCode for different error types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Finnhub', 'Fixer.io', 'Metals-API'),
          fc.string({ minLength: 5, maxLength: 30 }),
          fc.oneof(
            // Network error should have statusCode 0
            fc.record({
              type: fc.constant('network'),
              message: fc.string(),
              request: fc.constant({}),
              response: fc.constant(undefined)
            }),
            // HTTP error should have actual status code
            fc.record({
              type: fc.constant('http'),
              message: fc.string(),
              response: fc.record({
                status: fc.integer({ min: 400, max: 599 }),
                statusText: fc.string()
              })
            }),
            // Generic error should have statusCode 0
            fc.record({
              type: fc.constant('generic'),
              message: fc.string()
            })
          ),
          (provider, methodName, errorData) => {
            const error = new Error(errorData.message);
            if (errorData.request) error.request = errorData.request;
            if (errorData.response) error.response = errorData.response;

            const formatted = formatError(error, provider, methodName);

            // Verify statusCode matches error type
            if (errorData.type === 'http') {
              expect(formatted.statusCode).toBe(errorData.response.status);
            } else {
              expect(formatted.statusCode).toBe(0);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Error classification accuracy
   * For any error, the system should correctly identify whether it is retryable 
   * (network errors, 5xx) or non-retryable (4xx, rate limits)
   * Validates: Requirements 6.4
   * 
   * **Feature: api-migration, Property 10: Error classification accuracy**
   */
  describe('Property 10: Error classification accuracy', () => {
    test('isRetryable should correctly classify 5xx errors as retryable', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Finnhub', 'Fixer.io', 'Metals-API'),
          fc.integer({ min: 500, max: 599 }),
          fc.string(),
          (provider, statusCode, message) => {
            const error = new Error(message);
            error.response = {
              status: statusCode,
              statusText: 'Server Error'
            };

            const retryable = isRetryable(error, provider);

            // All 5xx errors should be retryable
            expect(retryable).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('isRetryable should correctly classify 4xx errors as non-retryable', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Finnhub', 'Fixer.io', 'Metals-API'),
          fc.integer({ min: 400, max: 499 }),
          fc.string(),
          (provider, statusCode, message) => {
            const error = new Error(message);
            error.response = {
              status: statusCode,
              statusText: 'Client Error'
            };

            const retryable = isRetryable(error, provider);

            // All 4xx errors should be non-retryable
            expect(retryable).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('isRetryable should correctly classify network errors as retryable', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Finnhub', 'Fixer.io', 'Metals-API'),
          fc.string(),
          (provider, message) => {
            const error = new Error(message);
            error.request = {}; // Has request but no response = network error
            error.response = undefined;

            const retryable = isRetryable(error, provider);

            // Network errors should be retryable
            expect(retryable).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('isRetryable should correctly classify API key errors as non-retryable', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Finnhub', 'Fixer.io', 'Metals-API'),
          fc.constantFrom(
            'invalid_access_key',
            'missing_access_key',
            'Invalid API key',
            'unauthorized'
          ),
          (provider, errorType) => {
            const error = new Error(errorType);

            const retryable = isRetryable(error, provider);

            // API key errors should not be retryable
            expect(retryable).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('isRetryable should correctly classify rate limit errors as non-retryable', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Finnhub', 'Fixer.io', 'Metals-API'),
          fc.constantFrom(
            'rate_limit',
            'rate limit exceeded',
            'too many requests',
            'Rate limit'
          ),
          (provider, errorMessage) => {
            const error = new Error(errorMessage);

            const retryable = isRetryable(error, provider);

            // Rate limit errors should not be retryable
            expect(retryable).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('classifyError should return correct classification for all error types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Finnhub', 'Fixer.io', 'Metals-API'),
          fc.oneof(
            // API key error - message-based classification
            fc.record({
              type: fc.constant('api_key'),
              message: fc.constantFrom('invalid_access_key', 'missing_access_key', 'Invalid API key'),
              expectedClass: fc.constant('INVALID_API_KEY')
            }),
            // Rate limit error - message-based classification
            fc.record({
              type: fc.constant('rate_limit'),
              message: fc.constantFrom('rate_limit', 'too many requests'),
              expectedClass: fc.constant('RATE_LIMIT')
            }),
            // Network error - has request but no response
            fc.record({
              type: fc.constant('network'),
              message: fc.string(),
              request: fc.constant({}),
              response: fc.constant(undefined),
              expectedClass: fc.constant('NETWORK_ERROR')
            }),
            // Server error - has response with 5xx status
            fc.record({
              type: fc.constant('server'),
              message: fc.string(),
              response: fc.record({
                status: fc.integer({ min: 500, max: 599 })
              }),
              expectedClass: fc.constant('SERVER_ERROR')
            }),
            // Client error - has response with 4xx status
            fc.record({
              type: fc.constant('client'),
              message: fc.string(),
              response: fc.record({
                status: fc.integer({ min: 400, max: 499 })
              }),
              expectedClass: fc.constant('CLIENT_ERROR')
            })
          ),
          (provider, errorData) => {
            const error = new Error(errorData.message);
            
            // Set up error object based on type
            if (errorData.request !== undefined) {
              error.request = errorData.request;
            }
            if (errorData.response !== undefined) {
              error.response = errorData.response;
            }

            const classification = classifyError(error, provider);

            // Verify classification matches expected
            expect(classification).toBe(errorData.expectedClass);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
