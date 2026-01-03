import {
  generateStateToken,
  generateCodeVerifier,
  getGoogleAuthUrl,
  getGoogleTokens,
  getGoogleUserInfo,
  getTwitterAuthUrl,
  getTwitterTokens,
  getTwitterUserInfo
} from '../services/oauthService.js'
import {
  findOAuthAccount,
  createOAuthAccount,
  updateOAuthTokens
} from '../repositories/oauthRepository.js'
import {
  createUser,
  findUserByEmail,
  updateLastLogin
} from '../repositories/userRepository.js'
import {
  generateSessionToken,
  hashToken,
  getTokenExpiration
} from '../services/tokenService.js'
import {
  createSession
} from '../repositories/sessionRepository.js'

// Store state tokens temporarily (in production, use Redis)
const stateStore = new Map()
const codeVerifierStore = new Map()

/**
 * Initiate Google OAuth flow
 */
export const initiateGoogleAuth = async (req, res) => {
  try {
    console.log('[OAuth] Initiating Google OAuth flow...')
    
    // Check if credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('[OAuth] Google OAuth credentials not configured')
      return res.status(500).json({
        success: false,
        error: 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.'
      })
    }
    
    const state = generateStateToken()
    
    // Store state with expiration (5 minutes)
    stateStore.set(state, {
      timestamp: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000
    })
    
    const authUrl = getGoogleAuthUrl(state)
    
    console.log('[OAuth] Google OAuth URL generated successfully')
    
    res.json({
      success: true,
      authUrl
    })
  } catch (error) {
    console.error('[OAuth] Error initiating Google auth:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to initiate authentication',
      details: error.message
    })
  }
}

/**
 * Handle Google OAuth callback
 */
export const handleGoogleCallback = async (req, res) => {
  try {
    const { code, state } = req.query
    
    // Verify state token
    const storedState = stateStore.get(state)
    if (!storedState || storedState.expiresAt < Date.now()) {
      return res.redirect(`${process.env.FRONTEND_URL}/signin?error=invalid_state`)
    }
    
    // Clean up state
    stateStore.delete(state)
    
    // Exchange code for tokens
    const tokens = await getGoogleTokens(code)
    
    // Get user info
    const userInfo = await getGoogleUserInfo(tokens.access_token)
    
    // Check if OAuth account exists
    let oauthAccount = await findOAuthAccount('google', userInfo.providerId)
    let user
    
    if (oauthAccount) {
      // Update tokens
      await updateOAuthTokens('google', userInfo.providerId, tokens.access_token, tokens.refresh_token)
      user = oauthAccount
    } else {
      // Check if user exists with this email
      user = await findUserByEmail(userInfo.email)
      
      if (!user) {
        // Create new user
        user = await createUser({
          username: userInfo.email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5),
          email: userInfo.email,
          passwordHash: null, // OAuth users don't have passwords
          fullName: userInfo.name,
          emailVerified: userInfo.emailVerified
        })
      }
      
      // Create OAuth account
      await createOAuthAccount(
        user.id,
        'google',
        userInfo.providerId,
        tokens.access_token,
        tokens.refresh_token,
        userInfo
      )
    }
    
    // Create session
    const sessionToken = generateSessionToken(
      { userId: user.id, email: user.email },
      false
    )
    
    const tokenHash = hashToken(sessionToken)
    const expiresAt = getTokenExpiration(false)
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.headers['user-agent']
    
    await createSession({
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent
    })
    
    // Update last login
    await updateLastLogin(user.id)
    
    // Set cookie
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    })
    
    // Redirect to dashboard
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`)
  } catch (error) {
    console.error('[OAuth] Error handling Google callback:', error)
    res.redirect(`${process.env.FRONTEND_URL}/signin?error=auth_failed`)
  }
}

/**
 * Initiate Twitter OAuth flow
 */
export const initiateTwitterAuth = async (req, res) => {
  try {
    console.log('[OAuth] Initiating Twitter OAuth flow...')
    
    // Check if credentials are configured
    if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
      console.error('[OAuth] Twitter OAuth credentials not configured')
      return res.status(500).json({
        success: false,
        error: 'Twitter OAuth is not configured. Please add TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET to your .env file.'
      })
    }
    
    const state = generateStateToken()
    const codeVerifier = generateCodeVerifier()
    
    // Store state and code verifier with expiration (5 minutes)
    stateStore.set(state, {
      timestamp: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000
    })
    
    codeVerifierStore.set(state, codeVerifier)
    
    const authUrl = getTwitterAuthUrl(state, codeVerifier)
    
    console.log('[OAuth] Twitter OAuth URL generated successfully')
    
    res.json({
      success: true,
      authUrl
    })
  } catch (error) {
    console.error('[OAuth] Error initiating Twitter auth:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to initiate authentication',
      details: error.message
    })
  }
}

/**
 * Handle Twitter OAuth callback
 */
export const handleTwitterCallback = async (req, res) => {
  try {
    const { code, state } = req.query
    
    // Verify state token
    const storedState = stateStore.get(state)
    if (!storedState || storedState.expiresAt < Date.now()) {
      return res.redirect(`${process.env.FRONTEND_URL}/signin?error=invalid_state`)
    }
    
    // Get code verifier
    const codeVerifier = codeVerifierStore.get(state)
    if (!codeVerifier) {
      return res.redirect(`${process.env.FRONTEND_URL}/signin?error=invalid_state`)
    }
    
    // Clean up state and verifier
    stateStore.delete(state)
    codeVerifierStore.delete(state)
    
    // Exchange code for tokens
    const tokens = await getTwitterTokens(code, codeVerifier)
    
    // Get user info
    const userInfo = await getTwitterUserInfo(tokens.access_token)
    
    // Check if OAuth account exists
    let oauthAccount = await findOAuthAccount('twitter', userInfo.providerId)
    let user
    
    if (oauthAccount) {
      // Update tokens
      await updateOAuthTokens('twitter', userInfo.providerId, tokens.access_token, tokens.refresh_token)
      user = oauthAccount
    } else {
      // For Twitter, we need to ask for email separately or use username
      const email = userInfo.email || `${userInfo.username}@twitter.oauth`
      
      // Check if user exists
      user = await findUserByEmail(email)
      
      if (!user) {
        // Create new user
        user = await createUser({
          username: userInfo.username,
          email: email,
          passwordHash: null, // OAuth users don't have passwords
          fullName: userInfo.name,
          emailVerified: false
        })
      }
      
      // Create OAuth account
      await createOAuthAccount(
        user.id,
        'twitter',
        userInfo.providerId,
        tokens.access_token,
        tokens.refresh_token,
        userInfo
      )
    }
    
    // Create session
    const sessionToken = generateSessionToken(
      { userId: user.id, email: user.email },
      false
    )
    
    const tokenHash = hashToken(sessionToken)
    const expiresAt = getTokenExpiration(false)
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.headers['user-agent']
    
    await createSession({
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent
    })
    
    // Update last login
    await updateLastLogin(user.id)
    
    // Set cookie
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    })
    
    // Redirect to dashboard
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`)
  } catch (error) {
    console.error('[OAuth] Error handling Twitter callback:', error)
    res.redirect(`${process.env.FRONTEND_URL}/signin?error=auth_failed`)
  }
}

// Clean up expired states periodically
setInterval(() => {
  const now = Date.now()
  for (const [state, data] of stateStore.entries()) {
    if (data.expiresAt < now) {
      stateStore.delete(state)
      codeVerifierStore.delete(state)
    }
  }
}, 60 * 1000) // Every minute

export default {
  initiateGoogleAuth,
  handleGoogleCallback,
  initiateTwitterAuth,
  handleTwitterCallback
}

