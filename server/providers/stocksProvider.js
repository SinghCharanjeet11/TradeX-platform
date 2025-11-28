/**
 * StocksProvider - Finnhub API Integration for Stocks
 * Fetches stock market data from Finnhub API
 */

import axios from 'axios';
import { apiConfig } from '../config/apiConfig.js';

class StocksProvider {
  constructor() {
    this.baseUrl = apiConfig.finnhub.baseUrl;
    this.apiKey = apiConfig.finnhub.apiKey;
    this.timeout = apiConfig.finnhub.timeout;
    this.retryConfig = apiConfig.retry;
    
    // Popular stock symbols to display
    this.defaultSymbols = [
      'AAPL',  // Apple
      'MSFT',  // Microsoft
      'GOOGL', // Alphabet
      'AMZN',  // Amazon
      'TSLA',  // Tesla
      'META',  // Meta
      'NVDA',  // NVIDIA
      'JPM',   // JPMorgan Chase
      'V',     // Visa
      'WMT'    // Walmart
    ];
  }

  /**
   * Get stock quote for a single symbol
   * @param {string} symbol - Stock symbol (e.g., 'AAPL')
   * @returns {Promise<Object>} Stock quote data
   */
  async getStockQuote(symbol) {
    const endpoint = `${this.baseUrl}/quote`;
    const params = {
      symbol: symbol,
      token: this.apiKey
    };

    return this._makeRequest(endpoint, params, `getStockQuote(${symbol})`);
  }

  /**
   * Get multiple stock quotes
   * Finnhub allows 60 calls/minute, so we can fetch concurrently
   * @param {Array<string>} symbols - Array of stock symbols
   * @returns {Promise<Object>} Object with symbols as keys
   */
  async getMultipleStockQuotes(symbols = this.defaultSymbols) {
    const results = {};
    
    console.log(`[StocksProvider] Fetching ${symbols.length} stock quotes concurrently`);
    
    // Fetch all concurrently (Finnhub allows 60/min)
    const promises = symbols.map(async symbol => {
      try {
        const data = await this.getStockQuote(symbol);
        return { symbol, data };
      } catch (error) {
        console.error(`[StocksProvider] Error fetching ${symbol}:`, error.message);
        return { symbol, data: null, error: error.message };
      }
    });

    const allResults = await Promise.all(promises);
    
    // Store results
    allResults.forEach(({ symbol, data, error }) => {
      results[symbol] = error ? { error } : data;
    });

    return results;
  }

  /**
   * Get stock time series data (candles)
   * @param {string} symbol - Stock symbol
   * @param {string} interval - Time interval ('1', '5', '15', '30', '60', 'D', 'W', 'M')
   * @param {number} from - Unix timestamp for start date
   * @param {number} to - Unix timestamp for end date
   * @returns {Promise<Object>} Time series data
   */
  async getStockTimeSeries(symbol, interval = 'D', from = null, to = null) {
    // Default to last 30 days if not specified
    if (!to) {
      to = Math.floor(Date.now() / 1000);
    }
    if (!from) {
      from = to - (30 * 24 * 60 * 60); // 30 days ago
    }

    const endpoint = `${this.baseUrl}/stock/candle`;
    const params = {
      symbol: symbol,
      resolution: interval,
      from: from,
      to: to,
      token: this.apiKey
    };

    return this._makeRequest(endpoint, params, `getStockTimeSeries(${symbol}, ${interval})`);
  }

  /**
   * Get company overview information
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Company overview data
   */
  async getCompanyOverview(symbol) {
    const endpoint = `${this.baseUrl}/stock/profile2`;
    const params = {
      symbol: symbol,
      token: this.apiKey
    };

    return this._makeRequest(endpoint, params, `getCompanyOverview(${symbol})`);
  }

  /**
   * Make HTTP request with retry logic and error handling
   * @private
   */
  async _makeRequest(endpoint, params, methodName, attempt = 1) {
    try {
      console.log(`[StocksProvider] ${methodName} - Attempt ${attempt}/${this.retryConfig.maxAttempts}`);
      
      const response = await axios.get(endpoint, {
        params,
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json'
        }
      });

      // Check for API error messages
      if (response.data.error) {
        throw new Error(`Finnhub API Error: ${response.data.error}`);
      }

      // Check if response is empty (invalid symbol or no data)
      if (response.data.c === 0 && response.data.d === null) {
        throw new Error(`Invalid stock symbol or no data available for this symbol`);
      }

      console.log(`[StocksProvider] ${methodName} - Success`);
      return response.data;

    } catch (error) {
      console.error(`[StocksProvider] ${methodName} - Error:`, error.message);

      // Check if we should retry
      if (attempt < this.retryConfig.maxAttempts && this._shouldRetry(error)) {
        const delay = this._calculateBackoffDelay(attempt);
        console.log(`[StocksProvider] ${methodName} - Retrying in ${delay}ms...`);
        
        await this._sleep(delay);
        return this._makeRequest(endpoint, params, methodName, attempt + 1);
      }

      // Max retries reached or non-retryable error
      throw this._formatError(error, methodName);
    }
  }

  /**
   * Determine if error is retryable
   * @private
   */
  _shouldRetry(error) {
    // Don't retry invalid symbol errors
    if (error.message && error.message.includes('Invalid stock symbol')) {
      return false;
    }

    // Don't retry API key errors
    if (error.response && error.response.status === 401) {
      return false;
    }

    // Don't retry rate limit errors (429)
    if (error.response && error.response.status === 429) {
      return false;
    }

    // Retry on network errors or 5xx server errors
    if (!error.response) {
      return true; // Network error
    }

    const status = error.response.status;
    return status >= 500 && status < 600; // Server errors
  }

  /**
   * Calculate exponential backoff delay
   * @private
   */
  _calculateBackoffDelay(attempt) {
    const delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format error for consistent error handling
   * @private
   */
  _formatError(error, methodName) {
    const formattedError = new Error();
    formattedError.provider = 'Finnhub';
    formattedError.method = methodName;
    formattedError.originalError = error.message;
    formattedError.retryable = this._shouldRetry(error);

    if (error.response) {
      formattedError.message = `Finnhub API error: ${error.response.status} - ${error.response.statusText}`;
      formattedError.statusCode = error.response.status;
      formattedError.data = error.response.data;
    } else if (error.request) {
      formattedError.message = 'Finnhub API request timeout or network error';
      formattedError.statusCode = 0;
    } else {
      formattedError.message = `Finnhub API request error: ${error.message}`;
      formattedError.statusCode = 0;
    }

    return formattedError;
  }
}

export default StocksProvider;
