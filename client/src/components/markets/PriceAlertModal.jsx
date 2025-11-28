import { useState } from 'react'
import { MdClose, MdNotifications, MdTrendingUp, MdTrendingDown } from 'react-icons/md'
import { useAlerts } from '../../hooks/useWatchlist'
import portfolioService from '../../services/portfolioService'
import styles from './PriceAlertModal.module.css'

function PriceAlertModal({ isOpen, onClose, asset }) {
  const { createAlert } = useAlerts()
  const [condition, setCondition] = useState('above')
  const [targetPrice, setTargetPrice] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isOpen || !asset) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!targetPrice || isNaN(targetPrice) || parseFloat(targetPrice) <= 0) {
      setError('Please enter a valid target price')
      return
    }

    try {
      setCreating(true)

      const result = await createAlert({
        symbol: asset.symbol,
        name: asset.name,
        assetType: asset.assetType,
        condition,
        targetPrice: parseFloat(targetPrice),
        currentPrice: asset.price
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
          setTargetPrice('')
          setCondition('above')
          setSuccess(false)
        }, 1500)
      } else {
        setError(result.error || 'Failed to create alert')
      }
    } catch (err) {
      setError('Failed to create alert')
    } finally {
      setCreating(false)
    }
  }

  const percentageDiff = targetPrice && !isNaN(targetPrice)
    ? ((parseFloat(targetPrice) - asset.price) / asset.price) * 100
    : 0

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <MdNotifications className={styles.headerIcon} />
            <div>
              <h2>Create Price Alert</h2>
              <p>{asset.name} ({asset.symbol})</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <MdClose />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.currentPrice}>
            <span className={styles.label}>Current Price</span>
            <span className={styles.price}>
              {portfolioService.formatCurrency(asset.price)}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Alert Condition</label>
              <div className={styles.conditionButtons}>
                <button
                  type="button"
                  className={`${styles.conditionBtn} ${condition === 'above' ? styles.active : ''}`}
                  onClick={() => setCondition('above')}
                >
                  <MdTrendingUp />
                  <span>Price Goes Above</span>
                </button>
                <button
                  type="button"
                  className={`${styles.conditionBtn} ${condition === 'below' ? styles.active : ''}`}
                  onClick={() => setCondition('below')}
                >
                  <MdTrendingDown />
                  <span>Price Goes Below</span>
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Target Price</label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter target price"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className={styles.input}
                required
              />
              {targetPrice && !isNaN(targetPrice) && (
                <div className={`${styles.priceDiff} ${percentageDiff >= 0 ? styles.positive : styles.negative}`}>
                  {percentageDiff >= 0 ? '+' : ''}{percentageDiff.toFixed(2)}% from current price
                </div>
              )}
            </div>

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            {success && (
              <div className={styles.success}>
                Alert created successfully!
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={creating || success}
              >
                {creating ? 'Creating...' : success ? 'Created!' : 'Create Alert'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PriceAlertModal
