/**
 * Paper Trading Service
 * Frontend service for paper trading API calls
 */

import api from './api';

const paperTradingService = {
  /**
   * Get or create paper trading account
   */
  async getAccount() {
    try {
      const response = await api.get('/paper-trading/account');
      return response.data;
    } catch (error) {
      console.error('[PaperTradingService] Error getting account:', error);
      throw error;
    }
  },

  /**
   * Reset paper trading account
   */
  async resetAccount() {
    try {
      const response = await api.post('/paper-trading/account/reset');
      return response.data;
    } catch (error) {
      console.error('[PaperTradingService] Error resetting account:', error);
      throw error;
    }
  },

  /**
   * Get paper trading statistics
   */
  async getStatistics() {
    try {
      const response = await api.get('/paper-trading/statistics');
      return response.data;
    } catch (error) {
      console.error('[PaperTradingService] Error getting statistics:', error);
      throw error;
    }
  },

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 100) {
    try {
      const response = await api.get(`/paper-trading/leaderboard?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('[PaperTradingService] Error getting leaderboard:', error);
      throw error;
    }
  },

  /**
   * Update leaderboard visibility
   */
  async updateLeaderboardVisibility(visible) {
    try {
      const response = await api.put('/paper-trading/leaderboard/visibility', { visible });
      return response.data;
    } catch (error) {
      console.error('[PaperTradingService] Error updating leaderboard visibility:', error);
      throw error;
    }
  },

  /**
   * Execute paper trading order
   */
  async executePaperOrder(orderData) {
    try {
      const response = await api.post('/paper-trading/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('[PaperTradingService] Error executing order:', error);
      throw error;
    }
  },

  /**
   * Get performance history for charts
   * @param {string} period - Time period (7d, 30d, 90d, all)
   */
  async getPerformanceHistory(period = '30d') {
    try {
      const response = await api.get(`/paper-trading/performance?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('[PaperTradingService] Error getting performance history:', error);
      throw error;
    }
  }
};

export default paperTradingService;
