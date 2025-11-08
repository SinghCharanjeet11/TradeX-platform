import { query } from '../config/database.js'

/**
 * Create a new session
 * @param {object} sessionData - Session data
 * @returns {Promise<object>} Created session
 */
export const createSession = async ({ userId, tokenHash, expiresAt, ipAddress, userAgent }) => {
  const sql = `
    INSERT INTO sessions (user_id, token_hash, expires_at, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, expires_at, created_at
  `
  const result = await query(sql, [userId, tokenHash, expiresAt, ipAddress, userAgent])
  return result.rows[0]
}

/**
 * Find session by token hash
 * @param {string} tokenHash - Hashed token
 * @returns {Promise<object|null>} Session or null
 */
export const findSessionByToken = async (tokenHash) => {
  const sql = `
    SELECT id, user_id, expires_at, created_at
    FROM sessions
    WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP
  `
  const result = await query(sql, [tokenHash])
  return result.rows[0] || null
}

/**
 * Delete a session
 * @param {string} tokenHash - Hashed token
 * @returns {Promise<boolean>} Success status
 */
export const deleteSession = async (tokenHash) => {
  const sql = `
    DELETE FROM sessions
    WHERE token_hash = $1
  `
  const result = await query(sql, [tokenHash])
  return result.rowCount > 0
}

/**
 * Delete all sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of deleted sessions
 */
export const deleteAllUserSessions = async (userId) => {
  const sql = `
    DELETE FROM sessions
    WHERE user_id = $1
  `
  const result = await query(sql, [userId])
  return result.rowCount
}

/**
 * Clean up expired sessions
 * @returns {Promise<number>} Number of deleted sessions
 */
export const cleanupExpiredSessions = async () => {
  const sql = `
    DELETE FROM sessions
    WHERE expires_at < CURRENT_TIMESTAMP
  `
  const result = await query(sql)
  return result.rowCount
}
