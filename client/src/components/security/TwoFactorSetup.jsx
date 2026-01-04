import { useState, useEffect } from 'react'
import api from '../../services/api'
import styles from './TwoFactorSetup.module.css'

function TwoFactorSetup() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  useEffect(() => {
    checkTwoFactorStatus()
  }, [])

  const checkTwoFactorStatus = async () => {
    try {
      const response = await api.get('/auth/2fa/status')
      // Handle nested data structure from API
      const data = response.data.data || response.data
      setIsEnabled(data.enabled || false)
    } catch (error) {
      console.error('Error checking 2FA status:', error)
    }
  }

  const generateQRCode = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await api.post('/auth/2fa/setup')
      // Handle nested data structure from API
      const data = response.data.data || response.data
      setSecret(data.manualEntryKey || data.secret)
      setQrCodeUrl(data.qrCode)
    } catch (error) {
      setError(error.message || 'Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  const enableTwoFactor = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      console.log('[2FA] Enabling 2FA with code:', verificationCode)
      
      const response = await api.post('/auth/2fa/enable', {
        token: verificationCode
      })
      
      console.log('[2FA] Success! Backup codes received:', response.data.backupCodes?.length)
      
      setBackupCodes(response.data.backupCodes)
      setIsEnabled(true)
      setShowBackupCodes(true)
      setSuccess('Two-factor authentication enabled successfully!')
      setQrCodeUrl('')
      setSecret('')
      setVerificationCode('')
    } catch (error) {
      console.error('[2FA] Enable error:', error)
      setError(error.message || 'Failed to enable 2FA. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const disableTwoFactor = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication?')) {
      return
    }

    setLoading(true)
    setError('')
    
    try {
      await api.post('/auth/2fa/disable')
      
      setIsEnabled(false)
      setBackupCodes([])
      setShowBackupCodes(false)
      setSuccess('Two-factor authentication disabled successfully!')
    } catch (error) {
      setError(error.message || 'Failed to disable two-factor authentication')
    } finally {
      setLoading(false)
    }
  }

  const regenerateBackupCodes = async () => {
    if (!window.confirm('This will invalidate all existing backup codes. Continue?')) {
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await api.post('/auth/2fa/backup-codes/regenerate')
      
      setBackupCodes(response.data.backupCodes)
      setShowBackupCodes(true)
      setSuccess('Backup codes regenerated successfully!')
    } catch (error) {
      setError(error.message || 'Failed to regenerate backup codes')
    } finally {
      setLoading(false)
    }
  }

  const downloadBackupCodes = () => {
    const text = backupCodes.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tradex-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Two-Factor Authentication</h3>
        <p>Add an extra layer of security to your account</p>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {success && (
        <div className={styles.success}>
          {success}
        </div>
      )}

      {!isEnabled ? (
        <div className={styles.setup}>
          {!qrCodeUrl ? (
            <div className={styles.enableSection}>
              <div className={styles.info}>
                <h4>Enable Two-Factor Authentication</h4>
                <p>Secure your account with an authenticator app like Google Authenticator or Authy.</p>
              </div>
              <button
                onClick={generateQRCode}
                disabled={loading}
                className={styles.enableBtn}
              >
                {loading ? 'Generating...' : 'Set Up 2FA'}
              </button>
            </div>
          ) : (
            <div className={styles.qrSection}>
              <div className={styles.steps}>
                <h4>Setup Instructions</h4>
                <ol>
                  <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>Scan the QR code below with your authenticator app</li>
                  <li>Enter the 6-digit code from your app to verify</li>
                </ol>
              </div>
              
              <div className={styles.qrCode}>
                <img src={qrCodeUrl} alt="QR Code for 2FA setup" />
              </div>
              
              <div className={styles.verification}>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className={styles.codeInput}
                  maxLength={6}
                />
                <button
                  onClick={enableTwoFactor}
                  disabled={loading || verificationCode.length !== 6}
                  className={styles.verifyBtn}
                >
                  {loading ? 'Verifying...' : 'Enable 2FA'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.enabled}>
          <div className={styles.status}>
            <div className={styles.statusIcon}>✅</div>
            <div>
              <h4>Two-Factor Authentication Enabled</h4>
              <p>Your account is protected with 2FA</p>
            </div>
          </div>
          
          {showBackupCodes && backupCodes.length > 0 && (
            <div className={styles.backupCodes}>
              <h4>⚠️ Backup Codes</h4>
              <p>Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.</p>
              <div className={styles.codes}>
                {backupCodes.map((code, index) => (
                  <code key={index} className={styles.code}>{code}</code>
                ))}
              </div>
              <button onClick={downloadBackupCodes} className={styles.downloadBtn}>
                Download Backup Codes
              </button>
            </div>
          )}
          
          <div className={styles.actions}>
            <button
              onClick={regenerateBackupCodes}
              disabled={loading}
              className={styles.regenerateBtn}
            >
              {loading ? 'Regenerating...' : 'Regenerate Backup Codes'}
            </button>
            <button
              onClick={disableTwoFactor}
              disabled={loading}
              className={styles.disableBtn}
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TwoFactorSetup
