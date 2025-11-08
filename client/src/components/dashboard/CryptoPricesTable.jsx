import { useState } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { MdSearch, MdFilterList, MdStar, MdStarBorder } from 'react-icons/md'
import AssetDetailModal from './AssetDetailModal'
import styles from './CryptoPricesTable.module.css'

// Helper functions
const formatPrice = (price) => {
  // Handle null, undefined, or non-numeric values
  if (price === null || price === undefined) return '-'
  
  // Convert to number if it's a string
  const value = typeof price === 'string' ? parseFloat(price) : price
  
  // Check if it's a valid number
  if (isNaN(value)) return '-'
  
  if (value >= 1) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
}

const formatLargeNumber = (num) => {
  // Handle null, undefined, or non-numeric values
  if (num === null || num === undefined || num === 0) return '-'
  
  // Convert to number if it's a string
  const value = typeof num === 'string' ? parseFloat(num) : num
  
  // Check if it's a valid number
  if (isNaN(value)) return '-'
  
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
  return value.toFixed(2)
}

const marketData = {
  Crypto: [
    { id: 1, name: 'Bitcoin', symbol: 'BTC', price: 67245, change: 2.15, marketCap: '1.32T', volume: '38.4B', supply: 'BTC 12.43M', chart: [40, 45, 42, 48, 52, 50, 55] },
    { id: 2, name: 'Ethereum', symbol: 'ETH', price: 3120, change: 0.84, marketCap: '380.2B', volume: '18.1B', supply: 'ETH 120.5M', chart: [30, 32, 35, 33, 36, 38, 40] },
    { id: 3, name: 'Solana', symbol: 'SOL', price: 152.40, change: -1.92, marketCap: '67.8B', volume: '3.9B', supply: 'SOL 445M', chart: [50, 48, 45, 42, 40, 38, 35] },
    { id: 4, name: 'BNB', symbol: 'BNB', price: 584.10, change: 0.34, marketCap: '85.3B', volume: '1.8B', supply: 'BNB 146M', chart: [35, 37, 36, 38, 40, 39, 41] },
  ],
  Stocks: [
    { id: 5, name: 'Apple Inc.', symbol: 'AAPL', price: 178.25, change: 1.45, marketCap: '2.8T', volume: '52.3M', supply: 'Shares 15.5B', chart: [170, 172, 175, 173, 176, 178, 178] },
    { id: 6, name: 'Microsoft', symbol: 'MSFT', price: 412.80, change: 0.92, marketCap: '3.1T', volume: '28.1M', supply: 'Shares 7.4B', chart: [405, 408, 410, 409, 411, 413, 412] },
    { id: 7, name: 'Tesla Inc.', symbol: 'TSLA', price: 242.50, change: -2.15, marketCap: '770B', volume: '95.2M', supply: 'Shares 3.2B', chart: [260, 255, 250, 248, 245, 243, 242] },
    { id: 8, name: 'Amazon', symbol: 'AMZN', price: 178.35, change: 1.12, marketCap: '1.8T', volume: '41.5M', supply: 'Shares 10.3B', chart: [175, 176, 177, 176, 178, 179, 178] },
  ],
  Forex: [
    { id: 9, name: 'EUR/USD', symbol: 'EURUSD', price: 1.0845, change: 0.15, marketCap: '-', volume: '1.2T', supply: 'Daily Vol', chart: [1.08, 1.082, 1.083, 1.084, 1.085, 1.084, 1.0845] },
    { id: 10, name: 'GBP/USD', symbol: 'GBPUSD', price: 1.2675, change: -0.22, marketCap: '-', volume: '850B', supply: 'Daily Vol', chart: [1.27, 1.269, 1.268, 1.267, 1.268, 1.267, 1.2675] },
    { id: 11, name: 'USD/JPY', symbol: 'USDJPY', price: 149.85, change: 0.45, marketCap: '-', volume: '950B', supply: 'Daily Vol', chart: [149, 149.5, 149.7, 149.6, 149.8, 149.9, 149.85] },
    { id: 12, name: 'AUD/USD', symbol: 'AUDUSD', price: 0.6542, change: -0.18, marketCap: '-', volume: '420B', supply: 'Daily Vol', chart: [0.656, 0.655, 0.654, 0.655, 0.654, 0.6545, 0.6542] },
  ],
  Commodities: [
    { id: 13, name: 'Gold', symbol: 'XAU', price: 2045.50, change: 0.85, marketCap: '12.5T', volume: '145B', supply: 'Oz 197K', chart: [2030, 2035, 2040, 2038, 2042, 2044, 2045] },
    { id: 14, name: 'Silver', symbol: 'XAG', price: 24.15, change: 1.25, marketCap: '1.4T', volume: '28B', supply: 'Oz 1.6M', chart: [23.5, 23.7, 23.9, 23.8, 24.0, 24.1, 24.15] },
    { id: 15, name: 'Crude Oil', symbol: 'WTI', price: 78.45, change: -1.35, marketCap: '-', volume: '185B', supply: 'Barrel', chart: [82, 81, 80, 79, 79.5, 78.8, 78.45] },
    { id: 16, name: 'Natural Gas', symbol: 'NG', price: 2.85, change: 2.15, marketCap: '-', volume: '42B', supply: 'MMBtu', chart: [2.7, 2.72, 2.75, 2.78, 2.8, 2.83, 2.85] },
  ]
}

function CryptoPricesTable({ marketType = 'Crypto', data = [], loading = false, error = null }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [favorites, setFavorites] = useState(new Set([]))
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('marketCap') // marketCap, price, change, volume
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedAsset, setSelectedAsset] = useState(null)
  
  // Use real data if available, otherwise fall back to mock data
  let cryptos = data.length > 0 ? data : (marketData[marketType] || marketData.Crypto)
  
  // Apply search filter
  if (searchTerm) {
    cryptos = cryptos.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }
  
  // Apply tab filters
  if (activeTab === 'Gainers') {
    cryptos = cryptos.filter(item => (item.change24h || item.change || 0) > 0)
      .sort((a, b) => (b.change24h || b.change || 0) - (a.change24h || a.change || 0))
  } else if (activeTab === 'All ATH') {
    cryptos = cryptos.filter(item => (item.change24h || item.change || 0) > 5)
  }
  
  // Apply sorting
  if (sortBy === 'price') {
    cryptos = [...cryptos].sort((a, b) => (b.price || 0) - (a.price || 0))
  } else if (sortBy === 'change') {
    cryptos = [...cryptos].sort((a, b) => (b.change24h || b.change || 0) - (a.change24h || a.change || 0))
  } else if (sortBy === 'volume') {
    cryptos = [...cryptos].sort((a, b) => (b.volume24h || b.volume || 0) - (a.volume24h || a.volume || 0))
  }
  
  // Pagination
  const totalItems = cryptos.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCryptos = cryptos.slice(startIndex, endIndex)
  
  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1)
  }
  
  // Market-specific tabs
  const marketTabs = {
    Crypto: ['Overview', 'All Coins', 'Gainers', 'All ATH', 'Performance'],
    Stocks: ['Overview', 'Top Stocks', 'Gainers', 'Losers', 'Most Active'],
    Forex: ['Overview', 'Major Pairs', 'Gainers', 'Losers', 'Exotic Pairs'],
    Commodities: ['Overview', 'All Commodities', 'Gainers', 'Precious Metals', 'Energy']
  }
  
  const tabs = marketTabs[marketType] || marketTabs.Crypto
  
  const handleRowClick = (crypto) => {
    console.log('Clicked:', crypto.name)
    setSelectedAsset(crypto)
  }
  
  const toggleFavorite = (id) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(id)) {
      newFavorites.delete(id)
    } else {
      newFavorites.add(id)
    }
    setFavorites(newFavorites)
  }

  return (
    <div className={styles.container} data-market={marketType}>
      <div className={styles.header}>
        <h2>{marketType} Prices</h2>
        <div className={styles.headerActions}>
          <div className={styles.tabs}>
            {tabs.map(tab => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className={styles.search}>
              <MdSearch />
              <input 
                type="text" 
                placeholder="Search" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.filterDropdown}>
              <button className={styles.filterBtn}>
                <MdFilterList />
                Filters
              </button>
              <div className={styles.filterMenu}>
                <button onClick={() => setSortBy('marketCap')}>Market Cap</button>
                <button onClick={() => setSortBy('price')}>Price</button>
                <button onClick={() => setSortBy('change')}>24h Change</button>
                <button onClick={() => setSortBy('volume')}>Volume</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading {marketType.toLowerCase()} data...</p>
          </div>
        ) : cryptos.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No {marketType.toLowerCase()} data available</p>
            {error && <p className={styles.errorText}>{error}</p>}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Price</th>
                <th>Change (24h)</th>
                <th>Market Cap</th>
                <th>Volume (24h)</th>
                <th>Circ Supply</th>
                <th>Price Graph (7D)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCryptos.map((crypto, index) => (
                <tr key={crypto.id || index} onClick={() => handleRowClick(crypto)} className={styles.clickableRow}>
                  <td>
                    <button 
                      className={styles.favoriteBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(crypto.id || index)
                      }}
                    >
                      {favorites.has(crypto.id || index) ? <MdStar /> : <MdStarBorder />}
                    </button>
                    {index + 1}
                  </td>
                  <td>
                    <div className={styles.nameCell}>
                      {crypto.image ? (
                        <img src={crypto.image} alt={crypto.symbol} className={styles.coinImage} />
                      ) : (
                        <div className={styles.coinIcon}>{crypto.symbol[0]}</div>
                      )}
                      <div>
                        <div className={styles.coinName}>
                          {crypto.name}
                        </div>
                        <div className={styles.coinSymbol}>{crypto.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.price}>${formatPrice(crypto.price)}</td>
                  <td>
                    <span className={(crypto.change24h || crypto.change) > 0 ? styles.positive : styles.negative}>
                      {(crypto.change24h || crypto.change) > 0 ? '+' : ''}{(crypto.change24h || crypto.change).toFixed(2)}%
                    </span>
                  </td>
                  <td>${formatLargeNumber(crypto.marketCap)}</td>
                  <td>${formatLargeNumber(crypto.volume24h || crypto.volume)}</td>
                  <td>{crypto.supply || crypto.symbol}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className={styles.miniChart}>
                      {crypto.chart ? (
                        <ResponsiveContainer width="100%" height={60}>
                          <LineChart data={crypto.chart.map((v, i) => ({ value: v, index: i }))}>
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className={styles.chartTooltip}>
                                      <span>${typeof payload[0].value === 'number' ? payload[0].value.toFixed(2) : payload[0].value}</span>
                                    </div>
                                  )
                                }
                                return null
                              }}
                              cursor={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke={(crypto.change24h || crypto.change) > 0 ? '#10b981' : '#ef4444'}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className={styles.noChart}>-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerInfo}>
          {startIndex + 1}-{Math.min(endIndex, totalItems)} from {totalItems}
        </span>
        <div className={styles.pagination}>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const pageNum = i + 1
            return (
              <button
                key={pageNum}
                className={currentPage === pageNum ? styles.active : ''}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            )
          })}
          {totalPages > 5 && <span className={styles.ellipsis}>...</span>}
          {totalPages > 5 && (
            <button
              className={currentPage === totalPages ? styles.active : ''}
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </button>
          )}
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            className={styles.rowsSelect}
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
          >
            <option value={10}>Show Rows: 10</option>
            <option value={20}>Show Rows: 20</option>
            <option value={50}>Show Rows: 50</option>
          </select>
          <button className={styles.viewAllBtn}>View All</button>
        </div>
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <AssetDetailModal 
          asset={selectedAsset}
          marketType={marketType.toLowerCase()}
          onClose={() => setSelectedAsset(null)} 
        />
      )}
    </div>
  )
}

export default CryptoPricesTable
