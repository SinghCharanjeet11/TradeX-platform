/**
 * Connected Accounts Repository
 * Handles persistent storage of user's connected exchange accounts
 */
import pool from '../config/database.js'
import encryption from '../utils/encryption.js'

class ConnectedAccountsRepository {
  /**
   * Get all connected accounts for a user
   */
  async getByUserId(userId) {
    try {
      const query = `
        SELECT 
          id,
          platform,
          account_name,
          is_active,
          last_sync,
          created_at,
          updated_at
        FROM connected_accounts 
        WHERE user_id = $1 AND is_active = true
        ORDER BY created_at DESC
      `
      const result = await pool.query(query, [userId])
      return result.rows
    } catch (error) {
      console.error('[ConnectedAccountsRepository] Error getting accounts:', error)
      throw error
    }
  }

  /**
   * Create or update a connected account
   */
  async upsert(userId, platform, accountData) {
    try {
      console.log('[ConnectedAccountsRepository] Upserting account...')
      console.log('[ConnectedAccountsRepository] User ID:', userId, 'Type:', typeof userId)
      console.log('[ConnectedAccountsRepository] Platform:', platform)
      console.log('[ConnectedAccountsRepository] Account data:', { hasCredentials: !!accountData.credentials, accountName: accountData.accountName })
      
      const { credentials, accountName } = accountData
      
      if (!credentials) {
        throw new Error('Credentials are required')
      }
      
      // Encrypt credentials before storing
      console.log('[ConnectedAccountsRepository] Encrypting credentials...')
      const encryptedCredentials = encryption.encrypt(credentials)
      console.log('[ConnectedAccountsRepository] Credentials encrypted successfully')
      
      const query = `
        INSERT INTO connected_accounts (
          user_id, 
          platform, 
          account_name, 
          credentials, 
          is_active,
          updated_at
        ) VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, platform) 
        DO UPDATE SET 
          account_name = EXCLUDED.account_name,
          credentials = EXCLUDED.credentials,
          is_active = true,
          updated_at = CURRENT_TIMESTAMP
        RETURNING 
          id,
          platform,
          account_name,
          is_active,
          created_at,
          updated_at
      `
      
      console.log('[ConnectedAccountsRepository] Executing database query...')
      const result = await pool.query(query, [
        userId, 
        platform, 
        accountName || platform,
        encryptedCredentials
      ])
      
      console.log(`[ConnectedAccountsRepository] Encrypted and stored credentials for ${platform}`)
      console.log('[ConnectedAccountsRepository] Result:', result.rows[0])
      
      return result.rows[0]
    } catch (error) {
      console.error('[ConnectedAccountsRepository] Error upserting account:', error)
      console.error('[ConnectedAccountsRepository] Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * Get account credentials (for internal use only)
   * Returns decrypted credentials
   */
  async getCredentials(userId, platform) {
    try {
      const query = `
        SELECT credentials 
        FROM connected_accounts 
        WHERE user_id = $1 AND platform = $2 AND is_active = true
      `
      const result = await pool.query(query, [userId, platform])
      
      if (!result.rows[0]?.credentials) {
        return null
      }
      
      // Decrypt credentials before returning
      const encryptedCredentials = result.rows[0].credentials
      const decryptedCredentials = encryption.decrypt(encryptedCredentials)
      
      console.log(`[ConnectedAccountsRepository] Decrypted credentials for ${platform}`)
      
      return decryptedCredentials
    } catch (error) {
      console.error('[ConnectedAccountsRepository] Error getting credentials:', error)
      throw error
    }
  }

  /**
   * Disconnect an account (soft delete)
   */
  async disconnect(userId, platform) {
    try {
      const query = `
        UPDATE connected_accounts 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND platform = $2
        RETURNING id
      `
      const result = await pool.query(query, [userId, platform])
      return result.rows[0]
    } catch (error) {
      console.error('[ConnectedAccountsRepository] Error disconnecting account:', error)
      throw error
    }
  }

  /**
   * Update last sync time
   */
  async updateLastSync(userId, platform) {
    try {
      const query = `
        UPDATE connected_accounts 
        SET last_sync = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND platform = $2 AND is_active = true
      `
      await pool.query(query, [userId, platform])
    } catch (error) {
      console.error('[ConnectedAccountsRepository] Error updating sync time:', error)
      throw error
    }
  }

  /**
   * Check if user has a connected account for platform
   */
  async hasConnectedAccount(userId, platform) {
    try {
      const query = `
        SELECT id 
        FROM connected_accounts 
        WHERE user_id = $1 AND platform = $2 AND is_active = true
      `
      const result = await pool.query(query, [userId, platform])
      return result.rows.length > 0
    } catch (error) {
      console.error('[ConnectedAccountsRepository] Error checking account:', error)
      return false
    }
  }
}

export default new ConnectedAccountsRepository()
