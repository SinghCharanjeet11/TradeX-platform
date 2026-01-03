/**
 * Alert Service
 * Business logic for AI-generated alerts
 */

import alertRepository from '../repositories/alertRepository.js';
import alertDetectionService from './alertDetectionService.js';

class AlertService {
  /**
   * Get alerts for a user
   * @param {number} userId - User ID
   * @param {number} limit - Maximum number of alerts
   * @param {boolean} unreadOnly - Only return unread alerts
   * @returns {Promise<Array>} - Array of alerts
   */
  async getAlerts(userId, limit = 20, unreadOnly = false) {
    try {
      const alerts = await alertRepository.getAlertsByUserId(userId, limit, unreadOnly);
      return alerts;
    } catch (error) {
      console.error('[AlertService] Error getting alerts:', error);
      throw error;
    }
  }

  /**
   * Get unread alert count
   * @param {number} userId - User ID
   * @returns {Promise<number>} - Count of unread alerts
   */
  async getUnreadCount(userId) {
    try {
      return await alertRepository.getUnreadCount(userId);
    } catch (error) {
      console.error('[AlertService] Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Mark alert as read
   * @param {string} alertId - Alert ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - True if successful
   */
  async markAsRead(alertId, userId) {
    try {
      const success = await alertRepository.markAsRead(alertId, userId);
      
      if (!success) {
        throw new Error('Alert not found or unauthorized');
      }

      return true;
    } catch (error) {
      console.error('[AlertService] Error marking alert as read:', error);
      throw error;
    }
  }

  /**
   * Mark all alerts as read
   * @param {number} userId - User ID
   * @returns {Promise<number>} - Number of alerts marked as read
   */
  async markAllAsRead(userId) {
    try {
      return await alertRepository.markAllAsRead(userId);
    } catch (error) {
      console.error('[AlertService] Error marking all alerts as read:', error);
      throw error;
    }
  }

  /**
   * Get alert configuration for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Alert configuration
   */
  async getAlertConfig(userId) {
    try {
      return await alertRepository.getAlertConfig(userId);
    } catch (error) {
      console.error('[AlertService] Error getting alert config:', error);
      throw error;
    }
  }

  /**
   * Update alert configuration
   * @param {number} userId - User ID
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} - Updated configuration
   */
  async updateAlertConfig(userId, config) {
    try {
      return await alertRepository.updateAlertConfig(userId, config);
    } catch (error) {
      console.error('[AlertService] Error updating alert config:', error);
      throw error;
    }
  }

  /**
   * Create alert from anomaly detection
   * @param {Object} anomaly - Anomaly detection result
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Created alert
   */
  async createAlertFromAnomaly(anomaly, userId) {
    try {
      // Get user's alert configuration
      const config = await this.getAlertConfig(userId);

      // Generate alert using alert detection service
      const alert = alertDetectionService.generateAlert(anomaly, userId, config.sensitivity);

      // If alert was filtered out by sensitivity, return null
      if (!alert) {
        return null;
      }

      // Check if asset is in user's filters (if filters are set)
      if (config.assetFilters && config.assetFilters.length > 0) {
        if (!config.assetFilters.includes(anomaly.symbol)) {
          return null; // Skip this alert
        }
      }

      // Save alert to database
      const savedAlert = await alertRepository.createAlert(alert);

      return savedAlert;
    } catch (error) {
      console.error('[AlertService] Error creating alert from anomaly:', error);
      throw error;
    }
  }

  /**
   * Process price movements and generate alerts
   * @param {string} symbol - Asset symbol
   * @param {Array} priceHistory - Historical price data
   * @param {number} currentPrice - Current price
   * @param {Array<number>} userIds - User IDs to notify
   * @returns {Promise<Array>} - Created alerts
   */
  async processAnomalyDetection(symbol, priceHistory, currentPrice, userIds) {
    try {
      // Detect anomaly
      const anomaly = alertDetectionService.detectAnomaly(symbol, priceHistory, currentPrice);

      // If no anomaly detected, return empty array
      if (!anomaly) {
        return [];
      }

      // Create alerts for all users
      const alerts = [];
      for (const userId of userIds) {
        const alert = await this.createAlertFromAnomaly(anomaly, userId);
        if (alert) {
          alerts.push(alert);
        }
      }

      // Group alerts if multiple were created within 5 minutes
      const groupedAlerts = alertDetectionService.groupAlerts(alerts, 5);

      return groupedAlerts;
    } catch (error) {
      console.error('[AlertService] Error processing anomaly detection:', error);
      throw error;
    }
  }

  /**
   * Clean up old alerts
   * @param {number} daysOld - Delete alerts older than this many days
   * @returns {Promise<number>} - Number of alerts deleted
   */
  async cleanupOldAlerts(daysOld = 30) {
    try {
      return await alertRepository.deleteOldAlerts(daysOld);
    } catch (error) {
      console.error('[AlertService] Error cleaning up old alerts:', error);
      throw error;
    }
  }
}

export default new AlertService();
