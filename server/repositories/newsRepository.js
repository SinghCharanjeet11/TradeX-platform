/**
 * News Repository
 * Handles database operations for news bookmarks
 */

import pool from '../config/database.js'

class NewsRepository {
  /**
   * Save bookmark for user
   * @param {number} userId - User ID
   * @param {string} articleId - Article ID
   * @returns {Promise<void>}
   */
  async addBookmark(userId, articleId) {
    try {
      const query = `
        INSERT INTO bookmarks (user_id, article_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, article_id) DO NOTHING
        RETURNING id
      `
      
      const result = await pool.query(query, [userId, articleId])
      
      return result.rows[0] || null

    } catch (error) {
      console.error('[NewsRepository] Error adding bookmark:', error)
      throw new Error(`Failed to add bookmark: ${error.message}`)
    }
  }

  /**
   * Remove bookmark
   * @param {number} userId - User ID
   * @param {string} articleId - Article ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async removeBookmark(userId, articleId) {
    try {
      const query = `
        DELETE FROM bookmarks
        WHERE user_id = $1 AND article_id = $2
        RETURNING id
      `
      
      const result = await pool.query(query, [userId, articleId])
      
      return result.rowCount > 0

    } catch (error) {
      console.error('[NewsRepository] Error removing bookmark:', error)
      throw new Error(`Failed to remove bookmark: ${error.message}`)
    }
  }

  /**
   * Get user's bookmarked article IDs
   * @param {number} userId - User ID
   * @returns {Promise<string[]>} Article IDs
   */
  async getBookmarks(userId) {
    try {
      const query = `
        SELECT article_id, created_at
        FROM bookmarks
        WHERE user_id = $1
        ORDER BY created_at DESC
      `
      
      const result = await pool.query(query, [userId])
      
      return result.rows.map(row => row.article_id)

    } catch (error) {
      console.error('[NewsRepository] Error getting bookmarks:', error)
      throw new Error(`Failed to get bookmarks: ${error.message}`)
    }
  }

  /**
   * Get user's bookmarks with metadata
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Bookmark records
   */
  async getBookmarksWithMetadata(userId) {
    try {
      const query = `
        SELECT id, article_id, created_at
        FROM bookmarks
        WHERE user_id = $1
        ORDER BY created_at DESC
      `
      
      const result = await pool.query(query, [userId])
      
      return result.rows

    } catch (error) {
      console.error('[NewsRepository] Error getting bookmarks with metadata:', error)
      throw new Error(`Failed to get bookmarks: ${error.message}`)
    }
  }

  /**
   * Check if article is bookmarked by user
   * @param {number} userId - User ID
   * @param {string} articleId - Article ID
   * @returns {Promise<boolean>}
   */
  async isBookmarked(userId, articleId) {
    try {
      const query = `
        SELECT 1
        FROM bookmarks
        WHERE user_id = $1 AND article_id = $2
        LIMIT 1
      `
      
      const result = await pool.query(query, [userId, articleId])
      
      return result.rowCount > 0

    } catch (error) {
      console.error('[NewsRepository] Error checking bookmark:', error)
      throw new Error(`Failed to check bookmark: ${error.message}`)
    }
  }

  /**
   * Check if multiple articles are bookmarked
   * @param {number} userId - User ID
   * @param {string[]} articleIds - Article IDs
   * @returns {Promise<Set<string>>} Set of bookmarked article IDs
   */
  async getBookmarkedArticles(userId, articleIds) {
    try {
      if (!articleIds || articleIds.length === 0) {
        return new Set()
      }

      const query = `
        SELECT article_id
        FROM bookmarks
        WHERE user_id = $1 AND article_id = ANY($2)
      `
      
      const result = await pool.query(query, [userId, articleIds])
      
      return new Set(result.rows.map(row => row.article_id))

    } catch (error) {
      console.error('[NewsRepository] Error getting bookmarked articles:', error)
      throw new Error(`Failed to get bookmarked articles: ${error.message}`)
    }
  }

  /**
   * Get bookmark count for user
   * @param {number} userId - User ID
   * @returns {Promise<number>}
   */
  async getBookmarkCount(userId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM bookmarks
        WHERE user_id = $1
      `
      
      const result = await pool.query(query, [userId])
      
      return parseInt(result.rows[0].count, 10)

    } catch (error) {
      console.error('[NewsRepository] Error getting bookmark count:', error)
      throw new Error(`Failed to get bookmark count: ${error.message}`)
    }
  }

  /**
   * Delete old bookmarks (cleanup)
   * @param {number} daysOld - Delete bookmarks older than this many days
   * @returns {Promise<number>} Number of deleted bookmarks
   */
  async deleteOldBookmarks(daysOld = 90) {
    try {
      const query = `
        DELETE FROM bookmarks
        WHERE created_at < NOW() - INTERVAL '${daysOld} days'
        RETURNING id
      `
      
      const result = await pool.query(query)
      
      return result.rowCount

    } catch (error) {
      console.error('[NewsRepository] Error deleting old bookmarks:', error)
      throw new Error(`Failed to delete old bookmarks: ${error.message}`)
    }
  }
}

export default new NewsRepository()
