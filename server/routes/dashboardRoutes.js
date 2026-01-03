/**
 * Dashboard Routes
 * Batch endpoint for fetching all dashboard data in one request
 */

import express from 'express'
import dashboardController from '../controllers/dashboardController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Batch endpoint - get all dashboard data
router.get('/all', requireAuth, dashboardController.getDashboardData)

export default router
