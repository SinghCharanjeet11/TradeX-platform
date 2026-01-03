/**
 * Performance Repository
 * Data access layer for portfolio performance snapshots
 */

import { query } from '../config/database.js';

class PerformanceRepository {
  /**
   * Create daily snapshot
   */
  async createSnapshot(userId, snapshotData) {
    const result = await query(
      `INSERT INTO portfolio_snapshots 
       (user_id, snapshot_date, total_value, total_invested, profit_loss, profit_loss_percent, holdings_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, snapshot_date) 
       DO UPDATE SET 
         total_value = EXCLUDED.total_value,
         total_invested = EXCLUDED.total_invested,
         profit_loss = EXCLUDED.profit_loss,
         profit_loss_percent = EXCLUDED.profit_loss_percent,
         holdings_count = EXCLUDED.holdings_count,
         created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        userId,
        snapshotData.date,
        snapshotData.totalValue,
        snapshotData.totalInvested,
        snapshotData.profitLoss,
        snapshotData.profitLossPercent,
        snapshotData.holdingsCount
      ]
    );
    return result.rows[0];
  }

  /**
   * Get snapshots for date range
   */
  async getSnapshotsByDateRange(userId, startDate, endDate) {
    try {
      const result = await query(
        `SELECT id, user_id as "userId", snapshot_date as "date",
                total_value as "totalValue", total_invested as "totalInvested",
                profit_loss as "profitLoss", profit_loss_percent as "profitLossPercent",
                holdings_count as "holdingsCount", created_at as "createdAt"
         FROM portfolio_snapshots
         WHERE user_id = $1 AND snapshot_date BETWEEN $2 AND $3
         ORDER BY snapshot_date ASC`,
        [userId, startDate, endDate]
      );
      return result.rows;
    } catch (error) {
      // Table doesn't exist yet, return empty array
      if (error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get latest snapshot
   */
  async getLatestSnapshot(userId) {
    const result = await query(
      `SELECT id, user_id as "userId", snapshot_date as "date",
              total_value as "totalValue", total_invested as "totalInvested",
              profit_loss as "profitLoss", profit_loss_percent as "profitLossPercent",
              holdings_count as "holdingsCount", created_at as "createdAt"
       FROM portfolio_snapshots
       WHERE user_id = $1
       ORDER BY snapshot_date DESC
       LIMIT 1`,
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Get snapshots for last N days
   */
  async getRecentSnapshots(userId, days) {
    const result = await query(
      `SELECT id, user_id as "userId", snapshot_date as "date",
              total_value as "totalValue", total_invested as "totalInvested",
              profit_loss as "profitLoss", profit_loss_percent as "profitLossPercent",
              holdings_count as "holdingsCount", created_at as "createdAt"
       FROM portfolio_snapshots
       WHERE user_id = $1 AND snapshot_date >= CURRENT_DATE - INTERVAL '1 day' * $2
       ORDER BY snapshot_date ASC`,
      [userId, days]
    );
    return result.rows;
  }

  /**
   * Delete old snapshots (cleanup)
   */
  async deleteOldSnapshots(userId, beforeDate) {
    const result = await query(
      'DELETE FROM portfolio_snapshots WHERE user_id = $1 AND snapshot_date < $2',
      [userId, beforeDate]
    );
    return result.rowCount;
  }

  /**
   * Get all snapshots for user
   */
  async getAllSnapshots(userId) {
    try {
      const result = await query(
        `SELECT id, user_id as "userId", snapshot_date as "date",
                total_value as "totalValue", total_invested as "totalInvested",
                profit_loss as "profitLoss", profit_loss_percent as "profitLossPercent",
                holdings_count as "holdingsCount", created_at as "createdAt"
         FROM portfolio_snapshots
         WHERE user_id = $1
         ORDER BY snapshot_date ASC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      // Table doesn't exist yet, return empty array
      if (error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }
}

export default new PerformanceRepository();
