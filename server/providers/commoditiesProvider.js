/**
 * CommoditiesProvider - Twelve Data API Integration for Commodities
 * Fetches commodity market data from Twelve Data API
 */

import axios from 'axios';
import { apiConfig } from '../config/apiConfig.js';

class CommoditiesProvider {
  constructor() {
    this.baseUrl = apiConfig.twelveData.baseUrl;
    this.apiKey = apiConfig.twelveData.apiKey;
    this.timeout = apiConfig.twelveData.timeout;
    this.retryConfig = apiConfig.retry;
    
    // Popular commodities to display with metadata
    // Twelve Data uses symbols like GC (Gold), SI (Silver), CL (Crude Oil), etc.
    this.defaultCommodities = [
      { symbol: 'GC', name: 'Gold', unit: 'USD per troy ounce' },
      { symbol: 'SI', name: 'Silver', unit: 'USD per troy ounce' },
      { symbol: 'PL', name: 'Platinum', unit: 'USD per troy ounce' },
      { symbol: 'PA', name: 'Palladium', unit: 'USD per troy ounce' },
      { symbol: 'CL', name: 'Crude Oil (WTI)', unit: 'USD per barrel' },
      { symbol: 'BZ', name: 'Brent Crude Oil', unit: 'USD per barrel' },
      { symbol: 'NG', name: 'Natural Gas', unit: 'USD per MMBtu' },
      { symbol: 'HG', name: 'Copper', unit: 'USD per pound' }
    ];
  }

  /**
   * Get commodity price for a single symbol
   * @param {string} symbol - Commodity symbol (e.g., 'GC' for Gold)
   * @returns {Promise<Object>} Commodity price data
   */
  async getCommodityPrice(symbol) {
    const endpoint = `${this.baseUrl}/quote`;
    const params = {
      symbol: symbol,
      apikey: this.apiKey
    };

    const data = await this._makeRequest(endpoint, params, `getCommodityPrice(${symbol})`);
    
    // Add symbol metadata
    const commodity = this.defaultCommodities.find(c => c.symbol === symbol);
    return {
      success: true,
      base: 'USD',
      date: new Date().toISOString().split('T')[0],
      rates: { [symbol]: parseFloat(data.close) },
      symbol,
      name: commodity?.name || symbol,
      unit: commodity?.unit || 'USD',
      rate: parseFloat(data.close)
    };
  }

  /**
   * Get multiple commodity prices
   * Twelve Data allows concurrent requests
   * @param {Array<Object>} commodities - Array of {symbol, name, unit} objects
   * @returns {Promise<Object>} Object with symbols as keys
   */
  async getMultipleCommodityPrices(commodities = this.defaultCommodities) {
    console.log(`[CommoditiesProvider] Fetching ${commodities.length} commodities concurrently`);
    
    const results = {};
    
    // Fetch all concurrently
    const promises = commodities.map(async commodity => {
      try {
        const data = await this.getCommodityPrice(commodity.symbol);
        return { symbol: commodity.symbol, data };
      } catch (error) {
        console.error(`[CommoditiesProvider] Error fetching ${commodity.symbol}:`, error.message);
        return { 
          symbol: commodity.symbol, 
          data: {
            error: error.message,
            symbol: commodity.symbol,
            name: commodity.name,
            unit: commodity.unit
          }
        };
      }
    });

    const allResults = await Promise.all(promises);
    
    // Store results
    allResults.forEach(({ symbol, data }) => {
      results[symbol] = data;
    });

    return results;
  }

  /**
   * Get commodity time series data (historical rates)
   * @param {string} symbol - Commodity symbol
   * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to latest)
   * @returns {Promise<Object>} Historical rate data
   */
  async getCommodityTimeSeries(symbol, date = null) {
    const endpoint = date ? `${this.baseUrl}/${date}` : `${this.baseUrl}/latest`;
    const params = {
      access_key: this.apiKey,
      base: 'USD',
      symbols: symbol
    };

    return this._makeRequest(endpoint, params, `getCommodityTimeSeries(${symbol}, ${date || 'latest'})`);
  }

  /**
   * Make HTTP request with retry logic and error handling
   * @private
   */
  async _makeRequest(endpoint, params, methodName, attempt = 1) {
    try {
      console.log(`[CommoditiesProvider] ${methodName} - Attempt ${attempt}/${this.retryConfig.maxAttempts}`);
      
      const response = await axios.get(endpoint, {
        params,
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json'
        }
      });

      // Check for API error messages
      if (!response.data.success) {
        const errorInfo = response.data.error || {};
        throw new Error(`Metals-API Error: ${errorInfo.type || 'Unknown error'} - ${errorInfo.info || 'No details'}`);
      }

      console.log(`[CommoditiesProvider] ${methodName} - Success`);
      return response.data;

    } catch (error) {
      console.error(`[CommoditiesProvider] ${methodName} - Error:`, error.message);

      // Check if we should retry
      if (attempt < this.retryConfig.maxAttempts && this._shouldRetry(error)) {
        const delay = this._calculateBackoffDelay(attempt);
        console.log(`[CommoditiesProvider] ${methodName} - Retrying in ${delay}ms...`);
        
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

    // Don't retry invalid symbol errors
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
    formattedError.provider = 'Metals-API';
    formattedError.method = methodName;
    formattedError.originalError = error.message;
    formattedError.retryable = this._shouldRetry(error);

    if (error.response) {
      formattedError.message = `Metals-API error: ${error.response.status} - ${error.response.statusText}`;
      formattedError.statusCode = error.response.status;
      formattedError.data = error.response.data;
    } else if (error.request) {
      formattedError.message = 'Metals-API request timeout or network error';
      formattedError.statusCode = 0;
    } else {
      formattedError.message = `Metals-API request error: ${error.message}`;
      formattedError.statusCode = 0;
    }

    return formattedError;
  }
}

export default CommoditiesProvider;
