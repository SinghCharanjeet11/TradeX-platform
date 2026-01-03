/**
 * ForexProvider - Twelve Data API Integration for Forex
 * Fetches foreign exchange market data from Twelve Data API
 */

import axios from 'axios';
import { apiConfig } from '../config/apiConfig.js';

class ForexProvider {
  constructor() {
    this.baseUrl = apiConfig.twelveData.baseUrl;
    this.apiKey = apiConfig.twelveData.apiKey;
    this.timeout = apiConfig.twelveData.timeout;
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
    const symbol = `${fromCurrency}/${toCurrency}`;
    const endpoint = `${this.baseUrl}/quote`;
    const params = {
      symbol: symbol,
      apikey: this.apiKey
    };

    const data = await this._makeRequest(endpoint, params, `getExchangeRate(${fromCurrency}/${toCurrency})`);
    
    // Transform to standard format
    return {
      success: true,
      base: fromCurrency,
      date: new Date().toISOString().split('T')[0],
      rates: { [toCurrency]: parseFloat(data.close) },
      pair: `${fromCurrency}/${toCurrency}`,
      fromCurrency,
      toCurrency,
      rate: parseFloat(data.close)
    };
  }

  /**
   * Get multiple exchange rates
   * Twelve Data allows concurrent requests
   * @param {Array<Object>} pairs - Array of {from, to, name} objects
   * @returns {Promise<Object>} Object with pair names as keys
   */
  async getMultipleExchangeRates(pairs = this.defaultPairs) {
    const results = {};
    
    console.log(`[ForexProvider] Fetching ${pairs.length} forex pairs concurrently`);
    
    // Fetch all concurrently
    const promises = pairs.map(async pair => {
      try {
        const data = await this.getExchangeRate(pair.from, pair.to);
        return { pair: pair.name, data };
      } catch (error) {
        console.error(`[ForexProvider] Error fetching ${pair.name}:`, error.message);
        return { pair: pair.name, data: null, error: error.message };
      }
    });

    const allResults = await Promise.all(promises);
    
    // Store results
    allResults.forEach(({ pair, data, error }) => {
      results[pair] = error ? { error } : data;
    });

    return results;
  }

  /**
   * Get forex time series data (historical rates)
   * @param {string} fromCurrency - From currency code
   * @param {string} toCurrency - To currency code
   * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to latest)
   * @returns {Promise<Object>} Historical rate data
   */
  async getForexTimeSeries(fromCurrency, toCurrency, date = null) {
    const symbol = `${fromCurrency}/${toCurrency}`;
    const endpoint = `${this.baseUrl}/time_series`;
    const params = {
      symbol: symbol,
      interval: '1day',
      apikey: this.apiKey,
      outputsize: 30
    };

    return this._makeRequest(endpoint, params, `getForexTimeSeries(${fromCurrency}/${toCurrency}, ${date || 'latest'})`);
  }

  /**
   * Make HTTP request with retry logic and error handling
   * @private
   */
  async _makeRequest(endpoint, params, methodName, attempt = 1) {
    try {
      console.log(`[ForexProvider] ${methodName} - Attempt ${attempt}/${this.retryConfig.maxAttempts}`);
      
      const response = await axios.get(endpoint, {
        params,
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json'
        }
      });

      // Check for API error messages
      if (response.data.status === 'error') {
        throw new Error(`Twelve Data API Error: ${response.data.message || 'Unknown error'}`);
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
    // Don't retry API key errors
    if (error.message && (error.message.includes('invalid_access_key') || error.message.includes('missing_access_key'))) {
      return false;
    }

    // Don't retry rate limit errors
    if (error.message && error.message.includes('rate_limit')) {
      return false;
    }

    // Don't retry invalid currency errors
    if (error.message && error.message.includes('invalid_currency')) {
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
    formattedError.provider = 'Twelve Data';
    formattedError.method = methodName;
    formattedError.originalError = error.message;
    formattedError.retryable = this._shouldRetry(error);

    if (error.response) {
      formattedError.message = `Twelve Data API error: ${error.response.status} - ${error.response.statusText}`;
      formattedError.statusCode = error.response.status;
      formattedError.data = error.response.data;
    } else if (error.request) {
      formattedError.message = 'Twelve Data API request timeout or network error';
      formattedError.statusCode = 0;
    } else {
      formattedError.message = `Twelve Data API request error: ${error.message}`;
      formattedError.statusCode = 0;
    }

    return formattedError;
  }
}

export default ForexProvider;
