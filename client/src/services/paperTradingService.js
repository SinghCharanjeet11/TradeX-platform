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
      console.log('[PaperTradingService - Frontend] ===== EXECUTING ORDER =====');
      console.log('[PaperTradingService - Frontend] Order data received:', orderData);
      console.log('[PaperTradingService - Frontend] Data types:', {
        quantity: typeof orderData.quantity,
        price: typeof orderData.price,
        quantityValue: orderData.quantity,
        priceValue: orderData.price
      });
      
      // CRITICAL: Validate data before sending
      const qtyStr = String(orderData.quantity);
      const prcStr = String(orderData.price);
      
      const qtyDecimals = (qtyStr.match(/\./g) || []).length;
      const prcDecimals = (prcStr.match(/\./g) || []).length;
      
      if (qtyDecimals > 1 || prcDecimals > 1) {
        console.error('[PaperTradingService - Frontend] ❌ DUPLICATE DECIMALS DETECTED!');
        console.error('[PaperTradingService - Frontend] Quantity:', qtyStr, 'Decimals:', qtyDecimals);
        console.error('[PaperTradingService - Frontend] Price:', prcStr, 'Decimals:', prcDecimals);
        throw new Error(`Invalid number format: quantity="${qtyStr}", price="${prcStr}"`);
      }
      
      console.log('[PaperTradingService - Frontend] ✅ Validation passed, sending to API...');
      
      const response = await api.post('/paper-trading/orders', orderData);
      
      console.log('[PaperTradingService - Frontend] ===== API RESPONSE =====');
      console.log('[PaperTradingService - Frontend] Response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('[PaperTradingService - Frontend] ===== ERROR =====');
      console.error('[PaperTradingService - Frontend] Error:', error);
      console.error('[PaperTradingService - Frontend] Error response:', error.response?.data);
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
      // Return the data object which contains { history: [...] }
      return response.data.data || response.data;
    } catch (error) {
      console.error('[PaperTradingService] Error getting performance history:', error);
      throw error;
    }
  },

  /**
   * Get paper trading order history
   * @param {string} account - Account type filter (default: 'paper')
   */
  async getOrders(account = 'paper') {
    try {
      const response = await api.get(`/paper-trading/orders?account=${account}`);
      return response.data;
    } catch (error) {
      console.error('[PaperTradingService] Error getting orders:', error);
      throw error;
    }
  }
};

export default paperTradingService;
