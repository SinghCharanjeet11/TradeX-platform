import { Link } from 'react-router-dom';
import styles from './PracticeModeBanner.module.css';

function PracticeModeBanner({ balance }) {
  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.left}>
          <span className={styles.icon}>🎓</span>
          <div className={styles.text}>
            <h3 className={styles.title}>PRACTICE MODE</h3>
            <p className={styles.subtitle}>Trading with virtual money</p>
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.balance}>
            <span className={styles.label}>VIRTUAL Balance:</span>
            <span className={styles.amount}>
              ${Number(balance || 0).toFixed(2)}
            </span>
          </div>
          <Link to="/dashboard" className={styles.switchLink}>
            Switch to Real Trading →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PracticeModeBanner;
