/**
 * Portfolio Routes
 * API endpoints for portfolio data and performance
 */

import express from 'express';
import {
  getPerformanceData,
  getAllocationData,
  getPortfolioSummary,
  createSnapshot,
  getHistoricalValue
} from '../controllers/performanceController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All portfolio routes require authentication
router.use(requireAuth);

// GET /api/portfolio/summary - Get portfolio summary statistics
router.get('/summary', getPortfolioSummary);

// GET /api/portfolio/performance?timeRange=30D - Get performance data
router.get('/performance', getPerformanceData);

// GET /api/portfolio/allocation - Get asset allocation
router.get('/allocation', getAllocationData);

// GET /api/portfolio/history?startDate=2024-01-01&endDate=2024-12-31 - Get historical value
router.get('/history', getHistoricalValue);

// POST /api/portfolio/snapshot - Create daily snapshot (manual trigger)
router.post('/snapshot', createSnapshot);

export default router;
