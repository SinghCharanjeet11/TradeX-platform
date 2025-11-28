/**
 * useWatchlist Hook
 * Custom hook for managing watchlist state
 */

import { useState, useEffect, useCallback } from 'react'
import watchlistService from '../services/watchlistService'

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWatchlist = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await watchlistService.getWatchlist()

      if (response.success) {
        setWatchlist(response.data)
      } else {
        throw new Error(response.error || 'Failed to fetch watchlist')
      }
    } catch (err) {
      console.error('[useWatchlist] Error:', err)
      setError(err.message)
      setWatchlist([])
    } finally {
      setLoading(false)
    }
  }, [])

  const addToWatchlist = useCallback(async (asset) => {
    try {
      const response = await watchlistService.addToWatchlist(asset)
      
      if (response.success) {
        await fetchWatchlist()
        return { success: true, message: response.message }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [fetchWatchlist])

  const removeFromWatchlist = useCallback(async (watchlistId) => {
    try {
      const response = await watchlistService.removeFromWatchlist(watchlistId)
      
      if (response.success) {
        await fetchWatchlist()
        return { success: true, message: response.message }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [fetchWatchlist])

  useEffect(() => {
    fetchWatchlist()
  }, [fetchWatchlist])

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    refetch: fetchWatchlist
  }
}

export const useAlerts = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await watchlistService.getAlerts()

      if (response.success) {
        setAlerts(response.data)
      } else {
        throw new Error(response.error || 'Failed to fetch alerts')
      }
    } catch (err) {
      console.error('[useAlerts] Error:', err)
      setError(err.message)
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [])

  const createAlert = useCallback(async (alertData) => {
    try {
      const response = await watchlistService.createAlert(alertData)
      
      if (response.success) {
        await fetchAlerts()
        return { success: true, message: response.message }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [fetchAlerts])

  const deleteAlert = useCallback(async (alertId) => {
    try {
      const response = await watchlistService.deleteAlert(alertId)
      
      if (response.success) {
        await fetchAlerts()
        return { success: true, message: response.message }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [fetchAlerts])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  return {
    alerts,
    loading,
    error,
    createAlert,
    deleteAlert,
    refetch: fetchAlerts
  }
}
