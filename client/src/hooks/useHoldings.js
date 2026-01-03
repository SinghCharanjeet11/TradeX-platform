/**
 * useHoldings Hook
 * Custom hook for managing holdings data state with CRUD operations, pagination, and selection
 */

import { useState, useEffect, useCallback } from 'react'
import holdingsService from '../services/holdingsService'

export const useHoldings = (initialFilters = {}, usePagination = false, enabled = true) => {
  const [holdings, setHoldings] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(initialFilters)
  const [selectedIds, setSelectedIds] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0
  })

  const fetchHoldings = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let response
      if (usePagination) {
        response = await holdingsService.getHoldingsPaginated(
          filters,
          pagination.page,
          pagination.pageSize
        )
      } else {
        response = await holdingsService.getHoldings(filters)
      }

      if (response.success) {
        setHoldings(response.data.holdings)
        setSummary(response.data.summary)
        
        if (usePagination && response.data.pagination) {
          setPagination(response.data.pagination)
        }
      } else {
        throw new Error(response.error || 'Failed to fetch holdings')
      }
    } catch (err) {
      console.error('[useHoldings] Error:', err)
      
      // Check if it's an authentication error
      if (err.message === 'Not authenticated' || err.message === 'Invalid session' || err.message.includes('Session expired')) {
        setError('authentication_required')
      } else {
        setError(err.message)
      }
      setHoldings([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, pagination.pageSize, usePagination, enabled])

  useEffect(() => {
    if (enabled) {
      fetchHoldings()
    }
  }, [fetchHoldings, enabled])

  // CRUD Operations

  const createHolding = useCallback(async (holdingData) => {
    try {
      setError(null)
      const response = await holdingsService.createHolding(holdingData)
      
      if (response.success) {
        // Optimistic update
        setHoldings(prev => [response.data, ...prev])
        await fetchHoldings() // Refetch to get updated summary
        return response.data
      } else {
        throw new Error(response.error || 'Failed to create holding')
      }
    } catch (err) {
      console.error('[useHoldings] Create error:', err)
      setError(err.message)
      throw err
    }
  }, [fetchHoldings])

  const updateHolding = useCallback(async (holdingId, holdingData) => {
    try {
      setError(null)
      const response = await holdingsService.updateHolding(holdingId, holdingData)
      
      if (response.success) {
        // Optimistic update
        setHoldings(prev => 
          prev.map(h => h.id === holdingId ? response.data : h)
        )
        await fetchHoldings() // Refetch to get updated summary
        return response.data
      } else {
        throw new Error(response.error || 'Failed to update holding')
      }
    } catch (err) {
      console.error('[useHoldings] Update error:', err)
      setError(err.message)
      throw err
    }
  }, [fetchHoldings])

  const deleteHolding = useCallback(async (holdingId) => {
    try {
      setError(null)
      const response = await holdingsService.deleteHolding(holdingId)
      
      if (response.success) {
        // Optimistic update
        setHoldings(prev => prev.filter(h => h.id !== holdingId))
        setSelectedIds(prev => prev.filter(id => id !== holdingId))
        await fetchHoldings() // Refetch to get updated summary
        return true
      } else {
        throw new Error(response.error || 'Failed to delete holding')
      }
    } catch (err) {
      console.error('[useHoldings] Delete error:', err)
      setError(err.message)
      throw err
    }
  }, [fetchHoldings])

  const bulkDelete = useCallback(async (holdingIds) => {
    try {
      setError(null)
      const response = await holdingsService.bulkDeleteHoldings(holdingIds)
      
      if (response.success) {
        // Optimistic update
        setHoldings(prev => prev.filter(h => !holdingIds.includes(h.id)))
        setSelectedIds([])
        await fetchHoldings() // Refetch to get updated summary
        return response.data.deletedCount
      } else {
        throw new Error(response.error || 'Failed to delete holdings')
      }
    } catch (err) {
      console.error('[useHoldings] Bulk delete error:', err)
      setError(err.message)
      throw err
    }
  }, [fetchHoldings])

  // Selection Management

  const toggleSelection = useCallback((holdingId) => {
    setSelectedIds(prev => {
      if (prev.includes(holdingId)) {
        return prev.filter(id => id !== holdingId)
      } else {
        return [...prev, holdingId]
      }
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(holdings.map(h => h.id))
  }, [holdings])

  const clearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  // Pagination Management

  const changePage = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }, [])

  const changePageSize = useCallback((newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }))
  }, [])

  // Filter Management

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    if (usePagination) {
      setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page on filter change
    }
  }, [usePagination])

  const resetFilters = useCallback(() => {
    setFilters({})
    if (usePagination) {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
  }, [usePagination])

  return {
    // Data
    holdings,
    summary,
    loading,
    error,
    
    // Filters
    filters,
    updateFilters,
    resetFilters,
    
    // Pagination
    pagination,
    changePage,
    changePageSize,
    
    // Selection
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    
    // CRUD Operations
    createHolding,
    updateHolding,
    deleteHolding,
    bulkDelete,
    
    // Refetch
    refetch: fetchHoldings
  }
}
