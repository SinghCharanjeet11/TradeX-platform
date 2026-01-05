import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdPerson, MdSecurity, MdNotifications, MdPalette, MdPrivacyTip, MdSave, MdLink, MdArrowBack, MdCameraAlt, MdCheckCircle, MdInfo, MdVerified } from 'react-icons/md'
import { useThemeContext } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import ConnectedAccounts from '../components/dashboard/ConnectedAccounts'
import ConnectAccountModal from '../components/dashboard/ConnectAccountModal'
import TwoFactorSetup from '../components/security/TwoFactorSetup'
import SessionList from '../components/security/SessionList'
import FormInput from '../components/FormInput'
// Currency is fixed to USD only
import styles from './SettingsPage.module.css'

function SettingsPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useThemeContext()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [saveMessage, setSaveMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)
  const [emailVerified, setEmailVerified] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState(null)
  const fileInputRef = useRef(null)

  // Profile Settings
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    bio: ''
  })
  const [initialProfileData, setInitialProfileData] = useState({})

  // Security Settings
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  })
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Notification Settings
  const [notificationData, setNotificationData] = useState({
    emailNotifications: true,
    priceAlerts: true,
    newsUpdates: false,
    marketUpdates: true,
    tradingAlerts: true
  })

  // Appearance Settings (only theme is configurable, currency/language are fixed)
  const [appearanceData, setAppearanceData] = useState({})

  // Privacy Settings
  const [privacyData, setPrivacyData] = useState({
    profileVisibility: 'private',
    showEmail: false,
    showActivity: true,
    dataSharing: false
  })

  // Connected Accounts
  const [connectedAccounts, setConnectedAccounts] = useState([])
  const [showConnectModal, setShowConnectModal] = useState(false)

  // Validation functions
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validatePhone = (phone) => {
    const re = /^[\d\s\-\+\(\)]+$/
    return !phone || re.test(phone)
  }

  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++
    return strength
  }

  // Update password strength when new password changes
  useEffect(() => {
    if (securityData.newPassword) {
      setPasswordStrength(calculatePasswordStrength(securityData.newPassword))
    } else {
      setPasswordStrength(0)
    }
  }, [securityData.newPassword])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/signin', { replace: true })
    }
  }, [authLoading, isAuthenticated, navigate])

  // Load user data when authenticated
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return
      
      try {
        const userData = {
          username: user.username || '',
          email: user.email || '',
          fullName: user.fullName || '',
          phone: user.phone || '',
          bio: user.bio || ''
        }
        setProfileData(userData)
        setInitialProfileData(userData)
        setEmailVerified(user.emailVerified || false)
        setProfilePicturePreview(user.profilePicture || null)
        
        // Fetch connected accounts
        const { authAPI } = await import('../services/api')
        const accountsResponse = await authAPI.getConnectedAccounts()
        if (accountsResponse.success) {
          setConnectedAccounts(accountsResponse.accounts || [])
        }
        
        setLoading(false)
      } catch (error) {
        console.error('[Settings] Error loading user data:', error)
        setLoading(false)
      }
    }

    loadUserData()
  }, [user])
  
  // Track unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(profileData) !== JSON.stringify(initialProfileData)
    setHasUnsavedChanges(hasChanges || profilePicture !== null)
  }, [profileData, initialProfileData, profilePicture])
  
  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (activeTab === 'profile') handleSaveProfile()
        else if (activeTab === 'security') handleSaveSecurity()
        else if (activeTab === 'notifications') handleSaveNotifications()
        else if (activeTab === 'appearance') handleSaveAppearance()
        else if (activeTab === 'privacy') handleSavePrivacy()
      }
      
      // Arrow keys to navigate tabs
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault() // Prevent page scrolling
        const tabs = ['profile', 'security', 'connections', 'notifications', 'appearance', 'privacy']
        const currentIndex = tabs.indexOf(activeTab)
        if (e.key === 'ArrowDown' && currentIndex < tabs.length - 1) {
          setActiveTab(tabs[currentIndex + 1])
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
          setActiveTab(tabs[currentIndex - 1])
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab])
  
  // Handle profile picture upload
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSaveMessage('Image size must be less than 5MB')
        setTimeout(() => setSaveMessage(''), 3000)
        return
      }
      
      setProfilePicture(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    // Validate inputs
    const newErrors = {}
    
    if (!profileData.username || profileData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    
    if (!profileData.email || !validateEmail(profileData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (profileData.phone && !validatePhone(profileData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSaveMessage('Please fix the errors before saving')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }
    
    setErrors({})
    setSaving(true)
    
    try {
      const { authAPI } = await import('../services/api')
      
      // Upload profile picture if changed
      if (profilePicture) {
        const formData = new FormData()
        formData.append('profilePicture', profilePicture)
        // await authAPI.uploadProfilePicture(formData)
      }
      
      await authAPI.updateProfile(profileData)
      setInitialProfileData(profileData)
      setProfilePicture(null)
      setShowSuccessAnimation(true)
      setSaveMessage('Profile updated successfully!')
      setTimeout(() => {
        setSaveMessage('')
        setShowSuccessAnimation(false)
      }, 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      setSaveMessage(error.response?.data?.message || 'Error updating profile')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSecurity = async () => {
    const newErrors = {}
    
    if (securityData.newPassword) {
      if (!securityData.currentPassword) {
        newErrors.currentPassword = 'Current password is required'
      }
      
      if (securityData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters'
      }
      
      if (securityData.newPassword !== securityData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
      
      if (passwordStrength < 3) {
        newErrors.newPassword = 'Password is too weak. Use a mix of uppercase, lowercase, numbers, and symbols'
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSaveMessage('Please fix the errors before saving')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }
    
    setErrors({})
    setSaving(true)
    
    try {
      const { authAPI } = await import('../services/api')
      await authAPI.updateSecurity(securityData)
      setSaveMessage('Security settings updated!')
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: securityData.twoFactorEnabled
      })
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error updating security:', error)
      setSaveMessage(error.response?.data?.message || 'Error updating security settings')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      console.log('Saving notifications:', notificationData)
      setSaveMessage('Notification preferences saved!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving notifications:', error)
    }
  }

  const handleSaveAppearance = async () => {
    try {
      // Theme is auto-saved via context, only save other appearance settings
      console.log('Saving appearance:', { theme, ...appearanceData })
      setShowSuccessAnimation(true)
      setSaveMessage('Appearance settings saved!')
      setTimeout(() => {
        setSaveMessage('')
        setShowSuccessAnimation(false)
      }, 3000)
    } catch (error) {
      console.error('Error saving appearance:', error)
      setSaveMessage('Error saving appearance settings')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const handleSavePrivacy = async () => {
    try {
      console.log('Saving privacy:', privacyData)
      setSaveMessage('Privacy settings saved!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving privacy:', error)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.'
    )
    
    if (!confirmed) return
    
    const doubleConfirm = window.confirm(
      'This is your final warning. Type "DELETE" in the next prompt to confirm account deletion.'
    )
    
    if (!doubleConfirm) return
    
    const userInput = window.prompt('Type DELETE to confirm account deletion:')
    
    if (userInput !== 'DELETE') {
      setSaveMessage('Account deletion cancelled - confirmation text did not match')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }
    
    try {
      const { authAPI } = await import('../services/api')
      await authAPI.deleteAccount()
      
      // Clear session and redirect to sign in
      sessionStorage.clear()
      localStorage.clear()
      navigate('/signin', { replace: true })
    } catch (error) {
      console.error('Error deleting account:', error)
      setSaveMessage(error.message || 'Error deleting account')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const handleDisconnectAccount = async (platform) => {
    try {
      const { authAPI } = await import('../services/api')
      const response = await authAPI.disconnectExternalAccount(platform)
      
      if (response.success) {
        // Remove the account from the list
        setConnectedAccounts(prev => prev.filter(acc => acc.platform !== platform))
        setSaveMessage(`Successfully disconnected from ${platform}`)
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error disconnecting account:', error)
      setSaveMessage('Error disconnecting account')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const handleRefreshAccount = async (accountId) => {
    try {
      const { authAPI } = await import('../services/api')
      await authAPI.refreshAccountData(accountId)
      setSaveMessage('Account data refreshed!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error refreshing account:', error)
    }
  }

  const handleConnectSuccess = async () => {
    try {
      const { authAPI } = await import('../services/api')
      const accountsResponse = await authAPI.getConnectedAccounts()
      if (accountsResponse.success) {
        setConnectedAccounts(accountsResponse.accounts || [])
      }
      setShowConnectModal(false)
      setSaveMessage('Account connected successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error fetching connected accounts:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className={styles.settingsPage}>
        <div className={styles.main}>
          <div className={styles.content}>
            <div className={styles.topBar}>
              <div className={`${styles.skeleton} ${styles.skeletonButton}`}></div>
            </div>
            
            <div className={styles.header}>
              <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{width: '200px', height: '32px'}}></div>
              <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{width: '300px', height: '14px', marginTop: '8px'}}></div>
            </div>

            <div className={styles.settingsLayout}>
              <div className={styles.tabsNav}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={`${styles.skeleton} ${styles.skeletonButton}`} style={{height: '50px'}}></div>
                ))}
              </div>

              <div className={styles.settingsContent}>
                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{width: '250px', height: '24px', marginBottom: '8px'}}></div>
                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{width: '400px', height: '14px', marginBottom: '32px'}}></div>
                
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`${styles.skeleton} ${styles.skeletonInput}`}></div>
                ))}
                
                <div className={`${styles.skeleton} ${styles.skeletonButton}`} style={{marginTop: '24px'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: MdPerson },
    { id: 'security', label: 'Security', icon: MdSecurity },
    { id: 'connections', label: 'Connected Accounts', icon: MdLink },
    { id: 'notifications', label: 'Notifications', icon: MdNotifications },
    { id: 'appearance', label: 'Appearance', icon: MdPalette },
    { id: 'privacy', label: 'Privacy', icon: MdPrivacyTip }
  ]

  return (
    <div className={styles.settingsPage}>
      <div className={styles.main}>
        <div className={styles.content}>
          <div className={styles.topBar}>
            <div className={styles.header}>
              <h1 className={styles.pageTitle}>Settings</h1>
              <p className={styles.subtitle}>
                Manage your account settings and preferences
                <span className={styles.keyboardHint}>
                  <kbd>Ctrl</kbd> + <kbd>S</kbd> to save • <kbd>↑</kbd> <kbd>↓</kbd> to navigate tabs
                </span>
              </p>
            </div>
            <button 
              className={styles.backButton} 
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    navigate('/dashboard')
                  }
                } else {
                  navigate('/dashboard')
                }
              }}
              aria-label="Back to dashboard"
            >
              <MdArrowBack aria-hidden="true" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          {saveMessage && (
            <div className={`${styles.saveMessage} ${showSuccessAnimation ? styles.successAnimation : ''}`}>
              {showSuccessAnimation && <MdCheckCircle className={styles.successIcon} />}
              {saveMessage}
            </div>
          )}
          
          {hasUnsavedChanges && (
            <div className={styles.unsavedWarning}>
              <MdInfo />
              <span>You have unsaved changes</span>
            </div>
          )}

          <div className={styles.settingsLayout}>
            {/* Tabs Navigation */}
            <div className={styles.tabsNav} role="tablist" aria-label="Settings sections">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-label={`${tab.label} settings`}
                  >
                    <Icon aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Settings Content */}
            <div className={styles.settingsContent} role="tabpanel" aria-label={`${activeTab} settings`}>
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Profile Information</h2>
                  <p className={styles.sectionDesc}>Update your personal information</p>

                  {/* Profile Picture Upload */}
                  <div className={styles.profilePictureSection}>
                    <div className={styles.profilePictureWrapper}>
                      <div className={styles.profilePicture}>
                        {profilePicturePreview ? (
                          <img src={profilePicturePreview} alt="Profile" />
                        ) : (
                          <div className={styles.profilePlaceholder}>
                            <MdPerson />
                          </div>
                        )}
                        <button 
                          className={styles.uploadButton}
                          onClick={() => fileInputRef.current?.click()}
                          type="button"
                          aria-label="Upload profile picture"
                        >
                          <MdCameraAlt />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          style={{ display: 'none' }}
                        />
                      </div>
                      <div className={styles.profilePictureInfo}>
                        <h3>Profile Picture</h3>
                        <p>JPG, PNG or GIF. Max size 5MB</p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Username *</label>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => {
                        setProfileData({...profileData, username: e.target.value})
                        if (errors.username) setErrors({...errors, username: null})
                      }}
                      placeholder="Enter username"
                      className={errors.username ? styles.inputError : ''}
                      aria-label="Username"
                      aria-required="true"
                      aria-invalid={!!errors.username}
                    />
                    {errors.username && <span className={styles.errorText} role="alert">{errors.username}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      Email Address *
                      {emailVerified && (
                        <span className={styles.verifiedBadge}>
                          <MdVerified /> Verified
                        </span>
                      )}
                    </label>
                    <div className={styles.inputWithTooltip}>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => {
                          setProfileData({...profileData, email: e.target.value})
                          if (errors.email) setErrors({...errors, email: null})
                        }}
                        placeholder="Enter email"
                        className={errors.email ? styles.inputError : ''}
                        aria-label="Email address"
                      />
                      <button
                        type="button"
                        className={styles.tooltipTrigger}
                        onMouseEnter={() => setActiveTooltip('email')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onFocus={() => setActiveTooltip('email')}
                        onBlur={() => setActiveTooltip(null)}
                        aria-label="Email information"
                      >
                        <MdInfo />
                      </button>
                      {activeTooltip === 'email' && (
                        <div className={styles.tooltip}>
                          Your email is used for account recovery and important notifications
                        </div>
                      )}
                    </div>
                    {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                      placeholder="Enter full name"
                      aria-label="Full name"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => {
                        setProfileData({...profileData, phone: e.target.value})
                        if (errors.phone) setErrors({...errors, phone: null})
                      }}
                      placeholder="Enter phone number"
                      className={errors.phone ? styles.inputError : ''}
                      aria-label="Phone number"
                      aria-invalid={!!errors.phone}
                    />
                    {errors.phone && <span className={styles.errorText} role="alert">{errors.phone}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      placeholder="Tell us about yourself"
                      rows="4"
                      aria-label="Bio"
                    />
                  </div>

                  <button 
                    className={styles.saveBtn} 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    aria-label="Save profile changes"
                  >
                    {saving ? (
                      <>
                        <div className={styles.spinner} aria-hidden="true"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <MdSave aria-hidden="true" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Connected Accounts */}
              {activeTab === 'connections' && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionTitle}>Connected Accounts</h2>
                      <p className={styles.sectionDesc}>Link your Binance account to view your portfolio and track real-time changes all in one place.</p>
                    </div>
                    <button 
                      className={styles.connectBtn}
                      onClick={() => setShowConnectModal(true)}
                      aria-label="Connect new account"
                    >
                      + Connect Account
                    </button>
                  </div>

                  {connectedAccounts.length > 0 ? (
                    <ConnectedAccounts 
                      accounts={connectedAccounts}
                      onDisconnect={handleDisconnectAccount}
                      onRefresh={handleRefreshAccount}
                    />
                  ) : (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>
                        <MdLink />
                      </div>
                      <h3>No Accounts Connected</h3>
                      <p>Get started by connecting your first trading account to track your portfolio in real-time.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Security Settings</h2>
                  <p className={styles.sectionDesc}>Manage your password and security preferences</p>

                  <FormInput
                    type="password"
                    name="currentPassword"
                    value={securityData.currentPassword}
                    placeholder="Current Password"
                    error={errors.currentPassword}
                    onChange={(value) => {
                      setSecurityData({...securityData, currentPassword: value})
                      if (errors.currentPassword) setErrors({...errors, currentPassword: null})
                    }}
                  />

                  <FormInput
                    type="password"
                    name="newPassword"
                    value={securityData.newPassword}
                    placeholder="New Password"
                    error={errors.newPassword}
                    onChange={(value) => {
                      setSecurityData({...securityData, newPassword: value})
                      if (errors.newPassword) setErrors({...errors, newPassword: null})
                    }}
                  />
                  {securityData.newPassword && (
                    <div className={styles.passwordStrength}>
                      <div className={styles.strengthBar}>
                        <div 
                          className={`${styles.strengthFill} ${styles[`strength${passwordStrength}`]}`}
                          style={{width: `${(passwordStrength / 5) * 100}%`}}
                        ></div>
                      </div>
                      <span className={styles.strengthText}>
                        {passwordStrength === 0 && 'Very Weak'}
                        {passwordStrength === 1 && 'Weak'}
                        {passwordStrength === 2 && 'Fair'}
                        {passwordStrength === 3 && 'Good'}
                        {passwordStrength === 4 && 'Strong'}
                        {passwordStrength === 5 && 'Very Strong'}
                      </span>
                    </div>
                  )}

                  <FormInput
                    type="password"
                    name="confirmPassword"
                    value={securityData.confirmPassword}
                    placeholder="Confirm New Password"
                    error={errors.confirmPassword}
                    onChange={(value) => {
                      setSecurityData({...securityData, confirmPassword: value})
                      if (errors.confirmPassword) setErrors({...errors, confirmPassword: null})
                    }}
                  />

                  <button 
                    className={styles.saveBtn} 
                    onClick={handleSaveSecurity}
                    disabled={saving}
                    aria-label="Update security settings"
                  >
                    {saving ? (
                      <>
                        <div className={styles.spinner} aria-hidden="true"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <MdSave aria-hidden="true" /> Update Password
                      </>
                    )}
                  </button>

                  {/* Two-Factor Authentication Section */}
                  <div style={{ marginTop: '32px' }}>
                    <TwoFactorSetup />
                  </div>

                  {/* Session Management Section */}
                  <div style={{ marginTop: '32px' }}>
                    <SessionList />
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Notification Preferences</h2>
                  <p className={styles.sectionDesc}>Choose what notifications you want to receive</p>

                  <div className={styles.toggleGroup}>
                    <div className={styles.toggleInfo}>
                      <h3>
                        Email Notifications
                        <button
                          type="button"
                          className={styles.inlineTooltipTrigger}
                          onMouseEnter={() => setActiveTooltip('emailNotif')}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onFocus={() => setActiveTooltip('emailNotif')}
                          onBlur={() => setActiveTooltip(null)}
                          aria-label="Email notifications information"
                        >
                          <MdInfo />
                        </button>
                        {activeTooltip === 'emailNotif' && (
                          <div className={styles.tooltip}>
                            Receive important account updates and notifications via email
                          </div>
                        )}
                      </h3>
                      <p>Receive updates via email</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationData.emailNotifications}
                        onChange={(e) => setNotificationData({...notificationData, emailNotifications: e.target.checked})}
                        aria-label="Enable email notifications"
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>

                  <div className={styles.toggleGroup}>
                    <div className={styles.toggleInfo}>
                      <h3>
                        Price Alerts
                        <button
                          type="button"
                          className={styles.inlineTooltipTrigger}
                          onMouseEnter={() => setActiveTooltip('priceAlerts')}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onFocus={() => setActiveTooltip('priceAlerts')}
                          onBlur={() => setActiveTooltip(null)}
                          aria-label="Price alerts information"
                        >
                          <MdInfo />
                        </button>
                        {activeTooltip === 'priceAlerts' && (
                          <div className={styles.tooltip}>
                            Get instant notifications when your watched assets reach target prices
                          </div>
                        )}
                      </h3>
                      <p>Get notified when prices hit your targets</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationData.priceAlerts}
                        onChange={(e) => setNotificationData({...notificationData, priceAlerts: e.target.checked})}
                        aria-label="Enable price alerts"
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>

                  <div className={styles.toggleGroup}>
                    <div className={styles.toggleInfo}>
                      <h3>News Updates</h3>
                      <p>Stay informed with latest market news</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationData.newsUpdates}
                        onChange={(e) => setNotificationData({...notificationData, newsUpdates: e.target.checked})}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>

                  <div className={styles.toggleGroup}>
                    <div className={styles.toggleInfo}>
                      <h3>Market Updates</h3>
                      <p>Receive real-time market updates</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationData.marketUpdates}
                        onChange={(e) => setNotificationData({...notificationData, marketUpdates: e.target.checked})}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>

                  <div className={styles.toggleGroup}>
                    <div className={styles.toggleInfo}>
                      <h3>Trading Alerts</h3>
                      <p>Get alerts for your trading activities</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationData.tradingAlerts}
                        onChange={(e) => setNotificationData({...notificationData, tradingAlerts: e.target.checked})}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>

                  <button 
                    className={styles.saveBtn} 
                    onClick={handleSaveNotifications}
                    aria-label="Save notification preferences"
                  >
                    <MdSave aria-hidden="true" /> Save Preferences
                  </button>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Appearance</h2>
                  <p className={styles.sectionDesc}>Customize how TradeX looks for you</p>

                  <div className={styles.formGroup}>
                    <label>
                      Theme
                      <button
                        type="button"
                        className={styles.inlineTooltipTrigger}
                        onMouseEnter={() => setActiveTooltip('theme')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onFocus={() => setActiveTooltip('theme')}
                        onBlur={() => setActiveTooltip(null)}
                        aria-label="Theme information"
                      >
                        <MdInfo />
                      </button>
                      {activeTooltip === 'theme' && (
                        <div className={styles.tooltip}>
                          Choose between dark, light, or auto mode (follows system preference). Changes apply instantly!
                        </div>
                      )}
                    </label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      aria-label="Select theme"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="auto">Auto (System)</option>
                    </select>
                    <small className={styles.helpText}>Theme is saved automatically and applies to the entire website</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Currency Preference</label>
                    <select
                      value="USD"
                      disabled
                      className={styles.currencySelect}
                    >
                      <option value="USD">USD ($) - US Dollar</option>
                    </select>
                    <small className={styles.helpText}>All prices and values will be displayed in your selected currency</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Language</label>
                    <select
                      value="en"
                      disabled
                    >
                      <option value="en">English</option>
                    </select>
                  </div>

                  <button 
                    className={styles.saveBtn} 
                    onClick={handleSaveAppearance}
                    aria-label="Save appearance settings"
                  >
                    <MdSave aria-hidden="true" /> Save Appearance
                  </button>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Privacy & Data</h2>
                  <p className={styles.sectionDesc}>Control your privacy and data sharing</p>

                  <div className={styles.formGroup}>
                    <label>
                      Profile Visibility
                      <button
                        type="button"
                        className={styles.inlineTooltipTrigger}
                        onMouseEnter={() => setActiveTooltip('visibility')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onFocus={() => setActiveTooltip('visibility')}
                        onBlur={() => setActiveTooltip(null)}
                        aria-label="Profile visibility information"
                      >
                        <MdInfo />
                      </button>
                      {activeTooltip === 'visibility' && (
                        <div className={styles.tooltip}>
                          Control who can see your profile and trading activity
                        </div>
                      )}
                    </label>
                    <select
                      value={privacyData.profileVisibility}
                      onChange={(e) => setPrivacyData({...privacyData, profileVisibility: e.target.value})}
                      aria-label="Select profile visibility"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="friends">Friends Only</option>
                    </select>
                  </div>

                  <div className={styles.toggleGroup}>
                    <div className={styles.toggleInfo}>
                      <h3>Show Email Address</h3>
                      <p>Make your email visible to others</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={privacyData.showEmail}
                        onChange={(e) => setPrivacyData({...privacyData, showEmail: e.target.checked})}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>

                  <div className={styles.toggleGroup}>
                    <div className={styles.toggleInfo}>
                      <h3>Show Activity Status</h3>
                      <p>Let others see when you're active</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={privacyData.showActivity}
                        onChange={(e) => setPrivacyData({...privacyData, showActivity: e.target.checked})}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>

                  <div className={styles.toggleGroup}>
                    <div className={styles.toggleInfo}>
                      <h3>Data Sharing</h3>
                      <p>Share anonymous data to improve TradeX</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={privacyData.dataSharing}
                        onChange={(e) => setPrivacyData({...privacyData, dataSharing: e.target.checked})}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>

                  <button 
                    className={styles.saveBtn} 
                    onClick={handleSavePrivacy}
                    aria-label="Save privacy settings"
                  >
                    <MdSave aria-hidden="true" /> Save Privacy Settings
                  </button>

                  <div className={styles.dangerZone}>
                    <h3>Danger Zone</h3>
                    <button 
                      className={styles.dangerBtn}
                      onClick={handleDeleteAccount}
                      aria-label="Delete account"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}


            </div>
          </div>
        </div>
      </div>

      {showConnectModal && (
        <ConnectAccountModal 
          onClose={() => setShowConnectModal(false)}
          onSuccess={handleConnectSuccess}
        />
      )}
    </div>
  )
}

export default SettingsPage
