import { query } from '../config/database.js'

/**
 * Create a new session with device metadata
 * @param {object} sessionData - Session data including device metadata
 * @returns {Promise<object>} Created session
 */
export const createSession = async ({ 
  userId, 
  tokenHash, 
  expiresAt, 
  ipAddress, 
  userAgent,
  deviceFingerprint,
  deviceType,
  browser,
  os,
  locationCountry,
  locationCity
}) => {
  const sql = `
    INSERT INTO sessions (
      user_id, token_hash, expires_at, ip_address, user_agent,
      device_fingerprint, device_type, browser, os,
      location_country, location_city, last_activity
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
    RETURNING id, user_id, expires_at, created_at, device_type, browser, os, 
              ip_address, location_country, location_city, last_activity
  `
  const result = await query(sql, [
    userId, tokenHash, expiresAt, ipAddress, userAgent,
    deviceFingerprint, deviceType, browser, os,
    locationCountry, locationCity
  ])
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
 * Delete all sessions for a user except the current one
 * @param {string} userId - User ID
 * @param {string} currentTokenHash - Current session token hash to preserve
 * @returns {Promise<number>} Number of deleted sessions
 */
export const deleteAllUserSessionsExcept = async (userId, currentTokenHash) => {
  const sql = `
    DELETE FROM sessions
    WHERE user_id = $1 AND token_hash != $2
  `
  const result = await query(sql, [userId, currentTokenHash])
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

/**
 * Get all active sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of active sessions
 */
export const getUserSessions = async (userId) => {
  const sql = `
    SELECT 
      id, user_id, device_type, browser, os, ip_address,
      location_country, location_city, last_activity, created_at, expires_at
    FROM sessions
    WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
    ORDER BY last_activity DESC
  `
  const result = await query(sql, [userId])
  return result.rows
}

/**
 * Terminate a specific session
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<boolean>} Success status
 */
export const terminateSession = async (sessionId, userId) => {
  const sql = `
    DELETE FROM sessions
    WHERE id = $1 AND user_id = $2
  `
  const result = await query(sql, [sessionId, userId])
  return result.rowCount > 0
}

/**
 * Terminate all sessions except the current one
 * @param {string} currentSessionId - Current session ID to preserve
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of terminated sessions
 */
export const terminateOtherSessions = async (currentSessionId, userId) => {
  const sql = `
    DELETE FROM sessions
    WHERE user_id = $1 AND id != $2
  `
  const result = await query(sql, [userId, currentSessionId])
  return result.rowCount
}

/**
 * Update session activity timestamp
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} Success status
 */
export const updateSessionActivity = async (sessionId) => {
  const sql = `
    UPDATE sessions
    SET last_activity = CURRENT_TIMESTAMP
    WHERE id = $1
  `
  const result = await query(sql, [sessionId])
  return result.rowCount > 0
}

/**
 * Get detailed session information
 * @param {string} sessionId - Session ID
 * @returns {Promise<object|null>} Session details or null
 */
export const getSessionDetails = async (sessionId) => {
  const sql = `
    SELECT 
      id, user_id, device_fingerprint, device_type, browser, os,
      ip_address, location_country, location_city, user_agent,
      last_activity, created_at, expires_at
    FROM sessions
    WHERE id = $1 AND expires_at > CURRENT_TIMESTAMP
  `
  const result = await query(sql, [sessionId])
  return result.rows[0] || null
}

/**
 * Update session IP address (for IP change detection)
 * @param {string} sessionId - Session ID
 * @param {string} newIpAddress - New IP address
 * @param {string} locationCountry - New location country
 * @param {string} locationCity - New location city
 * @returns {Promise<boolean>} Success status
 */
export const updateSessionIP = async (sessionId, newIpAddress, locationCountry, locationCity) => {
  const sql = `
    UPDATE sessions
    SET ip_address = $2, location_country = $3, location_city = $4, last_activity = CURRENT_TIMESTAMP
    WHERE id = $1
  `
  const result = await query(sql, [sessionId, newIpAddress, locationCountry, locationCity])
  return result.rowCount > 0
}

/**
 * Count active sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of active sessions
 */
export const countUserSessions = async (userId) => {
  const sql = `
    SELECT COUNT(*) as count
    FROM sessions
    WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
  `
  const result = await query(sql, [userId])
  return parseInt(result.rows[0].count)
}

/**
 * Get oldest session for a user
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Oldest session or null
 */
export const getOldestSession = async (userId) => {
  const sql = `
    SELECT id
    FROM sessions
    WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at ASC
    LIMIT 1
  `
  const result = await query(sql, [userId])
  return result.rows[0] || null
}
