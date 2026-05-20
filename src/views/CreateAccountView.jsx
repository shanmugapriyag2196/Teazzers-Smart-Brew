import { useState } from 'react';
import { saveUser } from '../utils/pineconeUserService';
import './Auth.css';

export default function CreateAccountView({ onCreated }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setMsg('Passwords do not match.'); return; }
    if (!form.fullName || !form.email || !form.password)         { setMsg('Fill in all required fields.');    return; }

    setSaving(true);
    const res = await saveUser({
      name:        form.fullName,
      email:       form.email,
      role:        form.role,
      passwordHash: form.password,
    });
    setSaving(false);

    if (res.upsertedCount > 0) {
      setMsg('');
      if (onCreated) onCreated();
    } else {
      setMsg('Failed to save account. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">&#9749;</div>
          <h1>TEAZZERS</h1>
          <span>SmartBrew Support</span>
        </div>

        <h2>Create Account</h2>
        <p>Join Teazzers SmartBrew admin team.</p>

        {msg && <div className="ca-alert">{msg}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="ca-row">
            <div className="ca-field">
              <label htmlFor="ca-name">Full Name</label>
              <input
                id="ca-name"
                type="text"
                value={form.fullName}
                onChange={update('fullName')}
                placeholder="Enter full name"
                autoComplete="name"
                required
              />
            </div>

            <div className="ca-field">
              <label htmlFor="ca-role">Role</label>
              <div className="ca-select-wrap">
                <select id="ca-role" value={form.role} onChange={update('role')}>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
                <span className="ca-select-arrow">&#9662;</span>
              </div>
            </div>
          </div>

          <div className="ca-field">
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

          <div className="ca-row">
            <div className="ca-field">
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

            <div className="ca-field">
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

          <button type="submit" className="ca-btn-primary" disabled={saving}>
            {saving ? 'Creating\u2026' : 'Create Account'}
          </button>
        </form>

        <span className="auth-btn-link" onClick={() => window.__setAuthMode?.('login')}>
          Already have an account? Sign in
        </span>
      </div>
    </div>
  );
}
