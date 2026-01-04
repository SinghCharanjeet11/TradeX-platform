/**
 * Market Service
 * API client for market data endpoints
 */

import api from './api';

const marketService = {
  /**
   * Get cryptocurrency market data
   * @returns {Promise} API response with crypto data
   */
  getCryptoData: async () => {
    try {
      const response = await api.get('/markets/crypto');
      return response.data;
    } catch (error) {
      console.error('[MarketService] Error fetching crypto data:', error);
      throw error;
    }
  },

  /**
   * Get stocks market data
   * @returns {Promise} API response with stocks data
   */
  getStocksData: async () => {
    try {
      const response = await api.get('/markets/stocks');
      return response.data;
    } catch (error) {
      console.error('[MarketService] Error fetching stocks data:', error);
      throw error;
    }
  },

  /**
   * Get forex market data
   * @returns {Promise} API response with forex data
   */
  getForexData: async () => {
    try {
      const response = await api.get('/markets/forex');
      return response.data;
    } catch (error) {
      console.error('[MarketService] Error fetching forex data:', error);
      throw error;
    }
  },

  /**
   * Get commodities market data
   * @returns {Promise} API response with commodities data
   */
  getCommoditiesData: async () => {
    try {
      const response = await api.get('/markets/commodities');
      return response.data;
    } catch (error) {
      console.error('[MarketService] Error fetching commodities data:', error);
      throw error;
    }
  },

  /**
   * Get detailed asset information
   * @param {string} type - Market type (crypto, stocks, forex, commodities)
   * @param {string} symbol - Symbol or ID
   * @returns {Promise} API response with detailed asset data
   */
  getAssetDetails: async (type, symbol) => {
    try {
      // URL-encode the symbol to handle special characters like '/' in forex pairs (EUR/USD)
      const encodedSymbol = encodeURIComponent(symbol);
      const response = await api.get(`/markets/${type}/${encodedSymbol}/details`);
      return response.data;
    } catch (error) {
      console.error(`[MarketService] Error fetching asset details for ${symbol}:`, error);
      throw error;
    }
  },

  /**
   * Get chart data for a specific symbol
   * @param {string} type - Market type (crypto, stocks, forex, commodities)
   * @param {string} symbol - Symbol or ID
   * @param {number|string} days - Number of days of historical data (1, 7, 30, 90, 365, 'max')
   * @returns {Promise} API response with chart data
   */
  getChartData: async (type, symbol, days = 7) => {
    try {
      // URL-encode the symbol to handle special characters like '/' in forex pairs (EUR/USD)
      const encodedSymbol = encodeURIComponent(symbol);
      const response = await api.get(`/markets/${type}/${encodedSymbol}/chart`, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error(`[MarketService] Error fetching chart data for ${symbol}:`, error);
      throw error;
    }
  },

  /**
   * Get market API health status
   * @returns {Promise} API health status
   */
  getHealth: async () => {
    try {
      const response = await api.get('/markets/health');
      return response.data;
    } catch (error) {
      console.error('[MarketService] Error fetching health status:', error);
      throw error;
    }
  }
};

export default marketService;
