import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MdClose, MdOpenInNew, MdBookmark, MdBookmarkBorder } from 'react-icons/md'
import newsService from '../../services/newsService'
import styles from './ArticleModal.module.css'

function ArticleModal({ article, isOpen, onClose, onToggleBookmark }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !article) return null

  const modalContent = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerActions}>
            <button
              className={styles.bookmarkButton}
              onClick={(e) => {
                e.stopPropagation()
                onToggleBookmark(article.id)
              }}
              title={article.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {article.isBookmarked ? <MdBookmark /> : <MdBookmarkBorder />}
            </button>
            <button className={styles.closeButton} onClick={onClose} title="Close">
              <MdClose />
            </button>
          </div>
        </div>

        <div className={styles.articleContent}>
          <h1 className={styles.articleTitle}>{article.title}</h1>

          {article.imageUrl && (
            <img src={article.imageUrl} alt={article.title} className={styles.articleImage} />
          )}

          <div className={styles.articleMeta}>
            <span className={styles.source}>{article.source}</span>
            <span className={styles.dot}></span>
            <span className={styles.time}>{newsService.formatDate(article.publishedAt)}</span>
          </div>

          {article.categories && article.categories.length > 0 && (
            <div className={styles.tags}>
              {article.categories.map((cat, index) => (
                <span key={index} className={styles.tag}>
                  {cat}
                </span>
              ))}
            </div>
          )}

          {article.body && typeof article.body === 'string' && article.body.trim() ? (
            <div className={styles.articleBody}>{article.body}</div>
          ) : (
            <div className={styles.noBodyMessage}>
              <p>Full article content not available. Click below to read on source website.</p>
            </div>
          )}

          {(article.url || article.sourceUrl) && (
            <a
              href={article.url || article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              Read Full Article <MdOpenInNew />
            </a>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default ArticleModal
