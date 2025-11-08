import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdArrowForward, MdAccessTime } from 'react-icons/md'
import Sidebar from '../components/dashboard/Sidebar'
import TopBar from '../components/dashboard/TopBar'
import LoadingScreen from '../components/LoadingScreen'
import styles from './NewsPage.module.css'

function NewsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeMarket, setActiveMarket] = useState('Crypto')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { authAPI } = await import('../services/api')
        const response = await authAPI.getCurrentUser()
        setUser(response.user)
        setLoading(false)
      } catch (error) {
        console.error('[News] Error fetching user:', error)
        navigate('/signin')
      }
    }

    fetchUser()
  }, [navigate])

  const categories = ['All', 'News', 'Exclusives', 'Guides', 'Recommended']

  // Comprehensive news data with category-specific content and images
  const allNewsData = [
    // Featured News
    {
      id: 1,
      title: 'Top Analyst Unveils Ethereum Catalyst That Could Trigger Nearly 50% Surge for ETH',
      excerpt: 'A prominent crypto analyst has identified key factors that could drive Ethereum to unprecedented heights in the coming months.',
      category: 'News',
      source: 'Blockchain News',
      time: '2 hours ago',
      tags: ['#Ethereum', '#Analytics'],
      featured: true,
      badge: 'BEST OF THE WEEK',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80'
    },
    // News Category
    {
      id: 2,
      title: 'US-Approved Spot Bitcoin ETFs Could Surpass Entire $50 Billion Crypto ETP Market',
      excerpt: 'Industry experts predict massive institutional adoption following regulatory approval of Bitcoin ETFs.',
      category: 'News',
      source: 'CryptoDaily',
      time: '3 hours ago',
      image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&q=80'
    },
    {
      id: 3,
      title: 'Over 65% of Crypto-Related Tweets Were Positive in 2023',
      excerpt: 'Social sentiment analysis reveals growing optimism in the cryptocurrency community across platforms.',
      category: 'News',
      source: 'Market Watch',
      time: '5 hours ago',
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80'
    },
    {
      id: 4,
      title: 'Solana Network Processes Record 65 Million Transactions in Single Day',
      excerpt: 'SOL blockchain demonstrates unprecedented scalability as adoption surges.',
      category: 'News',
      source: 'Blockchain News',
      time: '6 hours ago',
      image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400&q=80'
    },
    {
      id: 5,
      title: 'DeFi Total Value Locked Surpasses $100 Billion Milestone',
      excerpt: 'Decentralized finance protocols see massive growth as institutional interest increases.',
      category: 'News',
      source: 'DeFi Pulse',
      time: '8 hours ago',
      image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&q=80'
    },
    // Exclusives Category
    {
      id: 6,
      title: 'Exclusive: Inside Look at Ethereum\'s Upcoming Dencun Upgrade',
      excerpt: 'Core developers reveal groundbreaking features that will revolutionize Layer 2 scaling.',
      category: 'Exclusives',
      source: 'TradeX Exclusive',
      time: '1 hour ago',
      featured: true,
      badge: 'EXCLUSIVE',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80'
    },
    {
      id: 7,
      title: 'Interview: Vitalik Buterin on Ethereum\'s Future and Scalability',
      excerpt: 'Exclusive conversation with Ethereum founder about the network\'s roadmap and vision.',
      category: 'Exclusives',
      source: 'TradeX Exclusive',
      time: '4 hours ago',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80'
    },
    {
      id: 8,
      title: 'Behind the Scenes: How Major Exchanges Prepare for Bull Markets',
      excerpt: 'Exclusive access to top crypto exchanges reveals infrastructure upgrades.',
      category: 'Exclusives',
      source: 'TradeX Exclusive',
      time: '1 day ago',
      image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&q=80'
    },
    // Guides Category
    {
      id: 9,
      title: 'Complete Guide to Staking Ethereum: Maximize Your Returns in 2024',
      excerpt: 'Step-by-step tutorial on how to stake ETH safely and optimize your rewards.',
      category: 'Guides',
      source: 'TradeX Academy',
      time: '2 days ago',
      featured: true,
      badge: 'TRENDING GUIDE',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80'
    },
    {
      id: 10,
      title: 'DeFi for Beginners: Understanding Liquidity Pools and Yield Farming',
      excerpt: 'Learn the fundamentals of decentralized finance and start earning passive income.',
      category: 'Guides',
      source: 'TradeX Academy',
      time: '3 days ago',
      image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&q=80'
    },
    {
      id: 11,
      title: 'How to Analyze Crypto Charts: Technical Analysis Masterclass',
      excerpt: 'Master the art of reading charts and identifying profitable trading opportunities.',
      category: 'Guides',
      source: 'TradeX Academy',
      time: '4 days ago',
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80'
    },
    {
      id: 12,
      title: 'Wallet Security 101: Protecting Your Crypto Assets',
      excerpt: 'Essential security practices every crypto investor needs to know.',
      category: 'Guides',
      source: 'TradeX Academy',
      time: '5 days ago',
      image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400&q=80'
    },
    // Recommended Category
    {
      id: 13,
      title: 'Why Institutional Investors Are Betting Big on Bitcoin in 2024',
      excerpt: 'Analysis of major institutional moves and what they mean for retail investors.',
      category: 'Recommended',
      source: 'Market Insights',
      time: '6 hours ago',
      featured: true,
      badge: 'MUST READ',
      image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=80'
    },
    {
      id: 14,
      title: 'The Rise of Layer 2 Solutions: Arbitrum and Optimism Lead the Way',
      excerpt: 'How L2 networks are solving Ethereum\'s scalability challenges.',
      category: 'Recommended',
      source: 'Tech Analysis',
      time: '12 hours ago',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80'
    },
    {
      id: 15,
      title: 'NFT Market Shows Signs of Recovery: Blue Chips Rally',
      excerpt: 'Premium NFT collections see renewed interest from collectors and investors.',
      category: 'Recommended',
      source: 'NFT Tracker',
      time: '1 day ago',
      image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400&q=80'
    },
    {
      id: 16,
      title: 'Central Bank Digital Currencies: The Future of Money?',
      excerpt: 'Exploring how CBDCs could reshape the global financial system.',
      category: 'Recommended',
      source: 'Finance Today',
      time: '2 days ago',
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80'
    }
  ]

  const filteredNews = activeCategory === 'All' 
    ? allNewsData 
    : allNewsData.filter(news => news.category === activeCategory)

  const handleReadArticle = (newsId) => {
    const article = allNewsData.find(n => n.id === newsId)
    console.log('Opening article:', article?.title)
    // In production, this would navigate to the full article or open a modal
    alert(`Opening article:\n\n${article?.title}\n\nCategory: ${article?.category}\nSource: ${article?.source}`)
  }

  const handleViewAll = () => {
    console.log('View all recommended articles')
    setActiveCategory('Recommended')
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className={styles.newsPage}>
      <Sidebar />
      
      <div className={styles.main}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Market News & Insights</h1>
            <p className={styles.subtitle}>Stay updated with the latest financial news</p>
          </div>

          {/* Category Navigation */}
          <div className={styles.categoryNav}>
            {categories.map((category) => (
              <button
                key={category}
                className={`${styles.categoryBtn} ${activeCategory === category ? styles.active : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className={styles.newsLayout}>
            {/* Left Column - Featured & List */}
            <div className={styles.leftColumn}>
              {/* Featured Article */}
              {filteredNews.length > 0 && filteredNews[0].featured && (
                <div className={styles.featuredArticle}>
                  {filteredNews[0].badge && (
                    <div className={styles.badge}>{filteredNews[0].badge}</div>
                  )}
                  <div className={styles.featuredMeta}>
                    <span className={styles.source}>{filteredNews[0].source}</span>
                    <span className={styles.dot}>•</span>
                    <span className={styles.time}>{filteredNews[0].time}</span>
                  </div>
                  <h1 className={styles.featuredTitle}>{filteredNews[0].title}</h1>
                  {filteredNews[0].tags && (
                    <div className={styles.tags}>
                      {filteredNews[0].tags.map((tag, index) => (
                        <span key={index} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <button 
                    className={styles.readArticleBtn}
                    onClick={() => handleReadArticle(filteredNews[0].id)}
                  >
                    Read article <MdArrowForward />
                  </button>
                  <div className={styles.featuredGradient}></div>
                </div>
              )}

              {/* News List */}
              <div className={styles.newsList}>
                {filteredNews.slice(1, 4).map((news) => (
                  <div 
                    key={news.id} 
                    className={styles.newsListItem}
                    onClick={() => handleReadArticle(news.id)}
                  >
                    <div className={styles.newsListContent}>
                      <div className={styles.newsListMeta}>
                        <span className={styles.source}>{news.source}</span>
                        <span className={styles.dot}>•</span>
                        <span className={styles.time}>{news.time}</span>
                      </div>
                      <h3 className={styles.newsListTitle}>{news.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Recommended */}
            <div className={styles.rightColumn}>
              <div className={styles.recommendedHeader}>
                <h2 className={styles.recommendedTitle}>Recommended</h2>
                <button 
                  className={styles.viewAllBtn}
                  onClick={handleViewAll}
                >
                  View all <MdArrowForward />
                </button>
              </div>
              <div className={styles.recommendedList}>
                {filteredNews.slice(1).map((news) => (
                  <div 
                    key={news.id} 
                    className={styles.recommendedCard}
                    onClick={() => handleReadArticle(news.id)}
                  >
                    {news.image && (
                      <img src={news.image} alt={news.title} className={styles.recommendedImage} />
                    )}
                    <div className={styles.recommendedContent}>
                      <div className={styles.recommendedMeta}>
                        <span className={styles.source}>{news.source}</span>
                        <span className={styles.dot}>•</span>
                        <span className={styles.time}>{news.time}</span>
                      </div>
                      <h4 className={styles.recommendedTitle}>{news.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewsPage
