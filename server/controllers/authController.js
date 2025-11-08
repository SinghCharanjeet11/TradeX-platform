import { hashPassword, verifyPassword } from '../services/passwordService.js'
import { 
  generateSessionToken, 
  hashToken, 
  getTokenExpiration,
  generateResetToken,
  getResetTokenExpiration 
} from '../services/tokenService.js'
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
  updateUserPassword,
  updateLastLogin
} from '../repositories/userRepository.js'
import {
  createSession,
  deleteSession,
  deleteAllUserSessions
} from '../repositories/sessionRepository.js'
import {
  createResetToken,
  findValidResetToken,
  markTokenAsUsed
} from '../repositories/resetTokenRepository.js'

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Check if username already exists
    const existingUsername = await findUserByUsername(username)
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        error: 'Username already taken'
      })
    }

    // Check if email already exists
    const existingEmail = await findUserByEmail(email)
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await createUser({
      username,
      email,
      passwordHash
    })

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create account. Please try again.'
    })
  }
}

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body

    // Find user by email
    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
    }

    // Generate session token
    const token = generateSessionToken(
      { userId: user.id, email: user.email },
      rememberMe
    )

    // Store session in database
    const tokenHash = hashToken(token)
    const expiresAt = getTokenExpiration(rememberMe)
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

    // Set HTTP-only cookie
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    })

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to log in. Please try again.'
    })
  }
}

/**
 * Logout user
 */
export const logout = async (req, res) => {
  try {
    const token = req.cookies.session_token

    if (token) {
      const tokenHash = hashToken(token)
      await deleteSession(tokenHash)
    }

    res.clearCookie('session_token')

    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to log out'
    })
  }
}

/**
 * Request password reset
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    // Find user
    const user = await findUserByEmail(email)
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email exists, a password reset link has been sent'
      })
    }

    // Generate reset token
    const resetToken = generateResetToken()
    const tokenHash = hashToken(resetToken)
    const expiresAt = getResetTokenExpiration()

    // Store reset token
    await createResetToken({
      userId: user.id,
      tokenHash,
      expiresAt
    })

    // TODO: Send email with reset link
    // For now, log the token (in production, send via email)
    console.log(`Password reset token for ${email}: ${resetToken}`)
    console.log(`Reset link: ${process.env.FRONTEND_URL}/reset-password/${resetToken}`)

    res.json({
      success: true,
      message: 'If that email exists, a password reset link has been sent'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process request'
    })
  }
}

/**
 * Reset password with token
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    // Find valid reset token
    const tokenHash = hashToken(token)
    const resetToken = await findValidResetToken(tokenHash)

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      })
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update user password
    await updateUserPassword(resetToken.user_id, passwordHash)

    // Mark token as used
    await markTokenAsUsed(resetToken.id)

    // Invalidate all user sessions
    await deleteAllUserSessions(resetToken.user_id)

    res.json({
      success: true,
      message: 'Password reset successfully'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    })
  }
}

/**
 * Get current user (protected route)
 */
export const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    })
  } catch (error) {
    console.error('Get current user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    })
  }
}
