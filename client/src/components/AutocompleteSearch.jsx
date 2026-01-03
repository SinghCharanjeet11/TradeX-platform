import { useState, useEffect, useRef } from 'react'
import { MdSearch } from 'react-icons/md'
import styles from './AutocompleteSearch.module.css'

function AutocompleteSearch({ 
  placeholder = 'Search...', 
  onSearch,
  getSuggestions,
  onSelect,
  debounceMs = 300,
  minChars = 2,
  maxSuggestions = 10,
  showIcon = true
}) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const debounceTimer = useRef(null)
  const wrapperRef = useRef(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch suggestions when query changes
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (query.length < minChars) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceTimer.current = setTimeout(async () => {
      if (getSuggestions) {
        setLoading(true)
        try {
          const results = await getSuggestions(query)
          setSuggestions(results.slice(0, maxSuggestions))
          setShowSuggestions(results.length > 0)
        } catch (error) {
          console.error('Error fetching suggestions:', error)
          setSuggestions([])
        } finally {
          setLoading(false)
        }
      }
    }, debounceMs)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query, getSuggestions, debounceMs, minChars, maxSuggestions])

  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)
    if (onSearch) {
      onSearch(value)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.label || suggestion)
    setShowSuggestions(false)
    if (onSelect) {
      onSelect(suggestion)
    }
    if (onSearch) {
      onSearch(suggestion.label || suggestion)
    }
  }

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
      default:
        break
    }
  }

  return (
    <div className={styles.autocompleteWrapper} ref={wrapperRef}>
      <div className={styles.inputWrapper}>
        {showIcon && (
          <MdSearch className={styles.searchIcon} />
        )}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`${styles.input} ${showIcon ? styles.inputWithIcon : ''}`}
        />
        {loading && (
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className={styles.suggestionsList}>
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className={`${styles.suggestionItem} ${
                index === selectedIndex ? styles.selected : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion.icon && (
                <span className={styles.suggestionIcon}>{suggestion.icon}</span>
              )}
              <div className={styles.suggestionContent}>
                <div className={styles.suggestionLabel}>
                  {suggestion.label || suggestion}
                </div>
                {suggestion.description && (
                  <div className={styles.suggestionDescription}>
                    {suggestion.description}
                  </div>
                )}
              </div>
              {suggestion.badge && (
                <span className={styles.suggestionBadge}>{suggestion.badge}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AutocompleteSearch
