/**
 * Holdings Controller
 * Handles HTTP requests for portfolio holdings data
 */

import holdingsService from '../services/holdingsService.js'

/**
 * Get all holdings for authenticated user
 * @route GET /api/holdings
 */
export const getHoldings = async (req, res) => {
  try {
    const userId = req.user.id
    const { page, pageSize, assetType, search, sortBy, sortOrder } = req.query

    // Check if pagination is requested
    if (page || pageSize) {
      const pageNum = parseInt(page) || 1
      const size = parseInt(pageSize) || 20
      const filters = { assetType, search, sortBy, sortOrder }

      const result = await holdingsService.getHoldingsPaginated(userId, filters, pageNum, size)
      
      return res.json({
        success: true,
        data: result
      })
    }

    // Get all holdings without pagination
    const filters = { assetType, search, sortBy, sortOrder }
    const result = await holdingsService.getHoldings(userId, filters)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[HoldingsController] Error getting holdings:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch holdings'
    })
  }
}

/**
 * Create new holding
 * @route POST /api/holdings
 */
export const createHolding = async (req, res) => {
  try {
    const userId = req.user.id
    const holdingData = req.body

    const holding = await holdingsService.createHolding(userId, holdingData)

    res.status(201).json({
      success: true,
      data: holding,
      message: 'Holding created successfully'
    })
  } catch (error) {
    console.error('[HoldingsController] Error creating holding:', error)
    
    if (error.validationErrors) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: error.validationErrors
      })
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create holding'
    })
  }
}

/**
 * Update existing holding
 * @route PUT /api/holdings/:id
 */
export const updateHolding = async (req, res) => {
  try {
    const userId = req.user.id
    const holdingId = parseInt(req.params.id)
    const holdingData = req.body

    const holding = await holdingsService.updateHolding(holdingId, userId, holdingData)

    res.json({
      success: true,
      data: holding,
      message: 'Holding updated successfully'
    })
  } catch (error) {
    console.error('[HoldingsController] Error updating holding:', error)
    
    if (error.validationErrors) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: error.validationErrors
      })
    }

    if (error.message === 'Holding not found') {
      return res.status(404).json({
        success: false,
        error: 'Holding not found'
      })
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      })
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update holding'
    })
  }
}

/**
 * Delete holding
 * @route DELETE /api/holdings/:id
 */
export const deleteHolding = async (req, res) => {
  try {
    const userId = req.user.id
    const holdingId = parseInt(req.params.id)

    await holdingsService.deleteHolding(holdingId, userId)

    res.json({
      success: true,
      message: 'Holding deleted successfully'
    })
  } catch (error) {
    console.error('[HoldingsController] Error deleting holding:', error)
    
    if (error.message === 'Holding not found') {
      return res.status(404).json({
        success: false,
        error: 'Holding not found'
      })
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      })
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete holding'
    })
  }
}

/**
 * Bulk delete holdings
 * @route DELETE /api/holdings/bulk
 */
export const bulkDeleteHoldings = async (req, res) => {
  try {
    const userId = req.user.id
    const { holdingIds } = req.body

    if (!Array.isArray(holdingIds) || holdingIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid holding IDs array'
      })
    }

    const deletedCount = await holdingsService.bulkDeleteHoldings(holdingIds, userId)

    res.json({
      success: true,
      data: { deletedCount },
      message: `${deletedCount} holdings deleted successfully`
    })
  } catch (error) {
    console.error('[HoldingsController] Error bulk deleting holdings:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete holdings'
    })
  }
}

/**
 * Get single holding details
 * @route GET /api/holdings/:id
 */
export const getHoldingDetails = async (req, res) => {
  try {
    const holdingId = parseInt(req.params.id)

    const holding = await holdingsService.getHoldingDetails(holdingId)

    res.json({
      success: true,
      data: holding
    })
  } catch (error) {
    console.error('[HoldingsController] Error getting holding details:', error)
    
    if (error.message === 'Holding not found') {
      return res.status(404).json({
        success: false,
        error: 'Holding not found'
      })
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch holding details'
    })
  }
}

/**
 * Export holdings to CSV
 * @route GET /api/holdings/export/csv
 */
export const exportHoldingsCSV = async (req, res) => {
  try {
    const userId = req.user.id
    const { assetType, search } = req.query
    const filters = { assetType, search }

    const csv = await holdingsService.exportToCSV(userId, filters)

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=holdings-${Date.now()}.csv`)
    res.send(csv)
  } catch (error) {
    console.error('[HoldingsController] Error exporting CSV:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export holdings'
    })
  }
}

/**
 * Get holdings grouped by type
 * @route GET /api/holdings/by-type
 */
export const getHoldingsByType = async (req, res) => {
  try {
    const userId = req.user.id

    const grouped = await holdingsService.getHoldingsByType(userId)

    res.json({
      success: true,
      data: grouped
    })
  } catch (error) {
    console.error('[HoldingsController] Error getting holdings by type:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch holdings'
    })
  }
}
