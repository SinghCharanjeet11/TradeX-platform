/**
 * StocksProvider - Alpha Vantage API Integration for Stocks
 * Fetches stock market data from Alpha Vantage API
 */

import axios from 'axios';
import { apiConfig } from '../config/apiConfig.js';

class StocksProvider {
  constructor() {
    this.baseUrl = apiConfig.alphaVantage.baseUrl;
    this.apiKey = apiConfig.alphaVantage.apiKey;
    this.timeout = apiConfig.alphaVantage.timeout;
    this.retryConfig = apiConfig.retry;
    
    // Popular stock symbols to display
    this.defaultSymbols = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
      'META', 'NVDA', 'JPM', 'V', 'WMT',
      'DIS', 'NFLX', 'BA', 'GS', 'IBM'
    ];
  }

  /**
   * Get stock quote for a single symbol
   * @param {string} symbol - Stock symbol (e.g., 'AAPL')
   * @returns {Promise<Object>} Stock quote data
   */
  async getStockQuote(symbol) {
    const params = {
      function: 'GLOBAL_QUOTE',
      symbol: symbol,
      apikey: this.apiKey
    };

    return this._makeRequest(params, `getStockQuote(${symbol})`);
  }

  /**
   * Get multiple stock quotes
   * Note: Alpha Vantage free tier limits to 5 calls/minute
   * This method implements request queuing to respect rate limits
   * @param {Array<string>} symbols - Array of stock symbols
   * @returns {Promise<Object>} Object with symbol keys and quote data
   */
  async getMultipleStockQuotes(symbols = this.defaultSymbols) {
    const results = {};
    const batchSize = 5; // Free tier limit
    const delayBetweenBatches = 60000; // 1 minute

    // Process in batches to respect rate limits
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      console.log(`[StocksProvider] Fetching batch ${Math.floor(i / batchSize) + 1} (${batch.join(', ')})`);
      
      // Fetch batch concurrently
      const batchPromises = batch.map(async symbol => {
        try {
          const data = await this.getStockQuote(symbol);
          return { symbol, data };
        } catch (error) {
          console.error(`[StocksProvider] Error fetching ${symbol}:`, error.message);
          return { symbol, data: null, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Store results
      batchResults.forEach(({ symbol, data, error }) => {
        results[symbol] = error ? { error } : data;
      });

      // Wait before next batch (except for last batch)
      if (i + batchSize < symbols.length) {
        console.log(`[StocksProvider] Waiting ${delayBetweenBatches / 1000}s before next batch...`);
        await this._sleep(delayBetweenBatches);
      }
    }

    return results;
  }

  /**
   * Get time series data for a stock
   * @param {string} symbol - Stock symbol
   * @param {string} interval - Time interval ('daily', 'weekly', 'monthly')
   * @returns {Promise<Object>} Time series data
   */
  async getStockTimeSeries(symbol, interval = 'daily') {
    const functionMap = {
      'daily': 'TIME_SERIES_DAILY',
      'weekly': 'TIME_SERIES_WEEKLY',
      'monthly': 'TIME_SERIES_MONTHLY'
    };

    const params = {
      function: functionMap[interval] || 'TIME_SERIES_DAILY',
      symbol: symbol,
      apikey: this.apiKey
    };

    return this._makeRequest(params, `getStockTimeSeries(${symbol}, ${interval})`);
  }

  /**
   * Make HTTP request with retry logic and error handling
   * @private
   */
  async _makeRequest(params, methodName, attempt = 1) {
    try {
      console.log(`[StocksProvider] ${methodName} - Attempt ${attempt}/${this.retryConfig.maxAttempts}`);
      
      const response = await axios.get(this.baseUrl, {
        params,
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json'
        }
      });

      // Check for API error messages
      if (response.data['Error Message']) {
        throw new Error(`Alpha Vantage API Error: ${response.data['Error Message']}`);
      }

      if (response.data['Note']) {
        // Rate limit message
        throw new Error(`Alpha Vantage Rate Limit: ${response.data['Note']}`);
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
        return this._makeRequest(params, methodName, attempt + 1);
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
    // Don't retry rate limit errors
    if (error.message && error.message.includes('Rate Limit')) {
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
    formattedError.provider = 'AlphaVantage-Stocks';
    formattedError.method = methodName;
    formattedError.originalError = error.message;

    if (error.response) {
      formattedError.message = `Alpha Vantage API error: ${error.response.status} - ${error.response.statusText}`;
      formattedError.statusCode = error.response.status;
      formattedError.data = error.response.data;
    } else if (error.request) {
      formattedError.message = 'Alpha Vantage API request timeout or network error';
      formattedError.statusCode = 0;
    } else {
      formattedError.message = `Alpha Vantage API request error: ${error.message}`;
      formattedError.statusCode = 0;
    }

    return formattedError;
  }
}

export default StocksProvider;
