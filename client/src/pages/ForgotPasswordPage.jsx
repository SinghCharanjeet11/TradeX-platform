import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import FormInput from '../components/FormInput'
import Button from '../components/Button'
import styles from './ForgotPasswordPage.module.css'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const validateEmail = (value) => {
    if (!value) return 'Email is required'
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/.test(value)) return 'Please enter a valid email address'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    setIsSubmitting(true)
    
    try {
      const { authAPI } = await import('../services/api')
      await authAPI.forgotPassword(email)
      setIsSubmitting(false)
      setSuccess(true)
    } catch (error) {
      alert(error.message || 'Failed to send reset email')
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.content}>
          <div className={styles.successMessage}>
            <h2>Check Your Email</h2>
            <p>We've sent a password reset link to {email}</p>
            <Button text="Back to Sign In" onClick={() => navigate('/signin')} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.content}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Forgot Password?</h2>
          <p className={styles.description}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <form onSubmit={handleSubmit}>
            <FormInput
              type="email"
              name="email"
              value={email}
              placeholder="Email"
              error={error}
              onChange={(value) => {
                setEmail(value)
                setError(validateEmail(value))
              }}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            <Button
              type="submit"
              text="Send Reset Link"
              isLoading={isSubmitting}
              disabled={!email || !!error}
            />
          </form>

          <p className={styles.backLink}>
            <span onClick={() => navigate('/signin')} className={styles.link}>
              ← Back to Sign In
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
