import axios from 'axios'
import crypto from 'crypto'

/**
 * OAuth Service for Google and Twitter authentication
 */

// OAuth Configuration - read at runtime to ensure env vars are loaded
const getGoogleConfig = () => ({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/oauth/google/callback'
})

const getTwitterConfig = () => ({
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
  redirectUri: process.env.TWITTER_REDIRECT_URI || 'http://localhost:5000/api/auth/oauth/twitter/callback'
})

/**
 * Generate OAuth state token for CSRF protection
 */
export const generateStateToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Get Google OAuth URL
 */
export const getGoogleAuthUrl = (state) => {
  const config = getGoogleConfig()
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'offline',
    prompt: 'consent'
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Exchange Google authorization code for tokens
 */
export const getGoogleTokens = async (code) => {
  try {
    const config = getGoogleConfig()
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code'
    })

    return response.data
  } catch (error) {
    console.error('[OAuth] Error getting Google tokens:', error.response?.data || error.message)
    throw new Error('Failed to exchange authorization code')
  }
}

/**
 * Get Google user info
 */
export const getGoogleUserInfo = async (accessToken) => {
  try {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    return {
      provider: 'google',
      providerId: response.data.id,
      email: response.data.email,
      name: response.data.name,
      picture: response.data.picture,
      emailVerified: response.data.verified_email
    }
  } catch (error) {
    console.error('[OAuth] Error getting Google user info:', error.response?.data || error.message)
    throw new Error('Failed to get user information')
  }
}

/**
 * Get Twitter OAuth URL (OAuth 2.0 with PKCE)
 */
export const getTwitterAuthUrl = (state, codeVerifier) => {
  const config = getTwitterConfig()
  // Generate code challenge from verifier
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'tweet.read users.read offline.access',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  })

  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`
}

/**
 * Generate PKCE code verifier
 */
export const generateCodeVerifier = () => {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Exchange Twitter authorization code for tokens
 */
export const getTwitterTokens = async (code, codeVerifier) => {
  try {
    const config = getTwitterConfig()
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')
    
    const response = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        code_verifier: codeVerifier
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`
        }
      }
    )

    return response.data
  } catch (error) {
    console.error('[OAuth] Error getting Twitter tokens:', error.response?.data || error.message)
    throw new Error('Failed to exchange authorization code')
  }
}

/**
 * Get Twitter user info
 */
export const getTwitterUserInfo = async (accessToken) => {
  try {
    const response = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      params: {
        'user.fields': 'id,name,username,profile_image_url'
      }
    })

    const user = response.data.data

    return {
      provider: 'twitter',
      providerId: user.id,
      email: null, // Twitter API v2 doesn't provide email by default
      name: user.name,
      username: user.username,
      picture: user.profile_image_url,
      emailVerified: false
    }
  } catch (error) {
    console.error('[OAuth] Error getting Twitter user info:', error.response?.data || error.message)
    throw new Error('Failed to get user information')
  }
}

