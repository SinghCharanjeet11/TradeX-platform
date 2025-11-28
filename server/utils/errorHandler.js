/**
 * Error Handler Utility
 * Provides consistent error formatting and classification across all API providers
 */

/**
 * Provider-specific error patterns for classification
 */
const ERROR_PATTERNS = {
  Finnhub: {
    invalidSymbol: ['invalid stock symbol', 'no data available'],
    invalidApiKey: ['401', 'unauthorized', 'invalid api key', 'invalid_access_key', 'missing_access_key'],
    rateLimit: ['429', 'rate limit', 'rate_limit', 'too many requests'],
    invalidRequest: ['400', 'bad request']
  },
  'Fixer.io': {
    invalidApiKey: ['invalid_access_key', 'missing_access_key', 'invalid api key', 'unauthorized'],
    rateLimit: ['rate_limit', 'too many requests'],
    invalidCurrency: ['invalid_currency', 'invalid base'],
    invalidRequest: ['invalid_request']
  },
  'Metals-API': {
    invalidApiKey: ['invalid_access_key', 'missing_access_key', 'invalid api key', 'unauthorized'],
    rateLimit: ['rate_limit', 'too many requests'],
    invalidSymbol: ['invalid_currency', 'invalid symbol'],
    invalidRequest: ['invalid_request']
  }
};

/**
 * Format error into consistent structure
 * @param {Error} error - Original error object
 * @param {string} provider - Provider name ('Finnhub', 'Fixer.io', 'Metals-API')
 * @param {string} methodName - Method name that failed
 * @returns {Error} Formatted error with standard properties
 */
export function formatError(error, provider, methodName) {
  const formattedError = new Error();
  formattedError.provider = provider;
  formattedError.method = methodName;
  formattedError.originalError = error.message;
  
  // Classify error as retryable or not
  formattedError.retryable = isRetryable(error, provider);

  // Extract status code and message
  if (error.response) {
    // HTTP response error
    formattedError.message = `${provider} API error: ${error.response.status} - ${error.response.statusText}`;
    formattedError.statusCode = error.response.status;
    formattedError.data = error.response.data;
  } else if (error.request) {
    // Network error (request made but no response)
    formattedError.message = `${provider} API request timeout or network error`;
    formattedError.statusCode = 0;
  } else {
    // Other errors (request setup, etc.)
    formattedError.message = `${provider} API request error: ${error.message}`;
    formattedError.statusCode = 0;
  }

  return formattedError;
}

/**
 * Determine if an error is retryable
 * @param {Error} error - Error object
 * @param {string} provider - Provider name
 * @returns {boolean} True if error should be retried
 */
export function isRetryable(error, provider) {
  const errorMessage = error.message?.toLowerCase() || '';
  const patterns = ERROR_PATTERNS[provider] || {};

  // Check for non-retryable error patterns
  // API key errors - don't retry
  if (patterns.invalidApiKey?.some(pattern => errorMessage.includes(pattern.toLowerCase()))) {
    return false;
  }

  // Rate limit errors - don't retry immediately
  if (patterns.rateLimit?.some(pattern => errorMessage.includes(pattern.toLowerCase()))) {
    return false;
  }

  // Invalid symbol/currency errors - don't retry
  if (patterns.invalidSymbol?.some(pattern => errorMessage.includes(pattern.toLowerCase()))) {
    return false;
  }

  if (patterns.invalidCurrency?.some(pattern => errorMessage.includes(pattern.toLowerCase()))) {
    return false;
  }

  // Invalid request errors (4xx) - don't retry
  if (patterns.invalidRequest?.some(pattern => errorMessage.includes(pattern.toLowerCase()))) {
    return false;
  }

  // Check HTTP status codes
  if (error.response) {
    const status = error.response.status;
    
    // 4xx client errors - don't retry (except 429 which is already handled above)
    if (status >= 400 && status < 500) {
      return false;
    }
    
    // 5xx server errors - retry
    if (status >= 500 && status < 600) {
      return true;
    }
  }

  // Network errors (no response) - retry
  if (!error.response && error.request) {
    return true;
  }

  // Default: don't retry unknown errors
  return false;
}

/**
 * Classify error type for logging and monitoring
 * @param {Error} error - Error object
 * @param {string} provider - Provider name
 * @returns {string} Error classification
 */
export function classifyError(error, provider) {
  const errorMessage = error.message?.toLowerCase() || '';
  const patterns = ERROR_PATTERNS[provider] || {};

  // Check message-based patterns first (these work regardless of response object)
  if (patterns.invalidApiKey?.some(pattern => errorMessage.includes(pattern.toLowerCase()))) {
    return 'INVALID_API_KEY';
  }

  if (patterns.rateLimit?.some(pattern => errorMessage.includes(pattern.toLowerCase()))) {
    return 'RATE_LIMIT';
  }

  if (patterns.invalidSymbol?.some(pattern => errorMessage.includes(pattern.toLowerCase()))) {
    return 'INVALID_SYMBOL';
  }

  if (patterns.invalidCurrency?.some(pattern => errorMessage.includes(pattern.toLowerCase()))) {
    return 'INVALID_CURRENCY';
  }

  // Check response-based classifications
  if (error.response) {
    const status = error.response.status;
    if (status >= 400 && status < 500) {
      return 'CLIENT_ERROR';
    }
    if (status >= 500 && status < 600) {
      return 'SERVER_ERROR';
    }
  }

  // Check for network errors
  if (!error.response && error.request) {
    return 'NETWORK_ERROR';
  }

  return 'UNKNOWN_ERROR';
}
