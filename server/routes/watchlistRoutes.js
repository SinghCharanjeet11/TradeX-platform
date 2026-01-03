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

// Logging middleware
router.use((req, res, next) => {
  console.log(`[WatchlistRoutes] ${req.method} ${req.path}`)
  next()
})

// All watchlist routes require authentication
router.use(requireAuth)

// Price alerts endpoints (must come before /:id routes)
router.get('/alerts', getAlerts)
router.post('/alerts', createAlert)
router.delete('/alerts/:id', deleteAlert)

// Watchlist endpoints
router.get('/check/:symbol/:assetType', checkWatchlist)
router.get('/', getWatchlist)
router.post('/', addToWatchlist)
router.delete('/:id', removeFromWatchlist)

export default router
