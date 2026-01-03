/**
 * SearchBar Component
 * Reusable search input with autocomplete suggestions
 */

import { useState, useRef, useEffect } from 'react'
import styles from './SearchBar.module.css'

const SearchBar = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  suggestions = [],
  onSuggestionClick,
  showSuggestions = true,
  loading = false
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const wrapperRef = useRef(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSuggestionClick(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsFocused(false)
        setHighlightedIndex(-1)
        break
      default:
        break
    }
  }

  const handleSuggestionClick = (suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion)
    }
    setIsFocused(false)
    setHighlightedIndex(-1)
  }

  const handleClear = () => {
    onChange('')
    setHighlightedIndex(-1)
  }

  const showSuggestionsList = 
    isFocused && 
    showSuggestions && 
    suggestions.length > 0 && 
    value.length > 0

  return (
    <div className={styles.container} ref={wrapperRef}>
      <div className={styles.inputWrapper}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={styles.input}
        />
        {loading && (
          <div className={styles.loadingSpinner}></div>
        )}
        {value && !loading && (
          <button
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsList && (
        <div className={styles.suggestions}>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id || index}
              className={`${styles.suggestionItem} ${
                index === highlightedIndex ? styles.highlighted : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className={styles.suggestionContent}>
                <div className={styles.suggestionSymbol}>
                  {suggestion.symbol}
                </div>
                <div className={styles.suggestionName}>
                  {suggestion.name}
                </div>
              </div>
              {suggestion.assetType && (
                <span className={styles.suggestionType}>
                  {suggestion.assetType}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar
