import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = '/evaluation-service/notifications'
const NOTIFICATION_TYPES = ['All', 'Placement', 'Result', 'Event']

function formatTimestamp(timestamp) {
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

function AppSimple() {
  const [notifications, setNotifications] = useState([])
  const [filterType, setFilterType] = useState('All')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || '')

  async function fetchNotifications() {
    if (!token) {
      setError('Authorization token required. Paste your token and click Save Token.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError('')

    try {
      const url = new URL(API_URL, window.location.origin)
      url.searchParams.set('limit', '200')
      url.searchParams.set('page', '1')
      if (filterType !== 'All') {
        url.searchParams.set('notification_type', filterType)
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const response = await fetch(url.toString(), { headers })
      if (!response.ok) {
        let errorMessage = `Fetch failed: ${response.status} ${response.statusText}`
        if (response.status === 401) {
          try {
            const body = await response.json()
            const details = body?.message || body?.error || ''
            errorMessage = `Unauthorized: invalid token${details ? ` — ${details}` : ''}`
          } catch {
            errorMessage = 'Unauthorized: invalid token or expired session.'
          }
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      if (!Array.isArray(data.notifications)) {
        throw new Error('Unexpected API response format')
      }

      setNotifications(data.notifications)
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'Unable to load notifications')
      setStatus('error')
    }
  }

  useEffect(() => {
    if (token) {
      fetchNotifications()
    }
  }, [filterType, token])

  const filtered = useMemo(() => {
    if (filterType === 'All') return notifications
    return notifications.filter((item) => item.Type === filterType)
  }, [filterType, notifications])

  const normalizeToken = (value) => {
    const trimmed = value.trim()
    if (trimmed.toLowerCase().startsWith('bearer ')) {
      return trimmed.slice(7).trim()
    }
    return trimmed
  }

  const saveToken = () => {
    const normalized = normalizeToken(token)
    if (!normalized) {
      setError('Please paste a valid authorization token.')
      setStatus('error')
      return
    }

    try {
      localStorage.setItem('authToken', normalized)
    } catch {}
    setToken(normalized)
    fetchNotifications()
  }

  const clearToken = () => {
    try {
      localStorage.removeItem('authToken')
    } catch {}
    setToken('')
    setNotifications([])
    setStatus('idle')
    setError('')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Company Notification Center</p>
        <h1>Corporate Notification Dashboard</h1>
        <p className="subtitle">A clean notification dashboard for company announcements and alerts.</p>
      </header>

      <section className="controls">
        <label>
          Auth token
          <input
            type="text"
            placeholder="Paste auth token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <button className="secondary-button" type="button" onClick={saveToken}>
          Save Token
        </button>
        <button className="secondary-button" type="button" onClick={clearToken}>
          Clear Token
        </button>
        <div className="notification-state">
          If you paste a full bearer header like <code>Bearer ...</code>, the app will strip the prefix and use the raw token.
        </div>
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
        <button className="secondary-button" type="button" onClick={fetchNotifications}>
          Refresh
        </button>
      </section>
      {!token && (
        <div className="notification-state">
          Paste a valid auth token and click Save Token before refreshing.
        </div>
      )}

      {status === 'loading' && <div className="notification-state">Loading...</div>}
      {status === 'error' && <div className="notification-state error">{error}</div>}

      {status === 'ready' && filtered.length === 0 && (
        <div className="notification-state">No notifications found.</div>
      )}

      {status === 'ready' && filtered.length > 0 && (
        <section className="notification-grid">
          {filtered.map((item) => (
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

export default AppSimple
