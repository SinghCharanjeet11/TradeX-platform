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
    console.log('[OAuth] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'set' : 'NOT SET')
    console.log('[OAuth] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'set' : 'NOT SET')
    console.log('[OAuth] GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI)
    console.log('[OAuth] FRONTEND_URL:', process.env.FRONTEND_URL)
    
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
    
    console.log('[OAuth] Google OAuth URL generated:', authUrl.substring(0, 100) + '...')
    
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
    
    console.log('[OAuth] Google callback received')
    console.log('[OAuth] State:', state ? 'present' : 'missing')
    console.log('[OAuth] Code:', code ? 'present' : 'missing')
    console.log('[OAuth] FRONTEND_URL:', process.env.FRONTEND_URL)
    
    // Verify state token
    const storedState = stateStore.get(state)
    if (!storedState || storedState.expiresAt < Date.now()) {
      console.log('[OAuth] Invalid or expired state token')
      return res.redirect(`${process.env.FRONTEND_URL}/signin?error=invalid_state`)
    }
    
    // Clean up state
    stateStore.delete(state)
    
    // Exchange code for tokens
    console.log('[OAuth] Exchanging code for tokens...')
    const tokens = await getGoogleTokens(code)
    console.log('[OAuth] Tokens received successfully')
    
    // Get user info
    console.log('[OAuth] Getting user info...')
    const userInfo = await getGoogleUserInfo(tokens.access_token)
    console.log('[OAuth] User info received:', userInfo.email)
    
    // Check if OAuth account exists
    let oauthAccount = await findOAuthAccount('google', userInfo.providerId)
    let user
    
    if (oauthAccount) {
      // Update tokens
      await updateOAuthTokens('google', userInfo.providerId, tokens.access_token, tokens.refresh_token)
      user = oauthAccount
      console.log('[OAuth] Existing OAuth account found, tokens updated')
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
        console.log('[OAuth] New user created:', user.id)
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
      console.log('[OAuth] OAuth account linked')
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
    console.log('[OAuth] Session created')
    
    // Update last login
    await updateLastLogin(user.id)
    
    // Set cookie - use 'none' for cross-domain OAuth redirects in production
    const isProduction = process.env.NODE_ENV === 'production'
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: isProduction, // Must be true when sameSite is 'none'
      sameSite: isProduction ? 'none' : 'strict', // 'none' allows cross-domain cookies
      maxAge: 24 * 60 * 60 * 1000
    })
    console.log('[OAuth] Cookie set, redirecting to:', `${process.env.FRONTEND_URL}/dashboard?oauth=true`)
    
    // Redirect to dashboard with oauth flag so frontend can set session flags
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth=true`)
  } catch (error) {
    console.error('[OAuth] Error handling Google callback:', error)
    console.error('[OAuth] Error stack:', error.stack)
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
    
    // Set cookie - use 'none' for cross-domain OAuth redirects in production
    const isProductionTwitter = process.env.NODE_ENV === 'production'
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: isProductionTwitter, // Must be true when sameSite is 'none'
      sameSite: isProductionTwitter ? 'none' : 'strict', // 'none' allows cross-domain cookies
      maxAge: 24 * 60 * 60 * 1000
    })
    
    // Redirect to dashboard with oauth flag so frontend can set session flags
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth=true`)
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

