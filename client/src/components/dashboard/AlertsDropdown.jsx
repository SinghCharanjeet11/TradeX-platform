import { useState, useRef, useEffect } from 'react';
import { 
  MdNotifications, 
  MdWarning, 
  MdInfo, 
  MdError,
  MdTrendingUp,
  MdSettings,
  MdCheckCircle
} from 'react-icons/md';
import styles from './AlertsDropdown.module.css';

function AlertsDropdown({ alerts = [], unreadCount = 0, onMarkAsRead, onConfigure }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleAlertClick = (alert) => {
    if (!alert.read && onMarkAsRead) {
      onMarkAsRead(alert.id);
    }
  };

  const handleConfigure = () => {
    setIsOpen(false);
    if (onConfigure) {
      onConfigure();
    }
  };

  const getAlertIcon = (alertType, severity) => {
    if (alertType === 'anomaly') {
      return severity === 'high' ? <MdError /> : <MdWarning />;
    }
    if (alertType === 'signal') {
      return <MdTrendingUp />;
    }
    return <MdInfo />;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return styles.severityHigh;
      case 'medium':
        return styles.severityMedium;
      case 'low':
        return styles.severityLow;
      default:
        return '';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.alertsDropdown} ref={dropdownRef}>
      <button 
        className={styles.alertButton}
        onClick={handleToggle}
        title="Notifications"
      >
        <MdNotifications />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <span className={styles.unreadCount}>{unreadCount} new</span>
            )}
          </div>

          <div className={styles.alertList}>
            {alerts.length === 0 ? (
              <div className={styles.emptyState}>
                <MdCheckCircle />
                <p>No alerts</p>
                <span>You're all caught up!</span>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`${styles.alertItem} ${!alert.read ? styles.unread : ''} ${getSeverityColor(alert.severity)}`}
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className={styles.alertIcon}>
                    {getAlertIcon(alert.alertType, alert.severity)}
                  </div>
                  <div className={styles.alertContent}>
                    <div className={styles.alertHeader}>
                      <span className={styles.alertSymbol}>{alert.symbol}</span>
                      <span className={styles.alertTime}>
                        {formatTimestamp(alert.createdAt)}
                      </span>
                    </div>
                    <h4 className={styles.alertTitle}>{alert.title}</h4>
                    <p className={styles.alertMessage}>{alert.message}</p>
                    {alert.recommendedAction && (
                      <div className={styles.recommendedAction}>
                        <MdInfo />
                        <span>{alert.recommendedAction}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.footer}>
            <button 
              className={styles.footerButton}
              onClick={handleConfigure}
            >
              <MdSettings />
              <span>Configure</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlertsDropdown;
