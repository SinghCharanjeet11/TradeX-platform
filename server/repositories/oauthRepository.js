import { query } from '../config/database.js'

/**
 * Find OAuth account by provider and provider ID
 */
export const findOAuthAccount = async (provider, providerId) => {
  const result = await query(
    `SELECT oa.*, u.* 
     FROM oauth_accounts oa
     JOIN users u ON oa.user_id = u.id
     WHERE oa.provider = $1 AND oa.provider_user_id = $2`,
    [provider, providerId]
  )
  
  return result.rows[0] || null
}

/**
 * Create OAuth account
 */
export const createOAuthAccount = async (userId, provider, providerId, accessToken, refreshToken, profile) => {
  const result = await query(
    `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, access_token, refresh_token, profile_data)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, provider, providerId, accessToken, refreshToken, JSON.stringify(profile)]
  )
  
  return result.rows[0]
}

/**
 * Update OAuth account tokens
 */
export const updateOAuthTokens = async (provider, providerId, accessToken, refreshToken) => {
  const result = await query(
    `UPDATE oauth_accounts 
     SET access_token = $1, refresh_token = $2, updated_at = CURRENT_TIMESTAMP
     WHERE provider = $3 AND provider_user_id = $4
     RETURNING *`,
    [accessToken, refreshToken, provider, providerId]
  )
  
  return result.rows[0]
}

/**
 * Link OAuth account to existing user
 */
export const linkOAuthAccount = async (userId, provider, providerId, accessToken, refreshToken, profile) => {
  // Check if OAuth account already exists
  const existing = await query(
    'SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2',
    [provider, providerId]
  )
  
  if (existing.rows.length > 0) {
    // Update existing OAuth account
    return updateOAuthTokens(provider, providerId, accessToken, refreshToken)
  }
  
  // Create new OAuth account
  return createOAuthAccount(userId, provider, providerId, accessToken, refreshToken, profile)
}

/**
 * Get OAuth accounts for a user
 */
export const getUserOAuthAccounts = async (userId) => {
  const result = await query(
    'SELECT provider, provider_user_id, profile_data, created_at FROM oauth_accounts WHERE user_id = $1',
    [userId]
  )
  
  return result.rows
}

/**
 * Unlink OAuth account
 */
export const unlinkOAuthAccount = async (userId, provider) => {
  const result = await query(
    'DELETE FROM oauth_accounts WHERE user_id = $1 AND provider = $2 RETURNING *',
    [userId, provider]
  )
  
  return result.rows[0]
}

export default {
  findOAuthAccount,
  createOAuthAccount,
  updateOAuthTokens,
  linkOAuthAccount,
  getUserOAuthAccounts,
  unlinkOAuthAccount
}

