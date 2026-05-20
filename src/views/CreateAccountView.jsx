import { useState } from 'react';
import './Auth.css';

export default function CreateAccountView({ onCreated }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'user',
    password: '',
    confirmPassword: '',
  });

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return;
    if (!form.fullName || !form.email) return;
    if (onCreated) onCreated(form);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">☕</div>
          <h1>TEAZZERS</h1>
          <span>SmartBrew Support</span>
        </div>

        <h2>Create New Account</h2>
        <p>Get started with Teazzers Smart Brew admin.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field-row">
            <div className="auth-field">
              <label htmlFor="ca-fullname">Full Name</label>
              <input
                id="ca-fullname"
                type="text"
                value={form.fullName}
                onChange={update('fullName')}
                placeholder="Enter full name"
                autoComplete="name"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="ca-role">Role</label>
              <select
                id="ca-role"
                value={form.role}
                onChange={update('role')}
              >
                <option value="admin">Admin</option>
                <option value="technician">Technician</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="ca-email">Email Address</label>
            <input
              id="ca-email"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@teazzers.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="ca-phone">Phone Number</label>
            <input
              id="ca-phone"
              type="tel"
              value={form.phone}
              onChange={update('phone')}
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />
          </div>

          <div className="auth-field-row">
            <div className="auth-field">
              <label htmlFor="ca-password">Password</label>
              <input
                id="ca-password"
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="ca-confirm">Confirm Password</label>
              <input
                id="ca-confirm"
                type="password"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-btn-primary">
            Create Account
          </button>
        </form>

        <a className="auth-btn-link" onClick={() => window.__setAuthMode?.('login')}>
          Already have an account? Sign in
        </a>
      </div>
    </div>
  );
}
