import express from 'express'
import * as sessionController from '../controllers/sessionController.js'
import { verifyAuth } from '../middleware/auth.js'

const router = express.Router()

// All session routes require authentication
router.use(verifyAuth)

// Get all active sessions for current user
router.get('/', sessionController.getSessions)

// Terminate a specific session
router.delete('/:id', sessionController.terminateSession)

// Terminate all other sessions (keep current)
router.delete('/others/all', sessionController.terminateOtherSessions)

export default router
