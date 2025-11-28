/**
 * Paper Trading Controller
 * Handles HTTP requests for paper trading operations
 */

import paperTradingService from '../services/paperTradingService.js';

class PaperTradingController {
  /**
   * Get or create paper trading account
   * GET /api/paper-trading/account
   */
  async getAccount(req, res) {
    try {
      const userId = req.user.id;
      const account = await paperTradingService.getAccountSummary(userId);

      res.json({
        success: true,
        data: account
      });
    } catch (error) {
      console.error('[PaperTradingController] Error getting account:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get paper trading account'
      });
    }
  }

  /**
   * Reset paper trading account
   * POST /api/paper-trading/account/reset
   */
  async resetAccount(req, res) {
    try {
      const userId = req.user.id;
      const account = await paperTradingService.resetAccount(userId);

      res.json({
        success: true,
        message: 'Paper trading account reset successfully',
        data: account
      });
    } catch (error) {
      console.error('[PaperTradingController] Error resetting account:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset paper trading account'
      });
    }
  }

  /**
   * Get paper trading statistics
   * GET /api/paper-trading/statistics
   */
  async getStatistics(req, res) {
    try {
      const userId = req.user.id;
      
      const [account, performance] = await Promise.all([
        paperTradingService.getAccountSummary(userId),
        paperTradingService.calculatePerformance(userId)
      ]);

      res.json({
        success: true,
        data: {
          account,
          performance
        }
      });
    } catch (error) {
      console.error('[PaperTradingController] Error getting statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get paper trading statistics'
      });
    }
  }

  /**
   * Get leaderboard
   * GET /api/paper-trading/leaderboard
   */
  async getLeaderboard(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 100;
      
      const leaderboard = await paperTradingService.getLeaderboard(limit, userId);

      res.json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      console.error('[PaperTradingController] Error getting leaderboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get leaderboard'
      });
    }
  }

  /**
   * Update leaderboard visibility
   * PUT /api/paper-trading/leaderboard/visibility
   */
  async updateLeaderboardVisibility(req, res) {
    try {
      const userId = req.user.id;
      const { visible } = req.body;

      if (typeof visible !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Visible must be a boolean value'
        });
      }

      const account = await paperTradingService.updateLeaderboardVisibility(userId, visible);

      res.json({
        success: true,
        message: `Leaderboard visibility ${visible ? 'enabled' : 'disabled'}`,
        data: account
      });
    } catch (error) {
      console.error('[PaperTradingController] Error updating leaderboard visibility:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update leaderboard visibility'
      });
    }
  }

  /**
   * Execute paper trading order
   * POST /api/paper-trading/orders
   */
  async executePaperOrder(req, res) {
    try {
      const userId = req.user.id;
      const orderData = req.body;

      // Validate required fields
      const requiredFields = ['symbol', 'name', 'assetType', 'orderType', 'quantity', 'price'];
      for (const field of requiredFields) {
        if (!orderData[field]) {
          return res.status(400).json({
            success: false,
            error: `Missing required field: ${field}`
          });
        }
      }

      // Validate order type
      if (!['buy', 'sell'].includes(orderData.orderType)) {
        return res.status(400).json({
          success: false,
          error: 'Order type must be "buy" or "sell"'
        });
      }

      // Validate quantity and price
      if (orderData.quantity <= 0 || orderData.price <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantity and price must be positive numbers'
        });
      }

      const order = await paperTradingService.executePaperOrder(userId, orderData);

      res.json({
        success: true,
        message: 'Order executed successfully',
        data: order
      });
    } catch (error) {
      console.error('[PaperTradingController] Error executing order:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to execute order'
      });
    }
  }

  /**
   * Get performance history for charts
   * GET /api/paper-trading/performance?period=30d
   */
  async getPerformanceHistory(req, res) {
    try {
      const userId = req.user.id;
      const period = req.query.period || '30d';

      // Validate period
      const validPeriods = ['7d', '30d', '90d', 'all'];
      if (!validPeriods.includes(period)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid period. Must be one of: 7d, 30d, 90d, all'
        });
      }

      const history = await paperTradingService.getPerformanceHistory(userId, period);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('[PaperTradingController] Error getting performance history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance history'
      });
    }
  }
}

export default new PaperTradingController();
