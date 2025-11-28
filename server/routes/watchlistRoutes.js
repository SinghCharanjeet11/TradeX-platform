/**
 * Watchlist Routes
 * API endpoints for watchlist and price alerts
 */

import express from 'express'
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlist,
  getAlerts,
  createAlert,
  deleteAlert
} from '../controllers/watchlistController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// All watchlist routes require authentication
router.use(requireAuth)

// Watchlist endpoints
router.get('/', getWatchlist)
router.post('/', addToWatchlist)
router.delete('/:id', removeFromWatchlist)
router.get('/check/:symbol/:assetType', checkWatchlist)

// Price alerts endpoints
router.get('/alerts', getAlerts)
router.post('/alerts', createAlert)
router.delete('/alerts/:id', deleteAlert)

export default router
