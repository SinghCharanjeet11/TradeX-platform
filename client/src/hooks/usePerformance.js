/**
 * usePerformance Hook
 * Custom hook for managing portfolio performance and allocation data
 */

import { useState, useEffect, useCallback } from 'react'
import performanceService from '../services/performanceService'

export const usePerformance = (initialTimeRange = '30D', enabled = true) => {
  const [performanceData, setPerformanceData] = useState([])
  const [allocationData, setAllocationData] = useState([])
  const [timeRange, setTimeRange] = useState(initialTimeRange)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPerformanceData = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await performanceService.getPerformanceData(timeRange)

      if (response.success) {
        setPerformanceData(response.data.dataPoints || [])
      } else {
        throw new Error(response.error || 'Failed to fetch performance data')
      }
    } catch (err) {
      console.error('[usePerformance] Error fetching performance:', err)
      setError(err.message)
      setPerformanceData([])
    } finally {
      setLoading(false)
    }
  }, [timeRange, enabled])

  const fetchAllocationData = useCallback(async () => {
    if (!enabled) {
      return
    }

    try {
      const response = await performanceService.getAllocationData()

      if (response.success) {
        setAllocationData(response.data || [])
      } else {
        throw new Error(response.error || 'Failed to fetch allocation data')
      }
    } catch (err) {
      console.error('[usePerformance] Error fetching allocation:', err)
      setAllocationData([])
    }
  }, [enabled])

  const fetchAll = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [perfResponse, allocResponse] = await Promise.all([
        performanceService.getPerformanceData(timeRange),
        performanceService.getAllocationData()
      ])

      if (perfResponse.success) {
        setPerformanceData(perfResponse.data.dataPoints || [])
      }

      if (allocResponse.success) {
        setAllocationData(allocResponse.data || [])
      }
    } catch (err) {
      console.error('[usePerformance] Error fetching data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [timeRange, enabled])

  useEffect(() => {
    if (enabled) {
      fetchAll()
    }
  }, [fetchAll, enabled])

  const changeTimeRange = useCallback((newTimeRange) => {
    setTimeRange(newTimeRange)
  }, [])

  const refetch = useCallback(() => {
    return fetchAll()
  }, [fetchAll])

  return {
    performanceData,
    allocationData,
    timeRange,
    setTimeRange: changeTimeRange,
    loading,
    error,
    refetch
  }
}
