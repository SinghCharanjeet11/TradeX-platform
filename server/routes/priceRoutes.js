/**
 * Price Routes
 * API endpoints for price updates and history
 */

import express from 'express';
import {
  getCurrentPrices,
  refreshPrices,
  getPriceHistory
} from '../controllers/priceController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All price routes require authentication
router.use(requireAuth);

// GET /api/prices/current?symbols=BTC,ETH,AAPL - Get current prices
router.get('/current', getCurrentPrices);

// POST /api/prices/refresh - Trigger manual price refresh
router.post('/refresh', refreshPrices);

// GET /api/prices/history/:symbol?assetType=crypto&days=30 - Get price history
router.get('/history/:symbol', getPriceHistory);

export default router;
