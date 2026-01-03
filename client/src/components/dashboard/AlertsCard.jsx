import { useState } from 'react'
import { MdNotifications, MdDelete, MdTrendingUp, MdTrendingDown, MdCheckCircle, MdAccessTime } from 'react-icons/md'
import useDashboardData from '../../hooks/useDashboardData'
import watchlistService from '../../services/watchlistService'
import portfolioService from '../../services/portfolioService'
import styles from './AlertsCard.module.css'

function AlertsCard() {
  const { alerts, removeAlertItem, refreshAlerts } = useDashboardData()
  const [deleting, setDeleting] = useState(null)

  const handleDelete = async (e, alertId) => {
    e.stopPropagation()
    
    if (deleting) return

    try {
      setDeleting(alertId)
      
      // Optimistic update: remove item from UI immediately
      removeAlertItem(alertId)
      
      // Call API to delete (in background)
      await watchlistService.deleteAlert(alertId)
      
      // No need to refresh - optimistic update already handled it
      // Background refresh will sync on next poll cycle
    } catch (error) {
      console.error('Error deleting alert:', error)
      // On error, refresh to restore correct state from server
      await refreshAlerts()
    } finally {
      setDeleting(null)
    }
  }

  const calculateProgress = (alert) => {
    if (!alert.currentPrice || !alert.targetPrice) return 0
    
    const current = parseFloat(alert.currentPrice)
    const target = parseFloat(alert.targetPrice)
    const initial = parseFloat(alert.initialPrice || current)
    
    // For "above" alerts: progress increases as price goes up toward target
    // For "below" alerts: progress increases as price goes down toward target
    if (alert.condition === 'above') {
      if (current >= target) return 100 // Target reached
      if (initial >= target) return 100 // Already above target when created
      
      // Calculate how far we've moved from initial to target
      const totalDistance = target - initial
      const currentDistance = current - initial
      const progress = (currentDistance / totalDistance) * 100
      
      return Math.max(0, Math.min(100, progress))
    } else {
      // condition === 'below'
      if (current <= target) return 100 // Target reached
      if (initial <= target) return 100 // Already below target when created
      
      // Calculate how far we've moved from initial to target
      const totalDistance = initial - target
      const currentDistance = initial - current
      const progress = (currentDistance / totalDistance) * 100
      
      return Math.max(0, Math.min(100, progress))
    }
  }

  const getAlertStatus = (alert) => {
    if (alert.triggered) return 'triggered'
    
    const progress = calculateProgress(alert)
    if (progress >= 90) return 'near'
    return 'active'
  }

  if (alerts.loading) {
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

  // Safely access alerts data
  const alertsData = alerts.data || [];

  if (alertsData.length === 0) {
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

  // Show all items (scrollable list)
  const displayedAlerts = alertsData

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <MdNotifications className={styles.headerIcon} />
          <h3>Price Alerts</h3>
          <span className={styles.count}>{alertsData.length}</span>
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
    </div>
  )
}

export default AlertsCard
