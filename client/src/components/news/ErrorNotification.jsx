import { useState, useEffect } from 'react';
import styles from './ErrorNotification.module.css';

const ERROR_TYPES = {
  TIMEOUT: 'timeout',
  OFFLINE: 'offline',
  INVALID_DATA: 'invalid_data',
  GENERAL: 'general'
};

const ERROR_MESSAGES = {
  [ERROR_TYPES.TIMEOUT]: {
    title: 'Connection Timeout',
    message: 'The request took too long to complete. We\'ll retry automatically.',
    icon: '⏱️'
  },
  [ERROR_TYPES.OFFLINE]: {
    title: 'No Internet Connection',
    message: 'Please check your internet connection and try again.',
    icon: '📡'
  },
  [ERROR_TYPES.INVALID_DATA]: {
    title: 'Data Error',
    message: 'Received invalid data from the server. This has been logged.',
    icon: '⚠️'
  },
  [ERROR_TYPES.GENERAL]: {
    title: 'Error Loading News',
    message: 'Something went wrong while loading news. Please try again.',
    icon: '❌'
  }
};

const PERSIST_DURATION = 5 * 60 * 1000; // 5 minutes

export default function ErrorNotification({ 
  error, 
  type = ERROR_TYPES.GENERAL, 
  onRetry, 
  onDismiss,
  retryCount = 0,
  maxRetries = 3
}) {
  const [countdown, setCountdown] = useState(30);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!error) return;

    // Auto-dismiss after persist duration
    const dismissTimer = setTimeout(() => {
      onDismiss?.();
    }, PERSIST_DURATION);

    // Countdown for auto-retry
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          if (retryCount < maxRetries && type === ERROR_TYPES.TIMEOUT) {
            handleRetry();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(dismissTimer);
      clearInterval(countdownInterval);
    };
  }, [error, retryCount, maxRetries, type, onDismiss]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry?.();
    } finally {
      setIsRetrying(false);
    }
  };

  if (!error) return null;

  const errorInfo = ERROR_MESSAGES[type] || ERROR_MESSAGES[ERROR_TYPES.GENERAL];
  const canRetry = retryCount < maxRetries;

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <div className={styles.header}>
        <span className={`${styles.icon} ${type === ERROR_TYPES.OFFLINE ? styles.warning : styles.error}`}>
          {errorInfo.icon}
        </span>
        <h3 className={styles.title}>{errorInfo.title}</h3>
      </div>
      
      <p className={styles.message}>
        {errorInfo.message}
        {retryCount > 0 && ` (Attempt ${retryCount + 1}/${maxRetries + 1})`}
      </p>

      <div className={styles.actions}>
        {canRetry && onRetry && (
          <button 
            className={styles.retryButton}
            onClick={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? 'Retrying...' : 'Retry Now'}
          </button>
        )}
        <button className={styles.dismissButton} onClick={onDismiss}>
          Dismiss
        </button>
      </div>

      {canRetry && type === ERROR_TYPES.TIMEOUT && countdown > 0 && (
        <div className={styles.countdown}>
          Auto-retry in {countdown}s
        </div>
      )}
    </div>
  );
}

export { ERROR_TYPES };
