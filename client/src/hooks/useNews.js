/**
 * useNews Hook
 * Custom hook for managing news state with enhanced features
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import newsService from '../services/newsService'

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const RETRY_DELAY = 30 * 1000; // 30 seconds

export const useNews = (initialFilters = {}) => {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [cached, setCached] = useState(false)
  const [stale, setStale] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  const searchTimeoutRef = useRef(null)
  const autoRefreshIntervalRef = useRef(null)
  const retryTimeoutRef = useRef(null)

  const fetchNews = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true)
      }
      setError(null)

      const response = await newsService.getNews({
        ...filters,
        search: searchQuery
      })

      if (response.success) {
        setNews(response.data.articles || response.data)
        setCached(response.data.cached || false)
        setStale(response.data.stale || false)
        setRetryCount(0)
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      console.error('[useNews] Error:', err)
      setError(err.message)
      
      // Retry logic
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1)
        retryTimeoutRef.current = setTimeout(() => {
          fetchNews(true)
        }, RETRY_DELAY)
      }
    } finally {
      setLoading(false)
    }
  }, [filters, searchQuery, retryCount])

  // Debounced search
  const handleSearchChange = useCallback((query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(query)
    }, 300) // 300ms debounce
  }, [])

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({})
    setSearchQuery('')
  }, [])

  // Initial fetch and when filters/search change
  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    autoRefreshIntervalRef.current = setInterval(() => {
      fetchNews(true) // Silent refresh
    }, AUTO_REFRESH_INTERVAL)

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current)
      }
    }
  }, [fetchNews])

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  return {
    news,
    loading,
    error,
    filters,
    searchQuery,
    cached,
    stale,
    retryCount,
    refetch: fetchNews,
    updateFilters,
    clearFilters,
    handleSearchChange
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
