/**
 * useNews Hook
 * Custom hook for managing news state
 */

import { useState, useEffect, useCallback } from 'react'
import newsService from '../services/newsService'

export const useNews = (filters = {}) => {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await newsService.getNews(filters)

      if (response.success) {
        setNews(response.data)
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      console.error('[useNews] Error:', err)
      setError(err.message)
      setNews([])
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  return {
    news,
    loading,
    error,
    refetch: fetchNews
  }
}

export const useBreakingNews = () => {
  const [breakingNews, setBreakingNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBreakingNews = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await newsService.getBreakingNews()

      if (response.success) {
        setBreakingNews(response.data)
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      console.error('[useBreakingNews] Error:', err)
      setError(err.message)
      setBreakingNews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBreakingNews()
  }, [fetchBreakingNews])

  return {
    breakingNews,
    loading,
    error,
    refetch: fetchBreakingNews
  }
}

export const useMarketSentiment = () => {
  const [sentiment, setSentiment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSentiment = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await newsService.getMarketSentiment()

      if (response.success) {
        setSentiment(response.data)
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      console.error('[useMarketSentiment] Error:', err)
      setError(err.message)
      setSentiment(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSentiment()
  }, [fetchSentiment])

  return {
    sentiment,
    loading,
    error,
    refetch: fetchSentiment
  }
}
