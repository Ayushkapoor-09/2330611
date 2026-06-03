import React from 'react'

export default function Login({
  authToken,
  saveToken,
  setAuthToken,
  clearToken,
  authUser,
  setAuthUser,
  authPass,
  setAuthPass,
  loginWithCredentials,
  authLoading,
}) {
  return (
    <div className="auth-block">
      <label className="token-label">
        Token
        <input
          type="text"
          placeholder="Paste auth token"
          value={authToken}
          onChange={(e) => setAuthToken(e.target.value)}
        />
      </label>
      <button className="secondary-button" type="button" onClick={() => saveToken(authToken)}>
        Save Token
      </button>
      <button className="secondary-button" type="button" onClick={clearToken}>
        Clear Token
      </button>

      <div className="login-form">
        <input
          type="text"
          placeholder="Username"
          value={authUser}
          onChange={(e) => setAuthUser(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={authPass}
          onChange={(e) => setAuthPass(e.target.value)}
        />
        <button
          className="secondary-button"
          type="button"
          onClick={loginWithCredentials}
          disabled={authLoading}
        >
          {authLoading ? 'Logging in…' : 'Login'}
        </button>
      </div>
    </div>
  )
}
