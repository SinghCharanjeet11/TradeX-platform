import { useState, useEffect } from 'react'
import { MdDevices, MdLocationOn, MdAccessTime, MdDelete, MdComputer, MdPhoneAndroid, MdTablet, MdCheckCircle } from 'react-icons/md'
import api from '../../services/api'
import styles from './SessionList.module.css'

function SessionList() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [terminatingId, setTerminatingId] = useState(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions')
      setSessions(response.data.sessions || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
      setError('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const terminateSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to terminate this session?')) {
      return
    }

    setTerminatingId(sessionId)
    setError('')
    
    try {
      await api.delete(`/sessions/${sessionId}`)
      
      // Remove session from list
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch (error) {
      console.error('Error terminating session:', error)
      setError('Failed to terminate session')
    } finally {
      setTerminatingId(null)
    }
  }

  const terminateAllOtherSessions = async () => {
    if (!window.confirm('This will sign you out of all other devices. Continue?')) {
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await api.delete('/sessions/others/all')
      
      // Refresh sessions list
      await fetchSessions()
      
      setError(`Successfully terminated ${response.data.terminatedCount} session(s)`)
      setTimeout(() => setError(''), 3000)
    } catch (error) {
      console.error('Error terminating sessions:', error)
      setError('Failed to terminate sessions')
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <MdPhoneAndroid />
      case 'tablet':
        return <MdTablet />
      default:
        return <MdComputer />
    }
  }

  const formatLastActivity = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>Active Sessions</h3>
          <p>Loading sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3>Active Sessions</h3>
          <p>Manage your active sessions across all devices</p>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={terminateAllOtherSessions}
            className={styles.terminateAllBtn}
            disabled={loading}
          >
            Sign Out All Other Devices
          </button>
        )}
      </div>

      {error && (
        <div className={styles.message}>
          {error}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className={styles.emptyState}>
          <MdDevices />
          <p>No active sessions found</p>
        </div>
      ) : (
        <div className={styles.sessionsList}>
          {sessions.map((session) => (
            <div 
              key={session.id} 
              className={`${styles.sessionCard} ${session.isCurrent ? styles.currentSession : ''}`}
            >
              <div className={styles.sessionIcon}>
                {getDeviceIcon(session.deviceType)}
              </div>
              
              <div className={styles.sessionInfo}>
                <div className={styles.sessionHeader}>
                  <h4>
                    {session.browser || 'Unknown Browser'}
                    {session.isCurrent && (
                      <span className={styles.currentBadge}>
                        <MdCheckCircle /> Current Session
                      </span>
                    )}
                  </h4>
                  <p className={styles.deviceDetails}>
                    {session.os || 'Unknown OS'} • {session.deviceType || 'Desktop'}
                  </p>
                </div>
                
                <div className={styles.sessionMeta}>
                  <div className={styles.metaItem}>
                    <MdLocationOn />
                    <span>{session.location || 'Unknown Location'}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.ipAddress}>{session.ipAddress}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <MdAccessTime />
                    <span>{formatLastActivity(session.lastActivity)}</span>
                  </div>
                </div>
              </div>
              
              {!session.isCurrent && (
                <button
                  onClick={() => terminateSession(session.id)}
                  className={styles.terminateBtn}
                  disabled={terminatingId === session.id}
                  aria-label="Terminate session"
                >
                  {terminatingId === session.id ? (
                    <div className={styles.spinner}></div>
                  ) : (
                    <MdDelete />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SessionList
