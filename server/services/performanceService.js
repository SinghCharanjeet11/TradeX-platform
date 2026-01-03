/**
 * Performance Service
 * Business logic for portfolio performance tracking and analytics
 */

import performanceRepository from '../repositories/performanceRepository.js';
import holdingsService from './holdingsService.js';

class PerformanceService {
  /**
   * Get performance data for time range
   * @param {Number} userId - User ID
   * @param {String} timeRange - Time range (7D, 30D, 90D, 1Y, ALL)
   * @returns {Promise<Array>} Performance data points
   */
  async getPerformanceData(userId, timeRange = '30D') {
    try {
      const days = this._getDaysFromTimeRange(timeRange);
      
      let snapshots;
      if (timeRange === 'ALL') {
        snapshots = await performanceRepository.getAllSnapshots(userId);
      } else {
        snapshots = await performanceRepository.getRecentSnapshots(userId, days);
      }

      // Transform snapshots to performance data points
      const performanceData = snapshots.map((snapshot, index) => {
        const previousValue = index > 0 ? snapshots[index - 1].totalValue : snapshot.totalInvested;
        const change = snapshot.totalValue - previousValue;
        const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;

        return {
          date: snapshot.date,
          value: snapshot.totalValue,
          invested: snapshot.totalInvested,
          profitLoss: snapshot.profitLoss,
          profitLossPercent: snapshot.profitLossPercent,
          change,
          changePercent,
          holdingsCount: snapshot.holdingsCount
        };
      });

      return performanceData;
    } catch (error) {
      console.error('[PerformanceService] Error getting performance data:', error);
      throw error;
    }
  }

  /**
   * Create daily snapshot for user
   * Uses holdings from connected exchange accounts only
   * @param {Number} userId - User ID
   * @returns {Promise<Object>} Created snapshot
   */
  async createDailySnapshot(userId) {
    try {
      // Get current holdings from connected exchange accounts only
      const { holdings } = await holdingsService.getHoldings(userId);

      if (holdings.length === 0) {
        console.log(`[PerformanceService] No holdings for user ${userId}, skipping snapshot`);
        return null;
      }

      // Calculate totals
      const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
      const totalInvested = holdings.reduce((sum, h) => sum + (h.quantity * h.avgBuyPrice), 0);
      const profitLoss = totalValue - totalInvested;
      const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

      // Create snapshot
      const snapshotData = {
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        totalValue,
        totalInvested,
        profitLoss,
        profitLossPercent,
        holdingsCount: holdings.length
      };

      const snapshot = await performanceRepository.createSnapshot(userId, snapshotData);
      console.log(`[PerformanceService] Created snapshot for user ${userId}`);
      return snapshot;
    } catch (error) {
      console.error('[PerformanceService] Error creating snapshot:', error);
      throw error;
    }
  }

  /**
   * Calculate asset allocation
   * Uses holdings from connected exchange accounts only
   * @param {Number} userId - User ID
   * @returns {Promise<Array>} Allocation data by asset type
   */
  async calculateAllocation(userId) {
    try {
      // Get holdings from connected exchange accounts only
      const { holdings } = await holdingsService.getHoldings(userId);

      if (holdings.length === 0) {
        return [];
      }

      // Group by asset type
      const grouped = holdings.reduce((acc, holding) => {
        if (!acc[holding.assetType]) {
          acc[holding.assetType] = {
            assetType: holding.assetType,
            value: 0,
            count: 0
          };
        }
        acc[holding.assetType].value += holding.totalValue;
        acc[holding.assetType].count += 1;
        return acc;
      }, {});

      // Calculate total value
      const totalValue = Object.values(grouped).reduce((sum, g) => sum + g.value, 0);

      // Calculate percentages and format
      const allocation = Object.values(grouped).map(group => ({
        assetType: group.assetType,
        value: group.value,
        count: group.count,
        percentage: totalValue > 0 ? (group.value / totalValue) * 100 : 0,
        color: this._getAssetTypeColor(group.assetType)
      }));

      // Sort by value descending
      allocation.sort((a, b) => b.value - a.value);

      return allocation;
    } catch (error) {
      console.error('[PerformanceService] Error calculating allocation:', error);
      throw error;
    }
  }

  /**
   * Get historical portfolio value
   * @param {Number} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Historical values
   */
  async getHistoricalValue(userId, startDate, endDate) {
    try {
      const snapshots = await performanceRepository.getSnapshotsByDateRange(
        userId,
        startDate,
        endDate
      );

      return snapshots.map(snapshot => ({
        date: snapshot.date,
        value: snapshot.totalValue,
        profitLoss: snapshot.profitLoss,
        profitLossPercent: snapshot.profitLossPercent
      }));
    } catch (error) {
      console.error('[PerformanceService] Error getting historical value:', error);
      throw error;
    }
  }

  /**
   * Get portfolio summary statistics
   * Uses holdings from connected exchange accounts only
   * @param {Number} userId - User ID
   * @returns {Promise<Object>} Summary statistics
   */
  async getPortfolioSummary(userId) {
    try {
      // Get holdings from connected exchange accounts only
      const { holdings, summary } = await holdingsService.getHoldings(userId);
      const latestSnapshot = await performanceRepository.getLatestSnapshot(userId);

      const totalValue = summary.totalValue;
      const totalInvested = summary.totalInvested;
      const profitLoss = summary.totalProfitLoss;
      const profitLossPercent = summary.totalProfitLossPercent;

      // Calculate 24h change if we have yesterday's snapshot
      let change24h = 0;
      let change24hPercent = 0;
      if (latestSnapshot) {
        change24h = totalValue - latestSnapshot.totalValue;
        change24hPercent = latestSnapshot.totalValue > 0 
          ? (change24h / latestSnapshot.totalValue) * 100 
          : 0;
      }

      return {
        totalValue,
        totalInvested,
        profitLoss,
        profitLossPercent,
        holdingsCount: holdings.length,
        change24h,
        change24hPercent,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('[PerformanceService] Error getting portfolio summary:', error);
      throw error;
    }
  }

  // Private helper methods

  _getDaysFromTimeRange(timeRange) {
    const rangeMap = {
      '7D': 7,
      '30D': 30,
      '90D': 90,
      '1Y': 365,
      'ALL': 3650 // 10 years
    };
    return rangeMap[timeRange] || 30;
  }

  _getAssetTypeColor(assetType) {
    const colorMap = {
      crypto: '#f59e0b',
      stocks: '#3b82f6',
      forex: '#8b5cf6',
      commodities: '#10b981'
    };
    return colorMap[assetType] || '#6b7280';
  }
}

export default new PerformanceService();
