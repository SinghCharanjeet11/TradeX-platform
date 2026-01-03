import { useState, useEffect, useRef } from 'react'
import { MdSearch, MdClose } from 'react-icons/md'
import styles from './SearchBar.module.css'

function SearchBar({ onSearch, placeholder = 'Search news articles...', debounceMs = 300 }) {
  const [query, setQuery] = useState('')
  const debounceTimer = useRef(null)

  useEffect(() => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      onSearch(query)
    }, debounceMs)

    // Cleanup on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query, debounceMs, onSearch])

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className={styles.searchBar}>
      <MdSearch className={styles.searchIcon} />
      <input
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query && (
        <button
          className={styles.clearButton}
          onClick={handleClear}
          aria-label="Clear search"
        >
          <MdClose />
        </button>
      )}
    </div>
  )
}

export default SearchBar
