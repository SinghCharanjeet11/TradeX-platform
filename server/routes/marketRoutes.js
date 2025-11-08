/**
 * Market Routes
 * API routes for market data endpoints
 */

import express from 'express';
import * as marketController from '../controllers/marketController.js';
import { verifyAuth } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   GET /api/markets/health
 * @desc    Get market API health status
 * @access  Public
 */
router.get('/health', marketController.getMarketHealth);

/**
 * @route   GET /api/markets/:type
 * @desc    Get market data by type (crypto, stocks, forex, commodities)
 * @access  Private (requires authentication)
 */
router.get('/:type', verifyAuth, apiLimiter, marketController.getMarketData);

/**
 * @route   GET /api/markets/:type/:symbol/details
 * @desc    Get detailed information for a specific asset
 * @access  Private (requires authentication)
 */
router.get('/:type/:symbol/details', verifyAuth, apiLimiter, marketController.getAssetDetails);

/**
 * @route   GET /api/markets/:type/:symbol/chart
 * @desc    Get chart data for a specific symbol
 * @access  Private (requires authentication)
 * @query   days - Number of days of historical data (default: 7)
 */
router.get('/:type/:symbol/chart', verifyAuth, apiLimiter, marketController.getMarketChart);

export default router;
