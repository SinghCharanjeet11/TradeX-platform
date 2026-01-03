import styles from './LoadingScreen.module.css'

function LoadingScreen() {
  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loaderContent}>
        {/* Hourglass container */}
        <div className={styles.hourglassContainer}>
          <div className={styles.hourglass}>
            {/* Top half */}
            <div className={styles.hourglassTop}>
              <div className={styles.sandTop}></div>
            </div>
            {/* Middle neck */}
            <div className={styles.hourglassMiddle}></div>
            {/* Bottom half */}
            <div className={styles.hourglassBottom}>
              <div className={styles.sandBottom}></div>
            </div>
          </div>
        </div>
        
        {/* Brand name */}
        <h1 className={styles.brandName}>TradeX</h1>
        
        {/* Loading text */}
        <p className={styles.loadingText}>Loading...</p>
      </div>
    </div>
  )
}

export default LoadingScreen
