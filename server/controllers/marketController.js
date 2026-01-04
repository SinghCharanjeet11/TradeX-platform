/**
 * MarketController - Handles market data API requests
 */

import marketService from '../services/marketService.js';

/**
 * Get market data by type
 * GET /api/markets/:type
 * @param {string} type - Market type (crypto, stocks, forex, commodities)
 */
export const getMarketData = async (req, res) => {
  try {
    const { type } = req.params;

    // Validate market type
    const validTypes = ['crypto', 'stocks', 'forex', 'commodities'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MARKET_TYPE',
          message: `Invalid market type. Must be one of: ${validTypes.join(', ')}`
        }
      });
    }

    console.log(`[MarketController] Fetching ${type} market data for user ${req.user?.id}`);

    let result;

    // Route to appropriate service method
    switch (type) {
      case 'crypto':
        result = await marketService.getCryptoMarketData();
        break;
      case 'stocks':
        result = await marketService.getStocksMarketData();
        break;
      case 'forex':
        result = await marketService.getForexMarketData();
        break;
      case 'commodities':
        result = await marketService.getCommoditiesMarketData();
        break;
    }

    // Return appropriate status code
    const statusCode = result.success ? 200 : 503;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('[MarketController] Error in getMarketData:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while fetching market data'
      },
      data: []
    });
  }
};

/**
 * Get detailed asset information
 * GET /api/markets/:type/:symbol/details
 * @param {string} type - Market type
 * @param {string} symbol - Symbol or ID
 */
export const getAssetDetails = async (req, res) => {
  try {
    const { type } = req.params;
    // Decode the symbol in case it contains URL-encoded characters (e.g., EUR%2FUSD for EUR/USD)
    const symbol = decodeURIComponent(req.params.symbol);

    // Validate market type
    const validTypes = ['crypto', 'stocks', 'forex', 'commodities'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MARKET_TYPE',
          message: `Invalid market type. Must be one of: ${validTypes.join(', ')}`
        }
      });
    }

    // Validate symbol
    if (!symbol || symbol.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SYMBOL',
          message: 'Symbol is required'
        }
      });
    }

    console.log(`[MarketController] Fetching detailed data for ${type}/${symbol}`);

    const result = await marketService.getAssetDetails(type, symbol);

    const statusCode = result.success ? 200 : 503;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('[MarketController] Error in getAssetDetails:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while fetching asset details'
      }
    });
  }
};

/**
 * Get market chart data
 * GET /api/markets/:type/:symbol/chart?days=7
 * @param {string} type - Market type
 * @param {string} symbol - Symbol or ID
 * @param {number} days - Number of days (query param)
 */
export const getMarketChart = async (req, res) => {
  try {
    const { type } = req.params;
    // Decode the symbol in case it contains URL-encoded characters (e.g., EUR%2FUSD for EUR/USD)
    const symbol = decodeURIComponent(req.params.symbol);
    let days = req.query.days || '7';
    
    // Handle 'max' or convert to number
    if (days !== 'max') {
      days = parseInt(days);
      if (isNaN(days) || days < 1 || days > 365) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DAYS',
            message: 'Days must be between 1 and 365, or "max"'
          }
        });
      }
    }

    // Validate market type
    const validTypes = ['crypto', 'stocks', 'forex', 'commodities'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MARKET_TYPE',
          message: `Invalid market type. Must be one of: ${validTypes.join(', ')}`
        }
      });
    }

    // Validate symbol
    if (!symbol || symbol.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SYMBOL',
          message: 'Symbol is required'
        }
      });
    }

    console.log(`[MarketController] Fetching chart data for ${type}/${symbol} (${days} days)`);

    const result = await marketService.getMarketChartData(type, symbol, days);

    const statusCode = result.success ? 200 : 503;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('[MarketController] Error in getMarketChart:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while fetching chart data'
      }
    });
  }
};

/**
 * Get market API health status
 * GET /api/markets/health
 */
export const getMarketHealth = async (req, res) => {
  try {
    const { default: cacheService } = await import('../services/cacheService.js');
    const { apiConfig } = await import('../config/apiConfig.js');

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      apis: {
        coingecko: {
          status: 'configured',
          baseUrl: apiConfig.coingecko.baseUrl,
          requiresKey: false
        },
        alphaVantage: {
          status: apiConfig.alphaVantage.apiKey ? 'configured' : 'missing_key',
          baseUrl: apiConfig.alphaVantage.baseUrl,
          requiresKey: true,
          keyConfigured: !!apiConfig.alphaVantage.apiKey
        }
      },
      cache: {
        size: cacheService.getStats().size,
        keys: cacheService.getStats().keys
      }
    };

    // Overall status
    if (!apiConfig.alphaVantage.apiKey) {
      health.status = 'degraded';
      health.message = 'Alpha Vantage API key not configured. Stocks, Forex, and Commodities will not work.';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(health);

  } catch (error) {
    console.error('[MarketController] Error in getMarketHealth:', error);
    return res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
