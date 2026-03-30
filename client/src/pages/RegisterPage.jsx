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
