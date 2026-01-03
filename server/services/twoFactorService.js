import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import crypto from 'crypto'
import {
  create2FASecret,
  enable2FA as enable2FARepo,
  disable2FA as disable2FARepo,
  get2FAStatus,
  createBackupCodes,
  verifyBackupCode,
  invalidateBackupCode,
  getUnusedBackupCodesCount
} from '../repositories/twoFactorRepository.js'

/**
 * Generate 2FA secret and QR code for user
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {Promise<object>} Secret and QR code data URL
 */
export const generateSecret = async (userId, email) => {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `TradeX (${email})`,
    issuer: 'TradeX',
    length: 32
  })
  
  // Store secret in database
  await create2FASecret(userId, secret.base32)
  
  // Generate QR code
  const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url)
  
  return {
    secret: secret.base32,
    qrCode: qrCodeDataURL,
    manualEntryKey: secret.base32
  }
}

/**
 * Verify TOTP token
 * @param {string} userId - User ID
 * @param {string} token - 6-digit TOTP code
 * @returns {Promise<boolean>} Verification result
 */
export const verifyToken = async (userId, token) => {
  const twoFARecord = await get2FAStatus(userId)
  
  if (!twoFARecord || !twoFARecord.secret_key) {
    return false
  }
  
  // Verify token with ±1 window tolerance for clock skew
  const verified = speakeasy.totp.verify({
    secret: twoFARecord.secret_key,
    encoding: 'base32',
    token: token,
    window: 1
  })
  
  return verified
}

/**
 * Enable 2FA for user after verification
 * @param {string} userId - User ID
 * @param {string} verificationToken - TOTP code for verification
 * @returns {Promise<object>} Result with backup codes
 */
export const enable2FA = async (userId, verificationToken) => {
  // Verify token first
  const isValid = await verifyToken(userId, verificationToken)
  
  if (!isValid) {
    throw new Error('Invalid verification code')
  }
  
  // Enable 2FA
  await enable2FARepo(userId)
  
  // Generate backup codes
  const backupCodes = await generateBackupCodesForUser(userId)
  
  return {
    success: true,
    backupCodes
  }
}

/**
 * Disable 2FA for user
 * @param {string} userId - User ID
 * @param {string} token - TOTP code for verification (optional)
 * @returns {Promise<boolean>} Success status
 */
export const disable2FA = async (userId, token) => {
  // If token provided, verify it first
  if (token) {
    const isValid = await verifyToken(userId, token)
    
    if (!isValid) {
      throw new Error('Invalid verification code')
    }
  }
  
  // Disable 2FA
  const success = await disable2FARepo(userId)
  
  return success
}

/**
 * Generate backup recovery codes
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} Array of backup codes
 */
export const generateBackupCodesForUser = async (userId) => {
  const codes = []
  const codeHashes = []
  
  // Generate 10 backup codes
  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
    
    // Hash the code for storage
    const hash = crypto.createHash('sha256').update(code).digest('hex')
    codeHashes.push(hash)
  }
  
  // Store hashed codes in database
  await createBackupCodes(userId, codeHashes)
  
  return codes
}

/**
 * Verify backup code and mark as used
 * @param {string} userId - User ID
 * @param {string} code - Backup code
 * @returns {Promise<boolean>} Verification result
 */
export const verifyAndUseBackupCode = async (userId, code) => {
  // Hash the provided code
  const codeHash = crypto.createHash('sha256').update(code.toUpperCase()).digest('hex')
  
  // Verify code exists and is unused
  const backupCode = await verifyBackupCode(userId, codeHash)
  
  if (!backupCode) {
    return false
  }
  
  // Mark code as used
  await invalidateBackupCode(backupCode.id)
  
  return true
}

/**
 * Check if user has 2FA enabled
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} 2FA enabled status
 */
export const is2FAEnabled = async (userId) => {
  const twoFARecord = await get2FAStatus(userId)
  return twoFARecord ? twoFARecord.enabled : false
}

/**
 * Get 2FA status and details for user
 * @param {string} userId - User ID
 * @returns {Promise<object>} 2FA status details
 */
export const get2FADetails = async (userId) => {
  const twoFARecord = await get2FAStatus(userId)
  
  if (!twoFARecord) {
    return {
      enabled: false,
      enabledAt: null,
      backupCodesGenerated: null,
      unusedBackupCodes: 0
    }
  }
  
  const unusedBackupCodes = await getUnusedBackupCodesCount(userId)
  
  return {
    enabled: twoFARecord.enabled,
    enabledAt: twoFARecord.enabled_at,
    backupCodesGenerated: twoFARecord.backup_codes_generated_at,
    unusedBackupCodes
  }
}

/**
 * Regenerate backup codes for user
 * @param {string} userId - User ID
 * @param {string} token - TOTP code for verification (optional)
 * @returns {Promise<Array<string>>} New backup codes
 */
export const regenerateBackupCodes = async (userId, token) => {
  // If token provided, verify it first
  if (token) {
    const isValid = await verifyToken(userId, token)
    
    if (!isValid) {
      throw new Error('Invalid verification code')
    }
  }
  
  // Generate new backup codes (this will invalidate old ones)
  const backupCodes = await generateBackupCodesForUser(userId)
  
  return backupCodes
}
