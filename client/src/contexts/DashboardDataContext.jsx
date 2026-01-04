/**
 * DashboardDataContext
 * Centralized state management for all dashboard data
 * Implements request deduplication, caching, and adaptive polling
 */

import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import api from '../services/api'
import requestManager from '../services/requestManager'
import cacheLayer from '../services/cacheLayer'

const DashboardDataContext = createContext(null)

// Polling intervals
const INTERVALS = {
  ACTIVE: 30000,      // 30s when tab is active
  INACTIVE: 300000,   // 5min when tab is inactive
}

export function DashboardDataProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState({
    portfolio: { data: null, loading: true, error: null, lastUpdated: null },
    watchlist: { data: [], loading: true, error: null, lastUpdated: null },
    alerts: { data: [], loading: true, error: null, lastUpdated: null },
    recommendations: { data: [], loading: true, error: null, lastUpdated: null },
    isPolling: false,
    lastPollTime: null
  })

  const pollingIntervalRef = useRef(null)
  const isActiveRef = useRef(true)

  // Fetch all dashboard data using batch endpoint
  const refreshAll = useCallback(async () => {
    try {
      console.log('[DashboardDataContext] Refreshing all data...')

      // Check cache first
      const cached = cacheLayer.get('dashboard-all')
      if (cached) {
        console.log('[DashboardDataContext] Using cached data')
        setState(prev => ({
          ...prev,
          portfolio: { data: cached.portfolio || null, loading: false, error: null, lastUpdated: new Date() },
          watchlist: { data: cached.watchlist || [], loading: false, error: null, lastUpdated: new Date() },
          alerts: { data: cached.alerts || [], loading: false, error: null, lastUpdated: new Date() },
          recommendations: { data: cached.recommendations || [], loading: false, error: null, lastUpdated: new Date() },
          lastPollTime: new Date()
        }))
        return cached
      }

      // Use request manager to deduplicate
      const response = await requestManager.execute('dashboard-all', async () => {
        const res = await api.get('/dashboard/all')
        return res.data
      })

      if (response.success) {
        // Cache the response
        cacheLayer.set('dashboard-all', response.data)

        // Update state
        setState(prev => ({
          ...prev,
          portfolio: { 
            data: response.data.portfolio || null, 
            loading: false, 
            error: response.errors?.portfolio || null, 
            lastUpdated: new Date() 
          },
          watchlist: { 
            data: response.data.watchlist || [], 
            loading: false, 
            error: response.errors?.watchlist || null, 
            lastUpdated: new Date() 
          },
          alerts: { 
            data: response.data.alerts || [], 
            loading: false, 
            error: response.errors?.alerts || null, 
            lastUpdated: new Date() 
          },
          recommendations: { 
            data: response.data.recommendations?.recommendations || response.data.recommendations || [], 
            loading: false, 
            error: response.errors?.recommendations || null, 
            lastUpdated: new Date() 
          },
          lastPollTime: new Date()
        }))

        return response.data
      }
    } catch (error) {
      console.error('[DashboardDataContext] Batch fetch failed:', error)
      
      // Fall back to individual requests
      console.log('[DashboardDataContext] Falling back to individual requests')
      await Promise.allSettled([
        refreshPortfolio(),
        refreshWatchlist(),
        refreshAlerts(),
        refreshRecommendations()
      ])
    }
  }, [])

  // Refresh individual data types
  const refreshPortfolio = useCallback(async () => {
    try {
      const response = await api.get('/portfolio/summary')
      if (response.data.success) {
        setState(prev => ({
          ...prev,
          portfolio: { data: response.data.data, loading: false, error: null, lastUpdated: new Date() }
        }))
        cacheLayer.set('portfolio', response.data.data)
      }
    } catch (error) {
      console.error('[DashboardDataContext] Portfolio refresh failed:', error)
      setState(prev => ({
        ...prev,
        portfolio: { ...prev.portfolio, loading: false, error: error.message }
      }))
    }
  }, [])

  const refreshWatchlist = useCallback(async () => {
    try {
      // Clear related caches to ensure fresh data
      cacheLayer.invalidate('watchlist')
      cacheLayer.invalidate('dashboard-all')
      
      const response = await api.get('/watchlist')
      if (response.data.success) {
        setState(prev => ({
          ...prev,
          watchlist: { data: response.data.watchlist, loading: false, error: null, lastUpdated: new Date() }
        }))
        cacheLayer.set('watchlist', response.data.watchlist)
      }
    } catch (error) {
      console.error('[DashboardDataContext] Watchlist refresh failed:', error)
      setState(prev => ({
        ...prev,
        watchlist: { ...prev.watchlist, loading: false, error: error.message }
      }))
    }
  }, [])

  const refreshAlerts = useCallback(async () => {
    try {
      // Clear related caches to ensure fresh data
      cacheLayer.invalidate('alerts')
      cacheLayer.invalidate('dashboard-all')
      
      const response = await api.get('/watchlist/alerts')
      if (response.data.success) {
        setState(prev => ({
          ...prev,
          alerts: { data: response.data.alerts, loading: false, error: null, lastUpdated: new Date() }
        }))
        cacheLayer.set('alerts', response.data.alerts)
      }
    } catch (error) {
      console.error('[DashboardDataContext] Alerts refresh failed:', error)
      setState(prev => ({
        ...prev,
        alerts: { ...prev.alerts, loading: false, error: error.message }
      }))
    }
  }, [])

  const refreshRecommendations = useCallback(async () => {
    try {
      const response = await api.get('/insights/recommendations?limit=5')
      if (response.data.success) {
        // The API returns data.data.recommendations, not data.recommendations
        const recommendations = response.data.data?.recommendations || []
        setState(prev => ({
          ...prev,
          recommendations: { data: recommendations, loading: false, error: null, lastUpdated: new Date() }
        }))
        cacheLayer.set('recommendations', recommendations)
      }
    } catch (error) {
      console.error('[DashboardDataContext] Recommendations refresh failed:', error)
      setState(prev => ({
        ...prev,
        recommendations: { ...prev.recommendations, loading: false, error: error.message }
      }))
    }
  }, [])

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('[DashboardDataContext] Polling already active')
      return
    }

    const interval = isActiveRef.current ? INTERVALS.ACTIVE : INTERVALS.INACTIVE
    console.log(`[DashboardDataContext] Starting polling (interval: ${interval}ms)`)

    setState(prev => ({ ...prev, isPolling: true }))

    // Initial fetch
    refreshAll()

    // Set up interval
    pollingIntervalRef.current = setInterval(() => {
      refreshAll()
    }, interval)
  }, [refreshAll])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('[DashboardDataContext] Stopping polling')
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
      setState(prev => ({ ...prev, isPolling: false }))
    }
  }, [])

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isActive = !document.hidden
      isActiveRef.current = isActive

      if (isActive) {
        console.log('[DashboardDataContext] Tab active, resuming polling')
        stopPolling()
        startPolling()
      } else {
        console.log('[DashboardDataContext] Tab inactive, adjusting polling')
        stopPolling()
        startPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [startPolling, stopPolling])

  // Start polling on mount - only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [isAuthenticated, startPolling, stopPolling])

  // Log stats periodically
  useEffect(() => {
    const statsInterval = setInterval(() => {
      const requestStats = requestManager.getStats()
      const cacheStats = cacheLayer.getStats()
      console.log('[DashboardDataContext] Stats:', {
        requests: requestStats,
        cache: cacheStats
      })
    }, 60000) // Every minute

    return () => clearInterval(statsInterval)
  }, [])

  // Optimistic update functions for immediate UI feedback
  const removeWatchlistItem = useCallback((itemId) => {
    setState(prev => ({
      ...prev,
      watchlist: {
        ...prev.watchlist,
        data: (prev.watchlist.data || []).filter(item => item.id !== itemId)
      }
    }))
    // Also invalidate cache so next refresh gets fresh data
    cacheLayer.invalidate('watchlist')
    cacheLayer.invalidate('dashboard-all')
  }, [])

  const removeAlertItem = useCallback((alertId) => {
    setState(prev => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        data: (prev.alerts.data || []).filter(alert => alert.id !== alertId)
      }
    }))
    // Also invalidate cache so next refresh gets fresh data
    cacheLayer.invalidate('alerts')
    cacheLayer.invalidate('dashboard-all')
  }, [])

  const value = {
    // State
    portfolio: state.portfolio,
    watchlist: state.watchlist,
    alerts: state.alerts,
    recommendations: state.recommendations,
    isPolling: state.isPolling,
    lastPollTime: state.lastPollTime,

    // Actions
    refreshAll,
    refreshPortfolio,
    refreshWatchlist,
    refreshAlerts,
    refreshRecommendations,
    startPolling,
    stopPolling,

    // Optimistic updates
    removeWatchlistItem,
    removeAlertItem,

    // Cache invalidation
    invalidateCache: (key) => cacheLayer.invalidate(key)
  }

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  )
}

export default DashboardDataContext
