import { useState } from 'react';
import './Auth.css';

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password && onLogin) onLogin(email, password);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">☕</div>
          <h1>TEAZZERS</h1>
          <span>SmartBrew Support</span>
        </div>

        <h2>Welcome Back</h2>
        <p>Sign in to access your admin dashboard.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
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
          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="auth-btn-primary">
            Sign In
          </button>
        </form>

        <a className="auth-btn-link" onClick={() => window.__setAuthMode?.('create')}>
          Don't have an account? Create one
        </a>
      </div>
    </div>
  );
}
