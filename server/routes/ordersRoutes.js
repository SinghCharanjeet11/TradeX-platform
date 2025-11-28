/**
 * Orders Routes
 * API routes for trading orders
 */

import express from 'express'
import ordersController from '../controllers/ordersController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(requireAuth)

// Get all orders with filters
router.get('/', ordersController.getOrders.bind(ordersController))

// Get trade history (completed orders)
router.get('/history', ordersController.getTradeHistory.bind(ordersController))

// Get open orders
router.get('/open', ordersController.getOpenOrders.bind(ordersController))

// Get trade analytics
router.get('/analytics', ordersController.getAnalytics.bind(ordersController))

// Get performance data
router.get('/performance', ordersController.getPerformance.bind(ordersController))

// Cancel an order
router.post('/:id/cancel', ordersController.cancelOrder.bind(ordersController))

// Create a new order
router.post('/', ordersController.createOrder.bind(ordersController))

export default router
