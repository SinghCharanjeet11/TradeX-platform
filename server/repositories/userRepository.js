import { query } from '../config/database.js'

/**
 * Create a new user in the database
 * @param {object} userData - User data
 * @returns {Promise<object>} Created user
 */
export const createUser = async ({ username, email, passwordHash }) => {
  const sql = `
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, created_at
  `
  const result = await query(sql, [username, email, passwordHash])
  return result.rows[0]
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} User or null
 */
export const findUserByEmail = async (email) => {
  const sql = `
    SELECT id, username, email, password_hash, created_at, last_login
    FROM users
    WHERE email = $1
  `
  const result = await query(sql, [email])
  return result.rows[0] || null
}

/**
 * Find user by username
 * @param {string} username - Username
 * @returns {Promise<object|null>} User or null
 */
export const findUserByUsername = async (username) => {
  const sql = `
    SELECT id, username, email, password_hash, created_at, last_login
    FROM users
    WHERE username = $1
  `
  const result = await query(sql, [username])
  return result.rows[0] || null
}

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} User or null
 */
export const findUserById = async (userId) => {
  const sql = `
    SELECT id, username, email, full_name, phone, bio, profile_picture, created_at, last_login, password_hash
    FROM users
    WHERE id = $1
  `
  const result = await query(sql, [userId])
  return result.rows[0] || null
}

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} passwordHash - New password hash
 * @returns {Promise<boolean>} Success status
 */
export const updateUserPassword = async (userId, passwordHash) => {
  const sql = `
    UPDATE users
    SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `
  const result = await query(sql, [passwordHash, userId])
  return result.rowCount > 0
}

/**
 * Update last login timestamp
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const updateLastLogin = async (userId) => {
  const sql = `
    UPDATE users
    SET last_login = CURRENT_TIMESTAMP
    WHERE id = $1
  `
  const result = await query(sql, [userId])
  return result.rowCount > 0
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data to update
 * @returns {Promise<boolean>} Success status
 */
export const updateUserProfile = async (userId, { username, email, fullName, phone, bio }) => {
  const sql = `
    UPDATE users
    SET 
      username = COALESCE($1, username),
      email = COALESCE($2, email),
      full_name = COALESCE($3, full_name),
      phone = $4,
      bio = $5,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $6
  `
  const result = await query(sql, [username, email, fullName, phone, bio, userId])
  return result.rowCount > 0
}

/**
 * Delete user account and all related data
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteUser = async (userId) => {
  // Most tables have ON DELETE CASCADE, but we'll delete explicitly for safety
  try {
    console.log(`[UserRepository] Starting deletion for user ${userId}`)
    
    // Helper function to safely delete from a table
    const safeDelete = async (tableName) => {
      try {
        const result = await query(`DELETE FROM ${tableName} WHERE user_id = $1`, [userId])
        console.log(`[UserRepository] Deleted ${result.rowCount} rows from ${tableName}`)
      } catch (error) {
        // Log but don't fail if table doesn't exist or has no rows
        console.log(`[UserRepository] Could not delete from ${tableName}:`, error.message)
      }
    }
    
    // Delete related data in order (child tables first)
    await safeDelete('paper_account_resets')
    await safeDelete('paper_accounts')
    await safeDelete('portfolio_snapshots')
    await safeDelete('ai_signal_dismissals')
    await safeDelete('alert_config')
    await safeDelete('ai_alerts')
    await safeDelete('security_alerts')
    await safeDelete('backup_codes')
    await safeDelete('user_2fa')
    await safeDelete('bookmarks')
    await safeDelete('connected_accounts')
    await safeDelete('notifications')
    await safeDelete('orders')
    await safeDelete('price_alerts')
    await safeDelete('watchlist')
    await safeDelete('holdings')
    await safeDelete('reset_tokens')
    await safeDelete('sessions')
    await safeDelete('oauth_accounts')
    
    // audit_logs has ON DELETE SET NULL, so we just set user_id to null
    try {
      await query('UPDATE audit_logs SET user_id = NULL WHERE user_id = $1', [userId])
      console.log('[UserRepository] Nullified user_id in audit_logs')
    } catch (error) {
      console.log('[UserRepository] Could not update audit_logs:', error.message)
    }
    
    // Finally delete the user
    console.log('[UserRepository] Deleting user record')
    const result = await query('DELETE FROM users WHERE id = $1', [userId])
    console.log(`[UserRepository] User deletion complete. Rows affected: ${result.rowCount}`)
    
    return result.rowCount > 0
  } catch (error) {
    console.error('[UserRepository] Error deleting user:', error)
    console.error('[UserRepository] Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      table: error.table,
      constraint: error.constraint
    })
    throw error
  }
}
