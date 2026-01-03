import { useState } from 'react'
import styles from './TwoFactorModal.module.css'

function TwoFactorModal({ isOpen, onClose, onVerify, loading }) {
  const [code, setCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (code.length !== 6 && !useBackupCode) {
      setError('Please enter a 6-digit code')
      return
    }
    if (code.length < 6 && useBackupCode) {
      setError('Please enter a valid backup code')
      return
    }
    setError('')
    onVerify(code, useBackupCode)
  }

  const handleCodeChange = (e) => {
    const value = useBackupCode ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(value)
    setError('')
  }

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode)
    setCode('')
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Two-Factor Authentication</h2>
          <p>
            {useBackupCode 
              ? 'Enter one of your backup recovery codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.codeInput}>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder={useBackupCode ? 'Backup code' : '000000'}
              className={styles.input}
              maxLength={useBackupCode ? 20 : 6}
              autoFocus
              disabled={loading}
              aria-label={useBackupCode ? 'Backup code' : 'Verification code'}
            />
          </div>

          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.verifyBtn}
              disabled={loading || code.length < 6}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={toggleBackupCode}
              className={styles.switchBtn}
              disabled={loading}
            >
              {useBackupCode 
                ? '← Use authenticator app' 
                : 'Use backup code instead →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TwoFactorModal
