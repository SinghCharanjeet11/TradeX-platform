/**
 * CommoditiesProvider - Alpha Vantage API Integration for Commodities
 * Fetches commodity market data from Alpha Vantage API
 */

import axios from 'axios';
import { apiConfig } from '../config/apiConfig.js';

class CommoditiesProvider {
  constructor() {
    this.baseUrl = apiConfig.alphaVantage.baseUrl;
    this.apiKey = apiConfig.alphaVantage.apiKey;
    this.timeout = apiConfig.alphaVantage.timeout;
    this.retryConfig = apiConfig.retry;
    
    // Popular commodities with their symbols and metadata
    this.defaultCommodities = [
      { symbol: 'GC=F', name: 'Gold', unit: 'USD/oz' },
      { symbol: 'SI=F', name: 'Silver', unit: 'USD/oz' },
      { symbol: 'PL=F', name: 'Platinum', unit: 'USD/oz' },
      { symbol: 'CL=F', name: 'Crude Oil (WTI)', unit: 'USD/barrel' },
      { symbol: 'BZ=F', name: 'Brent Crude Oil', unit: 'USD/barrel' },
      { symbol: 'NG=F', name: 'Natural Gas', unit: 'USD/MMBtu' },
      { symbol: 'HG=F', name: 'Copper', unit: 'USD/lb' },
      { symbol: 'ZC=F', name: 'Corn', unit: 'USD/bushel' },
      { symbol: 'ZW=F', name: 'Wheat', unit: 'USD/bushel' },
      { symbol: 'KC=F', name: 'Coffee', unit: 'USD/lb' }
    ];
  }

  /**
   * Get commodity price
   * Note: Alpha Vantage doesn't have a dedicated commodity endpoint
   * We'll use the TIME_SERIES_DAILY function for commodity futures
   * @param {string} symbol - Commodity symbol
   * @returns {Promise<Object>} Commodity price data
   */
  async getCommodityPrice(symbol) {
    // For commodities, we'll use a workaround since Alpha Vantage
    // doesn't have direct commodity support in free tier
    // In production, consider using a dedicated commodity API
    
    const params = {
      function: 'GLOBAL_QUOTE',
      symbol: symbol,
      apikey: this.apiKey
    };

    return this._makeRequest(params, `getCommodityPrice(${symbol})`);
  }

  /**
   * Get multiple commodity prices
   * Note: Alpha Vantage free tier limits to 5 calls/minute
   * @param {Array<Object>} commodities - Array of commodity objects with symbol, name, unit
   * @returns {Promise<Object>} Object with symbol keys and price data
   */
  async getMultipleCommodityPrices(commodities = this.defaultCommodities) {
    const results = {};
    const batchSize = 5; // Free tier limit
    const delayBetweenBatches = 60000; // 1 minute

    // Process in batches to respect rate limits
    for (let i = 0; i < commodities.length; i += batchSize) {
      const batch = commodities.slice(i, i + batchSize);
      
      console.log(`[CommoditiesProvider] Fetching batch ${Math.floor(i / batchSize) + 1} (${batch.map(c => c.name).join(', ')})`);
      
      // Fetch batch concurrently
      const batchPromises = batch.map(async commodity => {
        try {
          const data = await this.getCommodityPrice(commodity.symbol);
          return { commodity, data };
        } catch (error) {
          console.error(`[CommoditiesProvider] Error fetching ${commodity.name}:`, error.message);
          return { commodity, data: null, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Store results
      batchResults.forEach(({ commodity, data, error }) => {
        results[commodity.symbol] = error ? { error } : data;
      });

      // Wait before next batch (except for last batch)
      if (i + batchSize < commodities.length) {
        console.log(`[CommoditiesProvider] Waiting ${delayBetweenBatches / 1000}s before next batch...`);
        await this._sleep(delayBetweenBatches);
      }
    }

    return results;
  }

  /**
   * Get time series data for a commodity
   * @param {string} symbol - Commodity symbol
   * @param {string} interval - Time interval ('daily', 'weekly', 'monthly')
   * @returns {Promise<Object>} Time series data
   */
  async getCommodityTimeSeries(symbol, interval = 'daily') {
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

    return this._makeRequest(params, `getCommodityTimeSeries(${symbol}, ${interval})`);
  }

  /**
   * Make HTTP request with retry logic and error handling
   * @private
   */
  async _makeRequest(params, methodName, attempt = 1) {
    try {
      console.log(`[CommoditiesProvider] ${methodName} - Attempt ${attempt}/${this.retryConfig.maxAttempts}`);
      
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

      console.log(`[CommoditiesProvider] ${methodName} - Success`);
      return response.data;

    } catch (error) {
      console.error(`[CommoditiesProvider] ${methodName} - Error:`, error.message);

      // Check if we should retry
      if (attempt < this.retryConfig.maxAttempts && this._shouldRetry(error)) {
        const delay = this._calculateBackoffDelay(attempt);
        console.log(`[CommoditiesProvider] ${methodName} - Retrying in ${delay}ms...`);
        
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
    formattedError.provider = 'AlphaVantage-Commodities';
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

export default CommoditiesProvider;
