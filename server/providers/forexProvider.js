/**
 * ForexProvider - Alpha Vantage API Integration for Forex
 * Fetches foreign exchange market data from Alpha Vantage API
 */

import axios from 'axios';
import { apiConfig } from '../config/apiConfig.js';

class ForexProvider {
  constructor() {
    this.baseUrl = apiConfig.alphaVantage.baseUrl;
    this.apiKey = apiConfig.alphaVantage.apiKey;
    this.timeout = apiConfig.alphaVantage.timeout;
    this.retryConfig = apiConfig.retry;
    
    // Popular forex pairs to display
    this.defaultPairs = [
      { from: 'EUR', to: 'USD', name: 'EUR/USD' },
      { from: 'GBP', to: 'USD', name: 'GBP/USD' },
      { from: 'USD', to: 'JPY', name: 'USD/JPY' },
      { from: 'USD', to: 'CHF', name: 'USD/CHF' },
      { from: 'AUD', to: 'USD', name: 'AUD/USD' },
      { from: 'USD', to: 'CAD', name: 'USD/CAD' },
      { from: 'NZD', to: 'USD', name: 'NZD/USD' },
      { from: 'EUR', to: 'GBP', name: 'EUR/GBP' },
      { from: 'EUR', to: 'JPY', name: 'EUR/JPY' },
      { from: 'GBP', to: 'JPY', name: 'GBP/JPY' }
    ];
  }

  /**
   * Get exchange rate for a currency pair
   * @param {string} fromCurrency - From currency code (e.g., 'EUR')
   * @param {string} toCurrency - To currency code (e.g., 'USD')
   * @returns {Promise<Object>} Exchange rate data
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    const params = {
      function: 'CURRENCY_EXCHANGE_RATE',
      from_currency: fromCurrency,
      to_currency: toCurrency,
      apikey: this.apiKey
    };

    return this._makeRequest(params, `getExchangeRate(${fromCurrency}/${toCurrency})`);
  }

  /**
   * Get multiple exchange rates
   * Note: Alpha Vantage free tier limits to 5 calls/minute
   * @param {Array<Object>} pairs - Array of {from, to, name} objects
   * @returns {Promise<Object>} Object with pair names as keys
   */
  async getMultipleExchangeRates(pairs = this.defaultPairs) {
    const results = {};
    const batchSize = 5; // Free tier limit
    const delayBetweenBatches = 60000; // 1 minute

    // Process in batches to respect rate limits
    for (let i = 0; i < pairs.length; i += batchSize) {
      const batch = pairs.slice(i, i + batchSize);
      
      console.log(`[ForexProvider] Fetching batch ${Math.floor(i / batchSize) + 1} (${batch.map(p => p.name).join(', ')})`);
      
      // Fetch batch concurrently
      const batchPromises = batch.map(async pair => {
        try {
          const data = await this.getExchangeRate(pair.from, pair.to);
          return { pair: pair.name, data };
        } catch (error) {
          console.error(`[ForexProvider] Error fetching ${pair.name}:`, error.message);
          return { pair: pair.name, data: null, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Store results
      batchResults.forEach(({ pair, data, error }) => {
        results[pair] = error ? { error } : data;
      });

      // Wait before next batch (except for last batch)
      if (i + batchSize < pairs.length) {
        console.log(`[ForexProvider] Waiting ${delayBetweenBatches / 1000}s before next batch...`);
        await this._sleep(delayBetweenBatches);
      }
    }

    return results;
  }

  /**
   * Get forex time series data
   * @param {string} fromCurrency - From currency code
   * @param {string} toCurrency - To currency code
   * @param {string} interval - Time interval ('1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly')
   * @returns {Promise<Object>} Time series data
   */
  async getForexTimeSeries(fromCurrency, toCurrency, interval = '60min') {
    const isIntraday = !['daily', 'weekly', 'monthly'].includes(interval);
    
    const params = {
      function: isIntraday ? 'FX_INTRADAY' : 'FX_DAILY',
      from_symbol: fromCurrency,
      to_symbol: toCurrency,
      apikey: this.apiKey
    };

    if (isIntraday) {
      params.interval = interval;
    }

    return this._makeRequest(params, `getForexTimeSeries(${fromCurrency}/${toCurrency}, ${interval})`);
  }

  /**
   * Make HTTP request with retry logic and error handling
   * @private
   */
  async _makeRequest(params, methodName, attempt = 1) {
    try {
      console.log(`[ForexProvider] ${methodName} - Attempt ${attempt}/${this.retryConfig.maxAttempts}`);
      
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

      console.log(`[ForexProvider] ${methodName} - Success`);
      return response.data;

    } catch (error) {
      console.error(`[ForexProvider] ${methodName} - Error:`, error.message);

      // Check if we should retry
      if (attempt < this.retryConfig.maxAttempts && this._shouldRetry(error)) {
        const delay = this._calculateBackoffDelay(attempt);
        console.log(`[ForexProvider] ${methodName} - Retrying in ${delay}ms...`);
        
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
    formattedError.provider = 'AlphaVantage-Forex';
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

export default ForexProvider;
