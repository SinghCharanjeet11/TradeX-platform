import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdArrowForward, MdBookmark, MdBookmarkBorder, MdArrowBack } from 'react-icons/md'
import Sidebar from '../components/dashboard/Sidebar'
import LoadingScreen from '../components/LoadingScreen'
import SearchBar from '../components/news/SearchBar'
import ArticleModal from '../components/news/ArticleModal'
import SentimentIndicator from '../components/news/SentimentIndicator'
import ShareButton from '../components/news/ShareButton'
import NewsFilters from '../components/news/NewsFilters'
import BreakingNewsSection from '../components/news/BreakingNewsSection'
import ErrorNotification, { ERROR_TYPES } from '../components/news/ErrorNotification'
import newsService from '../services/newsService'
import styles from './NewsPage.module.css'

function NewsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [news, setNews] = useState([])
  const [allNews, setAllNews] = useState([]) // Store all news for switching back
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [showReadingListOnly, setShowReadingListOnly] = useState(false)
  const [readArticles, setReadArticles] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [error, setError] = useState(null)
  const [cached, setCached] = useState(false)
  const [filters, setFilters] = useState({
    category: 'all',
    sentiment: 'all',
    dateFrom: '',
    dateTo: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [errorType, setErrorType] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Fetch user (optional - news can be viewed without auth)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { authAPI } = await import('../services/api')
        const response = await authAPI.getCurrentUser()
        setUser(response.user)
      } catch (error) {
        console.error('[News] Error fetching user:', error)
        // Don't redirect - news can be viewed without authentication
        setUser(null)
      }
    }
    fetchUser()
  }, [navigate])

  // Fetch news
  const fetchNews = useCallback(async () => {
    if (!isOnline) {
      setErrorType(ERROR_TYPES.OFFLINE)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setErrorType(null)

      const requestFilters = {
        category: filters.category !== 'all' ? filters.category : undefined,
        sentiment: filters.sentiment !== 'all' ? filters.sentiment : undefined,
        search: searchQuery || undefined,
        limit: 50
      }

      // Set timeout for request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 30000)
      )

      const response = await Promise.race([
        newsService.getNews(requestFilters),
        timeoutPromise
      ])
      
      if (response.success) {
        let articles = response.data.articles || response.data
        
        // Validate data
        if (!Array.isArray(articles)) {
          console.error('[News] Invalid data format:', articles)
          setErrorType(ERROR_TYPES.INVALID_DATA)
          setError('Received invalid data format')
          return
        }
        
        // Apply date range filter on client side
        if (filters.dateFrom || filters.dateTo) {
          articles = articles.filter(article => {
            const articleDate = new Date(article.publishedAt)
            const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null
            const toDate = filters.dateTo ? new Date(filters.dateTo) : null
            
            if (fromDate && articleDate < fromDate) return false
            if (toDate && articleDate > toDate) return false
            return true
          })
        }
        
        setNews(articles)
        setAllNews(articles) // Store all news
        setCached(response.data.cached || response.cached)
        setRetryCount(0) // Reset retry count on success
      } else {
        setError(response.error)
        setErrorType(ERROR_TYPES.GENERAL)
      }
    } catch (err) {
      console.error('[News] Error fetching news:', err)
      
      if (err.message === 'TIMEOUT') {
        setErrorType(ERROR_TYPES.TIMEOUT)
        setError('Request timed out')
        
        // Auto-retry with exponential backoff
        if (retryCount < 3) {
          const delay = Math.min(30000, 1000 * Math.pow(2, retryCount))
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
            fetchNews()
          }, delay)
        }
      } else if (!navigator.onLine) {
        setErrorType(ERROR_TYPES.OFFLINE)
        setError('No internet connection')
      } else {
        setErrorType(ERROR_TYPES.GENERAL)
        setError('Failed to load news')
      }
    } finally {
      setLoading(false)
    }
  }, [filters, searchQuery, isOnline, retryCount])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNews()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [fetchNews])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setErrorType(null)
      fetchNews()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setErrorType(ERROR_TYPES.OFFLINE)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [fetchNews])

  const categories = ['All', 'News', 'Analysis', 'Guides', 'Exclusives']

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleDismissError = () => {
    setError(null)
    setErrorType(null)
  }

  const handleRetry = () => {
    setRetryCount(0)
    fetchNews()
  }

  const handleArticleClick = (article) => {
    console.log('[NewsPage] Article clicked:', article)
    console.log('[NewsPage] Article has body:', !!article.body)
    console.log('[NewsPage] Article body length:', article.body?.length || 0)
    setSelectedArticle(article)
    // Mark article as read
    setReadArticles(prev => new Set([...prev, article.id]))
    // Store in localStorage
    const stored = JSON.parse(localStorage.getItem('readArticles') || '[]')
    if (!stored.includes(article.id)) {
      localStorage.setItem('readArticles', JSON.stringify([...stored, article.id]))
    }
  }

  const handleCloseModal = () => {
    setSelectedArticle(null)
  }

  const handleToggleBookmark = async (articleId) => {
    try {
      const response = await newsService.toggleBookmark(articleId)
      if (response.success) {
        // Update both news and allNews
        setNews(prevNews =>
          prevNews.map(article =>
            article.id === articleId
              ? { ...article, isBookmarked: response.bookmarked }
              : article
          )
        )
        setAllNews(prevNews =>
          prevNews.map(article =>
            article.id === articleId
              ? { ...article, isBookmarked: response.bookmarked }
              : article
          )
        )
        if (selectedArticle && selectedArticle.id === articleId) {
          setSelectedArticle(prev => ({ ...prev, isBookmarked: response.bookmarked }))
        }
      }
    } catch (error) {
      console.error('[News] Error toggling bookmark:', error)
    }
  }

  const handleShowBookmarks = () => {
    const bookmarked = allNews.filter(article => article.isBookmarked)
    if (bookmarked.length > 0) {
      setNews(bookmarked)
      setShowBookmarksOnly(true)
      setShowReadingListOnly(false)
    } else {
      alert('No bookmarked articles yet!')
    }
  }

  const handleShowReadingList = () => {
    const readList = allNews.filter(article => readArticles.has(article.id))
    if (readList.length > 0) {
      setNews(readList)
      setShowReadingListOnly(true)
      setShowBookmarksOnly(false)
    } else {
      alert('No articles in your reading list yet!')
    }
  }

  const handleShowAllNews = () => {
    setNews(allNews)
    setShowBookmarksOnly(false)
    setShowReadingListOnly(false)
  }

  // Load read articles from localStorage on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('readArticles') || '[]')
    setReadArticles(new Set(stored))
  }, [])

  const filteredNews = news
  const featuredArticle = filteredNews[0]
  const regularNews = filteredNews.slice(1)

  if (loading && news.length === 0) {
    return <LoadingScreen />
  }

  return (
    <div className={styles.newsPage}>
      <Sidebar />
      
      <div className={styles.main}>
        <div className={styles.content}>
          <div className={styles.headerRow}>
            <div className={styles.headerLeft}>
              <div className={styles.header}>
                <h1 className={styles.pageTitle}>
                  {showBookmarksOnly 
                    ? 'Bookmarked Articles' 
                    : showReadingListOnly 
                    ? 'Reading List' 
                    : 'Market News & Insights'}
                </h1>
              </div>
              
              <div className={styles.subtitle}>
                {showBookmarksOnly 
                  ? `Showing ${news.length} bookmarked article${news.length !== 1 ? 's' : ''}`
                  : showReadingListOnly
                  ? `${news.length} article${news.length !== 1 ? 's' : ''} you've read`
                  : 'Stay updated with real-time financial news'
                }
                {cached && !showBookmarksOnly && !showReadingListOnly && <span className={styles.cachedBadge}>Cached</span>}
              </div>
            </div>

            <div className={styles.headerButtons}>
              {(showBookmarksOnly || showReadingListOnly) ? (
                <button 
                  className={styles.backBtn}
                  onClick={handleShowAllNews}
                  title="Back to All News"
                >
                  <MdArrowBack />
                  <span>Back to All News</span>
                </button>
              ) : (
                <>
                  <button 
                    className={styles.readingListBtn}
                    onClick={handleShowReadingList}
                    title="View Reading List"
                  >
                    <MdArrowForward />
                    <span>Reading List</span>
                  </button>
                  <button 
                    className={styles.bookmarksBtn}
                    onClick={handleShowBookmarks}
                    title="View Bookmarks"
                  >
                    <MdBookmark />
                    <span>Bookmarks</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={styles.searchSection}>
            <SearchBar onSearch={handleSearch} placeholder="Search news articles..." />
            <button 
              className={styles.filterToggleBtn}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? '✕ Hide Filters' : '⚙ Show Filters'}
            </button>
          </div>

          {showFilters && !showBookmarksOnly && (
            <NewsFilters filters={filters} onFiltersChange={handleFiltersChange} />
          )}

          {!showBookmarksOnly && <BreakingNewsSection onArticleClick={handleArticleClick} />}

          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
              <button onClick={fetchNews} className={styles.retryButton}>Retry</button>
            </div>
          )}

          {loading && news.length === 0 && (
            <div className={styles.loadingState}><p>Loading news...</p></div>
          )}

          {!loading && filteredNews.length === 0 && (
            <div className={styles.emptyState}>
              <p>No news articles found</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className={styles.clearSearchButton}>
                  Clear search
                </button>
              )}
            </div>
          )}

          {filteredNews.length > 0 && (
            <div className={styles.newsLayout}>
              {/* Featured Article */}
              {featuredArticle && (
                <div className={styles.featuredArticle} onClick={() => handleArticleClick(featuredArticle)}>
                  <div className={styles.featuredContent}>
                    <div className={styles.badge}>FEATURED</div>
                    <div className={styles.featuredMeta}>
                      <span className={styles.source}>{featuredArticle.source}</span>
                      <span className={styles.dot}>•</span>
                      <span className={styles.time}>{newsService.formatDate(featuredArticle.publishedAt)}</span>
                      {featuredArticle.sentiment !== undefined && (
                        <>
                          <span className={styles.dot}>•</span>
                          <SentimentIndicator score={featuredArticle.sentiment} />
                        </>
                      )}
                    </div>
                    <h2 className={styles.featuredTitle}>{featuredArticle.title}</h2>
                    {featuredArticle.categories && featuredArticle.categories.length > 0 && (
                      <div className={styles.tags}>
                        {featuredArticle.categories.slice(0, 3).map((cat, index) => (
                          <span key={index} className={styles.tag}>{cat}</span>
                        ))}
                      </div>
                    )}
                    <button className={styles.readArticleBtn}>
                      Read article <MdArrowForward />
                    </button>
                  </div>
                  {featuredArticle.imageUrl && (
                    <img src={featuredArticle.imageUrl} alt={featuredArticle.title} className={styles.featuredImage} />
                  )}
                  <div className={styles.featuredGradient}></div>
                </div>
              )}

              {/* Regular News Cards */}
              {regularNews.map((article) => (
                <div 
                  key={article.id} 
                  className={`${styles.newsCard} ${readArticles.has(article.id) ? styles.readArticle : ''}`} 
                  onClick={() => handleArticleClick(article)}
                >
                  {readArticles.has(article.id) && (
                    <div className={styles.readBadge}>Read</div>
                  )}
                  {article.imageUrl && (
                    <img src={article.imageUrl} alt={article.title} className={styles.newsCardImage} />
                  )}
                  <div className={styles.newsCardContent}>
                    <div className={styles.newsCardMeta}>
                      <span className={styles.source}>{article.source}</span>
                      <span className={styles.dot}>•</span>
                      <span className={styles.time}>{newsService.formatDate(article.publishedAt)}</span>
                      {article.sentiment !== undefined && (
                        <>
                          <span className={styles.dot}>•</span>
                          <SentimentIndicator score={article.sentiment} size="small" />
                        </>
                      )}
                    </div>
                    <h3 className={styles.newsCardTitle}>{article.title}</h3>
                    <div className={styles.newsCardFooter}>
                      {article.categories && article.categories.length > 0 && (
                        <div className={styles.tags}>
                          {article.categories.slice(0, 2).map((cat, index) => (
                            <span key={index} className={styles.tag}>{cat}</span>
                          ))}
                        </div>
                      )}
                      <div className={styles.cardActions}>
                        <ShareButton 
                          article={article}
                          className={styles.shareBtn}
                        />
                        <button
                          className={styles.bookmarkBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleBookmark(article.id)
                          }}
                        >
                          {article.isBookmarked ? <MdBookmark /> : <MdBookmarkBorder />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ArticleModal
        article={selectedArticle}
        isOpen={!!selectedArticle}
        onClose={handleCloseModal}
        onToggleBookmark={handleToggleBookmark}
      />

      <ErrorNotification
        error={error}
        type={errorType}
        onRetry={handleRetry}
        onDismiss={handleDismissError}
        retryCount={retryCount}
        maxRetries={3}
      />
    </div>
  )
}

export default NewsPage
