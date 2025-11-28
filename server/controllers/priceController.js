/**
 * Price Controller
 * Handles HTTP requests for price updates
 */

import priceUpdateService from '../services/priceUpdateService.js';

/**
 * Get current prices for holdings
 * @route GET /api/prices/current
 */
export const getCurrentPrices = async (req, res) => {
  try {
    const { symbols } = req.query;

    if (!symbols) {
      return res.status(400).json({
        success: false,
        error: 'Symbols parameter is required'
      });
    }

    const symbolArray = symbols.split(',').map(s => s.trim());
    const prices = await priceUpdateService.getCurrentPrices(symbolArray);

    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('[PriceController] Error getting current prices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch current prices'
    });
  }
};

/**
 * Trigger manual price refresh
 * @route POST /api/prices/refresh
 */
export const refreshPrices = async (req, res) => {
  try {
    const userId = req.user.id;

    const updateCount = await priceUpdateService.refreshPrices(userId);

    res.json({
      success: true,
      data: {
        updatedCount: updateCount
      },
      message: `Updated ${updateCount} holdings`
    });
  } catch (error) {
    console.error('[PriceController] Error refreshing prices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to refresh prices'
    });
  }
};

/**
 * Get price history for symbol
 * @route GET /api/prices/history/:symbol
 */
export const getPriceHistory = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { assetType, days = 30 } = req.query;

    if (!assetType) {
      return res.status(400).json({
        success: false,
        error: 'Asset type is required'
      });
    }

    const history = await priceUpdateService.getPriceHistory(
      symbol,
      assetType,
      parseInt(days)
    );

    res.json({
      success: true,
      data: {
        symbol,
        assetType,
        history
      }
    });
  } catch (error) {
    console.error('[PriceController] Error getting price history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch price history'
    });
  }
};
