/**
 * AddEditHoldingModal Component
 * Modal form for creating and editing holdings
 */

import { useState, useEffect } from 'react'
import styles from './AddEditHoldingModal.module.css'

const AddEditHoldingModal = ({ isOpen, mode = 'add', holding = null, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    assetType: 'crypto',
    quantity: '',
    avgBuyPrice: '',
    currentPrice: '',
    account: 'default',
    notes: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && holding) {
      setFormData({
        symbol: holding.symbol || '',
        name: holding.name || '',
        assetType: holding.assetType || 'crypto',
        quantity: holding.quantity?.toString() || '',
        avgBuyPrice: holding.avgBuyPrice?.toString() || '',
        currentPrice: holding.currentPrice?.toString() || '',
        account: holding.account || 'default',
        notes: holding.notes || ''
      })
    } else if (mode === 'add') {
      // Reset form for add mode
      setFormData({
        symbol: '',
        name: '',
        assetType: 'crypto',
        quantity: '',
        avgBuyPrice: '',
        currentPrice: '',
        account: 'default',
        notes: ''
      })
    }
    setErrors({})
  }, [mode, holding, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Symbol validation
    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required'
    } else if (formData.symbol.length > 10) {
      newErrors.symbol = 'Symbol must be 10 characters or less'
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less'
    }

    // Asset type validation
    if (!['crypto', 'stocks', 'forex', 'commodities'].includes(formData.assetType)) {
      newErrors.assetType = 'Invalid asset type'
    }

    // Quantity validation
    const quantity = parseFloat(formData.quantity)
    if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
      newErrors.quantity = 'Quantity must be a positive number'
    }

    // Average buy price validation
    const avgBuyPrice = parseFloat(formData.avgBuyPrice)
    if (!formData.avgBuyPrice || isNaN(avgBuyPrice) || avgBuyPrice <= 0) {
      newErrors.avgBuyPrice = 'Average buy price must be a positive number'
    }

    // Current price validation (optional)
    if (formData.currentPrice) {
      const currentPrice = parseFloat(formData.currentPrice)
      if (isNaN(currentPrice) || currentPrice <= 0) {
        newErrors.currentPrice = 'Current price must be a positive number'
      }
    }

    // Account validation (optional)
    if (formData.account && formData.account.length > 50) {
      newErrors.account = 'Account name must be 50 characters or less'
    }

    // Notes validation (optional)
    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes must be 500 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const holdingData = {
        symbol: formData.symbol.trim().toUpperCase(),
        name: formData.name.trim(),
        assetType: formData.assetType,
        quantity: parseFloat(formData.quantity),
        avgBuyPrice: parseFloat(formData.avgBuyPrice),
        currentPrice: formData.currentPrice ? parseFloat(formData.currentPrice) : undefined,
        account: formData.account.trim() || 'default',
        notes: formData.notes.trim() || null
      }

      await onSave(holdingData)
      onClose()
    } catch (error) {
      console.error('[AddEditHoldingModal] Save error:', error)
      
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors = {}
        error.response.data.errors.forEach(err => {
          backendErrors[err.field] = err.message
        })
        setErrors(backendErrors)
      } else {
        setErrors({ general: error.message || 'Failed to save holding' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{mode === 'add' ? 'Add New Holding' : 'Edit Holding'}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.general && (
            <div className={styles.errorBanner}>{errors.general}</div>
          )}

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="symbol">Symbol *</label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                className={errors.symbol ? styles.inputError : ''}
                placeholder="BTC, AAPL, EUR/USD"
                disabled={loading}
              />
              {errors.symbol && <span className={styles.error}>{errors.symbol}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? styles.inputError : ''}
                placeholder="Bitcoin, Apple Inc."
                disabled={loading}
              />
              {errors.name && <span className={styles.error}>{errors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="assetType">Asset Type *</label>
              <select
                id="assetType"
                name="assetType"
                value={formData.assetType}
                onChange={handleChange}
                className={errors.assetType ? styles.inputError : ''}
                disabled={loading}
              >
                <option value="crypto">Cryptocurrency</option>
                <option value="stocks">Stocks</option>
                <option value="forex">Forex</option>
                <option value="commodities">Commodities</option>
              </select>
              {errors.assetType && <span className={styles.error}>{errors.assetType}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="account">Account</label>
              <input
                type="text"
                id="account"
                name="account"
                value={formData.account}
                onChange={handleChange}
                className={errors.account ? styles.inputError : ''}
                placeholder="default"
                disabled={loading}
              />
              {errors.account && <span className={styles.error}>{errors.account}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={errors.quantity ? styles.inputError : ''}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={loading}
              />
              {errors.quantity && <span className={styles.error}>{errors.quantity}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="avgBuyPrice">Average Buy Price *</label>
              <input
                type="number"
                id="avgBuyPrice"
                name="avgBuyPrice"
                value={formData.avgBuyPrice}
                onChange={handleChange}
                className={errors.avgBuyPrice ? styles.inputError : ''}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={loading}
              />
              {errors.avgBuyPrice && <span className={styles.error}>{errors.avgBuyPrice}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="currentPrice">Current Price</label>
              <input
                type="number"
                id="currentPrice"
                name="currentPrice"
                value={formData.currentPrice}
                onChange={handleChange}
                className={errors.currentPrice ? styles.inputError : ''}
                placeholder="0.00 (optional)"
                step="0.01"
                min="0"
                disabled={loading}
              />
              {errors.currentPrice && <span className={styles.error}>{errors.currentPrice}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className={errors.notes ? styles.inputError : ''}
              placeholder="Add any notes about this holding..."
              rows="3"
              disabled={loading}
            />
            {errors.notes && <span className={styles.error}>{errors.notes}</span>}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'add' ? 'Add Holding' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEditHoldingModal
