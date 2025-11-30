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
  const [localFilters, setLocalFilters] = useState({
    category: 'all',
    sentiment: 'all',
    dateFrom: '',
    dateTo: '',
    ...filters
  });

  useEffect(() => {
    setLocalFilters(prev => ({ ...prev, ...filters }));
  }, [filters]);

  const handleCategoryChange = (category) => {
    const newFilters = { ...localFilters, category };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSentimentChange = (e) => {
    const sentiment = e.target.value;
    const newFilters = { ...localFilters, sentiment };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      category: 'all',
      sentiment: 'all',
      dateFrom: '',
      dateTo: ''
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.category !== 'all') count++;
    if (localFilters.sentiment !== 'all') count++;
    if (localFilters.dateFrom) count++;
    if (localFilters.dateTo) count++;
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
              className={`${styles.categoryButton} ${
                localFilters.category === cat.value ? styles.active : ''
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
            value={localFilters.sentiment}
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

      {/* Date Range Filter */}
      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>Date Range</label>
        <div className={styles.dateInputs}>
          <input
            type="date"
            className={styles.dateInput}
            value={localFilters.dateFrom}
            onChange={(e) => handleDateChange('dateFrom', e.target.value)}
            max={localFilters.dateTo || new Date().toISOString().split('T')[0]}
            placeholder="From"
          />
          <input
            type="date"
            className={styles.dateInput}
            value={localFilters.dateTo}
            onChange={(e) => handleDateChange('dateTo', e.target.value)}
            min={localFilters.dateFrom}
            max={new Date().toISOString().split('T')[0]}
            placeholder="To"
          />
        </div>
      </div>
    </div>
  );
}
