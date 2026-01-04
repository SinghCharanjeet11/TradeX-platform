import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdPerson, MdSettings, MdEdit, MdLogout, MdSearch } from 'react-icons/md'
import { useAuth } from '../../contexts/AuthContext'
import AlertsDropdown from './AlertsDropdown'
import AlertConfigurationModal from './AlertConfigurationModal'
import AssetDetailModal from './AssetDetailModal'
import ToastContainer from '../Toast'
import { useToast } from '../../hooks/useToast'
import insightsService from '../../services/insightsService'
import marketService from '../../services/marketService'
import styles from './TopBar.module.css'

function TopBar({ user, activeMarket, onMarketChange, additionalActions }) {
  const navigate = useNavigate()
  const { logout, isAuthenticated } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [previousAlertIds, setPreviousAlertIds] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const { toasts, removeToast, showInfo } = useToast()

  // Fetch alerts on mount and set up polling - only when authenticated and not logging out
  useEffect(() => {
    if (!isAuthenticated || isLoggingOut) return;
    
    const fetchAlerts = async () => {
      if (!isAuthenticated || isLoggingOut) return;
      
      try {
        const response = await insightsService.getAlerts(10);
        if (response.success && response.data) {
          const newAlerts = response.data.alerts || [];
          const newUnreadCount = response.data.unreadCount || 0;
          
          const currentAlertIds = new Set(newAlerts.map(alert => alert.id));
          const newAlertIds = [...currentAlertIds].filter(id => !previousAlertIds.has(id));
          
          if (newAlertIds.length > 0 && previousAlertIds.size > 0) {
            const newUnreadAlerts = newAlerts.filter(
              alert => newAlertIds.includes(alert.id) && !alert.read
            );
            
            if (newUnreadAlerts.length > 0) {
              const firstAlert = newUnreadAlerts[0];
              showInfo(firstAlert.message, `New ${firstAlert.severity} Alert`);
            }
          }
          
          setAlerts(newAlerts);
          setUnreadCount(newUnreadCount);
          setPreviousAlertIds(currentAlertIds);
        }
      } catch (error) {
        // Silently ignore errors when not authenticated
        if (isAuthenticated && !isLoggingOut) {
          console.error('Error fetching alerts:', error);
        }
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isLoggingOut, previousAlertIds, showInfo]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search functionality
  useEffect(() => {
    const searchAssets = async () => {
      if (!activeMarket || searchQuery.length < 2) {
        setSearchResults([])
        setShowSearchResults(false)
        return
      }

      try {
        let response
        const lowerQuery = searchQuery.toLowerCase()
        
        switch (activeMarket) {
          case 'Crypto':
            response = await marketService.getCryptoData()
            break
          case 'Stocks':
            response = await marketService.getStocksData()
            break
          case 'Forex':
            response = await marketService.getForexData()
            break
          case 'Commodities':
            response = await marketService.getCommoditiesData()
            break
          default:
            return
        }
        
        if (response.success && response.data) {
          const filtered = response.data
            .filter(asset => 
              asset.name?.toLowerCase().includes(lowerQuery) ||
              asset.symbol?.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 8)
          
          setSearchResults(filtered)
          setShowSearchResults(filtered.length > 0)
        }
      } catch (error) {
        console.error('Error searching assets:', error)
      }
    }

    const debounce = setTimeout(searchAssets, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, activeMarket])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setShowDropdown(false)
    
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    // Navigate to signin
    navigate('/signin', { replace: true })
  }

  const handleSettings = () => {
    navigate('/settings')
    setShowDropdown(false)
  }

  const handleEditProfile = () => {
    navigate('/settings')
    setShowDropdown(false)
  }

  const handleMarkAlertAsRead = async (alertId) => {
    try {
      await insightsService.markAlertAsRead(alertId);
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId ? { ...alert, read: true } : alert
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleViewAllAlerts = () => {
    console.log('View all alerts');
  };

  const handleConfigureAlerts = () => {
    setShowConfigModal(true);
  };

  const handleCloseConfigModal = () => {
    setShowConfigModal(false);
  };

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset)
    setShowAssetModal(true)
    setShowSearchResults(false)
    setSearchQuery('')
  }

  const handleCloseAssetModal = () => {
    setShowAssetModal(false)
    setSelectedAsset(null)
  }

  const getMarketType = () => {
    if (!activeMarket) return 'crypto'
    return activeMarket.toLowerCase()
  }

  const markets = ['Crypto', 'Stocks', 'Forex', 'Commodities']

  return (
    <div 
      className={`${styles.topBar} topBar`}
      data-page={activeMarket ? 'markets' : 'other'}
      data-market={activeMarket || ''}
    >
      {/* Center Section - Search + Market Tabs */}
      {activeMarket && (
        <div className={styles.centerSection}>
          {/* Search Bar */}
          <div className={styles.searchWrapper} ref={searchRef}>
            <MdSearch className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder={`Search ${activeMarket || 'Markets'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className={styles.searchResults}>
                {searchResults.map((asset, index) => (
                  <div
                    key={index}
                    className={styles.searchResultItem}
                    onClick={() => handleAssetClick(asset)}
                  >
                    {asset.image && (
                      <img src={asset.image} alt={asset.symbol} className={styles.assetImage} />
                    )}
                    <div className={styles.assetInfo}>
                      <span className={styles.assetName}>{asset.name}</span>
                      <span className={styles.assetSymbol}>{asset.symbol}</span>
                    </div>
                    <span className={styles.assetPrice}>
                      ${asset.price?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Market Tabs */}
          <div className={styles.marketTabs}>
            {markets.map((market) => (
              <button
                key={market}
                className={`${styles.marketTab} ${activeMarket === market ? styles.active : ''}`}
                onClick={() => onMarketChange(market)}
                data-market={market}
              >
                {market}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions - Right Side */}
      <div className={styles.actions}>
        {additionalActions}
        <AlertsDropdown
          alerts={alerts}
          unreadCount={unreadCount}
          onMarkAsRead={handleMarkAlertAsRead}
          onViewAll={handleViewAllAlerts}
          onConfigure={handleConfigureAlerts}
        />
        <div className={styles.userMenu} ref={dropdownRef}>
          <button 
            className={styles.userBtn}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <MdPerson />
            <span>{user?.username || 'User'}</span>
          </button>
          {showDropdown && (
            <div className={styles.dropdown}>
              <button onClick={handleSettings} className={styles.dropdownItem}>
                <MdSettings />
                <span>Settings</span>
              </button>
              <button onClick={handleEditProfile} className={styles.dropdownItem}>
                <MdEdit />
                <span>Edit Profile</span>
              </button>
              <div className={styles.dropdownDivider}></div>
              <button onClick={handleLogout} className={`${styles.dropdownItem} ${styles.logoutItem}`}>
                <MdLogout />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alert Configuration Modal */}
      <AlertConfigurationModal
        isOpen={showConfigModal}
        onClose={handleCloseConfigModal}
      />

      {/* Asset Detail Modal */}
      {showAssetModal && selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={handleCloseAssetModal}
          marketType={getMarketType()}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default TopBar
