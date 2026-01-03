/**
 * Alert Repository
 * Handles database operations for AI-generated alerts
 */

import db from '../config/database.js';

class AlertRepository {
  /**
   * Create a new alert
   * @param {Object} alertData - Alert data
   * @returns {Promise<Object>} - Created alert
   */
  async createAlert(alertData) {
    const {
      userId,
      symbol,
      alertType,
      severity,
      title,
      message,
      recommendedAction,
      data,
      channels
    } = alertData;

    const query = `
      INSERT INTO ai_alerts (
        user_id, symbol, alert_type, severity, title, message,
        recommended_action, data, channels, read, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, NOW())
      RETURNING *
    `;

    const values = [
      userId,
      symbol,
      alertType,
      severity,
      title,
      message,
      recommendedAction,
      JSON.stringify(data),
      JSON.stringify(channels)
    ];

    const result = await db.query(query, values);
    return this._formatAlert(result.rows[0]);
  }

  /**
   * Get alerts for a user
   * @param {number} userId - User ID
   * @param {number} limit - Maximum number of alerts to return
   * @param {boolean} unreadOnly - Only return unread alerts
   * @returns {Promise<Array>} - Array of alerts
   */
  async getAlertsByUserId(userId, limit = 20, unreadOnly = false) {
    try {
      let query = `
        SELECT * FROM ai_alerts
        WHERE user_id = $1
      `;

      if (unreadOnly) {
        query += ' AND read = false';
      }

      query += ' ORDER BY created_at DESC LIMIT $2';

      const result = await db.query(query, [userId, limit]);
      return result.rows.map(row => this._formatAlert(row));
    } catch (error) {
      // If table doesn't exist, return empty array
      console.warn('[AlertRepository] ai_alerts table may not exist, returning empty array');
      return [];
    }
  }

  /**
   * Get alert by ID
   * @param {string} alertId - Alert ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} - Alert or null if not found
   */
  async getAlertById(alertId, userId) {
    const query = `
      SELECT * FROM ai_alerts
      WHERE id = $1 AND user_id = $2
    `;

    const result = await db.query(query, [alertId, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this._formatAlert(result.rows[0]);
  }

  /**
   * Mark alert as read
   * @param {string} alertId - Alert ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<boolean>} - True if updated, false if not found
   */
  async markAsRead(alertId, userId) {
    const query = `
      UPDATE ai_alerts
      SET read = true
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await db.query(query, [alertId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Mark all alerts as read for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} - Number of alerts marked as read
   */
  async markAllAsRead(userId) {
    const query = `
      UPDATE ai_alerts
      SET read = true
      WHERE user_id = $1 AND read = false
      RETURNING id
    `;

    const result = await db.query(query, [userId]);
    return result.rows.length;
  }

  /**
   * Get unread alert count for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} - Count of unread alerts
   */
  async getUnreadCount(userId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM ai_alerts
        WHERE user_id = $1 AND read = false
      `;

      const result = await db.query(query, [userId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      // If table doesn't exist, return 0
      console.warn('[AlertRepository] ai_alerts table may not exist, returning 0');
      return 0;
    }
  }

  /**
   * Delete old alerts (cleanup)
   * @param {number} daysOld - Delete alerts older than this many days
   * @returns {Promise<number>} - Number of alerts deleted
   */
  async deleteOldAlerts(daysOld = 30) {
    const query = `
      DELETE FROM ai_alerts
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
      RETURNING id
    `;

    const result = await db.query(query);
    return result.rows.length;
  }

  /**
   * Get or create alert configuration for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Alert configuration
   */
  async getAlertConfig(userId) {
    try {
      const query = `
        SELECT * FROM alert_config
        WHERE user_id = $1
      `;

      const result = await db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        // Return default configuration
        return {
          userId,
          sensitivity: 'medium',
          channels: ['in-app'],
          assetFilters: []
        };
      }

      const config = result.rows[0];
      return {
        userId: config.user_id,
        sensitivity: config.sensitivity,
        channels: config.channels,
        assetFilters: config.asset_filters
      };
    } catch (error) {
      // If table doesn't exist, return default config
      console.warn('[AlertRepository] alert_config table may not exist, returning default config');
      return {
        userId,
        sensitivity: 'medium',
        channels: ['in-app'],
        assetFilters: []
      };
    }
  }

  /**
   * Update alert configuration for a user
   * @param {number} userId - User ID
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} - Updated configuration
   */
  async updateAlertConfig(userId, config) {
    const { sensitivity, channels, assetFilters } = config;

    console.log('[AlertRepository] Updating config for user:', userId);
    console.log('[AlertRepository] Config values:', { sensitivity, channels, assetFilters });

    try {
      const query = `
        INSERT INTO alert_config (user_id, sensitivity, channels, asset_filters, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
          sensitivity = EXCLUDED.sensitivity,
          channels = EXCLUDED.channels,
          asset_filters = EXCLUDED.asset_filters,
          updated_at = NOW()
        RETURNING *
      `;

      const values = [
        userId,
        sensitivity || 'medium',
        JSON.stringify(channels || ['in-app']),
        JSON.stringify(assetFilters || [])
      ];

      console.log('[AlertRepository] Query values:', values);

      const result = await db.query(query, values);
      const savedConfig = result.rows[0];

      console.log('[AlertRepository] Saved config:', savedConfig);

      return {
        userId: savedConfig.user_id,
        sensitivity: savedConfig.sensitivity,
        channels: savedConfig.channels,
        assetFilters: savedConfig.asset_filters
      };
    } catch (error) {
      console.error('[AlertRepository] Error updating alert config:', error);
      console.error('[AlertRepository] Error details:', error.message, error.code);
      throw error;
    }
  }

  /**
   * Format alert from database row
   * @private
   */
  _formatAlert(row) {
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      symbol: row.symbol,
      alertType: row.alert_type,
      severity: row.severity,
      title: row.title,
      message: row.message,
      recommendedAction: row.recommended_action,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      channels: typeof row.channels === 'string' ? JSON.parse(row.channels) : row.channels,
      read: row.read,
      createdAt: row.created_at
    };
  }
}

export default new AlertRepository();
