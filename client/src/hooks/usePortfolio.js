/**
 * usePortfolio Hook
 * Custom hook for managing portfolio data state
 */

import { useState, useEffect, useCallback } from 'react'
import portfolioService from '../services/portfolioService'

export const usePortfolio = (enabled = true) => {
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchPortfolio = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await portfolioService.getPortfolioSummary()
      
      if (response.success) {
        setPortfolio(response.data)
      } else {
        throw new Error(response.error || 'Failed to fetch portfolio')
      }
    } catch (err) {
      console.error('[usePortfolio] Error:', err)
      
      // Check if it's an authentication error
      if (err.message === 'Not authenticated' || err.message === 'Invalid session' || err.message.includes('Session expired')) {
        setError('authentication_required')
      } else {
        setError(err.message)
      }
      setPortfolio(null)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  const refreshPortfolio = useCallback(async () => {
    // Simply refetch the portfolio data (no backend refresh endpoint needed)
    try {
      setRefreshing(true)
      await fetchPortfolio()
    } catch (err) {
      console.error('[usePortfolio] Refresh error:', err)
      setError(err.message)
    } finally {
      setRefreshing(false)
    }
  }, [fetchPortfolio])

  useEffect(() => {
    if (enabled) {
      fetchPortfolio()
    }
  }, [fetchPortfolio, enabled])

  return {
    portfolio,
    loading,
    error,
    refreshing,
    refreshPortfolio,
    refetch: fetchPortfolio
  }
}

export const usePortfolioPerformance = (timeframe = '1M') => {
  const [performance, setPerformance] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await portfolioService.getPortfolioPerformance(timeframe)
        
        if (response.success) {
          setPerformance(response.data)
        } else {
          throw new Error(response.error || 'Failed to fetch performance')
        }
      } catch (err) {
        console.error('[usePortfolioPerformance] Error:', err)
        setError(err.message)
        setPerformance([])
      } finally {
        setLoading(false)
      }
    }

    fetchPerformance()
  }, [timeframe])

  return { performance, loading, error }
}
