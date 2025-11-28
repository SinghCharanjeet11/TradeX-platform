/**
 * CommoditiesProvider - Metals-API Integration for Commodities
 * Fetches commodity market data from Metals-API
 */

import axios from 'axios';
import { apiConfig } from '../config/apiConfig.js';

class CommoditiesProvider {
  constructor() {
    this.baseUrl = apiConfig.metalsApi.baseUrl;
    this.apiKey = apiConfig.metalsApi.apiKey;
    this.timeout = apiConfig.metalsApi.timeout;
    this.retryConfig = apiConfig.retry;
    
    // Popular commodities to display with metadata
    // Metals-API uses symbols like XAU (Gold), XAG (Silver), etc.
    this.defaultCommodities = [
      { symbol: 'XAU', name: 'Gold', unit: 'USD per troy ounce' },
      { symbol: 'XAG', name: 'Silver', unit: 'USD per troy ounce' },
      { symbol: 'XPT', name: 'Platinum', unit: 'USD per troy ounce' },
      { symbol: 'XPD', name: 'Palladium', unit: 'USD per troy ounce' },
      { symbol: 'CRUDE_OIL_WTI', name: 'Crude Oil (WTI)', unit: 'USD per barrel' },
      { symbol: 'CRUDE_OIL_BRENT', name: 'Brent Crude Oil', unit: 'USD per barrel' },
      { symbol: 'NATURAL_GAS', name: 'Natural Gas', unit: 'USD per MMBtu' },
      { symbol: 'COPPER', name: 'Copper', unit: 'USD per pound' }
    ];
  }

  /**
   * Get commodity price for a single symbol
   * @param {string} symbol - Commodity symbol (e.g., 'XAU' for Gold)
   * @returns {Promise<Object>} Commodity price data
   */
  async getCommodityPrice(symbol) {
    const endpoint = `${this.baseUrl}/latest`;
    const params = {
      access_key: this.apiKey,
      base: 'USD',
      symbols: symbol
    };

    const data = await this._makeRequest(endpoint, params, `getCommodityPrice(${symbol})`);
    
    // Add symbol metadata
    const commodity = this.defaultCommodities.find(c => c.symbol === symbol);
    return {
      ...data,
      symbol,
      name: commodity?.name || symbol,
      unit: commodity?.unit || 'USD'
    };
  }

  /**
   * Get multiple commodity prices in a single batched request
   * Metals-API allows fetching multiple symbols in one call
   * @param {Array<Object>} commodities - Array of {symbol, name, unit} objects
   * @returns {Promise<Object>} Object with symbols as keys
   */
  async getMultipleCommodityPrices(commodities = this.defaultCommodities) {
    const symbols = commodities.map(c => c.symbol).join(',');
    
    console.log(`[CommoditiesProvider] Fetching ${commodities.length} commodities in a single batched request`);
    
    try {
      const endpoint = `${this.baseUrl}/latest`;
      const params = {
        access_key: this.apiKey,
        base: 'USD',
        symbols: symbols
      };

      const data = await this._makeRequest(endpoint, params, 'getMultipleCommodityPrices');
      
      const results = {};
      
      // Map results to commodity symbols
      commodities.forEach(commodity => {
        const rate = data.rates?.[commodity.symbol];
        if (rate) {
          results[commodity.symbol] = {
            success: true,
            base: 'USD',
            date: data.date,
            rates: { [commodity.symbol]: rate },
            symbol: commodity.symbol,
            name: commodity.name,
            unit: commodity.unit,
            rate: rate
          };
        } else {
          results[commodity.symbol] = {
            error: 'Symbol not found in response',
            symbol: commodity.symbol,
            name: commodity.name,
            unit: commodity.unit
          };
        }
      });

      return results;
    } catch (error) {
      console.error(`[CommoditiesProvider] Error fetching commodities:`, error.message);
      
      // Return error for all commodities
      const results = {};
      commodities.forEach(commodity => {
        results[commodity.symbol] = {
          error: error.message,
          symbol: commodity.symbol,
          name: commodity.name,
          unit: commodity.unit
        };
      });
      return results;
    }
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
