import { useState } from 'react';
import './Auth.css';

export default function LoginView({ onLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [saving,   setSaving]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setSaving(true);
    // tiny pause so the loading state is visible even on instant logins
    await new Promise(r => setTimeout(r, 400));
    if (onLogin) onLogin(email, password);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">&#9749;</div>
          <h1>TEAZZERS</h1>
          <span>SmartBrew Support</span>
        </div>

        <h2>Welcome Back</h2>
        <p>Sign in to your admin workspace.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* ── Email ─────────────────────────────────────────────────── */}
          <div className="ca-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@teazzers.com"
              autoComplete="email"
              required
            />
          </div>

          {/* ── Password (with toggle) ────────────────────────────────── */}
          <div className="ca-field">
            <label htmlFor="login-password">Password</label>
            <div className="login-pw-wrap">
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-pw-toggle"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {/*{showPw ? '&#x1F441;' : '&#x1F50D;'}*/}
              </button>
            </div>
          </div>

          {/* ── Submit ────────────────────────────────────────────────── */}
          <button type="submit" className="ca-btn-primary" disabled={saving}>
            {saving ? 'Signing in\u2026' : 'Sign In'}
          </button>
        </form>

        <span className="auth-btn-link" onClick={() => window.__setAuthMode?.('create')}>
          Don't have an account? Create one
        </span>
      </div>
    </div>
  );
}
