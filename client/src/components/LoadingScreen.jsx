import styles from './LoadingScreen.module.css'

function LoadingScreen() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.logoContainer}>
        {/* TradeX Logo with animated chart */}
        <svg 
          className={styles.logo} 
          width="120" 
          height="120" 
          viewBox="0 0 120 120" 
          fill="none"
        >
          {/* Outer glow circle */}
          <circle 
            cx="60" 
            cy="60" 
            r="55" 
            className={styles.glowCircle}
            stroke="url(#gradient1)" 
            strokeWidth="2"
            fill="none"
          />
          
          {/* Main logo square */}
          <rect 
            x="20" 
            y="20" 
            width="80" 
            height="80" 
            rx="16" 
            stroke="url(#gradient2)" 
            strokeWidth="3"
            fill="rgba(124, 140, 255, 0.1)"
            className={styles.logoSquare}
          />
          
          {/* Animated chart line */}
          <path 
            d="M35 70L45 55L55 60L65 45L75 50L85 35" 
            stroke="url(#gradient3)" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
            className={styles.chartLine}
          />
          
          {/* Chart dots */}
          <circle cx="35" cy="70" r="4" fill="#7c8cff" className={styles.dot1} />
          <circle cx="45" cy="55" r="4" fill="#7c8cff" className={styles.dot2} />
          <circle cx="55" cy="60" r="4" fill="#7c8cff" className={styles.dot3} />
          <circle cx="65" cy="45" r="4" fill="#10b981" className={styles.dot4} />
          <circle cx="75" cy="50" r="4" fill="#10b981" className={styles.dot5} />
          <circle cx="85" cy="35" r="4" fill="#10b981" className={styles.dot6} />
          
          {/* Arrow indicator */}
          <path 
            d="M78 35H85V42" 
            stroke="#10b981" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={styles.arrow}
          />
          
          {/* Gradients */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c8cff" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#7c8cff" stopOpacity="0.5" />
            </linearGradient>
            
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c8cff" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c8cff" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Brand name */}
        <h1 className={styles.brandName}>TradeX</h1>
        
        {/* Loading text */}
        <p className={styles.loadingText}>Loading<span className={styles.dots}>...</span></p>
      </div>
      
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill}></div>
      </div>
    </div>
  )
}

export default LoadingScreen
