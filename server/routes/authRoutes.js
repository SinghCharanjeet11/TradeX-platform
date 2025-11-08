import express from 'express'
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser
} from '../controllers/authController.js'
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

export default router
