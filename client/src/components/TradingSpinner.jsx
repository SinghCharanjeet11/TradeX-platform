import styles from './TradingSpinner.module.css'

function TradingSpinner({ size = 'medium' }) {
  return (
    <div className={`${styles.spinnerContainer} ${styles[size]}`}>
      {/* Candlestick Chart Animation */}
      <div className={styles.candlesticks}>
        <div className={`${styles.candle} ${styles.candle1}`}>
          <div className={styles.wick}></div>
          <div className={`${styles.body} ${styles.bullish}`}></div>
        </div>
        <div className={`${styles.candle} ${styles.candle2}`}>
          <div className={styles.wick}></div>
          <div className={`${styles.body} ${styles.bearish}`}></div>
        </div>
        <div className={`${styles.candle} ${styles.candle3}`}>
          <div className={styles.wick}></div>
          <div className={`${styles.body} ${styles.bullish}`}></div>
        </div>
        <div className={`${styles.candle} ${styles.candle4}`}>
          <div className={styles.wick}></div>
          <div className={`${styles.body} ${styles.bullish}`}></div>
        </div>
        <div className={`${styles.candle} ${styles.candle5}`}>
          <div className={styles.wick}></div>
          <div className={`${styles.body} ${styles.bearish}`}></div>
        </div>
      </div>
    </div>
  )
}

export default TradingSpinner
