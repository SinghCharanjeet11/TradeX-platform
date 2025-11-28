/**
 * Notifications Repository
 * Data access layer for user notifications with PostgreSQL
 */

import { query } from '../config/database.js';

class NotificationsRepository {
  /**
   * Get user notifications
   */
  async getUserNotifications(userId, limit = 50) {
    const result = await query(
      `SELECT id, user_id as "userId", type, title, message, data,
              is_read as "isRead", created_at as "createdAt"
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Create notification
   */
  async createNotification(userId, notificationData) {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id as "userId", type, title, message, data,
                 is_read as "isRead", created_at as "createdAt"`,
      [
        userId,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        JSON.stringify(notificationData.data || {})
      ]
    );
    return result.rows[0];
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const result = await query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [notificationId, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    const result = await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return result.rowCount;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Delete old notifications (cleanup)
   */
  async deleteOldNotifications(daysOld = 30) {
    const result = await query(
      `DELETE FROM notifications 
       WHERE created_at < NOW() - INTERVAL '${daysOld} days'`,
      []
    );
    return result.rowCount;
  }
}

export default new NotificationsRepository();
