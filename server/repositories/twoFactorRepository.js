import { query } from '../config/database.js'

/**
 * Create 2FA secret for user
 * @param {string} userId - User ID
 * @param {string} secretKey - Encrypted TOTP secret key
 * @returns {Promise<object>} Created 2FA record
 */
export const create2FASecret = async (userId, secretKey) => {
  const sql = `
    INSERT INTO user_2fa (user_id, secret_key, enabled)
    VALUES ($1, $2, FALSE)
    ON CONFLICT (user_id) 
    DO UPDATE SET secret_key = $2, updated_at = CURRENT_TIMESTAMP
    RETURNING id, user_id, enabled, created_at
  `
  const result = await query(sql, [userId, secretKey])
  return result.rows[0]
}

/**
 * Enable 2FA for user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const enable2FA = async (userId) => {
  const sql = `
    UPDATE user_2fa
    SET enabled = TRUE, enabled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1
  `
  const result = await query(sql, [userId])
  return result.rowCount > 0
}

/**
 * Disable 2FA for user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const disable2FA = async (userId) => {
  const sql = `
    UPDATE user_2fa
    SET enabled = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1
  `
  const result = await query(sql, [userId])
  return result.rowCount > 0
}

/**
 * Get 2FA status for user
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} 2FA record or null
 */
export const get2FAStatus = async (userId) => {
  const sql = `
    SELECT id, user_id, secret_key, enabled, enabled_at, backup_codes_generated_at, created_at
    FROM user_2fa
    WHERE user_id = $1
  `
  const result = await query(sql, [userId])
  return result.rows[0] || null
}

/**
 * Create backup codes for user
 * @param {string} userId - User ID
 * @param {Array<string>} codeHashes - Array of hashed backup codes
 * @returns {Promise<number>} Number of codes created
 */
export const createBackupCodes = async (userId, codeHashes) => {
  const client = await query.pool.connect()
  
  try {
    await client.query('BEGIN')
    
    // Delete existing backup codes
    await client.query('DELETE FROM backup_codes WHERE user_id = $1', [userId])
    
    // Insert new backup codes one by one
    for (const codeHash of codeHashes) {
      await client.query(`
        INSERT INTO backup_codes (user_id, code_hash, used)
        VALUES ($1, $2, FALSE)
      `, [userId, codeHash])
    }
    
    // Update backup_codes_generated_at timestamp
    await client.query(`
      UPDATE user_2fa
      SET backup_codes_generated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `, [userId])
    
    await client.query('COMMIT')
    
    return codeHashes.length
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Verify backup code
 * @param {string} userId - User ID
 * @param {string} codeHash - Hashed backup code
 * @returns {Promise<object|null>} Backup code record or null
 */
export const verifyBackupCode = async (userId, codeHash) => {
  const sql = `
    SELECT id, user_id, code_hash, used, used_at
    FROM backup_codes
    WHERE user_id = $1 AND code_hash = $2 AND used = FALSE
  `
  const result = await query(sql, [userId, codeHash])
  return result.rows[0] || null
}

/**
 * Mark backup code as used
 * @param {string} codeId - Backup code ID
 * @returns {Promise<boolean>} Success status
 */
export const invalidateBackupCode = async (codeId) => {
  const sql = `
    UPDATE backup_codes
    SET used = TRUE, used_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `
  const result = await query(sql, [codeId])
  return result.rowCount > 0
}

/**
 * Get unused backup codes count for user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of unused backup codes
 */
export const getUnusedBackupCodesCount = async (userId) => {
  const sql = `
    SELECT COUNT(*) as count
    FROM backup_codes
    WHERE user_id = $1 AND used = FALSE
  `
  const result = await query(sql, [userId])
  return parseInt(result.rows[0].count)
}
