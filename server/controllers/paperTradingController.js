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

      console.log('[PaperTradingController] ===== NEW ORDER REQUEST =====');
      console.log('[PaperTradingController] Full request body:', JSON.stringify(orderData, null, 2));

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

      // Convert to strings for validation
      let quantityStr = String(orderData.quantity).trim();
      let priceStr = String(orderData.price).trim();
      
      // CRITICAL: Check if the values are already strings with issues
      if (typeof orderData.quantity === 'string') {
        console.warn('[PaperTradingController] ⚠️  Quantity received as string:', orderData.quantity);
        // Check for duplicate decimals in the original string
        const origQtyDecimals = (orderData.quantity.match(/\./g) || []).length;
        if (origQtyDecimals > 1) {
          console.error('[PaperTradingController] ❌ REJECTED - Original quantity string has multiple decimals:', orderData.quantity);
          return res.status(400).json({
            success: false,
            error: `Invalid quantity format: "${orderData.quantity}". Contains ${origQtyDecimals} decimal points. Please refresh the page and try again.`
          });
        }
      }
      if (typeof orderData.price === 'string') {
        console.warn('[PaperTradingController] ⚠️  Price received as string:', orderData.price);
        // Check for duplicate decimals in the original string
        const origPrcDecimals = (orderData.price.match(/\./g) || []).length;
        if (origPrcDecimals > 1) {
          console.error('[PaperTradingController] ❌ REJECTED - Original price string has multiple decimals:', orderData.price);
          return res.status(400).json({
            success: false,
            error: `Invalid price format: "${orderData.price}". Contains ${origPrcDecimals} decimal points. Please refresh the page and try again.`
          });
        }
      }

      console.log('[PaperTradingController] Raw string values:', { 
        quantity: quantityStr, 
        price: priceStr,
        quantityType: typeof orderData.quantity,
        priceType: typeof orderData.price,
        quantityOriginal: orderData.quantity,
        priceOriginal: orderData.price
      });

      // CRITICAL: Check for duplicate decimals BEFORE any processing
      const qtyDecimalCount = (quantityStr.match(/\./g) || []).length;
      const prcDecimalCount = (priceStr.match(/\./g) || []).length;

      console.log('[PaperTradingController] Decimal counts:', {
        quantity: qtyDecimalCount,
        price: prcDecimalCount
      });

      if (qtyDecimalCount > 1) {
        console.error('[PaperTradingController] ❌ REJECTED - Quantity has multiple decimals:', quantityStr);
        console.error('[PaperTradingController] Original value:', orderData.quantity);
        console.error('[PaperTradingController] Type:', typeof orderData.quantity);
        return res.status(400).json({
          success: false,
          error: `Invalid quantity format: "${quantityStr}". Contains ${qtyDecimalCount} decimal points. Please refresh the page and try again.`
        });
      }

      if (prcDecimalCount > 1) {
        console.error('[PaperTradingController] ❌ REJECTED - Price has multiple decimals:', priceStr);
        console.error('[PaperTradingController] Original value:', orderData.price);
        console.error('[PaperTradingController] Type:', typeof orderData.price);
        console.error('[PaperTradingController] Full order data:', JSON.stringify(orderData, null, 2));
        return res.status(400).json({
          success: false,
          error: `Invalid price format: "${priceStr}". Contains ${prcDecimalCount} decimal points. Please refresh the page and try again.`
        });
      }

      // Remove any non-numeric characters except decimal point and minus
      const cleanedQuantity = quantityStr.replace(/[^0-9.-]/g, '');
      const cleanedPrice = priceStr.replace(/[^0-9.-]/g, '');

      console.log('[PaperTradingController] After cleaning:', { 
        cleanedQuantity, 
        cleanedPrice 
      });

      // Parse to numbers - use Number() for more strict parsing
      const parsedQuantity = Number(cleanedQuantity);
      const parsedPrice = Number(cleanedPrice);

      console.log('[PaperTradingController] Parsed numbers:', { 
        parsedQuantity, 
        parsedPrice,
        quantityIsNaN: isNaN(parsedQuantity),
        priceIsNaN: isNaN(parsedPrice)
      });

      // Validate parsed numbers
      if (isNaN(parsedQuantity) || parsedQuantity <= 0 || !isFinite(parsedQuantity)) {
        console.error('[PaperTradingController] Invalid quantity after parsing:', {
          original: orderData.quantity,
          cleaned: cleanedQuantity,
          parsed: parsedQuantity
        });
        return res.status(400).json({
          success: false,
          error: `Invalid quantity: "${orderData.quantity}". Must be a positive number.`
        });
      }

      if (isNaN(parsedPrice) || parsedPrice <= 0 || !isFinite(parsedPrice)) {
        console.error('[PaperTradingController] Invalid price after parsing:', {
          original: orderData.price,
          cleaned: cleanedPrice,
          parsed: parsedPrice
        });
        return res.status(400).json({
          success: false,
          error: `Invalid price: "${orderData.price}". Must be a positive number.`
        });
      }

      // Use the parsed values - ensure they're numbers
      const quantity = parsedQuantity;
      const price = parsedPrice;

      console.log('[PaperTradingController] ✅ Validation passed. Final values:', {
        quantity,
        price,
        total: quantity * price
      });

      // Create validated order data
      const validatedOrderData = {
        ...orderData,
        symbol: String(orderData.symbol).trim().toUpperCase(),
        name: String(orderData.name).trim(),
        quantity,
        price
      };

      const order = await paperTradingService.executePaperOrder(userId, validatedOrderData);

      console.log('[PaperTradingController] ✅ Order executed successfully');

      res.json({
        success: true,
        message: 'Order executed successfully',
        data: order
      });
    } catch (error) {
      console.error('[PaperTradingController] ❌ Error executing order:', error);
      console.error('[PaperTradingController] Error stack:', error.stack);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to execute order'
      });
    }
  }

  /**
   * Get paper trading order history
   * GET /api/paper-trading/orders
   */
  async getOrders(req, res) {
    try {
      const userId = req.user.id;
      const account = req.query.account || 'paper';

      // Get orders from repository
      const ordersRepository = await import('../repositories/ordersRepository.js');
      const orders = await ordersRepository.default.getUserOrders(userId);
      
      // Filter by account type and map field names for frontend compatibility
      const paperOrders = orders
        .filter(o => o.account === account)
        .map(order => ({
          ...order,
          side: order.type, // Frontend expects 'side' (buy/sell), backend stores as 'type'
        }));

      // Return in format expected by frontend: { orders: [...] }
      res.json({
        success: true,
        orders: paperOrders
      });
    } catch (error) {
      console.error('[PaperTradingController] Error getting orders:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get order history'
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

      // Map frontend periods to backend periods
      const periodMapping = {
        '1d': '7d',    // 1 day -> use 7 days (minimum)
        '5d': '7d',    // 5 days -> use 7 days
        '7d': '7d',    // 7 days
        '30d': '30d',  // 30 days
        '180d': '90d', // 6 months -> use 90 days (closest)
        '90d': '90d',  // 90 days
        'ytd': '90d',  // Year to date -> use 90 days
        '365d': 'all', // 1 year -> use all
        '1825d': 'all', // 5 years -> use all
        'all': 'all'   // All time
      };

      const mappedPeriod = periodMapping[period] || '30d';
      console.log(`[PaperTradingController] Period mapping: ${period} -> ${mappedPeriod}`);

      const history = await paperTradingService.getPerformanceHistory(userId, mappedPeriod);

      // Return data in expected format with history array
      res.json({
        success: true,
        data: {
          history: history || []
        }
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
