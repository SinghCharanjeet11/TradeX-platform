import {
  generateSecret,
  enable2FA,
  disable2FA,
  get2FADetails,
  regenerateBackupCodes
} from '../services/twoFactorService.js'

/**
 * Setup 2FA - Generate secret and QR code
 */
export const setup2FA = async (req, res) => {
  try {
    const userId = req.user.id
    const email = req.user.email
    
    const result = await generateSecret(userId, email)
    
    res.json({
      success: true,
      data: {
        qrCode: result.qrCode,
        manualEntryKey: result.manualEntryKey
      }
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to setup 2FA. Please try again.'
    })
  }
}

/**
 * Enable 2FA after verification
 */
export const enable2FAEndpoint = async (req, res) => {
  try {
    const userId = req.user.id
    const { token } = req.body
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required'
      })
    }
    
    const result = await enable2FA(userId, token)
    
    res.json({
      success: true,
      message: '2FA enabled successfully',
      backupCodes: result.backupCodes
    })
  } catch (error) {
    console.error('2FA enable error:', error)
    
    if (error.message === 'Invalid verification code') {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      })
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to enable 2FA. Please try again.'
    })
  }
}

/**
 * Disable 2FA
 */
export const disable2FAEndpoint = async (req, res) => {
  try {
    const userId = req.user.id
    const { token } = req.body
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required'
      })
    }
    
    const success = await disable2FA(userId, token)
    
    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to disable 2FA'
      })
    }
    
    res.json({
      success: true,
      message: '2FA disabled successfully'
    })
  } catch (error) {
    console.error('2FA disable error:', error)
    
    if (error.message === 'Invalid verification code') {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      })
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to disable 2FA. Please try again.'
    })
  }
}

/**
 * Get 2FA status
 */
export const get2FAStatus = async (req, res) => {
  try {
    const userId = req.user.id
    
    const status = await get2FADetails(userId)
    
    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error('Get 2FA status error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get 2FA status'
    })
  }
}

/**
 * Regenerate backup codes
 */
export const regenerateBackupCodesEndpoint = async (req, res) => {
  try {
    const userId = req.user.id
    const { token } = req.body
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required'
      })
    }
    
    const backupCodes = await regenerateBackupCodes(userId, token)
    
    res.json({
      success: true,
      message: 'Backup codes regenerated successfully',
      backupCodes
    })
  } catch (error) {
    console.error('Regenerate backup codes error:', error)
    
    if (error.message === 'Invalid verification code') {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      })
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate backup codes. Please try again.'
    })
  }
}
