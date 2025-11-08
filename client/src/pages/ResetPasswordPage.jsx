import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import FormInput from '../components/FormInput'
import Button from '../components/Button'
import styles from './ForgotPasswordPage.module.css'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { token } = useParams()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      setErrors({
        password: passwordError,
        confirmPassword: confirmError
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const { authAPI } = await import('../services/api')
      await authAPI.resetPassword(token, formData.password)
      alert('Password reset successfully! Please sign in.')
      navigate('/signin')
    } catch (error) {
      alert(error.message || 'Failed to reset password')
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return formData.password && 
           formData.confirmPassword &&
           !errors.password && 
           !errors.confirmPassword
  }

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.content}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Reset Password</h2>
          <p className={styles.description}>
            Enter your new password below.
          </p>
          
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
    </div>
  )
}

export default ResetPasswordPage
