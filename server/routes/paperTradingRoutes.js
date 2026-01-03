/**
 * Paper Trading Routes
 * API routes for paper trading functionality
 */

import express from 'express';
import paperTradingController from '../controllers/paperTradingController.js';
import { requireAuth } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);

// Apply rate limiting
router.use(apiLimiter);

/**
 * @route   GET /api/paper-trading/account
 * @desc    Get or create paper trading account
 * @access  Private
 */
router.get('/account', paperTradingController.getAccount);

/**
 * @route   POST /api/paper-trading/account/reset
 * @desc    Reset paper trading account to initial state
 * @access  Private
 */
router.post('/account/reset', paperTradingController.resetAccount);

/**
 * @route   GET /api/paper-trading/statistics
 * @desc    Get paper trading statistics and performance
 * @access  Private
 */
router.get('/statistics', paperTradingController.getStatistics);

/**
 * @route   GET /api/paper-trading/leaderboard
 * @desc    Get paper trading leaderboard
 * @access  Private
 */
router.get('/leaderboard', paperTradingController.getLeaderboard);

/**
 * @route   PUT /api/paper-trading/leaderboard/visibility
 * @desc    Update leaderboard visibility preference
 * @access  Private
 */
router.put('/leaderboard/visibility', paperTradingController.updateLeaderboardVisibility);

/**
 * @route   POST /api/paper-trading/orders
 * @desc    Execute a paper trading order
 * @access  Private
 */
router.post('/orders', paperTradingController.executePaperOrder);

/**
 * @route   GET /api/paper-trading/orders
 * @desc    Get paper trading order history
 * @access  Private
 * @query   account - Filter by account type (paper)
 */
router.get('/orders', paperTradingController.getOrders);

/**
 * @route   GET /api/paper-trading/performance
 * @desc    Get performance history for charts
 * @access  Private
 * @query   period - Time period (7d, 30d, 90d, all)
 */
router.get('/performance', paperTradingController.getPerformanceHistory);

export default router;
