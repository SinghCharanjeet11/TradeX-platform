import { createContext, useContext } from 'react'
import { useTheme } from '../hooks/useTheme'

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const themeState = useTheme()

  return (
    <ThemeContext.Provider value={themeState}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}
