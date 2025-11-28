/**
 * Encryption Utility for Sensitive Data
 * Uses AES-256-GCM for secure encryption of API credentials
 */
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

class EncryptionService {
  constructor() {
    // Get encryption key from environment variable
    this.encryptionKey = process.env.ENCRYPTION_KEY
    
    if (!this.encryptionKey) {
      console.warn('⚠️  WARNING: ENCRYPTION_KEY not set in environment variables!')
      console.warn('⚠️  Using default key - THIS IS NOT SECURE FOR PRODUCTION!')
      // Generate a temporary key for development
      this.encryptionKey = crypto.randomBytes(32).toString('hex')
    }
    
    // Derive a proper key from the encryption key
    this.key = crypto.scryptSync(this.encryptionKey, 'salt', KEY_LENGTH)
  }

  /**
   * Encrypt sensitive data
   * @param {string|object} data - Data to encrypt
   * @returns {string} Encrypted data in format: iv:encrypted:tag
   */
  encrypt(data) {
    try {
      console.log('[Encryption] Encrypting data...')
      console.log('[Encryption] Data type:', typeof data)
      
      // Convert object to string if needed
      const text = typeof data === 'object' ? JSON.stringify(data) : String(data)
      console.log('[Encryption] Text length:', text.length)
      
      // Generate random IV
      const iv = crypto.randomBytes(IV_LENGTH)
      console.log('[Encryption] IV generated')
      
      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv)
      console.log('[Encryption] Cipher created')
      
      // Encrypt the data
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      console.log('[Encryption] Data encrypted, length:', encrypted.length)
      
      // Get authentication tag
      const tag = cipher.getAuthTag()
      console.log('[Encryption] Auth tag retrieved')
      
      // Return format: iv:encrypted:tag (all in hex)
      const result = `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`
      console.log('[Encryption] Encryption successful, result length:', result.length)
      return result
    } catch (error) {
      console.error('[Encryption] Error encrypting data:', error)
      console.error('[Encryption] Error stack:', error.stack)
      throw new Error(`Failed to encrypt data: ${error.message}`)
    }
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedData - Encrypted data in format: iv:encrypted:tag
   * @returns {object|string} Decrypted data
   */
  decrypt(encryptedData) {
    try {
      // Split the encrypted data
      const parts = encryptedData.split(':')
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format')
      }
      
      const [ivHex, encrypted, tagHex] = parts
      
      // Convert from hex
      const iv = Buffer.from(ivHex, 'hex')
      const tag = Buffer.from(tagHex, 'hex')
      
      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv)
      decipher.setAuthTag(tag)
      
      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      // Try to parse as JSON, otherwise return as string
      try {
        return JSON.parse(decrypted)
      } catch {
        return decrypted
      }
    } catch (error) {
      console.error('[Encryption] Error decrypting data:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Generate a secure random encryption key
   * @returns {string} Hex-encoded encryption key
   */
  static generateKey() {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Hash sensitive data (one-way)
   * @param {string} data - Data to hash
   * @returns {string} Hashed data
   */
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex')
  }
}

// Export singleton instance
export default new EncryptionService()
