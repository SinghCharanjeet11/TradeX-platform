import { useState } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { MdSearch, MdFilterList, MdStar, MdStarBorder, MdNotifications } from 'react-icons/md'
import AssetDetailModal from './AssetDetailModal'
import WatchlistButton from '../markets/WatchlistButton'
import PriceAlertModal from '../markets/PriceAlertModal'
import { useWatchlist } from '../../hooks/useWatchlist'
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
    { id: 1, name: 'Bitcoin', symbol: 'BTC', price: 67245, change: 2.15, marketCap: 1320000000000, volume: 38400000000, supply: 'BTC 19.5M', chart: [64000, 65000, 64500, 66000, 67000, 66500, 67245], image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
    { id: 2, name: 'Ethereum', symbol: 'ETH', price: 3120, change: 0.84, marketCap: 380200000000, volume: 18100000000, supply: 'ETH 120.5M', chart: [3050, 3080, 3100, 3090, 3110, 3115, 3120], image: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
    { id: 3, name: 'Solana', symbol: 'SOL', price: 152.40, change: -1.92, marketCap: 67800000000, volume: 3900000000, supply: 'SOL 445M', chart: [158, 156, 155, 154, 153, 152.5, 152.40], image: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
    { id: 4, name: 'BNB', symbol: 'BNB', price: 584.10, change: 0.34, marketCap: 85300000000, volume: 1800000000, supply: 'BNB 146M', chart: [580, 581, 582, 583, 584, 583.5, 584.10], image: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
  ],
  Stocks: [
    { id: 5, name: 'Apple Inc.', symbol: 'AAPL', price: 178.25, change: 1.45, marketCap: 2800000000000, volume: 52300000, supply: 'Shares 15.5B', chart: [175, 176, 176.5, 177, 177.5, 178, 178.25], image: 'https://logo.clearbit.com/apple.com' },
    { id: 6, name: 'Microsoft', symbol: 'MSFT', price: 412.80, change: 0.92, marketCap: 3100000000000, volume: 28100000, supply: 'Shares 7.4B', chart: [408, 409, 410, 411, 412, 412.5, 412.80], image: 'https://logo.clearbit.com/microsoft.com' },
    { id: 7, name: 'Tesla Inc.', symbol: 'TSLA', price: 242.50, change: -2.15, marketCap: 770000000000, volume: 95200000, supply: 'Shares 3.2B', chart: [250, 248, 246, 245, 244, 243, 242.50], image: 'https://logo.clearbit.com/tesla.com' },
    { id: 8, name: 'Amazon', symbol: 'AMZN', price: 178.35, change: 1.12, marketCap: 1800000000000, volume: 41500000, supply: 'Shares 10.3B', chart: [176, 176.5, 177, 177.5, 178, 178.2, 178.35], image: 'https://logo.clearbit.com/amazon.com' },
  ],
  Forex: [
    { id: 9, name: 'EUR/USD', symbol: 'EURUSD', price: 1.0845, change: 0.15, marketCap: 0, volume: 1200000000000, supply: 'Daily Vol', chart: [1.083, 1.0835, 1.084, 1.0842, 1.0843, 1.0844, 1.0845], image: 'https://flagcdn.com/w80/eu.png' },
    { id: 10, name: 'GBP/USD', symbol: 'GBPUSD', price: 1.2675, change: -0.22, marketCap: 0, volume: 850000000000, supply: 'Daily Vol', chart: [1.270, 1.269, 1.268, 1.2678, 1.2676, 1.2675, 1.2675], image: 'https://flagcdn.com/w80/gb.png' },
    { id: 11, name: 'USD/JPY', symbol: 'USDJPY', price: 149.85, change: 0.45, marketCap: 0, volume: 950000000000, supply: 'Daily Vol', chart: [149.2, 149.4, 149.5, 149.6, 149.7, 149.8, 149.85], image: 'https://flagcdn.com/w80/us.png' },
    { id: 12, name: 'AUD/USD', symbol: 'AUDUSD', price: 0.6542, change: -0.18, marketCap: 0, volume: 420000000000, supply: 'Daily Vol', chart: [0.656, 0.655, 0.6548, 0.6545, 0.6543, 0.6542, 0.6542], image: 'https://flagcdn.com/w80/au.png' },
  ],
  Commodities: [
    { id: 13, name: 'Gold', symbol: 'XAU', price: 2045.50, change: 0.85, marketCap: 12500000000000, volume: 145000000000, supply: 'Oz 197K', chart: [2035, 2038, 2040, 2042, 2043, 2044, 2045.50], image: 'https://cdn-icons-png.flaticon.com/512/2529/2529508.png' },
    { id: 14, name: 'Silver', symbol: 'XAG', price: 24.15, change: 1.25, marketCap: 1400000000000, volume: 28000000000, supply: 'Oz 1.6M', chart: [23.8, 23.9, 24.0, 24.05, 24.1, 24.12, 24.15], image: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png' },
    { id: 15, name: 'Crude Oil', symbol: 'WTI', price: 78.45, change: -1.35, marketCap: 0, volume: 185000000000, supply: 'Barrel', chart: [80, 79.5, 79.2, 79, 78.8, 78.6, 78.45], image: 'https://cdn-icons-png.flaticon.com/512/3104/3104405.png' },
    { id: 16, name: 'Natural Gas', symbol: 'NG', price: 2.85, change: 2.15, marketCap: 0, volume: 42000000000, supply: 'MMBtu', chart: [2.75, 2.78, 2.80, 2.81, 2.82, 2.83, 2.85], image: 'https://cdn-icons-png.flaticon.com/512/2917/2917242.png' },
  ]
}

// Generate chart data for items that don't have it
const generateChartData = (price, change) => {
  const points = 7
  const changeDecimal = (change || 0) / 100
  const startPrice = price / (1 + changeDecimal)
  
  return Array.from({ length: points }, (_, i) => {
    const progress = i / (points - 1)
    const value = startPrice + (price - startPrice) * progress
    const variance = (Math.random() - 0.5) * (price * 0.01)
    return value + variance
  })
}

// Get default image for market type
const getDefaultImage = (marketType, symbol) => {
  const defaults = {
    Crypto: `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png`,
    Stocks: `https://logo.clearbit.com/${symbol.toLowerCase()}.com`,
    Forex: symbol.includes('EUR') ? 'https://flagcdn.com/w80/eu.png' : 
           symbol.includes('GBP') ? 'https://flagcdn.com/w80/gb.png' :
           symbol.includes('AUD') ? 'https://flagcdn.com/w80/au.png' :
           symbol.includes('CAD') ? 'https://flagcdn.com/w80/ca.png' :
           symbol.includes('CHF') ? 'https://flagcdn.com/w80/ch.png' :
           'https://flagcdn.com/w80/us.png', // Default to US flag for USD pairs
    Commodities: symbol === 'XAU' ? 'https://cdn-icons-png.flaticon.com/512/2529/2529508.png' :
                 symbol === 'XAG' ? 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png' :
                 symbol === 'WTI' || symbol === 'CL' ? 'https://cdn-icons-png.flaticon.com/512/3104/3104405.png' :
                 symbol === 'NG' ? 'https://cdn-icons-png.flaticon.com/512/2917/2917242.png' :
                 'https://cdn-icons-png.flaticon.com/512/2917/2917242.png'
  }
  return defaults[marketType] || defaults.Crypto
}

function CryptoPricesTable({ marketType = 'Crypto', data = [], loading = false, error = null, lastUpdate = null }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [favorites, setFavorites] = useState(new Set([]))
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('marketCap') // marketCap, price, change, volume
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [alertModalAsset, setAlertModalAsset] = useState(null)
  const { watchlist, refetch: refetchWatchlist } = useWatchlist()
  
  // Use real data if available, otherwise fall back to mock data
  // Enhance data with charts and images if missing
  let cryptos = data.length > 0 ? data.map(item => ({
    ...item,
    chart: item.chart || generateChartData(item.price, item.change24h || item.change),
    image: item.image || getDefaultImage(marketType, item.symbol)
  })) : (marketData[marketType] || marketData.Crypto)
  
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
    Crypto: ['Overview', 'All Coins', 'Watchlist', 'Gainers', 'All ATH'],
    Stocks: ['Overview', 'Top Stocks', 'Watchlist', 'Gainers', 'Losers'],
    Forex: ['Overview', 'Major Pairs', 'Watchlist', 'Gainers', 'Losers'],
    Commodities: ['Overview', 'All Commodities', 'Watchlist', 'Gainers', 'Precious Metals']
  }
  
  const tabs = marketTabs[marketType] || marketTabs.Crypto
  
  // Filter by watchlist if Watchlist tab is active
  if (activeTab === 'Watchlist') {
    const watchlistSymbols = new Set(watchlist.map(item => item.symbol))
    cryptos = cryptos.filter(item => watchlistSymbols.has(item.symbol))
  }
  
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
        <div className={styles.headerTop}>
          <h2>{marketType} Prices</h2>
          <span className={styles.updated}>
            {lastUpdate ? (
              <>
                Updated {Math.floor((new Date() - lastUpdate) / 1000)}s ago
              </>
            ) : (
              'Loading...'
            )}
          </span>
        </div>
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
                <th>Actions</th>
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
                  <td className={styles.price}>${formatPrice(crypto?.price)}</td>
                  <td>
                    {crypto && (crypto.change24h !== undefined || crypto.change !== undefined) ? (
                      <span className={(crypto.change24h || crypto.change || 0) >= 0 ? styles.positive : styles.negative}>
                        {(crypto.change24h || crypto.change || 0) >= 0 ? '+' : ''}{((crypto.change24h || crypto.change || 0)).toFixed(2)}%
                      </span>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>${formatLargeNumber(crypto?.marketCap)}</td>
                  <td>${formatLargeNumber(crypto?.volume24h || crypto?.volume)}</td>
                  <td>{crypto?.supply || crypto?.symbol || '-'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className={styles.miniChart}>
                      {crypto?.chart ? (
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
                              stroke={(crypto?.change24h || crypto?.change || 0) >= 0 ? '#10b981' : '#ef4444'}
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
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className={styles.actions}>
                      <WatchlistButton 
                        asset={{
                          symbol: crypto.symbol,
                          name: crypto.name,
                          assetType: marketType.toLowerCase()
                        }}
                        onToggle={refetchWatchlist}
                      />
                      <button 
                        className={styles.alertBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          setAlertModalAsset({
                            symbol: crypto.symbol,
                            name: crypto.name,
                            assetType: marketType.toLowerCase(),
                            price: crypto.price
                          })
                        }}
                        title="Set price alert"
                      >
                        <MdNotifications />
                      </button>
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

      {/* Price Alert Modal */}
      {alertModalAsset && (
        <PriceAlertModal
          isOpen={true}
          onClose={() => setAlertModalAsset(null)}
          asset={alertModalAsset}
        />
      )}
    </div>
  )
}

export default CryptoPricesTable
