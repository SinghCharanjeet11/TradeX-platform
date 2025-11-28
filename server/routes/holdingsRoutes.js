/**
 * Holdings Routes
 * API endpoints for portfolio holdings
 */

import express from 'express'
import {
  getHoldings,
  createHolding,
  updateHolding,
  deleteHolding,
  bulkDeleteHoldings,
  getHoldingsByType,
  getHoldingDetails,
  exportHoldingsCSV
} from '../controllers/holdingsController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// All holdings routes require authentication
router.use(requireAuth)

// GET /api/holdings - Get all holdings with filters and pagination
router.get('/', getHoldings)

// POST /api/holdings - Create new holding
router.post('/', createHolding)

// GET /api/holdings/by-type - Get holdings grouped by type
router.get('/by-type', getHoldingsByType)

// GET /api/holdings/export/csv - Export holdings to CSV
router.get('/export/csv', exportHoldingsCSV)

// DELETE /api/holdings/bulk - Bulk delete holdings
router.delete('/bulk', bulkDeleteHoldings)

// GET /api/holdings/:id - Get holding details
router.get('/:id', getHoldingDetails)

// PUT /api/holdings/:id - Update holding
router.put('/:id', updateHolding)

// DELETE /api/holdings/:id - Delete holding
router.delete('/:id', deleteHolding)

export default router
