import { FaGithub } from 'react-icons/fa'
import styles from './GitHubLink.module.css'

function GitHubLink() {
  return (
    <a
      href="https://github.com/SinghCharanjeet11/TradeX-platform"
      target="_blank"
      rel="noopener noreferrer"
      className={styles.githubLink}
      title="View TradeX on GitHub"
    >
      <FaGithub className={styles.icon} />
      <span className={styles.text}>GitHub</span>
    </a>
  )
}

export default GitHubLink
