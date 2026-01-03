/**
 * Base AI Insights Service
 * Provides common functionality for all AI insight services
 */

import cacheService from './cacheService.js';

class AIInsightsService {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  /**
   * Log info message
   * @param {string} message
   * @param {object} data
   */
  logInfo(message, data = {}) {
    console.log(`[${this.serviceName}] ${message}`, data);
  }

  /**
   * Log error message
   * @param {string} message
   * @param {Error} error
   */
  logError(message, error) {
    console.error(`[${this.serviceName}] ${message}`, {
      error: error.message,
      stack: error.stack
    });
  }

  /**
   * Get cached data
   * @param {string} key
   * @returns {any|null}
   */
  getCached(key) {
    const cached = cacheService.get(key);
    if (cached) {
      this.logInfo(`Cache hit for key: ${key}`);
    }
    return cached;
  }

  /**
   * Set cached data
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds
   */
  setCached(key, value, ttlSeconds) {
    cacheService.set(key, value, ttlSeconds);
    this.logInfo(`Cached data for key: ${key} (TTL: ${ttlSeconds}s)`);
  }

  /**
   * Handle service errors with consistent error response
   * @param {Error} error
   * @param {string} operation
   * @returns {object} Error response
   */
  handleError(error, operation) {
    this.logError(`Error in ${operation}`, error);
    
    return {
      success: false,
      error: {
        message: error.message || 'An unexpected error occurred',
        operation,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Validate required parameters
   * @param {object} params
   * @param {string[]} required
   * @throws {Error} If validation fails
   */
  validateParams(params, required) {
    const missing = required.filter(field => !params[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  /**
   * Check if data is stale (older than threshold)
   * @param {Date|string} timestamp
   * @param {number} thresholdMinutes
   * @returns {boolean}
   */
  isStale(timestamp, thresholdMinutes) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = (now - date) / (1000 * 60);
    
    return diffMinutes > thresholdMinutes;
  }

  /**
   * Generate cache key
   * @param {string} prefix
   * @param {object} params
   * @returns {string}
   */
  generateCacheKey(prefix, params) {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    
    return `${prefix}:${paramString}`;
  }

  /**
   * Retry operation with exponential backoff
   * @param {Function} operation
   * @param {number} maxRetries
   * @param {number} baseDelay
   * @returns {Promise<any>}
   */
  async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          this.logInfo(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate confidence level based on data quality
   * @param {object} factors
   * @returns {number} Confidence (0-100)
   */
  calculateConfidence(factors) {
    const {
      dataPoints = 0,
      minDataPoints = 100,
      dataAge = 0,
      maxAge = 24,
      volatility = 0.5,
      maxVolatility = 1.0
    } = factors;

    // Handle NaN and invalid values
    const safeDataPoints = isNaN(dataPoints) || !isFinite(dataPoints) ? 0 : dataPoints;
    const safeDataAge = isNaN(dataAge) || !isFinite(dataAge) ? 0 : dataAge;
    const safeVolatility = isNaN(volatility) || !isFinite(volatility) ? 0.5 : volatility;

    // Data availability score (0-40 points)
    const dataScore = Math.min(40, (safeDataPoints / minDataPoints) * 40);

    // Data freshness score (0-30 points)
    const freshnessScore = Math.max(0, 30 * (1 - (safeDataAge / maxAge)));

    // Volatility score (0-30 points) - lower volatility = higher confidence
    const volatilityScore = Math.max(0, 30 * (1 - (safeVolatility / maxVolatility)));

    const totalScore = dataScore + freshnessScore + volatilityScore;
    
    return Math.round(Math.min(100, Math.max(0, totalScore)));
  }
}

export default AIInsightsService;
