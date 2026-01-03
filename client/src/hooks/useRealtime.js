/**
 * useRealtime Hook
 * Custom hook for managing real-time price updates with polling
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import priceService from '../services/priceService'

export const useRealtime = (interval = 60000, enabled = true) => {
  const [isPolling, setIsPolling] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [error, setError] = useState(null)
  const callbackRef = useRef(null)

  const handlePriceUpdate = useCallback((data) => {
    setLastUpdate(new Date())
    setError(null)
    
    // Call the registered callback if it exists
    if (callbackRef.current) {
      callbackRef.current(data)
    }
  }, [])

  const startPolling = useCallback((callback) => {
    if (isPolling) {
      console.log('[useRealtime] Polling already active')
      return
    }

    console.log('[useRealtime] Starting price polling')
    
    // Store the callback
    if (callback) {
      callbackRef.current = callback
    }

    // Start polling with the service
    priceService.startPolling(interval, handlePriceUpdate)
    setIsPolling(true)
    setLastUpdate(new Date())
  }, [isPolling, interval, handlePriceUpdate])

  const stopPolling = useCallback(() => {
    if (!isPolling) {
      return
    }

    console.log('[useRealtime] Stopping price polling')
    priceService.stopPolling()
    setIsPolling(false)
    callbackRef.current = null
  }, [isPolling])

  const refreshNow = useCallback(async () => {
    try {
      setError(null)
      const response = await priceService.refreshPrices()
      setLastUpdate(new Date())
      
      // Call the registered callback if it exists
      if (callbackRef.current) {
        callbackRef.current(response)
      }
      
      return response
    } catch (err) {
      console.error('[useRealtime] Manual refresh error:', err)
      setError(err.message)
      throw err
    }
  }, [])

  // Auto-start polling when enabled
  useEffect(() => {
    if (enabled && !isPolling) {
      // Add a small delay to ensure authentication is established
      const timer = setTimeout(() => {
        if (enabled && !isPolling) {
          startPolling()
        }
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [enabled, isPolling, startPolling])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isPolling) {
        stopPolling()
      }
    }
  }, []) // Empty deps - only run on unmount

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, stop polling
        if (isPolling) {
          console.log('[useRealtime] Page hidden, stopping polling')
          stopPolling()
        }
      } else {
        // Page is visible, resume polling if enabled
        if (enabled && !isPolling) {
          console.log('[useRealtime] Page visible, resuming polling')
          startPolling()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, isPolling, startPolling, stopPolling])

  return {
    isPolling,
    lastUpdate,
    error,
    startPolling,
    stopPolling,
    refreshNow
  }
}
