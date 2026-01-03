/**
 * BulkActionsToolbar Component
 * Toolbar for bulk operations on selected holdings
 */

import { useState } from 'react'
import styles from './BulkActionsToolbar.module.css'

const BulkActionsToolbar = ({
  selectedCount = 0,
  onBulkDelete,
  onBulkEdit,
  onExport,
  onClearSelection,
  loading = false
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleBulkDelete = () => {
    if (showDeleteConfirm) {
      onBulkDelete()
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
      setTimeout(() => setShowDeleteConfirm(false), 3000)
    }
  }

  const handleClearSelection = () => {
    onClearSelection()
    setShowDeleteConfirm(false)
  }

  if (selectedCount === 0) {
    return null
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.selectionInfo}>
        <span className={styles.count}>
          {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
        </span>
      </div>

      <div className={styles.actions}>
        {onExport && (
          <button
            className={styles.actionButton}
            onClick={onExport}
            disabled={loading}
          >
            <span className={styles.icon}>📊</span>
            Export
          </button>
        )}

        {onBulkEdit && (
          <button
            className={styles.actionButton}
            onClick={onBulkEdit}
            disabled={loading}
          >
            <span className={styles.icon}>✏️</span>
            Edit
          </button>
        )}

        <button
          className={`${styles.actionButton} ${styles.deleteButton} ${
            showDeleteConfirm ? styles.confirmDelete : ''
          }`}
          onClick={handleBulkDelete}
          disabled={loading}
        >
          <span className={styles.icon}>
            {showDeleteConfirm ? '⚠️' : '🗑️'}
          </span>
          {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
        </button>

        <button
          className={styles.clearButton}
          onClick={handleClearSelection}
          disabled={loading}
        >
          <span className={styles.icon}>✕</span>
          Clear
        </button>
      </div>

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}
    </div>
  )
}

export default BulkActionsToolbar
