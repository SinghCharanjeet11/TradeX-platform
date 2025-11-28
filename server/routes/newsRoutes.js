/**
 * News Routes
 * API routes for news
 */

import express from 'express'
import newsController from '../controllers/newsController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(requireAuth)

// Get all news with filters
router.get('/', newsController.getNews.bind(newsController))

// Get breaking news
router.get('/breaking', newsController.getBreakingNews.bind(newsController))

// Get personalized news
router.get('/personalized', newsController.getPersonalizedNews.bind(newsController))

// Get market sentiment
router.get('/sentiment', newsController.getMarketSentiment.bind(newsController))

export default router
