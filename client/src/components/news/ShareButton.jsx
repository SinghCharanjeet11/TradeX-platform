import { useState } from 'react'
import { MdShare, MdContentCopy, MdCheck } from 'react-icons/md'
import { FaTwitter, FaFacebook, FaLinkedin, FaWhatsapp, FaTelegram } from 'react-icons/fa'
import styles from './ShareButton.module.css'

function ShareButton({ article, className = '' }) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = article.url || window.location.href
  const shareTitle = article.title || 'Check out this article'
  const shareText = `${shareTitle} - TradeX News`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setShowMenu(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShare = (platform) => {
    let url = ''
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
        break
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
        break
      default:
        return
    }

    window.open(url, '_blank', 'width=600,height=400')
    setShowMenu(false)
  }

  // Use native share API if available (mobile devices)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        })
        setShowMenu(false)
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err)
        }
      }
    } else {
      setShowMenu(!showMenu)
    }
  }

  return (
    <div className={`${styles.shareContainer} ${className}`}>
      <button
        className={styles.shareButton}
        onClick={handleNativeShare}
        title="Share article"
      >
        <MdShare />
      </button>

      {showMenu && (
        <>
          <div className={styles.overlay} onClick={() => setShowMenu(false)} />
          <div className={styles.shareMenu}>
            <div className={styles.shareMenuHeader}>
              <span>Share Article</span>
              <button className={styles.closeBtn} onClick={() => setShowMenu(false)}>×</button>
            </div>
            
            <div className={styles.shareOptions}>
              <button
                className={`${styles.shareOption} ${styles.twitter}`}
                onClick={() => handleShare('twitter')}
              >
                <FaTwitter />
                <span>Twitter</span>
              </button>

              <button
                className={`${styles.shareOption} ${styles.facebook}`}
                onClick={() => handleShare('facebook')}
              >
                <FaFacebook />
                <span>Facebook</span>
              </button>

              <button
                className={`${styles.shareOption} ${styles.linkedin}`}
                onClick={() => handleShare('linkedin')}
              >
                <FaLinkedin />
                <span>LinkedIn</span>
              </button>

              <button
                className={`${styles.shareOption} ${styles.whatsapp}`}
                onClick={() => handleShare('whatsapp')}
              >
                <FaWhatsapp />
                <span>WhatsApp</span>
              </button>

              <button
                className={`${styles.shareOption} ${styles.telegram}`}
                onClick={() => handleShare('telegram')}
              >
                <FaTelegram />
                <span>Telegram</span>
              </button>

              <button
                className={`${styles.shareOption} ${styles.copy} ${copied ? styles.copied : ''}`}
                onClick={handleCopyLink}
              >
                {copied ? <MdCheck /> : <MdContentCopy />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ShareButton
