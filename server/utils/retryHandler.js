/**
 * Retry Handler Utility
 * Provides configurable retry logic with exponential backoff
 */

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000,      // 1 second
  maxDelay: 5000,          // 5 seconds
  backoffMultiplier: 2
};

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (1-based)
 * @param {Object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
export function calculateBackoffDelay(attempt, config = DEFAULT_CONFIG) {
  const { initialDelay, maxDelay, backoffMultiplier } = config;
  
  // Calculate: initialDelay * (multiplier ^ (attempt - 1))
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
  
  // Cap at maxDelay
  return Math.min(delay, maxDelay);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 * @param {Function} fn - Async function to execute
 * @param {Function} shouldRetryFn - Function to determine if error is retryable
 * @param {Object} config - Retry configuration
 * @returns {Promise<any>} Result of the function
 */
export async function withRetry(fn, shouldRetryFn, config = DEFAULT_CONFIG) {
  const { maxAttempts } = config;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Execute the function
      const result = await fn(attempt);
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = shouldRetryFn(error);
      const hasMoreAttempts = attempt < maxAttempts;

      if (shouldRetry && hasMoreAttempts) {
        // Calculate delay and wait
        const delay = calculateBackoffDelay(attempt, config);
        console.log(`[RetryHandler] Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        // Don't retry - either non-retryable error or max attempts reached
        throw error;
      }
    }
  }

  // Should never reach here, but throw last error just in case
  throw lastError;
}

/**
 * Check if retry should be attempted based on error
 * This is a generic implementation - providers can override with specific logic
 * @param {Error} error - Error object
 * @returns {boolean} True if should retry
 */
export function shouldRetryDefault(error) {
  // Retry on network errors (no response)
  if (!error.response && error.request) {
    return true;
  }

  // Retry on 5xx server errors
  if (error.response) {
    const status = error.response.status;
    return status >= 500 && status < 600;
  }

  // Don't retry by default
  return false;
}

/**
 * Create a retry configuration object
 * @param {Object} overrides - Configuration overrides
 * @returns {Object} Retry configuration
 */
export function createRetryConfig(overrides = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...overrides
  };
}
