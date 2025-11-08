import { query } from '../config/database.js'

/**
 * Create a password reset token
 * @param {object} tokenData - Token data
 * @returns {Promise<object>} Created token
 */
export const createResetToken = async ({ userId, tokenHash, expiresAt }) => {
  const sql = `
    INSERT INTO reset_tokens (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, expires_at, created_at
  `
  const result = await query(sql, [userId, tokenHash, expiresAt])
  return result.rows[0]
}

/**
 * Find valid reset token
 * @param {string} tokenHash - Hashed token
 * @returns {Promise<object|null>} Token or null
 */
export const findValidResetToken = async (tokenHash) => {
  const sql = `
    SELECT id, user_id, expires_at, used
    FROM reset_tokens
    WHERE token_hash = $1 
      AND expires_at > CURRENT_TIMESTAMP 
      AND used = FALSE
  `
  const result = await query(sql, [tokenHash])
  return result.rows[0] || null
}

/**
 * Mark reset token as used
 * @param {string} tokenId - Token ID
 * @returns {Promise<boolean>} Success status
 */
export const markTokenAsUsed = async (tokenId) => {
  const sql = `
    UPDATE reset_tokens
    SET used = TRUE
    WHERE id = $1
  `
  const result = await query(sql, [tokenId])
  return result.rowCount > 0
}

/**
 * Clean up expired reset tokens
 * @returns {Promise<number>} Number of deleted tokens
 */
export const cleanupExpiredTokens = async () => {
  const sql = `
    DELETE FROM reset_tokens
    WHERE expires_at < CURRENT_TIMESTAMP OR used = TRUE
  `
  const result = await query(sql)
  return result.rowCount
}
