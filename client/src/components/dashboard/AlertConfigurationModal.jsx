import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MdClose, MdNotifications, MdFilterList } from 'react-icons/md';
import insightsService from '../../services/insightsService';
import styles from './AlertConfigurationModal.module.css';

function AlertConfigurationModal({ isOpen, onClose }) {
  const [sensitivity, setSensitivity] = useState('medium');
  const [channels, setChannels] = useState(['in-app']);
  const [assetFilters, setAssetFilters] = useState([]);
  const [newAsset, setNewAsset] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch current configuration when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await insightsService.getAlertConfig();
      if (response.success && response.data) {
        setSensitivity(response.data.sensitivity || 'medium');
        setChannels(response.data.channels || ['in-app']);
        setAssetFilters(response.data.assetFilters || []);
      }
    } catch (err) {
      console.error('Error fetching alert config:', err);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await insightsService.configureAlerts({
        sensitivity,
        channels,
        assetFilters
      });

      if (response.success) {
        onClose();
      }
    } catch (err) {
      console.error('Error saving alert config:', err);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleChannelToggle = (channel) => {
    setChannels(prev => {
      if (prev.includes(channel)) {
        // Keep at least one channel selected
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== channel);
      }
      return [...prev, channel];
    });
  };

  const handleAddAsset = () => {
    const asset = newAsset.trim().toUpperCase();
    if (asset && !assetFilters.includes(asset)) {
      setAssetFilters(prev => [...prev, asset]);
      setNewAsset('');
    }
  };

  const handleRemoveAsset = (asset) => {
    setAssetFilters(prev => prev.filter(a => a !== asset));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddAsset();
    }
  };

  if (!isOpen) return null;

  // Get or create modal root element
  let modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';
    document.body.appendChild(modalRoot);
  }

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <MdNotifications />
            <h2>Alert Configuration</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <MdClose />
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Loading configuration...</div>
          ) : (
            <>
              {error && (
                <div className={styles.error}>{error}</div>
              )}

              {/* Sensitivity Settings */}
              <div className={styles.section}>
                <h3>Alert Sensitivity</h3>
                <p className={styles.description}>
                  Control how many alerts you receive based on market significance
                </p>
                <div className={styles.sensitivityOptions}>
                  <button
                    className={`${styles.sensitivityBtn} ${sensitivity === 'low' ? styles.active : ''}`}
                    onClick={() => setSensitivity('low')}
                  >
                    <span className={styles.label}>Low</span>
                    <span className={styles.sublabel}>Only critical alerts</span>
                  </button>
                  <button
                    className={`${styles.sensitivityBtn} ${sensitivity === 'medium' ? styles.active : ''}`}
                    onClick={() => setSensitivity('medium')}
                  >
                    <span className={styles.label}>Medium</span>
                    <span className={styles.sublabel}>Balanced notifications</span>
                  </button>
                  <button
                    className={`${styles.sensitivityBtn} ${sensitivity === 'high' ? styles.active : ''}`}
                    onClick={() => setSensitivity('high')}
                  >
                    <span className={styles.label}>High</span>
                    <span className={styles.sublabel}>All market movements</span>
                  </button>
                </div>
              </div>

              {/* Notification Channels */}
              <div className={styles.section}>
                <h3>Notification Channels</h3>
                <p className={styles.description}>
                  Choose how you want to receive alerts
                </p>
                <div className={styles.channelOptions}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={channels.includes('in-app')}
                      onChange={() => handleChannelToggle('in-app')}
                    />
                    <span>In-App Notifications</span>
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={channels.includes('email')}
                      onChange={() => handleChannelToggle('email')}
                    />
                    <span>Email Notifications</span>
                  </label>
                </div>
              </div>

              {/* Asset Filters */}
              <div className={styles.section}>
                <h3>
                  <MdFilterList />
                  Asset Filters
                </h3>
                <p className={styles.description}>
                  Only receive alerts for specific assets (leave empty for all assets)
                </p>
                <div className={styles.assetInput}>
                  <input
                    type="text"
                    placeholder="Enter asset symbol (e.g., BTC, ETH)"
                    value={newAsset}
                    onChange={(e) => setNewAsset(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button onClick={handleAddAsset}>Add</button>
                </div>
                {assetFilters.length > 0 && (
                  <div className={styles.assetList}>
                    {assetFilters.map(asset => (
                      <div key={asset} className={styles.assetTag}>
                        <span>{asset}</span>
                        <button onClick={() => handleRemoveAsset(asset)}>
                          <MdClose />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, modalRoot);
}

export default AlertConfigurationModal;
