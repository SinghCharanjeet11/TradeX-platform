import { useState, useEffect, useCallback } from 'react';
import paperTradingService from '../../services/paperTradingService';
import marketService from '../../services/marketService';
import TradingTooltip from './TradingTooltip';
import styles from './PaperTradingInterface.module.css';

function PaperTradingInterface({ account, onOrderExecuted }) {
  const [orderType, setOrderType] = useState('buy');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('crypto');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [marketData, setMarketData] = useState([]);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);
  const [priceChange, setPriceChange] = useState(null);

  // CRITICAL: Safe price setter that ALWAYS validates before setting
  const setSafePrice = useCallback((newPrice) => {
    if (newPrice === '' || newPrice === null || newPrice === undefined) {
      setPrice('');
      return;
    }
    
    // Convert to string and clean
    let priceStr = String(newPrice).trim();
    
    // Check for duplicate decimals
    const decimalCount = (priceStr.match(/\./g) || []).length;
    if (decimalCount > 1) {
      console.error('[PaperTradingInterface] ❌ BLOCKED: Attempted to set price with duplicate decimals:', priceStr);
      console.error('[PaperTradingInterface] Stack trace:', new Error().stack);
      return; // BLOCK the update completely
    }
    
    // Validate it's a valid number format
    if (priceStr !== '' && !/^\d*\.?\d*$/.test(priceStr)) {
      console.error('[PaperTradingInterface] ❌ BLOCKED: Invalid price format:', priceStr);
      return;
    }
    
    console.log('[PaperTradingInterface] ✅ Safe price set:', priceStr);
    setPrice(priceStr);
  }, []);

  // Load market data based on asset type
  useEffect(() => {
    const loadMarketData = async () => {
      try {
        console.log('[PaperTradingInterface] Loading market data for:', assetType);
        let response;
        switch (assetType) {
          case 'crypto':
            response = await marketService.getCryptoData();
            break;
          case 'stocks':
            response = await marketService.getStocksData();
            break;
          case 'forex':
            response = await marketService.getForexData();
            break;
          case 'commodities':
            response = await marketService.getCommoditiesData();
            break;
          default:
            return;
        }
        
        if (response.success && response.data) {
          console.log('[PaperTradingInterface] Market data loaded:', {
            assetType,
            count: response.data.length,
            sample: response.data.slice(0, 3).map(d => ({
              symbol: d.symbol,
              name: d.name,
              price: d.price,
              priceType: typeof d.price
            }))
          });
          
          // Backend already filters invalid prices, so we can use the data directly
          setMarketData(response.data);
          
          if (response.data.length === 0) {
            console.error('[PaperTradingInterface] ❌ NO MARKET DATA! API returned empty array.');
            setPriceError('Market data unavailable. Please try again later.');
          }
        } else {
          console.error('[PaperTradingInterface] Failed to load market data:', response);
          setPriceError('Failed to load market data');
        }
      } catch (error) {
        console.error('[PaperTradingInterface] Error loading market data:', error);
        setPriceError('Error loading market data');
      }
    };

    loadMarketData();
  }, [assetType]);

  // Refresh current price for selected symbol
  const refreshCurrentPrice = useCallback(async () => {
    if (!symbol || symbol.length < 2) {
      return;
    }

    const upperSymbol = symbol.toUpperCase().trim();
    const matchingAsset = marketData.find(asset => {
      const assetSymbol = (asset.symbol || '').toUpperCase().trim();
      const assetId = (asset.id || '').toUpperCase().trim();
      const symbolWithoutSlash = assetSymbol.replace('/', '');
      const searchWithoutSlash = upperSymbol.replace('/', '');
      
      return assetSymbol === upperSymbol || 
             assetId === upperSymbol || 
             symbolWithoutSlash === searchWithoutSlash ||
             assetSymbol.includes(upperSymbol) ||
             upperSymbol.includes(assetSymbol);
    });

    if (matchingAsset) {
      setPriceLoading(true);
      try {
        // Price is already sanitized from market data
        const priceValue = matchingAsset.price;
        
        console.log('[PaperTradingInterface] Refresh - using sanitized price:', priceValue, typeof priceValue);
        
        if (typeof priceValue === 'number' && priceValue > 0) {
          const oldPrice = parseFloat(price) || 0;
          
          // CRITICAL: Convert to string with fixed precision to prevent concatenation
          // Use toFixed to ensure clean decimal representation
          let formattedPrice;
          if (priceValue < 0.01) {
            formattedPrice = priceValue.toFixed(8).replace(/\.?0+$/, '');
          } else if (priceValue < 1) {
            formattedPrice = priceValue.toFixed(6).replace(/\.?0+$/, '');
          } else {
            formattedPrice = priceValue.toFixed(2);
          }
          
          // Double-check for duplicate decimals before setting
          const decimalCount = (formattedPrice.match(/\./g) || []).length;
          if (decimalCount > 1) {
            console.error('[PaperTradingInterface] ❌ CRITICAL: Formatted price has duplicate decimals:', formattedPrice);
            setPriceError('Price formatting error - please enter manually');
            return;
          }
          
          // Calculate price change
          if (oldPrice > 0) {
            const change = ((priceValue - oldPrice) / oldPrice) * 100;
            setPriceChange(change);
          }
          
          console.log('[PaperTradingInterface] Refresh - final price:', formattedPrice);
          setSafePrice(formattedPrice);
          setLastPriceUpdate(new Date());
          setPriceError('');
        } else {
          setPriceError('Invalid price data - please enter manually');
        }
      } catch (error) {
        console.error('[PaperTradingInterface] Error refreshing price:', error);
        setPriceError('Could not fetch current price');
      } finally {
        setPriceLoading(false);
      }
    }
  }, [symbol, marketData, price]);

  // Auto-fill price when symbol changes
  const handleSymbolChange = useCallback(async (value) => {
    setSymbol(value);
    setPriceError('');
    setPriceChange(null);
    
    if (!value || value.length < 2) {
      setSafePrice('');
      setName('');
      setLastPriceUpdate(null);
      return;
    }

    // Try to find matching asset in market data
    const upperSymbol = value.toUpperCase().trim();
    const matchingAsset = marketData.find(asset => {
      const assetSymbol = (asset.symbol || '').toUpperCase().trim();
      const assetId = (asset.id || '').toUpperCase().trim();
      
      // For forex pairs, also check without the slash (e.g., EURUSD matches EUR/USD)
      const symbolWithoutSlash = assetSymbol.replace('/', '');
      const searchWithoutSlash = upperSymbol.replace('/', '');
      
      return assetSymbol === upperSymbol || 
             assetId === upperSymbol || 
             symbolWithoutSlash === searchWithoutSlash ||
             assetSymbol.includes(upperSymbol) ||
             upperSymbol.includes(assetSymbol);
    });

    console.log('[PaperTradingInterface] Symbol search:', {
      searchSymbol: upperSymbol,
      assetType,
      marketDataCount: marketData.length,
      matchingAsset: matchingAsset ? {
        symbol: matchingAsset.symbol,
        name: matchingAsset.name,
        price: matchingAsset.price,
        priceType: typeof matchingAsset.price
      } : null
    });

    if (matchingAsset) {
      setPriceLoading(true);
      try {
        // Price is already sanitized from market data
        const priceValue = matchingAsset.price;
        
        console.log('[PaperTradingInterface] Using sanitized price from market data:', priceValue, typeof priceValue);
        
        if (typeof priceValue === 'number' && priceValue > 0) {
          // CRITICAL: Convert to string with fixed precision to prevent concatenation
          // Use toFixed to ensure clean decimal representation
          let formattedPrice;
          if (priceValue < 0.01) {
            formattedPrice = priceValue.toFixed(8).replace(/\.?0+$/, '');
          } else if (priceValue < 1) {
            formattedPrice = priceValue.toFixed(6).replace(/\.?0+$/, '');
          } else {
            formattedPrice = priceValue.toFixed(2);
          }
          
          // Double-check for duplicate decimals before setting
          const decimalCount = (formattedPrice.match(/\./g) || []).length;
          if (decimalCount > 1) {
            console.error('[PaperTradingInterface] ❌ CRITICAL: Formatted price has duplicate decimals:', formattedPrice);
            setPriceError('Price formatting error - please enter manually');
            return;
          }
          
          console.log('[PaperTradingInterface] Final formatted price:', formattedPrice);
          setSafePrice(formattedPrice);
          setName(matchingAsset.name || '');
          setLastPriceUpdate(new Date());
          setPriceError('');
          console.log('[PaperTradingInterface] Auto-filled successfully:', { 
            symbol: upperSymbol, 
            price: formattedPrice, 
            name: matchingAsset.name 
          });
        } else {
          console.error('[PaperTradingInterface] Invalid price after sanitization:', matchingAsset.price);
          setPriceError('Invalid price data - please enter manually');
        }
      } catch (error) {
        console.error('[PaperTradingInterface] Error auto-filling price:', error);
        setPriceError('Could not fetch current price');
      } finally {
        setPriceLoading(false);
      }
    } else {
      console.log('[PaperTradingInterface] No matching asset found for:', upperSymbol);
    }
  }, [marketData, assetType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!symbol || !name || !quantity || !price) {
      setError('Please fill in all fields');
      return;
    }

    // Strict validation - check for duplicate decimals BEFORE parsing
    const qtyStr = String(quantity).trim();
    const prcStr = String(price).trim();
    
    const qtyDecimalCount = (qtyStr.match(/\./g) || []).length;
    const prcDecimalCount = (prcStr.match(/\./g) || []).length;
    
    if (qtyDecimalCount > 1) {
      setError(`Invalid quantity format: "${qtyStr}". Contains multiple decimal points.`);
      console.error('[PaperTradingInterface] Quantity has multiple decimals:', qtyStr);
      return;
    }
    
    if (prcDecimalCount > 1) {
      setError(`Invalid price format: "${prcStr}". Contains multiple decimal points.`);
      console.error('[PaperTradingInterface] Price has multiple decimals:', prcStr);
      return;
    }

    // Parse to numbers - use Number() for strict parsing
    const qty = Number(qtyStr);
    const prc = Number(prcStr);

    console.log('[PaperTradingInterface] Form submission:', {
      symbol,
      name,
      assetType,
      orderType,
      quantity: qty,
      price: prc,
      quantityRaw: qtyStr,
      priceRaw: prcStr,
      quantityType: typeof qty,
      priceType: typeof prc
    });

    // CRITICAL: Validate parsed numbers
    if (isNaN(qty) || qty <= 0 || !isFinite(qty)) {
      console.error('[PaperTradingInterface] Invalid quantity:', { qty, qtyStr });
      setError('Quantity must be a valid positive number');
      return;
    }

    if (isNaN(prc) || prc <= 0 || !isFinite(prc)) {
      console.error('[PaperTradingInterface] Invalid price:', { prc, prcStr });
      setError('Price must be a valid positive number');
      return;
    }

    // CRITICAL: Final check - convert back to string and verify no duplicate decimals
    const finalQtyStr = String(qty);
    const finalPrcStr = String(prc);
    
    const finalQtyDecimals = (finalQtyStr.match(/\./g) || []).length;
    const finalPrcDecimals = (finalPrcStr.match(/\./g) || []).length;
    
    if (finalQtyDecimals > 1) {
      console.error('[PaperTradingInterface] ❌ CRITICAL: Quantity has duplicate decimals after parsing:', {
        original: qtyStr,
        parsed: qty,
        stringified: finalQtyStr
      });
      setError('Invalid quantity format detected. Please refresh the page and try again.');
      return;
    }
    
    if (finalPrcDecimals > 1) {
      console.error('[PaperTradingInterface] ❌ CRITICAL: Price has duplicate decimals after parsing:', {
        original: prcStr,
        parsed: prc,
        stringified: finalPrcStr
      });
      setError('Invalid price format detected. Please refresh the page and try again.');
      return;
    }

    const totalCost = qty * prc;

    if (orderType === 'buy' && totalCost > account?.currentBalance) {
      setError(`Insufficient balance. Required: $${totalCost.toFixed(2)}, Available: $${account.currentBalance.toFixed(2)}`);
      return;
    }

    try {
      setLoading(true);
      
      // CRITICAL: Log the exact data being sent
      console.log('[PaperTradingInterface] ===== SENDING ORDER TO API =====');
      console.log('[PaperTradingInterface] Order data:', {
        symbol: symbol.toUpperCase().trim(),
        name: name.trim(),
        assetType,
        orderType,
        quantity: qty,
        price: prc,
        quantityType: typeof qty,
        priceType: typeof prc
      });
      
      const response = await paperTradingService.executePaperOrder({
        symbol: symbol.toUpperCase().trim(),
        name: name.trim(),
        assetType,
        orderType,
        quantity: qty,
        price: prc
      });

      console.log('[PaperTradingInterface] ===== ORDER RESPONSE =====');
      console.log('[PaperTradingInterface] Response:', response);

      if (response.success) {
        setSuccess(`${orderType === 'buy' ? 'Bought' : 'Sold'} ${qty} ${symbol.toUpperCase()} at $${prc.toFixed(2)}`);
        // Reset form
        setSymbol('');
        setName('');
        setQuantity('');
        setSafePrice('');
        setPriceError('');
        setLastPriceUpdate(null);
        setPriceChange(null);
        // Notify parent
        if (onOrderExecuted) {
          onOrderExecuted();
        }
      }
    } catch (error) {
      console.error('[PaperTradingInterface] Order execution error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to execute order');
    } finally {
      setLoading(false);
    }
  };

  const totalValue = quantity && price ? (parseFloat(quantity) * parseFloat(price)) : 0;
  
  // Format total value with proper decimal places
  const formatTotalValue = (value) => {
    if (value === 0) return '0.00';
    if (value < 0.01) return value.toFixed(8).replace(/\.?0+$/, '');
    if (value < 1) return value.toFixed(6).replace(/\.?0+$/, '');
    return value.toFixed(2);
  };
  
  // Format last update time
  const formatLastUpdate = () => {
    if (!lastPriceUpdate) return '';
    const now = new Date();
    const diff = Math.floor((now - lastPriceUpdate) / 1000); // seconds
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastPriceUpdate.toLocaleTimeString();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Place Order</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.orderTypeToggle}>
          <button
            type="button"
            className={`${styles.toggleButton} ${orderType === 'buy' ? styles.active : ''}`}
            onClick={() => setOrderType('buy')}
          >
            Buy
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${orderType === 'sell' ? styles.active : ''}`}
            onClick={() => setOrderType('sell')}
          >
            Sell
          </button>
        </div>

        <div className={styles.formGroup}>
          <TradingTooltip concept="assetTypes">
            <label className={styles.label}>Asset Type</label>
          </TradingTooltip>
          <select
            className={styles.select}
            value={assetType}
            onChange={(e) => {
              setAssetType(e.target.value);
              // Reset form when changing asset type
              setSymbol('');
              setName('');
              setSafePrice('');
              setPriceError('');
            }}
          >
            <option value="crypto">Cryptocurrency</option>
            <option value="stocks">Stocks</option>
            <option value="forex">Forex</option>
            <option value="commodities">Commodities</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Symbol
            {priceLoading && <span className={styles.loadingIndicator}> (Loading price...)</span>}
          </label>
          <div className={styles.inputWithButton}>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g., BTC, AAPL, EUR/USD"
              value={symbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
            />
            {symbol && symbol.length >= 2 && (
              <button
                type="button"
                className={styles.refreshButton}
                onClick={refreshCurrentPrice}
                disabled={priceLoading}
                title="Refresh current price"
              >
                🔄
              </button>
            )}
          </div>
          {priceError && <div className={styles.priceError}>{priceError}</div>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Name</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g., Bitcoin, Apple Inc."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <TradingTooltip concept="quantity">
            <label className={styles.label}>Quantity</label>
          </TradingTooltip>
          <input
            type="text"
            inputMode="decimal"
            className={styles.input}
            placeholder="0.00"
            value={quantity}
            onChange={(e) => {
              let value = e.target.value;
              console.log('[PaperTradingInterface] Quantity input raw:', value);
              
              // Remove any non-numeric characters except decimal point
              value = value.replace(/[^0-9.]/g, '');
              
              // Count decimal points - if more than one, reject the entire input
              const decimalCount = (value.match(/\./g) || []).length;
              if (decimalCount > 1) {
                console.warn('[PaperTradingInterface] Quantity rejected - multiple decimals:', value);
                return; // Don't update state at all
              }
              
              // Only allow valid decimal format
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                console.log('[PaperTradingInterface] Quantity validated:', value);
                setQuantity(value);
              } else {
                console.warn('[PaperTradingInterface] Quantity rejected - invalid format:', value);
              }
            }}
          />
        </div>

        <div className={styles.formGroup}>
          <TradingTooltip concept="marketPrice">
            <label className={styles.label}>
              Price (USD)
              {price && lastPriceUpdate && (
                <span className={styles.priceInfo}>
                  <span className={styles.autoFilled}> ✓ Live</span>
                  {priceChange !== null && (
                    <span className={priceChange >= 0 ? styles.priceUp : styles.priceDown}>
                      {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
                    </span>
                  )}
                  <span className={styles.lastUpdate}> • {formatLastUpdate()}</span>
                </span>
              )}
            </label>
          </TradingTooltip>
          <input
            type="text"
            inputMode="decimal"
            className={styles.input}
            placeholder="0.00"
            value={price}
            onChange={(e) => {
              let value = e.target.value;
              console.log('[PaperTradingInterface] Price input raw:', value);
              
              // Remove any non-numeric characters except decimal point
              value = value.replace(/[^0-9.]/g, '');
              
              // Count decimal points - if more than one, reject the entire input
              const decimalCount = (value.match(/\./g) || []).length;
              if (decimalCount > 1) {
                console.warn('[PaperTradingInterface] Price rejected - multiple decimals:', value);
                return; // Don't update state at all
              }
              
              // Only allow valid decimal format
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                console.log('[PaperTradingInterface] Price validated:', value);
                setSafePrice(value);
                setPriceChange(null); // Reset change indicator when manually editing
              } else {
                console.warn('[PaperTradingInterface] Price rejected - invalid format:', value);
              }
            }}
          />
        </div>

        <div className={styles.totalValue}>
          <TradingTooltip concept="totalCost">
            <span className={styles.totalLabel}>
              {orderType === 'buy' ? 'Total Cost:' : 'Total Proceeds:'}
            </span>
          </TradingTooltip>
          <span className={`${styles.totalAmount} ${orderType === 'buy' ? styles.buyAmount : styles.sellAmount}`}>
            ${formatTotalValue(totalValue)}
          </span>
          {quantity && price && totalValue > 0 && (
            <span className={styles.breakdown}>
              {parseFloat(quantity).toFixed(8).replace(/\.?0+$/, '')} × ${parseFloat(price).toFixed(8).replace(/\.?0+$/, '')} = ${formatTotalValue(totalValue)}
            </span>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <button
          type="submit"
          className={`${styles.submitButton} ${orderType === 'buy' ? styles.buyButton : styles.sellButton}`}
          disabled={loading || priceLoading}
        >
          {loading ? 'Processing...' : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${symbol.toUpperCase() || 'Asset'}`}
        </button>

        <div className={styles.virtualNote}>
          💡 This is virtual money. Practice without risk!
        </div>
      </form>
    </div>
  );
}

export default PaperTradingInterface;
