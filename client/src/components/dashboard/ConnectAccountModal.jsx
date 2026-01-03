import { useState, useEffect } from 'react'
import { MdClose, MdLink, MdCheckCircle, MdError } from 'react-icons/md'
import { SiBinance } from 'react-icons/si'
import styles from './ConnectAccountModal.module.css'

const SUPPORTED_PLATFORMS = [
  {
    id: 'binance',
    name: 'Binance',
    icon: SiBinance,
    description: 'Connect your Binance account to sync portfolio and trades',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'text', placeholder: 'Enter your Binance API Key' },
      { name: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Enter your Binance API Secret' }
    ]
  }
]

function ConnectAccountModal({ isOpen, onClose, onConnect }) {
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [formData, setFormData] = useState({})
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  // Modal doesn't need to handle scroll - parent component handles it
  // Just prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handlePlatformSelect = (platform) => {
    setSelectedPlatform(platform)
    setFormData({})
    setError('')
  }

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleConnect = async () => {
    console.log('Connect button clicked!')
    console.log('Selected platform:', selectedPlatform)
    console.log('Form data:', formData)
    
    setConnecting(true)
    setError('')

    try {
      // Validate all fields are filled
      const platform = SUPPORTED_PLATFORMS.find(p => p.id === selectedPlatform)
      console.log('Platform found:', platform)
      
      const missingFields = platform.fields.filter(field => !formData[field.name])
      console.log('Missing fields:', missingFields)
      
      if (missingFields.length > 0) {
        setError('Please fill in all required fields')
        setConnecting(false)
        return
      }

      console.log('Calling API to connect account...')
      
      // Trim all credential values to remove whitespace
      const trimmedCredentials = {}
      Object.keys(formData).forEach(key => {
        trimmedCredentials[key] = formData[key]?.trim()
      })
      
      console.log('Trimmed credentials:', { ...trimmedCredentials, apiSecret: '***' })
      
      // Call the API to connect the account
      const { authAPI } = await import('../../services/api')
      const response = await authAPI.connectExternalAccount({
        platform: selectedPlatform,
        credentials: trimmedCredentials
      })

      console.log('API response:', response)

      if (response.success) {
        console.log('Connection successful!')
        onConnect(selectedPlatform, response.account)
        onClose()
      } else {
        console.log('Connection failed:', response.message)
        setError(response.message || 'Failed to connect account')
      }
    } catch (err) {
      console.error('Error connecting account:', err)
      setError(err.message || 'Failed to connect account. Please check your credentials.')
    } finally {
      setConnecting(false)
    }
  }

  const handleBack = () => {
    setSelectedPlatform(null)
    setFormData({})
    setError('')
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            <MdLink /> Connect Trading Account
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <MdClose />
          </button>
        </div>

        <div className={styles.modalBody}>
          {!selectedPlatform ? (
            <>
              <p className={styles.description}>
                Connect your trading accounts to sync your portfolio, view real-time changes, and track your investments all in one place.
              </p>

              <div className={styles.platformsList}>
                {SUPPORTED_PLATFORMS.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <div
                      key={platform.id}
                      className={styles.platformCard}
                      onClick={() => handlePlatformSelect(platform.id)}
                    >
                      <div className={styles.platformIcon}>
                        <Icon />
                      </div>
                      <div className={styles.platformInfo}>
                        <h3>{platform.name}</h3>
                        <p>{platform.description}</p>
                      </div>
                      <div className={styles.connectArrow}>→</div>
                    </div>
                  )
                })}
              </div>

              <div className={styles.securityNote}>
                <MdCheckCircle />
                <div>
                  <strong>Your data is secure</strong>
                  <p>We use bank-level encryption to protect your credentials. We only request read-only access to your portfolio data.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <button className={styles.backBtn} onClick={handleBack}>
                ← Back to platforms
              </button>

              {(() => {
                const platform = SUPPORTED_PLATFORMS.find(p => p.id === selectedPlatform)
                const Icon = platform.icon
                return (
                  <>
                    <div className={styles.selectedPlatform}>
                      <Icon />
                      <h3>{platform.name}</h3>
                    </div>

                    <p className={styles.instructions}>
                      Enter your {platform.name} API credentials to connect your account. We'll only access your portfolio data and trade history.
                    </p>

                    {selectedPlatform === 'binance' && (
                      <div className={styles.helpBox}>
                        <strong>How to create Binance API keys:</strong>
                        <ol>
                          <li>Log in to Binance and go to API Management</li>
                          <li>Create a new API key with "Enable Reading" permission only</li>
                          <li>Copy both the API Key and Secret immediately (Secret is shown only once)</li>
                          <li>Paste them below without any extra spaces</li>
                        </ol>
                      </div>
                    )}

                    <div className={styles.form}>
                      {platform.fields.map((field) => (
                        <div key={field.name} className={styles.formGroup}>
                          <label>{field.label}</label>
                          {field.type === 'textarea' ? (
                            <textarea
                              className={styles.textarea}
                              placeholder={field.placeholder}
                              value={formData[field.name] || ''}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              rows={6}
                              spellCheck={false}
                            />
                          ) : (
                            <input
                              type={field.type}
                              placeholder={field.placeholder}
                              value={formData[field.name] || ''}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {error && (
                      <div className={styles.errorMessage}>
                        <MdError /> 
                        <div className={styles.errorText}>
                          {error.split(/\d\./).map((line, index) => {
                            if (index === 0 && !line.trim()) return null
                            return (
                              <div key={index}>
                                {index > 0 && `${index}. `}{line.trim()}
                              </div>
                            )
                          }).filter(Boolean)}
                        </div>
                      </div>
                    )}

                    <div className={styles.permissions}>
                      <h4>Permissions we'll request:</h4>
                      <ul>
                        <li>✓ Read portfolio balances</li>
                        <li>✓ Read trade history</li>
                        <li>✓ Read account information</li>
                        <li>✗ No withdrawal permissions</li>
                        <li>✗ No trading permissions</li>
                      </ul>
                    </div>

                    <div className={styles.modalActions}>
                      <button 
                        className={styles.cancelBtn} 
                        onClick={onClose}
                        disabled={connecting}
                      >
                        Cancel
                      </button>
                      <button 
                        className={styles.connectBtn} 
                        onClick={handleConnect}
                        disabled={connecting}
                      >
                        {connecting ? 'Connecting...' : 'Connect Account'}
                      </button>
                    </div>
                  </>
                )
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConnectAccountModal
