import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import FormInput from '../components/FormInput'
import Button from '../components/Button'
import styles from './ForgotPasswordPage.module.css'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { token } = useParams()
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const validatePassword = (value) => {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    if (!/\d/.test(value)) return 'Password must include at least one number'
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must include at least one symbol'
    return ''
  }

  const validateConfirmPassword = (value) => {
    if (!value) return 'Please confirm your password'
    if (value !== formData.password) return 'Passwords do not match'
    return ''
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    let error = ''
    if (field === 'password') error = validatePassword(value)
    if (field === 'confirmPassword') error = validateConfirmPassword(value)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const passwordError = validatePassword(formData.password)
    const confirmError = validateConfirmPassword(formData.confirmPassword)
    if (passwordError || confirmError) {
      setErrors({ password: passwordError, confirmPassword: confirmError })
      return
    }
    setIsSubmitting(true)
    try {
      const { authAPI } = await import('../services/api')
      await authAPI.resetPassword(token, formData.password)
      setSuccess(true)
    } catch (error) {
      alert(error.message || 'Failed to reset password. The link may have expired.')
      setIsSubmitting(false)
    }
  }

  const isFormValid = () =>
    formData.password && formData.confirmPassword && !errors.password && !errors.confirmPassword

  if (success) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.content}>
          <div className={styles.leftSection}>
            <div className={styles.successContainer}>
              <div className={styles.successIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2>Password Reset!</h2>
              <p>Your password has been updated successfully. You can now sign in with your new password.</p>
              <Button text="Sign In" onClick={() => navigate('/signin')} />
            </div>
          </div>
          <div className={styles.rightSection}>
            <h1 className={styles.title}>ALL DONE</h1>
            <p className={styles.subtitle}>
              Your TradeX account is secured with your new password. Sign in to continue trading.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.content}>
        <div className={styles.leftSection}>
          <div className={styles.formContainer}>
            <h2 className={styles.formTitle}>Reset Password</h2>
            <p className={styles.description}>Enter your new password below.</p>

            <form onSubmit={handleSubmit}>
              <FormInput
                type="password"
                name="password"
                value={formData.password}
                placeholder="New Password"
                helperText="8+ characters, include a number and symbol."
                error={errors.password}
                onChange={(value) => handleInputChange('password', value)}
              />
              <FormInput
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                placeholder="Confirm Password"
                error={errors.confirmPassword}
                onChange={(value) => handleInputChange('confirmPassword', value)}
              />
              <Button
                type="submit"
                text="Reset Password"
                isLoading={isSubmitting}
                disabled={!isFormValid()}
              />
            </form>
          </div>
        </div>

        <div className={styles.rightSection}>
          <h1 className={styles.title}>NEW PASSWORD</h1>
          <p className={styles.subtitle}>
            Choose a strong password to keep your TradeX account and portfolio secure.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
