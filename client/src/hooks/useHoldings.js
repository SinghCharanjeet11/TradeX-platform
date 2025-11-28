/**
 * useHoldings Hook
 * Custom hook for managing holdings data state
 */

import { useState, useEffect, useCallback } from 'react'
import holdingsService from '../services/holdingsService'

export const useHoldings = (initialFilters = {}) => {
  const [holdings, setHoldings] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(initialFilters)

  const fetchHoldings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await holdingsService.getHoldings(filters)

      if (response.success) {
        setHoldings(response.data.holdings)
        setSummary(response.data.summary)
      } else {
        throw new Error(response.error || 'Failed to fetch holdings')
      }
    } catch (err) {
      console.error('[useHoldings] Error:', err)
      setError(err.message)
      setHoldings([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchHoldings()
  }, [fetchHoldings])

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({})
  }, [])

  return {
    holdings,
    summary,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refetch: fetchHoldings
  }
}
