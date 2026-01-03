import { useState, useEffect } from 'react';
import styles from './NewsFilters.module.css';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'blockchain', label: 'Blockchain' },
  { value: 'regulation', label: 'Regulation' },
  { value: 'trading', label: 'Trading' },
  { value: 'technology', label: 'Technology' },
  { value: 'market', label: 'Market' }
];

const SENTIMENT_OPTIONS = [
  { value: 'all', label: 'All Sentiment' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' }
];

export default function NewsFilters({ filters, onFiltersChange }) {
  const [selectedCategory, setSelectedCategory] = useState(filters?.category || 'all');
  const [selectedSentiment, setSelectedSentiment] = useState(filters?.sentiment || 'all');

  useEffect(() => {
    if (filters) {
      setSelectedCategory(filters.category || 'all');
      setSelectedSentiment(filters.sentiment || 'all');
    }
  }, [filters]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    onFiltersChange({
      category,
      sentiment: selectedSentiment
    });
  };

  const handleSentimentChange = (e) => {
    const sentiment = e.target.value;
    setSelectedSentiment(sentiment);
    onFiltersChange({
      category: selectedCategory,
      sentiment
    });
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedSentiment('all');
    onFiltersChange({
      category: 'all',
      sentiment: 'all'
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedSentiment !== 'all') count++;
    return count;
  };

  const activeCount = getActiveFilterCount();
  const hasActiveFilters = activeCount > 0;

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersHeader}>
        <div className={styles.filtersTitle}>
          Filters
          {activeCount > 0 && (
            <span className={styles.activeCount}>{activeCount}</span>
          )}
        </div>
        <button
          className={styles.clearButton}
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
        >
          Clear All
        </button>
      </div>

      {/* Category Filter */}
      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>Category</label>
        <div className={styles.categoryButtons}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              className={`${styles.categoryButton} ${
                selectedCategory === cat.value ? styles.active : ''
              }`}
              onClick={() => handleCategoryChange(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sentiment Filter */}
      <div className={styles.filterSection}>
        <label className={styles.filterLabel} htmlFor="sentiment-filter">
          Sentiment
        </label>
        <div className={styles.selectWrapper}>
          <select
            id="sentiment-filter"
            className={styles.select}
            value={selectedSentiment}
            onChange={handleSentimentChange}
          >
            {SENTIMENT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
