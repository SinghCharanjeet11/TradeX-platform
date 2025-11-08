import styles from './Button.module.css'

function Button({ 
  text, 
  onClick, 
  isLoading = false, 
  disabled = false, 
  variant = 'primary',
  type = 'button'
}) {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <span className={styles.spinner}></span>
      ) : (
        text
      )}
    </button>
  )
}

export default Button
