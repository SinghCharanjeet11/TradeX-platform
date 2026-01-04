/**
 * Performance Controller
 * Handles HTTP requests for portfolio performance and analytics
 */

import performanceService from '../services/performanceService.js';

/**
 * Get performance data for time range
 * @route GET /api/portfolio/performance
 */
export const getPerformanceData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '30D' } = req.query;

    // Validate time range - support both old and new formats
    const validRanges = ['1D', '5D', '7D', '1M', '30D', '6M', '90D', 'YTD', '1Y', '5Y', 'MAX', 'ALL'];
    if (!validRanges.includes(timeRange)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time range. Must be one of: 1D, 5D, 7D, 1M, 30D, 6M, 90D, YTD, 1Y, 5Y, MAX, ALL'
      });
    }
    
    // Map frontend time ranges to backend equivalents
    const rangeMapping = {
      '1D': '1D',
      '5D': '7D',    // Map 5D to 7D
      '7D': '7D',
      '1M': '30D',   // Map 1M to 30D
      '30D': '30D',
      '6M': '90D',   // Map 6M to 90D (closest)
      '90D': '90D',
      'YTD': '1Y',   // Map YTD to 1Y
      '1Y': '1Y',
      '5Y': 'ALL',   // Map 5Y to ALL (max available data)
      'MAX': 'ALL',  // Map MAX to ALL
      'ALL': 'ALL'
    };
    const mappedRange = rangeMapping[timeRange] || timeRange;

    const performanceData = await performanceService.getPerformanceData(userId, mappedRange);

    res.json({
      success: true,
      data: {
        timeRange,  // Return original requested range
        dataPoints: performanceData,
        count: performanceData.length
      }
    });
  } catch (error) {
    console.error('[PerformanceController] Error getting performance data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch performance data'
    });
  }
};

/**
 * Get asset allocation data
 * @route GET /api/portfolio/allocation
 */
export const getAllocationData = async (req, res) => {
  try {
    const userId = req.user.id;

    const allocation = await performanceService.calculateAllocation(userId);

    res.json({
      success: true,
      data: allocation
    });
  } catch (error) {
    console.error('[PerformanceController] Error getting allocation data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch allocation data'
    });
  }
};

/**
 * Get portfolio summary statistics
 * @route GET /api/portfolio/summary
 */
export const getPortfolioSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const summary = await performanceService.getPortfolioSummary(userId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('[PerformanceController] Error getting portfolio summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch portfolio summary'
    });
  }
};

/**
 * Create daily snapshot (manual trigger)
 * @route POST /api/portfolio/snapshot
 */
export const createSnapshot = async (req, res) => {
  try {
    const userId = req.user.id;

    const snapshot = await performanceService.createDailySnapshot(userId);

    if (!snapshot) {
      return res.json({
        success: true,
        message: 'No holdings to snapshot'
      });
    }

    res.json({
      success: true,
      data: snapshot,
      message: 'Snapshot created successfully'
    });
  } catch (error) {
    console.error('[PerformanceController] Error creating snapshot:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create snapshot'
    });
  }
};

/**
 * Get historical portfolio value
 * @route GET /api/portfolio/history
 */
export const getHistoricalValue = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const history = await performanceService.getHistoricalValue(
      userId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('[PerformanceController] Error getting historical value:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch historical value'
    });
  }
};
