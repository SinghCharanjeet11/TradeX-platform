import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
import FormInput from '../components/FormInput'
import Button from '../components/Button'
import AuthLoadingTransition from '../components/AuthLoadingTransition'
import TwoFactorModal from '../components/auth/TwoFactorModal'
import GitHubLink from '../components/GitHubLink'
import styles from './SignInPage.module.css'

function SignInPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLoadingTransition, setShowLoadingTransition] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [oauthError, setOauthError] = useState(null)

  // Check for OAuth errors in URL
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      const errorMessages = {
        'invalid_state': 'Authentication session expired. Please try again.',
        'auth_failed': 'Authentication failed. Please try again.',
        'access_denied': 'Access was denied. Please try again.'
      }
      setOauthError(errorMessages[error] || 'Authentication failed. Please try again.')
    }
  }, [searchParams])

  // DO NOT auto-redirect authenticated users - they need to sign in fresh per tab
  // The session flag check happens in AuthenticatedLayout

  const validateEmail = (value) => {
    if (!value) return 'Email is required'
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/.test(value)) return 'Please enter a valid email address'
    return ''
  }

  const validatePassword = (value) => {
    if (!value) return 'Password is required'
    return ''
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Real-time validation
    let error = ''
    if (field === 'email') error = validateEmail(value)
    if (field === 'password') error = validatePassword(value)
    
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate all fields
    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)
    
    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      })
      
      // Check if 2FA is required
      if (response.requires2FA) {
        setShow2FAModal(true)
        setIsSubmitting(false)
        return
      }
      
      // Set session flag BEFORE showing loading transition - this is critical
      sessionStorage.setItem('sessionActive', 'true')
      sessionStorage.setItem('justSignedIn', 'true')
      
      // Success - show loading transition then redirect
      setShowLoadingTransition(true)
    } catch (error) {
      // Show error message
      alert(error.message || 'Failed to sign in')
      setIsSubmitting(false)
    }
  }

  const handle2FAVerify = async (code, isBackupCode) => {
    setTwoFactorLoading(true)
    
    try {
      await login({
        email: formData.email,
        password: formData.password,
        totpCode: isBackupCode ? undefined : code,
        backupCode: isBackupCode ? code : undefined,
        rememberMe: formData.rememberMe
      })
      
      // Set session flag BEFORE showing loading transition
      sessionStorage.setItem('sessionActive', 'true')
      sessionStorage.setItem('justSignedIn', 'true')
      
      // Success - show loading transition then redirect
      setShow2FAModal(false)
      setShowLoadingTransition(true)
    } catch (error) {
      alert(error.message || 'Invalid verification code')
      setTwoFactorLoading(false)
    }
  }

  const handle2FAClose = () => {
    setShow2FAModal(false)
    setIsSubmitting(false)
  }

  const handleLoadingComplete = () => {
    // Session flags already set in handleSubmit/handle2FAVerify
    // Get redirect destination or default to dashboard
    const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard'
    sessionStorage.removeItem('redirectAfterLogin')
    navigate(redirectTo)
  }


  const isFormValid = () => {
    return formData.email && 
           formData.password &&
           !errors.email && 
           !errors.password
  }

  if (showLoadingTransition) {
    return <AuthLoadingTransition onComplete={handleLoadingComplete} />
  }

  return (
    <div className={styles.container}>
      <Header />
      
      <div className={styles.content}>
        <div className={styles.leftSection}>
          <div className={styles.formContainer}>
            <h2 className={styles.formTitle}>Sign In</h2>
            
            {oauthError && (
              <div className={styles.errorBanner}>
                {oauthError}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <FormInput
                type="email"
                name="email"
                value={formData.email}
                placeholder="Email"
                error={errors.email}
                onChange={(value) => handleInputChange('email', value)}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <FormInput
                type="password"
                name="password"
                value={formData.password}
                placeholder="Password"
                helperText="Use your account password. Keep it private."
                error={errors.password}
                onChange={(value) => handleInputChange('password', value)}
              />

              <div className={styles.options}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>Remember me</span>
                </label>
                
                <span 
                  onClick={() => navigate('/forgot-password')} 
                  className={styles.forgotLink}
                >
                  Forgot password?
                </span>
              </div>

              <Button
                type="submit"
                text="Sign In"
                isLoading={isSubmitting}
                disabled={!isFormValid()}
              />
            </form>

          </div>
        </div>

        <div className={styles.rightSection}>
          <h1 className={styles.title}>WELCOME BACK</h1>
          <p className={styles.subtitle}>
            Access your TradeX account to manage portfolios and continue trading with secure sign-in.
          </p>
        </div>
      </div>

      <TwoFactorModal
        isOpen={show2FAModal}
        onClose={handle2FAClose}
        onVerify={handle2FAVerify}
        loading={twoFactorLoading}
      />

      <GitHubLink />
    </div>
  )
}

export default SignInPage
