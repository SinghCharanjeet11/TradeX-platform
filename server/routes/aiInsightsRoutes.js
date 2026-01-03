/**
 * AI Insights Routes
 * Routes for AI-powered insights endpoints
 */

import express from 'express';
import {
  getPricePredictions,
  getSentimentAnalysis,
  getTradingSignal,
  dismissSignal,
  getTechnicalIndicators,
  getRecommendations,
  trackRecommendationAction,
  getPortfolioOptimization,
  getAlerts,
  configureAlerts,
  getAlertConfig,
  markAlertAsRead
} from '../controllers/aiInsightsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All AI insights routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/insights/predictions/:symbol
 * @desc    Get price predictions for an asset
 * @access  Private
 * @query   assetType (required): crypto, stock, forex, commodity
 * @query   timeHorizons (optional): comma-separated list (24h,7d,30d)
 */
router.get('/predictions/:symbol', getPricePredictions);

/**
 * @route   GET /api/insights/sentiment/:symbol
 * @desc    Get sentiment analysis for an asset
 * @access  Private
 * @query   hoursBack (optional): number of hours to analyze (default: 48, max: 168)
 */
router.get('/sentiment/:symbol', getSentimentAnalysis);

/**
 * @route   GET /api/insights/signals/:symbol
 * @desc    Get trading signal for an asset
 * @access  Private
 * @query   assetType (required): crypto, stock, forex, commodity
 */
router.get('/signals/:symbol', getTradingSignal);

/**
 * @route   GET /api/insights/technical/:symbol
 * @desc    Get technical indicators analysis for an asset
 * @access  Private
 * @query   assetType (required): crypto, stock, forex, commodity
 */
router.get('/technical/:symbol', getTechnicalIndicators);

/**
 * @route   POST /api/insights/signals/:id/dismiss
 * @desc    Dismiss a trading signal
 * @access  Private
 */
router.post('/signals/:id/dismiss', dismissSignal);

/**
 * @route   GET /api/insights/recommendations
 * @desc    Get personalized trading recommendations
 * @access  Private
 * @query   limit (optional): number of recommendations (default: 5, max: 10)
 */
router.get('/recommendations', getRecommendations);

/**
 * @route   POST /api/insights/recommendations/:id/track
 * @desc    Track action on a recommendation
 * @access  Private
 * @body    action: string (view, dismiss, added_to_watchlist, purchased)
 * @body    outcome: object (optional, e.g., { success: boolean, value: number })
 */
router.post('/recommendations/:id/track', trackRecommendationAction);

/**
 * @route   GET /api/insights/portfolio-optimization
 * @desc    Get portfolio optimization suggestions
 * @access  Private
 */
router.get('/portfolio-optimization', getPortfolioOptimization);

/**
 * @route   GET /api/insights/alerts
 * @desc    Get AI-generated alerts
 * @access  Private
 * @query   limit (optional): number of alerts (default: 20, max: 100)
 * @query   unreadOnly (optional): only return unread alerts (default: false)
 */
router.get('/alerts', getAlerts);

/**
 * @route   GET /api/insights/alerts/config
 * @desc    Get alert configuration
 * @access  Private
 */
router.get('/alerts/config', getAlertConfig);

/**
 * @route   POST /api/insights/alerts/configure
 * @desc    Configure alert preferences
 * @access  Private
 * @body    sensitivity: string (low, medium, high)
 * @body    channels: array of strings (in-app, email)
 * @body    assetFilters: array of asset symbols
 */
router.post('/alerts/configure', configureAlerts);

/**
 * @route   POST /api/insights/alerts/:id/read
 * @desc    Mark alert as read
 * @access  Private
 */
router.post('/alerts/:id/read', markAlertAsRead);

export default router;
