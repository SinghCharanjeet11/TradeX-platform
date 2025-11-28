/**
 * useOrders Hook
 * Custom hook for managing orders state
 */

import { useState, useEffect, useCallback } from 'react'
import ordersService from '../services/ordersService'

export const useOrders = (filters = {}) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ordersService.getOrders(filters)

      if (response.success) {
        setOrders(response.data)
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      console.error('[useOrders] Error:', err)
      setError(err.message)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders
  }
}

export const useTradeHistory = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ordersService.getTradeHistory()

      if (response.success) {
        setHistory(response.data)
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      console.error('[useTradeHistory] Error:', err)
      setError(err.message)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return {
    history,
    loading,
    error,
    refetch: fetchHistory
  }
}

export const useOpenOrders = () => {
  const [openOrders, setOpenOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOpenOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ordersService.getOpenOrders()

      if (response.success) {
        setOpenOrders(response.data)
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      console.error('[useOpenOrders] Error:', err)
      setError(err.message)
      setOpenOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelOrder = useCallback(async (orderId) => {
    try {
      const response = await ordersService.cancelOrder(orderId)
      
      if (response.success) {
        await fetchOpenOrders()
        return { success: true, message: response.message }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [fetchOpenOrders])

  useEffect(() => {
    fetchOpenOrders()
  }, [fetchOpenOrders])

  return {
    openOrders,
    loading,
    error,
    cancelOrder,
    refetch: fetchOpenOrders
  }
}

export const useTradeAnalytics = () => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ordersService.getAnalytics()

      if (response.success) {
        setAnalytics(response.data)
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      console.error('[useTradeAnalytics] Error:', err)
      setError(err.message)
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  }
}
