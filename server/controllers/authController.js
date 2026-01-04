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
  findUserById,
  updateUserPassword,
  updateLastLogin
} from '../repositories/userRepository.js'
import {
  createSession,
  deleteSession,
  deleteAllUserSessions,
  deleteAllUserSessionsExcept
} from '../repositories/sessionRepository.js'
import {
  createResetToken,
  findValidResetToken,
  markTokenAsUsed
} from '../repositories/resetTokenRepository.js'
import {
  is2FAEnabled,
  verifyToken as verify2FAToken,
  verifyAndUseBackupCode
} from '../services/twoFactorService.js'

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

    // Generate session token for immediate login
    const token = generateSessionToken(
      { userId: user.id, email: user.email },
      false
    )

    // Store session in database
    const tokenHash = hashToken(token)
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

    // Set HTTP-only cookie
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 24 * 60 * 60 * 1000
    })

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token, // Include token in response for API testing
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
    const { email, password, rememberMe = false, totpCode, backupCode } = req.body

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

    // Check if 2FA is enabled
    const has2FA = await is2FAEnabled(user.id)
    
    if (has2FA) {
      // If 2FA is enabled but no code provided, request 2FA
      if (!totpCode && !backupCode) {
        return res.status(200).json({
          success: false,
          requires2FA: true,
          message: 'Two-factor authentication required',
          userId: user.id // Temporary identifier for 2FA flow
        })
      }
      
      // Verify 2FA code
      let is2FAValid = false
      
      if (totpCode) {
        // Verify TOTP code
        is2FAValid = await verify2FAToken(user.id, totpCode)
      } else if (backupCode) {
        // Verify and use backup code
        is2FAValid = await verifyAndUseBackupCode(user.id, backupCode)
      }
      
      if (!is2FAValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid authentication code'
        })
      }
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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    })

    res.json({
      success: true,
      message: 'Logged in successfully',
      token, // Include token in response for API testing
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

    // Clear cookie with same options used when setting it
    res.clearCookie('session_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      path: '/'
    })

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

    // Invalidate all user sessions (security requirement 4.4)
    await deleteAllUserSessions(resetToken.user_id)

    res.json({
      success: true,
      message: 'Password reset successfully. All sessions have been terminated for security.'
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

/**
 * Update user profile (protected route)
 */
export const updateProfile = async (req, res) => {
  try {
    const { username, email, fullName, phone, bio } = req.body
    const userId = req.user.id

    // Check if username is taken by another user
    if (username && username !== req.user.username) {
      const existingUser = await findUserByUsername(username)
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          error: 'Username already taken'
        })
      }
    }

    // Check if email is taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await findUserByEmail(email)
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        })
      }
    }

    // Import user repository update function
    const { updateUserProfile } = await import('../repositories/userRepository.js')
    
    // Update user profile
    await updateUserProfile(userId, {
      username,
      email,
      fullName,
      phone,
      bio
    })

    // Get updated user
    const updatedUser = await findUserById(userId)

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        phone: updatedUser.phone,
        bio: updatedUser.bio
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    })
  }
}

/**
 * Change password (protected route)
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.id

    // Verify current password
    const user = await findUserById(userId)
    const isValidPassword = await verifyPassword(currentPassword, user.password_hash)
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      })
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update user password
    await updateUserPassword(userId, passwordHash)

    // Get current session token to preserve it
    const currentToken = req.cookies.session_token || 
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
        ? req.headers.authorization.substring(7) 
        : null)
    
    const currentTokenHash = currentToken ? hashToken(currentToken) : null

    // Invalidate all other sessions (security requirement 4.4)
    if (currentTokenHash) {
      // Delete all sessions except current one
      await deleteAllUserSessionsExcept(userId, currentTokenHash)
    } else {
      // If no current token, delete all sessions
      await deleteAllUserSessions(userId)
    }

    res.json({
      success: true,
      message: 'Password changed successfully. All other sessions have been terminated for security.'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    })
  }
}
