/**
 * AI Insights Controller
 * Handles HTTP requests for AI-powered insights
 */

import pricePredictorService from '../services/pricePredictorService.js';
import sentimentAnalyzerService from '../services/sentimentAnalyzerService.js';
import signalGeneratorService from '../services/signalGeneratorService.js';
import technicalIndicatorService from '../services/technicalIndicatorService.js';
import recommendationService from '../services/recommendationService.js';
import portfolioOptimizerService from '../services/portfolioOptimizerService.js';
import alertService from '../services/alertService.js';

// Valid asset types
const VALID_ASSET_TYPES = ['crypto', 'stock', 'forex', 'commodity'];

/**
 * Normalize asset type (accept both singular and plural forms)
 */
const normalizeAssetType = (assetType) => {
  if (!assetType) return null;
  const normalized = assetType.toLowerCase();
  if (normalized === 'stocks') return 'stock';
  if (normalized === 'commodities') return 'commodity';
  return normalized;
};

/**
 * Validate asset type and return error response if invalid
 */
const validateAssetType = (assetType, res) => {
  const normalized = normalizeAssetType(assetType);
  if (!normalized || !VALID_ASSET_TYPES.includes(normalized)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ASSET_TYPE',
        message: `assetType must be one of: ${VALID_ASSET_TYPES.join(', ')}`
      }
    });
    return null;
  }
  return normalized;
};

/**
 * Get price predictions for an asset
 * GET /api/insights/predictions/:symbol
 * Query params: assetType (required), timeHorizons (optional, comma-separated)
 */
export const getPricePredictions = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { assetType, timeHorizons } = req.query;

    // Validate required parameters
    if (!assetType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'assetType query parameter is required'
        }
      });
    }

    // Normalize and validate assetType
    const normalizedAssetType = validateAssetType(assetType, res);
    if (!normalizedAssetType) return;

    // Parse time horizons if provided
    let horizons = ['24h', '7d', '30d']; // default
    if (timeHorizons) {
      horizons = timeHorizons.split(',').map(h => h.trim());
      
      // Validate time horizons
      const validHorizons = ['24h', '7d', '30d'];
      const invalidHorizons = horizons.filter(h => !validHorizons.includes(h));
      if (invalidHorizons.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TIME_HORIZON',
            message: `Invalid time horizons: ${invalidHorizons.join(', ')}. Valid options: ${validHorizons.join(', ')}`
          }
        });
      }
    }

    // Get predictions
    const prediction = await pricePredictorService.predictPrice(symbol, normalizedAssetType, horizons);

    // Check if there was an error (insufficient data)
    if (prediction.error) {
      return res.status(200).json({
        success: true,
        data: prediction,
        message: prediction.error.message
      });
    }

    // Return successful prediction
    return res.status(200).json({
      success: true,
      data: prediction
    });

  } catch (error) {
    console.error('[AIInsightsController] Error getting price predictions:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while generating price predictions'
      }
    });
  }
};

/**
 * Get sentiment analysis for an asset
 * GET /api/insights/sentiment/:symbol
 * Query params: hoursBack (optional, default: 48)
 */
export const getSentimentAnalysis = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { hoursBack } = req.query;

    // Parse hoursBack parameter
    let hours = 48; // default
    if (hoursBack) {
      hours = parseInt(hoursBack, 10);
      
      // Validate hoursBack
      if (isNaN(hours) || hours < 1 || hours > 168) { // max 7 days
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_HOURS_BACK',
            message: 'hoursBack must be a number between 1 and 168 (7 days)'
          }
        });
      }
    }

    // Get sentiment analysis
    const sentiment = await sentimentAnalyzerService.analyzeSentiment(symbol, hours);

    // Check if there was an error (no data)
    if (sentiment.error) {
      return res.status(200).json({
        success: true,
        data: sentiment,
        message: sentiment.error.message
      });
    }

    // Return successful sentiment analysis
    return res.status(200).json({
      success: true,
      data: sentiment
    });

  } catch (error) {
    console.error('[AIInsightsController] Error getting sentiment analysis:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while analyzing sentiment'
      }
    });
  }
};

/**
 * Get trading signal for an asset
 * GET /api/insights/signals/:symbol
 * Query params: assetType (required)
 */
export const getTradingSignal = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { assetType } = req.query;

    // Validate required parameters
    if (!assetType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'assetType query parameter is required'
        }
      });
    }

    // Normalize and validate assetType
    const normalizedAssetType = validateAssetType(assetType, res);
    if (!normalizedAssetType) return;

    // Get trading signal
    const signal = await signalGeneratorService.generateSignal(symbol, normalizedAssetType);

    // Check if there was an error (insufficient data)
    if (signal.error) {
      return res.status(200).json({
        success: true,
        data: signal,
        message: signal.error.message
      });
    }

    // Return successful signal
    return res.status(200).json({
      success: true,
      data: signal
    });

  } catch (error) {
    console.error('[AIInsightsController] Error getting trading signal:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while generating trading signal'
      }
    });
  }
};

/**
 * Get technical indicators analysis for an asset
 * GET /api/insights/technical/:symbol
 * Query params: assetType (required)
 */
export const getTechnicalIndicators = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { assetType } = req.query;

    if (!assetType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'assetType query parameter is required'
        }
      });
    }

    // Normalize and validate assetType
    const normalizedAssetType = validateAssetType(assetType, res);
    if (!normalizedAssetType) return;

    const analysis = await technicalIndicatorService.analyzeTechnicalIndicators(symbol, normalizedAssetType);

    if (analysis.error) {
      return res.status(200).json({
        success: true,
        data: analysis,
        message: analysis.error.message
      });
    }

    return res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('[AIInsightsController] Error getting technical indicators:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while analyzing technical indicators'
      }
    });
  }
};

/**
 * Dismiss a trading signal
 * POST /api/insights/signals/:id/dismiss
 */
export const dismissSignal = async (req, res) => {
  try {
    // Store dismissed signal in database (simplified - would use a repository)
    // For now, just return success
    return res.status(200).json({
      success: true,
      message: 'Signal dismissed successfully'
    });

  } catch (error) {
    console.error('[AIInsightsController] Error dismissing signal:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while dismissing signal'
      }
    });
  }
};

/**
 * Get personalized recommendations
 * GET /api/insights/recommendations
 * Query params: limit (optional, default: 5, max: 10)
 */
export const getRecommendations = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        success: true,
        data: {
          recommendations: [],
          count: 0,
          generatedAt: new Date().toISOString()
        }
      });
    }

    const userId = req.user.id;
    const { limit } = req.query;

    // Parse limit parameter
    let recommendationLimit = 5; // default
    if (limit) {
      recommendationLimit = parseInt(limit, 10);
      
      if (isNaN(recommendationLimit) || recommendationLimit < 3 || recommendationLimit > 10) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_LIMIT',
            message: 'limit must be a number between 3 and 10'
          }
        });
      }
    }

    // Generate recommendations using the recommendation service
    const recommendations = await recommendationService.generateRecommendations(
      userId,
      recommendationLimit
    );

    return res.status(200).json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('[AIInsightsController] Error getting recommendations:', error);
    // Return empty data instead of error
    return res.status(200).json({
      success: true,
      data: {
        recommendations: [],
        count: 0,
        generatedAt: new Date().toISOString()
      }
    });
  }
};

/**
 * Track recommendation action
 * POST /api/insights/recommendations/:id/track
 * Body: { action: 'view' | 'dismiss' | 'added_to_watchlist' | 'purchased', outcome?: object }
 */
export const trackRecommendationAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, outcome } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!action) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'action is required'
        }
      });
    }

    // Validate action
    const validActions = ['view', 'dismiss', 'added_to_watchlist', 'purchased'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: `action must be one of: ${validActions.join(', ')}`
        }
      });
    }

    // Extract symbol from recommendation ID (format: userId-symbol-timestamp-index)
    const parts = id.split('-');
    const symbol = parts.length >= 2 ? parts[1] : id;

    // Track action using the recommendation service
    await recommendationService.trackRecommendationAction(
      userId,
      symbol,
      action,
      outcome || null
    );

    return res.status(200).json({
      success: true,
      message: 'Action tracked successfully'
    });

  } catch (error) {
    console.error('[AIInsightsController] Error tracking recommendation action:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while tracking action'
      }
    });
  }
};

/**
 * Get portfolio optimization suggestions
 * GET /api/insights/portfolio-optimization
 */
export const getPortfolioOptimization = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        success: true,
        data: {
          isOptimized: true,
          message: 'No portfolio to optimize. Start by adding some holdings.',
          currentAllocation: {},
          recommendedAllocation: {},
          suggestions: [],
          trades: []
        }
      });
    }

    const userId = req.user.id;

    // Generate optimization using the portfolio optimizer service
    const optimization = await portfolioOptimizerService.optimizePortfolio(userId);

    return res.status(200).json({
      success: true,
      data: optimization
    });

  } catch (error) {
    console.error('[AIInsightsController] Error getting portfolio optimization:', error);
    // Return empty optimization instead of error
    return res.status(200).json({
      success: true,
      data: {
        isOptimized: true,
        message: 'Unable to generate optimization at this time.',
        currentAllocation: {},
        recommendedAllocation: {},
        suggestions: [],
        trades: []
      }
    });
  }
};

/**
 * Get AI-generated alerts
 * GET /api/insights/alerts
 * Query params: limit (optional, default: 20, max: 100), unreadOnly (optional, default: false)
 */
export const getAlerts = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        success: true,
        data: {
          alerts: [],
          unreadCount: 0
        }
      });
    }

    const userId = req.user.id;
    const { limit, unreadOnly } = req.query;

    // Parse limit parameter
    let alertLimit = 20; // default
    if (limit) {
      alertLimit = parseInt(limit, 10);
      
      if (isNaN(alertLimit) || alertLimit < 1 || alertLimit > 100) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_LIMIT',
            message: 'limit must be a number between 1 and 100'
          }
        });
      }
    }

    // Parse unreadOnly parameter
    const onlyUnread = unreadOnly === 'true';

    // Get alerts from service
    const alerts = await alertService.getAlerts(userId, alertLimit, onlyUnread);

    // Get unread count
    const unreadCount = await alertService.getUnreadCount(userId);

    return res.status(200).json({
      success: true,
      data: {
        alerts,
        unreadCount
      }
    });

  } catch (error) {
    console.error('[AIInsightsController] Error getting alerts:', error);
    // Return empty data instead of error
    return res.status(200).json({
      success: true,
      data: {
        alerts: [],
        unreadCount: 0
      }
    });
  }
};

/**
 * Configure alert preferences
 * POST /api/insights/alerts/configure
 * Body: { sensitivity, channels, assetFilters }
 */
export const configureAlerts = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const userId = req.user.id;
    const { sensitivity, channels, assetFilters } = req.body;
    
    console.log('[AIInsightsController] Configuring alerts for user:', userId);
    console.log('[AIInsightsController] Config:', { sensitivity, channels, assetFilters });

    // Validate sensitivity
    const validSensitivities = ['low', 'medium', 'high'];
    if (sensitivity && !validSensitivities.includes(sensitivity)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SENSITIVITY',
          message: `sensitivity must be one of: ${validSensitivities.join(', ')}`
        }
      });
    }

    // Validate channels
    const validChannels = ['in-app', 'email'];
    if (channels && !Array.isArray(channels)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CHANNELS',
          message: 'channels must be an array'
        }
      });
    }

    if (channels) {
      const invalidChannels = channels.filter(c => !validChannels.includes(c));
      if (invalidChannels.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CHANNELS',
            message: `Invalid channels: ${invalidChannels.join(', ')}. Valid options: ${validChannels.join(', ')}`
          }
        });
      }
    }

    // Validate assetFilters
    if (assetFilters && !Array.isArray(assetFilters)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ASSET_FILTERS',
          message: 'assetFilters must be an array'
        }
      });
    }

    // Update configuration using service
    const config = await alertService.updateAlertConfig(userId, {
      sensitivity,
      channels,
      assetFilters
    });

    return res.status(200).json({
      success: true,
      data: config,
      message: 'Alert preferences configured successfully'
    });

  } catch (error) {
    console.error('[AIInsightsController] Error configuring alerts:', error);
    console.error('[AIInsightsController] Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An error occurred while configuring alerts'
      }
    });
  }
};

/**
 * Mark alert as read
 * POST /api/insights/alerts/:id/read
 */
export const markAlertAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Mark alert as read using service
    await alertService.markAsRead(id, userId);

    return res.status(200).json({
      success: true,
      message: 'Alert marked as read'
    });

  } catch (error) {
    console.error('[AIInsightsController] Error marking alert as read:', error);
    
    if (error.message === 'Alert not found or unauthorized') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ALERT_NOT_FOUND',
          message: 'Alert not found or you do not have permission to access it'
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while marking alert as read'
      }
    });
  }
};

/**
 * Get alert configuration
 * GET /api/insights/alerts/config
 */
export const getAlertConfig = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        success: true,
        data: {
          sensitivity: 'medium',
          channels: ['in-app'],
          assetFilters: []
        }
      });
    }

    const userId = req.user.id;

    const config = await alertService.getAlertConfig(userId);

    return res.status(200).json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('[AIInsightsController] Error getting alert config:', error);
    // Return default config instead of error
    return res.status(200).json({
      success: true,
      data: {
        sensitivity: 'medium',
        channels: ['in-app'],
        assetFilters: []
      }
    });
  }
};
