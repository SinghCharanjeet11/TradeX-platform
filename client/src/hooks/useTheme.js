import { useState, useEffect } from 'react'

const THEME_KEY = 'tradex-theme'

// Get initial theme from localStorage or default to 'light'
const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY)
    if (savedTheme && ['dark', 'light', 'auto'].includes(savedTheme)) {
      return savedTheme
    }
  } catch (error) {
    console.error('Error reading theme from localStorage:', error)
  }
  return 'light' // Default theme
}

// Get system theme preference
const getSystemTheme = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

// Resolve the actual theme to apply (handles 'auto' mode)
const resolveTheme = (theme) => {
  if (theme === 'auto') {
    return getSystemTheme()
  }
  return theme
}

// Apply theme to document
const applyTheme = (theme) => {
  const resolvedTheme = resolveTheme(theme)
  document.documentElement.setAttribute('data-theme', resolvedTheme)
}

export const useTheme = () => {
  const [theme, setTheme] = useState(getInitialTheme)

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      applyTheme('auto')
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } 
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [theme])

  // Update theme and persist to localStorage
  const updateTheme = (newTheme) => {
    if (!['dark', 'light', 'auto'].includes(newTheme)) {
      console.error('Invalid theme:', newTheme)
      return
    }

    try {
      localStorage.setItem(THEME_KEY, newTheme)
      setTheme(newTheme)
    } catch (error) {
      console.error('Error saving theme to localStorage:', error)
      setTheme(newTheme) // Still update state even if localStorage fails
    }
  }

  return {
    theme,
    setTheme: updateTheme,
    resolvedTheme: resolveTheme(theme)
  }
}

// Initialize theme immediately (before React renders)
export const initializeTheme = () => {
  const theme = getInitialTheme()
  applyTheme(theme)
}
