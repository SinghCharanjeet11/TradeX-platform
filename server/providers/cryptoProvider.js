/**
 * CryptoProvider - CoinGecko API Integration
 * Fetches cryptocurrency market data from CoinGecko API
 */

import axios from 'axios';
import { apiConfig } from '../config/apiConfig.js';

class CryptoProvider {
  constructor() {
    this.apiKey = process.env.COINGECKO_API_KEY;
    // Check if Pro API is explicitly enabled via environment variable
    // Default to Demo API since most keys are Demo keys
    this.isProKey = process.env.COINGECKO_USE_PRO_API === 'true';
    
    // Use Pro API only if explicitly configured, otherwise use Demo/Free API
    this.baseUrl = this.isProKey 
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';
    this.timeout = apiConfig.coingecko.timeout;
    this.retryConfig = apiConfig.retry;
    this.lastRequestTime = 0;
    this.minRequestInterval = this.apiKey ? 500 : 1500; // Faster with API key
    
    // Enhanced logging for debugging
    console.log(`[CryptoProvider] ========================================`);
    console.log(`[CryptoProvider] API Key present: ${!!this.apiKey}`);
    console.log(`[CryptoProvider] API Key type: ${this.isProKey ? 'Pro' : 'Demo/Free'}`);
    console.log(`[CryptoProvider] API Key prefix: ${this.apiKey ? this.apiKey.substring(0, 5) + '...' : 'N/A'}`);
    console.log(`[CryptoProvider] Base URL: ${this.baseUrl}`);
    console.log(`[CryptoProvider] ========================================`);
  }

  /**
   * Get top cryptocurrencies by market cap
   * @param {number} limit - Number of cryptocurrencies to fetch (default: 20)
   * @returns {Promise<Array>} Array of cryptocurrency data
   */
  async getTopCryptocurrencies(limit = 20) {
    const endpoint = `${this.baseUrl}/coins/markets`;
    const params = {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: limit,
      page: 1,
      sparkline: false,
      price_change_percentage: '24h'
    };

    return this._makeRequest(endpoint, params, 'getTopCryptocurrencies');
  }

  /**
   * Get cryptocurrency data by ID
   * @param {string} id - CoinGecko cryptocurrency ID
   * @returns {Promise<Object>} Cryptocurrency data
   */
  async getCryptocurrencyById(id) {
    const endpoint = `${this.baseUrl}/coins/${id}`;
    const params = {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false
    };

    return this._makeRequest(endpoint, params, 'getCryptocurrencyById');
  }

  /**
   * Get market chart data for a cryptocurrency
   * @param {string} id - CoinGecko cryptocurrency ID
   * @param {number|string} days - Number of days of historical data (1, 7, 30, 90, 365, 'max')
   * @returns {Promise<Object>} Chart data with prices and volumes
   */
  async getMarketChart(id, days = 7) {
    const endpoint = `${this.baseUrl}/coins/${id}/market_chart`;
    
    // Build params - CoinGecko doesn't accept 'interval' parameter for market_chart endpoint
    const params = {
      vs_currency: 'usd',
      days: days === 'max' ? 'max' : days
    };

    return this._makeRequest(endpoint, params, 'getMarketChart');
  }

  /**
   * Get detailed cryptocurrency data with market stats
   * Enhanced version for asset detail modal
   * @param {string} id - CoinGecko cryptocurrency ID
   * @returns {Promise<Object>} Detailed cryptocurrency data
   */
  async getCryptocurrencyDetails(id) {
    const endpoint = `${this.baseUrl}/coins/${id}`;
    const params = {
      localization: false,
      tickers: true,
      market_data: true,
      community_data: true,
      developer_data: false,
      sparkline: true
    };

    return this._makeRequest(endpoint, params, 'getCryptocurrencyDetails');
  }

  /**
   * Get OHLC (Open, High, Low, Close) data for candlestick charts
   * @param {string} id - CoinGecko cryptocurrency ID
   * @param {number} days - Number of days (1, 7, 14, 30, 90, 180, 365, max)
   * @returns {Promise<Array>} OHLC data array
   */
  async getOHLC(id, days = 7) {
    const endpoint = `${this.baseUrl}/coins/${id}/ohlc`;
    const params = {
      vs_currency: 'usd',
      days: days
    };

    return this._makeRequest(endpoint, params, 'getOHLC');
  }

  /**
   * Make HTTP request with retry logic and error handling
   * @private
   */
  async _makeRequest(endpoint, params, methodName, attempt = 1) {
    try {
      // Rate limiting: ensure minimum interval between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        const waitTime = this.minRequestInterval - timeSinceLastRequest;
        console.log(`[CryptoProvider] Rate limiting: waiting ${waitTime}ms before request`);
        await this._sleep(waitTime);
      }
      
      console.log(`[CryptoProvider] ${methodName} - Attempt ${attempt}/${this.retryConfig.maxAttempts}`);
      console.log(`[CryptoProvider] Endpoint: ${endpoint}`);
      
      this.lastRequestTime = Date.now();
      
      // Build headers
      const headers = {
        'Accept': 'application/json',
        'User-Agent': 'TradeX-Platform/1.0'
      };
      
      // Add API key header if available
      // Pro keys use x-cg-pro-api-key, Demo keys use x-cg-demo-api-key
      if (this.apiKey) {
        if (this.isProKey) {
          headers['x-cg-pro-api-key'] = this.apiKey;
        } else {
          headers['x-cg-demo-api-key'] = this.apiKey;
        }
      }
      
      const response = await axios.get(endpoint, {
        params,
        timeout: this.timeout,
        headers
      });

      console.log(`[CryptoProvider] ${methodName} - Success`);
      return response.data;

    } catch (error) {
      console.error(`[CryptoProvider] ${methodName} - Error:`, error.message);
      
      // Log more details for debugging
      if (error.response) {
        console.error(`[CryptoProvider] Status: ${error.response.status}`);
        console.error(`[CryptoProvider] Response:`, error.response.data);
      }

      // Check if we should retry
      if (attempt < this.retryConfig.maxAttempts && this._shouldRetry(error)) {
        const delay = this._calculateBackoffDelay(attempt);
        console.log(`[CryptoProvider] ${methodName} - Retrying in ${delay}ms...`);
        
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
    // Retry on network errors or 5xx server errors
    if (!error.response) {
      return true; // Network error
    }

    const status = error.response.status;
    
    // Retry on server errors (5xx)
    if (status >= 500 && status < 600) {
      return true;
    }
    
    // Retry on rate limiting (429)
    if (status === 429) {
      console.log('[CryptoProvider] Rate limited by CoinGecko, will retry...');
      return true;
    }
    
    return false;
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
    formattedError.provider = 'CoinGecko';
    formattedError.method = methodName;
    formattedError.originalError = error.message;

    if (error.response) {
      // API responded with error
      formattedError.message = `CoinGecko API error: ${error.response.status} - ${error.response.statusText}`;
      formattedError.statusCode = error.response.status;
      formattedError.data = error.response.data;
    } else if (error.request) {
      // Request made but no response
      formattedError.message = 'CoinGecko API request timeout or network error';
      formattedError.statusCode = 0;
    } else {
      // Error in request setup
      formattedError.message = `CoinGecko API request error: ${error.message}`;
      formattedError.statusCode = 0;
    }

    return formattedError;
  }
}

export default CryptoProvider;
