import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
import FormInput from '../components/FormInput'
import Button from '../components/Button'
import AuthLoadingTransition from '../components/AuthLoadingTransition'
import GitHubLink from '../components/GitHubLink'
import styles from './RegisterPage.module.css'

function RegisterPage() {
  const navigate = useNavigate()
  const { checkAuth } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLoadingTransition, setShowLoadingTransition] = useState(false)

  const validateUsername = (value) => {
    if (!value) return 'Username is required'
    if (value.length < 3) return 'Username must be at least 3 characters'
    if (value.length > 30) return 'Username must be less than 30 characters'
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username can only contain letters, numbers, hyphens, and underscores'
    return ''
  }

  const validateEmail = (value) => {
    if (!value) return 'Email is required'
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/.test(value)) return 'Please enter a valid email address'
    return ''
  }

  const validatePassword = (value) => {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    if (!/\d/.test(value)) return 'Password must include at least one number'
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must include at least one symbol'
    return ''
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Real-time validation
    let error = ''
    if (field === 'username') error = validateUsername(value)
    if (field === 'email') error = validateEmail(value)
    if (field === 'password') error = validatePassword(value)
    
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate all fields
    const usernameError = validateUsername(formData.username)
    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)
    
    if (usernameError || emailError || passwordError) {
      setErrors({
        username: usernameError,
        email: emailError,
        password: passwordError
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const { authAPI } = await import('../services/api')
      await authAPI.register(formData)
      
      // Set session flag BEFORE checking auth - this is critical
      sessionStorage.setItem('sessionActive', 'true')
      sessionStorage.setItem('justSignedIn', 'true')
      
      // Registration automatically logs the user in, so update auth context
      await checkAuth()
      
      // Success - show loading transition then redirect to dashboard
      setShowLoadingTransition(true)
    } catch (error) {
      // Show error message
      alert(error.message || 'Failed to create account')
      setIsSubmitting(false)
    }
  }

  const handleLoadingComplete = () => {
    // Session flags already set in handleSubmit
    navigate('/dashboard')
  }

  const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL
    }
    if (window.location.hostname === 'tradex-platform.onrender.com') {
      return 'https://tradex-api-zsyj.onrender.com'
    }
    return 'http://localhost:5000'
  }

  const handleGoogleLogin = async () => {
    try {
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/auth/oauth/google`)
      const data = await response.json()
      
      if (data.success && data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl
      } else {
        alert(data.error || 'Failed to initiate Google login')
      }
    } catch (error) {
      console.error('Google login error:', error)
      alert('Failed to initiate Google login')
    }
  }

  const isFormValid = () => {
    return formData.username && 
           formData.email && 
           formData.password &&
           !errors.username && 
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
          <h1 className={styles.title}>WELCOME!</h1>
          <p className={styles.subtitle}>
            We're delighted to have you here. If you need any assistance, feel free to reach out.
          </p>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.formContainer}>
            <h2 className={styles.formTitle}>Register</h2>
            
            <form onSubmit={handleSubmit}>
              <FormInput
                type="text"
                name="username"
                value={formData.username}
                placeholder="Username"
                helperText="Choose a unique handle for your trading profile."
                error={errors.username}
                onChange={(value) => handleInputChange('username', value)}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />

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
                helperText="8+ characters, include a number and symbol."
                error={errors.password}
                onChange={(value) => handleInputChange('password', value)}
              />

              <Button
                type="submit"
                text="Create Account"
                isLoading={isSubmitting}
                disabled={!isFormValid()}
              />
            </form>

            <div className={styles.divider}>
              <span>or continue with</span>
            </div>

            <div className={styles.socialButtons}>
              <button className={styles.socialBtn} onClick={handleGoogleLogin}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </div>

            <p className={styles.signInLink}>
              Already have an account?{' '}
              <span onClick={() => navigate('/signin')} className={styles.link}>
                Sign In
              </span>
            </p>
          </div>
        </div>
      </div>

      <GitHubLink />
    </div>
  )
}

export default RegisterPage
