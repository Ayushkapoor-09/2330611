import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = '/evaluation-service/notifications'
const NOTIFICATION_TYPES = ['All', 'Placement', 'Result', 'Event']

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function App() {
  const [notifications, setNotifications] = useState([])
  const [filterType, setFilterType] = useState('All')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || '')

  const fetchNotifications = async () => {
    setStatus('loading')
    setError('')

    try {
      const url = new URL(API_URL, window.location.origin)
      url.searchParams.set('limit', '200')
      url.searchParams.set('page', '1')
      if (filterType !== 'All') {
        url.searchParams.set('notification_type', filterType)
      }

      const headers = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(url.toString(), { headers })
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (!Array.isArray(data.notifications)) {
        throw new Error('Unexpected API response format')
      }

      setNotifications(data.notifications)
      setStatus('ready')
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to load notifications')
      setStatus('error')
    }
  }

  useEffect(() => {
    fetchNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType])

  const visibleNotifications = useMemo(() => {
    return filterType === 'All'
      ? notifications
      : notifications.filter((item) => item.Type === filterType)
  }, [filterType, notifications])

  const clearToken = () => {
    try {
      localStorage.removeItem('authToken')
    } catch {}
    setToken('')
  }

  const saveToken = () => {
    try {
      localStorage.setItem('authToken', token)
    } catch {}
    fetchNotifications()
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Campus Notification Center</p>
        <h1>Notifications</h1>
        <p className="subtitle">Simple React notification app for beginner practice.</p>
      </header>

      <section className="controls">
        <label>
          Token
          <input
            type="text"
            placeholder="Paste auth token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <button type="button" onClick={saveToken} className="secondary-button">
          Save Token
        </button>
        <button type="button" onClick={clearToken} className="secondary-button">
          Clear Token
        </button>
        <label>
          Filter type
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            {NOTIFICATION_TYPES.map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={fetchNotifications} className="secondary-button">
          Refresh
        </button>
      </section>

      {status === 'loading' && <div className="notification-state">Loading...</div>}
      {status === 'error' && <div className="notification-state error">{error}</div>}

      {status === 'ready' && visibleNotifications.length === 0 && (
        <div className="notification-state">No notifications found.</div>
      )}

      {status === 'ready' && visibleNotifications.length > 0 && (
        <section className="notification-grid">
          {visibleNotifications.map((item) => (
            <article key={item.ID} className="notification-card">
              <div className="card-header">
                <strong>{item.Type}</strong>
                <span>{formatTimestamp(item.Timestamp)}</span>
              </div>
              <p>{item.Message}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

export default App

  const fetchNotifications = async () => {
    setStatus('loading')
    setError('')

    try {
      const url = new URL(API_URL, window.location.origin)
      url.searchParams.set('limit', '200')
      url.searchParams.set('page', '1')
      if (filterType !== 'All') {
        url.searchParams.set('notification_type', filterType)
      }

      let token = authToken || localStorage.getItem('authToken')
      // if token looks like a JWT and is expired, attempt refresh
      if (token && token.split('.').length === 3 && isTokenExpired(token)) {
        const ok = await tryRefreshToken()
        if (ok) {
          token = localStorage.getItem('authToken')
        }
      }
      const headers = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(url.toString(), {
        headers,
      })

      if (response.status === 401) {
        // surface server message when available
        let body = ''
        try {
          const json = await response.json()
          body = json.message ? ` — ${json.message}` : ''
        } catch {}
        throw new Error('Fetch failed: 401 Unauthorized' + body)
      }

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (!Array.isArray(data.notifications)) {
        throw new Error('Unexpected API response format')
      }

      setNotifications(data.notifications)
      setStatus('ready')
    } catch (fetchError) {
      const msg = fetchError.message || 'Unable to load notifications'
      setError(msg)
      if (msg.includes('401')) {
        setStatus('unauthorized')
      } else {
        setStatus('error')
      }
    }
  }

  useEffect(() => {
    fetchNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType])

  useEffect(() => {
    saveSeenIds(seenIds)
  }, [seenIds])

  const visibleNotifications = useMemo(() => {
    return filterType === 'All'
      ? notifications
      : notifications.filter((item) => item.Type === filterType)
  }, [filterType, notifications])

  const priorityNotifications = useMemo(() => {
    return [...visibleNotifications].sort(sortByPriority).slice(0, priorityLimit)
  }, [visibleNotifications, priorityLimit])

  const newCount = visibleNotifications.filter((item) => !seenIds.has(item.ID)).length
  const priorityNewCount = priorityNotifications.filter((item) => !seenIds.has(item.ID)).length

  const markNotificationViewed = (id) => {
    setSeenIds((current) => {
      const updated = new Set(current)
      updated.add(id)
      return updated
    })
  }

  const markAllViewed = () => {
    setSeenIds((current) => {
      const updated = new Set(current)
      visibleNotifications.forEach((item) => updated.add(item.ID))
      return updated
    })
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const saveToken = (token) => {
    try {
      localStorage.setItem('authToken', token)
    } catch {}
    setAuthToken(token)
    // After storing a token, immediately refresh notifications
    try {
      fetchNotifications()
    } catch {}
  }

  const saveRefreshToken = (rToken) => {
    try {
      localStorage.setItem('refreshToken', rToken)
    } catch {}
    setRefreshToken(rToken)
  }

  const clearToken = () => {
    try {
      localStorage.removeItem('authToken')
    } catch {}
    setAuthToken('')
    try {
      localStorage.removeItem('refreshToken')
    } catch {}
    setRefreshToken('')
    // Clear notifications and errors when logging out
    setNotifications([])
    setStatus('idle')
    setError('')
  }

  const loginWithCredentials = async () => {
    setAuthLoading(true)
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUser, password: authPass }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Login failed: ${res.status}`)
      }

      const json = await res.json()
      const token = json.token || json.accessToken || json.jwt || ''
      const rToken = json.refreshToken || json.refresh_token || ''
      if (!token) throw new Error('No token in login response')
      saveToken(token)
      if (rToken) saveRefreshToken(rToken)
      setAuthPass('')
    } catch (e) {
      // surface login error in UI
      setError(e.message)
      setStatus('error')
    } finally {
      setAuthLoading(false)
    }
  }

  const displayedNotifications = activeTab === 'all' ? visibleNotifications : priorityNotifications

  const useMockData = () => {
    setNotifications(SAMPLE_NOTIFICATIONS)
    setStatus('ready')
    setError('')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Campus Notification Center</p>
          <h1>Notifications & Priority Inbox</h1>
          <p className="subtitle">
            Responsive React notification dashboard with type filters, top priority inbox, and viewed-state tracking.
          </p>
        </div>
        <div className="auth-status">
          {authToken ? (
            <div>
              <span>Signed in</span>
              <button type="button" onClick={clearToken} className="secondary-button">
                Logout
              </button>
            </div>
          ) : (
            <span>Not signed in</span>
          )}
        </div>
      </header>

      <div className="summary-grid">
        <div className="summary-card">
          <span>Total loaded</span>
          <strong>{visibleNotifications.length}</strong>
        </div>
        <div className="summary-card">
          <span>New items</span>
          <strong>{newCount}</strong>
        </div>
        <div className="summary-card">
          <span>Priority top</span>
          <strong>{priorityLimit}</strong>
        </div>
      </div>

      <div className="action-bar">
        <div className="tabs" role="tablist" aria-label="Notification pages">
          <button
            type="button"
            className={activeTab === 'priority' ? 'tab active' : 'tab'}
            onClick={() => handleTabChange('priority')}
          >
            Priority Inbox
          </button>
          <button
            type="button"
            className={activeTab === 'all' ? 'tab active' : 'tab'}
            onClick={() => handleTabChange('all')}
          >
            All Notifications
          </button>
        </div>

        <div className="controls-row">
          <Login
            authToken={authToken}
            setAuthToken={setAuthToken}
            saveToken={saveToken}
            clearToken={clearToken}
            authUser={authUser}
            setAuthUser={setAuthUser}
            authPass={authPass}
            setAuthPass={setAuthPass}
            loginWithCredentials={loginWithCredentials}
            authLoading={authLoading}
          />
          <label>
            Filter type
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
              {NOTIFICATION_TYPES.map((type) => (
                <option value={type} key={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            Priority count
            <input
              type="number"
              min="3"
              max="20"
              value={priorityLimit}
              onChange={(event) => setPriorityLimit(Number(event.target.value))}
            />
          </label>

          <button className="secondary-button" type="button" onClick={markAllViewed}>
            Mark viewed
          </button>

          <button className="secondary-button" type="button" onClick={fetchNotifications}>
            Refresh
          </button>
        </div>
      </div>

      {status === 'loading' && (
        <div className="notification-state">Loading notifications...</div>
      )}
      {(status === 'error' || status === 'unauthorized') && (
        <div className={`notification-state ${status === 'unauthorized' ? 'unauthorized' : 'error'}`}>
          <p>{error}</p>
          {status === 'unauthorized' ? (
            <div>
              <p>Please provide a valid token or login below.</p>
              <button type="button" onClick={() => { clearToken(); setStatus('idle'); }}>
                Clear token
              </button>
              <button type="button" onClick={useMockData}>
                Use mock data
              </button>
              <button type="button" onClick={fetchNotifications}>
                Retry
              </button>
            </div>
          ) : (
            <button type="button" onClick={fetchNotifications}>
              Retry
            </button>
          )}
        </div>
      )}

      {status === 'ready' && (
        <main className="notification-page">
          <section className="section-header">
            <div>
              <h2>{activeTab === 'all' ? 'All Notifications' : 'Priority Inbox'}</h2>
              <p>
                {activeTab === 'all'
                  ? 'Display all notifications from the service with viewed state and type tags.'
                  : 'Top notifications are ordered by placement > result > event and by latest timestamp.'}
              </p>
            </div>
            <div className="status-pill">
              <span>{activeTab === 'all' ? newCount : priorityNewCount} new</span>
              <span>{displayedNotifications.length} shown</span>
            </div>
          </section>

          {displayedNotifications.length === 0 ? (
            <div className="empty-state">
              No notifications available for the selected type.
            </div>
          ) : (
            <section className="notification-grid">
              {displayedNotifications.map((notification) => {
                const isNew = !seenIds.has(notification.ID)
                return (
                  <article key={notification.ID} className={isNew ? 'notification-card new' : 'notification-card'}>
                    <div className="card-header">
                      <span className={`badge badge-${notification.Type.toLowerCase()}`}>
                        {notification.Type}
                      </span>
                      {isNew ? <span className="badge new-badge">New</span> : null}
                    </div>
                    <h3>{notification.Message}</h3>
                    <p className="notification-meta">
                      <span>{formatTimestamp(notification.Timestamp)}</span>
                      <span>Score {computePriorityScore(notification)}</span>
                    </p>
                    <div className="card-footer">
                      <button type="button" onClick={() => markNotificationViewed(notification.ID)}>
                        Mark viewed
                      </button>
                    </div>
                  </article>
                )
              })}
            </section>
          )}
        </main>
      )}

      <aside className="explanation-panel">
        <h2>Priority algorithm</h2>
        <p>
          Notifications are prioritized by type weight (Placement {'>'} Result {'>'} Event) and by recency. The top
          notifications are selected from the loaded feed and displayed in the priority inbox.
        </p>
        <p>
          Viewed notifications are persisted in local storage so the app can distinguish new vs viewed items across
          sessions.
        </p>
      </aside>
    </div>
  )
}

export default App
