import { useEffect } from 'react'
import styles from './AuthLoadingTransition.module.css'

function AuthLoadingTransition({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 1500) // 1.5 seconds for smooth transition

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <svg className={styles.logo} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="90" stroke="#00d4aa" strokeWidth="4" opacity="0.2"/>
            <path
              d="M100 20 L100 50 M100 150 L100 180 M20 100 L50 100 M150 100 L180 100"
              stroke="#00d4aa"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="30" fill="#00d4aa"/>
            <text
              x="100"
              y="110"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="32"
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
            >
              TX
            </text>
          </svg>
        </div>
        <h2 className={styles.title}>TradeX</h2>
        <div className={styles.loadingBar}>
          <div className={styles.loadingProgress}></div>
        </div>
      </div>
    </div>
  )
}

export default AuthLoadingTransition
