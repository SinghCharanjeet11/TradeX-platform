import { useState } from 'react'
import { MdNotifications, MdDelete, MdTrendingUp, MdTrendingDown, MdCheckCircle, MdAccessTime } from 'react-icons/md'
import { useAlerts } from '../../hooks/useWatchlist'
import portfolioService from '../../services/portfolioService'
import styles from './AlertsCard.module.css'

function AlertsCard() {
  const { alerts, loading, deleteAlert } = useAlerts()
  const [deleting, setDeleting] = useState(null)

  const handleDelete = async (e, alertId) => {
    e.stopPropagation()
    
    if (deleting) return

    try {
      setDeleting(alertId)
      await deleteAlert(alertId)
    } catch (error) {
      console.error('Error deleting alert:', error)
    } finally {
      setDeleting(null)
    }
  }

  const calculateProgress = (alert) => {
    if (!alert.currentPrice || !alert.targetPrice) return 0
    
    const diff = alert.targetPrice - alert.currentPrice
    const totalDiff = alert.targetPrice - (alert.initialPrice || alert.currentPrice)
    
    if (totalDiff === 0) return 100
    
    const progress = ((totalDiff - diff) / totalDiff) * 100
    return Math.max(0, Math.min(100, progress))
  }

  const getAlertStatus = (alert) => {
    if (alert.triggered) return 'triggered'
    
    const progress = calculateProgress(alert)
    if (progress >= 90) return 'near'
    return 'active'
  }

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MdNotifications className={styles.headerIcon} />
            <h3>Price Alerts</h3>
          </div>
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading alerts...</p>
        </div>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MdNotifications className={styles.headerIcon} />
            <h3>Price Alerts</h3>
          </div>
        </div>
        <div className={styles.empty}>
          <MdNotifications className={styles.emptyIcon} />
          <p>No active price alerts</p>
          <p className={styles.emptyHint}>Set alerts on assets to get notified when prices reach your targets</p>
        </div>
      </div>
    )
  }

  // Show only first 5 items
  const displayedAlerts = alerts.slice(0, 5)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <MdNotifications className={styles.headerIcon} />
          <h3>Price Alerts</h3>
          <span className={styles.count}>{alerts.length}</span>
        </div>
      </div>

      <div className={styles.list}>
        {displayedAlerts.map((alert) => {
          const status = getAlertStatus(alert)
          const progress = calculateProgress(alert)
          
          return (
            <div key={alert.id} className={`${styles.alert} ${styles[status]}`}>
              <div className={styles.alertHeader}>
                <div className={styles.alertInfo}>
                  <span className={styles.alertName}>{alert.name}</span>
                  <span className={styles.alertSymbol}>{alert.symbol}</span>
                </div>
                
                <div className={styles.alertStatus}>
                  {status === 'triggered' && (
                    <span className={styles.statusBadge}>
                      <MdCheckCircle /> Triggered
                    </span>
                  )}
                  {status === 'near' && (
                    <span className={`${styles.statusBadge} ${styles.near}`}>
                      <MdAccessTime /> Near Target
                    </span>
                  )}
                  {status === 'active' && (
                    <span className={`${styles.statusBadge} ${styles.active}`}>
                      <MdAccessTime /> Active
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.alertBody}>
                <div className={styles.priceRow}>
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>Current</span>
                    <span className={styles.priceValue}>
                      {portfolioService.formatCurrency(alert.currentPrice || 0)}
                    </span>
                  </div>

                  <div className={styles.conditionIcon}>
                    {alert.condition === 'above' ? <MdTrendingUp /> : <MdTrendingDown />}
                  </div>

                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>Target</span>
                    <span className={styles.priceValue}>
                      {portfolioService.formatCurrency(alert.targetPrice)}
                    </span>
                  </div>
                </div>

                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className={styles.progressText}>
                  {progress.toFixed(0)}% to target
                </div>
              </div>

              <button
                className={styles.deleteBtn}
                onClick={(e) => handleDelete(e, alert.id)}
                disabled={deleting === alert.id}
                title="Delete alert"
              >
                <MdDelete />
              </button>
            </div>
          )
        })}
      </div>

      {alerts.length > 5 && (
        <div className={styles.footer}>
          <span className={styles.footerText}>
            +{alerts.length - 5} more alerts
          </span>
        </div>
      )}
    </div>
  )
}

export default AlertsCard
