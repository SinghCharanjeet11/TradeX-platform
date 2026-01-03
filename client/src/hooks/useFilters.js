/**
 * useFilters Hook
 * Manages filtering, searching, and sorting logic for holdings
 */

import { useState, useMemo } from 'react'

export const useFilters = (holdings = []) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    assetType: 'all',
    sortBy: 'totalValue',
    sortOrder: 'desc',
    gainLossFilter: 'all',
    minValue: null,
    maxValue: null,
    minGainLossPercent: null,
    maxGainLossPercent: null
  })

  // Apply all filters and sorting
  const filteredHoldings = useMemo(() => {
    let result = [...holdings]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(holding => 
        holding.symbol?.toLowerCase().includes(term) ||
        holding.name?.toLowerCase().includes(term)
      )
    }

    // Asset type filter
    if (filters.assetType !== 'all') {
      result = result.filter(holding => 
        holding.assetType === filters.assetType
      )
    }

    // Gain/Loss filter
    if (filters.gainLossFilter === 'gainers') {
      result = result.filter(holding => holding.gainLoss > 0)
    } else if (filters.gainLossFilter === 'losers') {
      result = result.filter(holding => holding.gainLoss < 0)
    }

    // Value range filter
    if (filters.minValue !== null) {
      result = result.filter(holding => 
        holding.totalValue >= filters.minValue
      )
    }
    if (filters.maxValue !== null) {
      result = result.filter(holding => 
        holding.totalValue <= filters.maxValue
      )
    }

    // Gain/Loss percentage range filter
    if (filters.minGainLossPercent !== null) {
      result = result.filter(holding => 
        holding.gainLossPercent >= filters.minGainLossPercent
      )
    }
    if (filters.maxGainLossPercent !== null) {
      result = result.filter(holding => 
        holding.gainLossPercent <= filters.maxGainLossPercent
      )
    }

    // Sorting
    result.sort((a, b) => {
      const aValue = a[filters.sortBy]
      const bValue = b[filters.sortBy]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      let comparison = 0
      if (typeof aValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else {
        comparison = aValue - bValue
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [holdings, searchTerm, filters])

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilters({
      assetType: 'all',
      sortBy: 'totalValue',
      sortOrder: 'desc',
      gainLossFilter: 'all',
      minValue: null,
      maxValue: null,
      minGainLossPercent: null,
      maxGainLossPercent: null
    })
  }

  const hasActiveFilters = 
    searchTerm !== '' ||
    filters.assetType !== 'all' ||
    filters.gainLossFilter !== 'all' ||
    filters.minValue !== null ||
    filters.maxValue !== null ||
    filters.minGainLossPercent !== null ||
    filters.maxGainLossPercent !== null

  return {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilters,
    clearFilters,
    filteredHoldings,
    hasActiveFilters,
    totalCount: holdings.length,
    filteredCount: filteredHoldings.length
  }
}

export default useFilters
