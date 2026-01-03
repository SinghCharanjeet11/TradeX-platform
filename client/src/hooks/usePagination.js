/**
 * usePagination Hook
 * Reusable custom hook for managing pagination state and logic
 */

import { useState, useCallback, useMemo } from 'react'

export const usePagination = (initialPage = 1, initialPageSize = 20, totalItems = 0) => {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize) || 1
  }, [totalItems, pageSize])

  const canGoNext = useMemo(() => {
    return page < totalPages
  }, [page, totalPages])

  const canGoPrev = useMemo(() => {
    return page > 1
  }, [page])

  const nextPage = useCallback(() => {
    if (canGoNext) {
      setPage(prev => prev + 1)
    }
  }, [canGoNext])

  const prevPage = useCallback(() => {
    if (canGoPrev) {
      setPage(prev => prev - 1)
    }
  }, [canGoPrev])

  const goToPage = useCallback((newPage) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages))
    setPage(validPage)
  }, [totalPages])

  const changePageSize = useCallback((newPageSize) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page when changing page size
  }, [])

  const reset = useCallback(() => {
    setPage(initialPage)
    setPageSize(initialPageSize)
  }, [initialPage, initialPageSize])

  // Calculate start and end indices for current page
  const startIndex = useMemo(() => {
    return (page - 1) * pageSize
  }, [page, pageSize])

  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSize, totalItems)
  }, [startIndex, pageSize, totalItems])

  return {
    page,
    pageSize,
    totalPages,
    canGoNext,
    canGoPrev,
    nextPage,
    prevPage,
    setPage: goToPage,
    setPageSize: changePageSize,
    reset,
    startIndex,
    endIndex
  }
}
