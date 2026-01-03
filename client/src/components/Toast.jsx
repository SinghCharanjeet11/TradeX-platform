import { useEffect, useState } from 'react'
import { MdClose, MdInfo, MdCheckCircle, MdWarning, MdError } from 'react-icons/md'
import styles from './Toast.module.css'

const ICONS = {
  info: MdInfo,
  success: MdCheckCircle,
  warning: MdWarning,
  error: MdError
}

function Toast({ id, type = 'info', title, message, duration = 5000, onClose }) {
  const [isExiting, setIsExiting] = useState(false)
  const Icon = ICONS[type] || MdInfo

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(id)
    }, 300) // Match animation duration
  }

  return (
    <div className={`${styles.toast} ${isExiting ? styles.exiting : ''}`}>
      <div className={`${styles.toastIcon} ${styles[type]}`}>
        <Icon />
      </div>
      <div className={styles.toastContent}>
        {title && <h4 className={styles.toastTitle}>{title}</h4>}
        <p className={styles.toastMessage}>{message}</p>
      </div>
      <button
        className={styles.toastClose}
        onClick={handleClose}
        aria-label="Close notification"
      >
        <MdClose />
      </button>
    </div>
  )
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null

  return (
    <div className={styles.toastContainer}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemove}
        />
      ))}
    </div>
  )
}

export { Toast, ToastContainer }
export default ToastContainer
