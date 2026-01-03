/**
 * Watchlist Repository
 * Data access layer for user watchlists with PostgreSQL
 */

import { query } from '../config/database.js';

class WatchlistRepository {
  /**
   * Get user's watchlist
   */
  async getUserWatchlist(userId) {
    const result = await query(
      'SELECT id, user_id as "userId", symbol, name, asset_type as "assetType", created_at as "addedAt" FROM watchlist WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  /**
   * Add asset to watchlist
   */
  async addToWatchlist(userId, asset) {
    try {
      const result = await query(
        'INSERT INTO watchlist (user_id, symbol, name, asset_type) VALUES ($1, $2, $3, $4) RETURNING id, user_id as "userId", symbol, name, asset_type as "assetType", created_at as "addedAt"',
        [userId, asset.symbol, asset.name, asset.assetType]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Asset already in watchlist');
      }
      throw error;
    }
  }

  /**
   * Remove asset from watchlist
   */
  async removeFromWatchlist(userId, watchlistId) {
    const result = await query(
      'DELETE FROM watchlist WHERE id = $1 AND user_id = $2',
      [watchlistId, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Check if asset is in watchlist
   */
  async isInWatchlist(userId, symbol, assetType) {
    const result = await query(
      'SELECT EXISTS(SELECT 1 FROM watchlist WHERE user_id = $1 AND symbol = $2 AND asset_type = $3)',
      [userId, symbol, assetType]
    );
    return result.rows[0].exists;
  }

  /**
   * Get user's price alerts
   */
  async getUserAlerts(userId) {
    const result = await query(
      'SELECT id, user_id as "userId", symbol, name, asset_type as "assetType", target_price as "targetPrice", condition, current_price as "currentPrice", initial_price as "initialPrice", is_active as "active", triggered_at as "triggeredAt", created_at as "createdAt" FROM price_alerts WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map(row => ({
      ...row,
      triggered: !!row.triggeredAt
    }));
  }

  /**
   * Create price alert
   */
  async createAlert(userId, alertData) {
    const result = await query(
      'INSERT INTO price_alerts (user_id, symbol, name, asset_type, target_price, condition, current_price, initial_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, user_id as "userId", symbol, name, asset_type as "assetType", target_price as "targetPrice", condition, current_price as "currentPrice", initial_price as "initialPrice", is_active as "active", created_at as "createdAt"',
      [userId, alertData.symbol, alertData.name, alertData.assetType, alertData.targetPrice, alertData.condition, alertData.currentPrice, alertData.initialPrice || alertData.currentPrice]
    );
    return {
      ...result.rows[0],
      triggered: false,
      triggeredAt: null
    };
  }

  /**
   * Delete price alert
   */
  async deleteAlert(userId, alertId) {
    const result = await query(
      'DELETE FROM price_alerts WHERE id = $1 AND user_id = $2',
      [alertId, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Update alert status
   * CRITICAL FIX: Use proper SQL placeholders with $ sign ($1, $2, etc.)
   */
  async updateAlert(alertId, updates) {
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (updates.active !== undefined) {
      setClauses.push('is_active = $' + paramCount++);
      values.push(updates.active);
    }
    if (updates.triggeredAt !== undefined) {
      setClauses.push('triggered_at = $' + paramCount++);
      values.push(updates.triggeredAt);
    }
    if (updates.currentPrice !== undefined) {
      setClauses.push('current_price = $' + paramCount++);
      values.push(updates.currentPrice);
    }

    if (setClauses.length === 0) return null;

    values.push(alertId);
    const sqlQuery = 'UPDATE price_alerts SET ' + setClauses.join(', ') + ', updated_at = CURRENT_TIMESTAMP WHERE id = $' + paramCount + ' RETURNING *';
    
    const result = await query(sqlQuery, values);
    return result.rows[0];
  }

  /**
   * Get all active alerts (for monitoring)
   */
  async getAllActiveAlerts() {
    const result = await query(
      'SELECT id, user_id as "userId", symbol, name, asset_type as "assetType", target_price as "targetPrice", condition, current_price as "currentPrice", initial_price as "initialPrice", is_active as "active", triggered_at as "triggeredAt", created_at as "createdAt" FROM price_alerts WHERE is_active = true AND triggered_at IS NULL',
      []
    );
    return result.rows.map(row => ({
      ...row,
      triggered: false
    }));
  }
}

export default new WatchlistRepository();
