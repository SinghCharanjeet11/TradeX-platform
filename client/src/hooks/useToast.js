import { useState, useCallback } from 'react'

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
    const id = ++toastId
    const toast = { id, type, title, message, duration }
    
    setToasts(prev => [...prev, toast])
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showInfo = useCallback((message, title) => {
    return addToast({ type: 'info', title, message })
  }, [addToast])

  const showSuccess = useCallback((message, title) => {
    return addToast({ type: 'success', title, message })
  }, [addToast])

  const showWarning = useCallback((message, title) => {
    return addToast({ type: 'warning', title, message })
  }, [addToast])

  const showError = useCallback((message, title) => {
    return addToast({ type: 'error', title, message })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    showInfo,
    showSuccess,
    showWarning,
    showError
  }
}
