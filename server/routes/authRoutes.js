import express from 'express'
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  changePassword
} from '../controllers/authController.js'
import {
  setup2FA,
  enable2FAEndpoint,
  disable2FAEndpoint,
  get2FAStatus,
  regenerateBackupCodesEndpoint
} from '../controllers/twoFactorController.js'
import {
  initiateGoogleAuth,
  handleGoogleCallback,
  initiateTwitterAuth,
  handleTwitterCallback
} from '../controllers/oauthController.js'
import {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  checkValidation
} from '../middleware/validation.js'
import {
  registrationRateLimiter,
  loginRateLimiter,
  passwordResetRateLimiter,
  logLoginAttempt,
  checkFailedAttempts
} from '../middleware/rateLimiter.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.post(
  '/register',
  registrationRateLimiter,
  validateRegistration,
  checkValidation,
  register
)

router.post(
  '/login',
  loginRateLimiter,
  checkFailedAttempts,
  logLoginAttempt,
  validateLogin,
  checkValidation,
  login
)

router.post('/logout', logout)

router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validateForgotPassword,
  checkValidation,
  forgotPassword
)

router.post(
  '/reset-password',
  validateResetPassword,
  checkValidation,
  resetPassword
)

// Protected routes
router.get('/me', requireAuth, getCurrentUser)
router.put('/profile', requireAuth, async (req, res, next) => {
  const { updateProfile } = await import('../controllers/authController.js')
  updateProfile(req, res, next)
})
router.post('/change-password', requireAuth, changePassword)

// 2FA routes
router.post('/2fa/setup', requireAuth, setup2FA)
router.post('/2fa/enable', requireAuth, enable2FAEndpoint)
router.post('/2fa/disable', requireAuth, disable2FAEndpoint)
router.get('/2fa/status', requireAuth, get2FAStatus)
router.post('/2fa/backup-codes/regenerate', requireAuth, regenerateBackupCodesEndpoint)

// OAuth routes
router.get('/oauth/google', initiateGoogleAuth)
router.get('/oauth/google/callback', handleGoogleCallback)
router.get('/oauth/twitter', initiateTwitterAuth)
router.get('/oauth/twitter/callback', handleTwitterCallback)

// External account connection routes
router.post('/connect-account', requireAuth, async (req, res) => {
  try {
    console.log('[Auth] Connect account request received')
    console.log('[Auth] Request body:', { platform: req.body.platform, hasCredentials: !!req.body.credentials })
    console.log('[Auth] User:', { id: req.user?.id, email: req.user?.email })
    
    const { platform, credentials } = req.body
    const userId = req.user.id

    if (!platform || !credentials) {
      console.log('[Auth] Missing platform or credentials')
      return res.status(400).json({ 
        success: false,
        error: 'Platform and credentials are required' 
      })
    }

    // Test connection based on platform
    if (platform === 'binance') {
      console.log('[Auth] Testing Binance connection...')
      const { default: binanceService } = await import('../services/binanceService.js')
      const testResult = await binanceService.testConnection(credentials.apiKey, credentials.apiSecret)
      
      console.log('[Auth] Binance test result:', testResult)
      
      if (!testResult.success) {
        // Provide helpful error message for signature errors
        let errorMessage = testResult.message
        
        if (errorMessage.includes('Signature') || errorMessage.includes('signature') || 
            errorMessage.includes('Invalid API') || errorMessage.includes('API-key')) {
          errorMessage = 'Invalid API credentials. Please verify: 1. API Key and Secret match (both from the same API key) 2. You saved the Secret when creating the API key (Binance only shows it once) 3. No extra spaces in the credentials 4. API key has "Enable Reading" permission enabled'
        }
        
        console.log('[Auth] Binance connection failed:', errorMessage)
        return res.status(400).json({
          success: false,
          error: errorMessage
        })
      }
      console.log('[Auth] Binance connection test passed')
    } else {
      // Only Binance is supported
      console.log('[Auth] Unsupported platform:', platform)
      return res.status(400).json({
        success: false,
        error: 'Only Binance is currently supported for account connections'
      })
    }

    // Import repository
    console.log('[Auth] Importing repository...')
    const { default: connectedAccountsRepository } = await import('../repositories/connectedAccountsRepository.js')
    
    // Create account name based on platform
    const accountName = `${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`
    
    console.log('[Auth] Storing account in database...')
    console.log('[Auth] User ID:', userId, 'Type:', typeof userId)
    
    // Store the connected account (credentials will be encrypted)
    const account = await connectedAccountsRepository.upsert(userId, platform, {
      credentials,
      accountName
    })

    console.log(`[Auth] User ${userId} connected to ${platform}`)
    console.log('[Auth] Account stored:', account)

    res.json({
      success: true,
      message: `Successfully connected to ${platform}`,
      account: {
        id: account.id,
        platform: account.platform,
        name: account.account_name,
        status: 'connected',
        connectedAt: account.created_at,
        lastSync: account.last_sync
      }
    })
  } catch (error) {
    console.error('[Auth] Error connecting account:', error)
    console.error('[Auth] Error stack:', error.stack)
    console.error('[Auth] Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    res.status(500).json({ 
      success: false,
      error: 'Failed to connect account',
      message: error.message // Include error message for debugging
    })
  }
})

router.get('/connected-accounts', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    
    // Import repository
    const { default: connectedAccountsRepository } = await import('../repositories/connectedAccountsRepository.js')
    
    // Get connected accounts from database
    const accounts = await connectedAccountsRepository.getByUserId(userId)
    
    // Format accounts for frontend
    const formattedAccounts = accounts.map(account => ({
      id: account.id,
      platform: account.platform,
      name: account.account_name,
      status: account.is_active ? 'connected' : 'disconnected',
      connectedAt: account.created_at,
      lastSync: account.last_sync
    }))

    console.log(`[Auth] Found ${formattedAccounts.length} connected accounts for user ${userId}`)

    res.json({
      success: true,
      accounts: formattedAccounts
    })
  } catch (error) {
    console.error('[Auth] Error fetching connected accounts:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch connected accounts' 
    })
  }
})

router.delete('/disconnect-account/:platform', requireAuth, async (req, res) => {
  try {
    const { platform } = req.params
    const userId = req.user.id
    
    // Import repository
    const { default: connectedAccountsRepository } = await import('../repositories/connectedAccountsRepository.js')
    
    // Disconnect the account
    await connectedAccountsRepository.disconnect(userId, platform)
    
    console.log(`[Auth] User ${userId} disconnected from ${platform}`)
    
    res.json({
      success: true,
      message: `Successfully disconnected from ${platform}`
    })
  } catch (error) {
    console.error('[Auth] Error disconnecting account:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to disconnect account' 
    })
  }
})

router.post('/connected-accounts/:accountId/refresh', requireAuth, async (req, res) => {
  try {
    const { accountId } = req.params
    const userId = req.user.id
    
    // Import repository
    const { default: connectedAccountsRepository } = await import('../repositories/connectedAccountsRepository.js')
    
    // Get account to find platform
    const accounts = await connectedAccountsRepository.getByUserId(userId)
    const account = accounts.find(acc => acc.id === parseInt(accountId))
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      })
    }
    
    // Update last sync time
    await connectedAccountsRepository.updateLastSync(userId, account.platform)
    
    res.json({
      success: true,
      message: 'Account data refreshed successfully'
    })
  } catch (error) {
    console.error('[Auth] Error refreshing account:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to refresh account data' 
    })
  }
})

// Delete account route
router.delete('/account', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    
    console.log(`[Auth] User ${userId} requested account deletion`)
    
    // Import deleteUser function from user repository
    const { deleteUser } = await import('../repositories/userRepository.js')
    
    // Delete the user account (this should cascade delete related data)
    await deleteUser(userId)
    
    console.log(`[Auth] User ${userId} account deleted successfully`)
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    })
  } catch (error) {
    console.error('[Auth] Error deleting account:', error)
    console.error('[Auth] Error stack:', error.stack)
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete account',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

export default router
