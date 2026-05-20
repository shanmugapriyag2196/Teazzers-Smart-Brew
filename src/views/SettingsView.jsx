import { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { updateUser } from '../utils/pineconeUserService';
import './SettingsView.css';

export default function SettingsView({ onSaved }) {
  const { user, setUser } = useUser();

  const [form, setForm] = useState({
    name:       '',
    email:      '',
    role:       'user',
    currPass:   '',
    newPass:    '',
    confirmPass:'',
  });
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const syncedRef = useRef(null);

  // Pre-fill on first mount when `user` is confirmed
  useEffect(() => {
    if (user && syncedRef.current !== user.id) {
      syncedRef.current = user.id;
      setForm({
        name:        user.name  || '',
        email:       user.email || '',
        role:        user.role  || 'user',
        currPass:    '',
        newPass:    '',
        confirmPass:'',
      });
    }
  }, [user]);

  const update = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setMsg('Name and Email are required.'); return; }
    if (form.newPass && form.newPass !== form.confirmPass) { setMsg('Passwords do not match.'); return; }

    setSaving(true);
    const patch = {
      id:           user.id,
      name:         form.name.trim(),
      email:        form.email.trim(),
      role:         form.role,
      passwordHash: form.newPass || user.passwordHash || form.currPass,
    };
    const res = await updateUser(patch);
    setSaving(false);

    if (res.upsertedCount > 0) {
      setUser({ ...user, ...patch });
      setForm(prev => ({ ...prev, currPass: '', newPass: '', confirmPass: '' }));
      setMsg('✓ Profile saved successfully.');
      if (onSaved) onSaved();
      setTimeout(() => setMsg(''), 3000);
    } else {
      setMsg('Failed to save. Check your password and try again.');
    }
  };

  if (!user) {
    return (
      <div className="sv-loading">
        <div className="sv-spinner" />
      </div>
    );
  }

  return (
    <div className="sv">
      <div className="sv-card">
        <div className="sv-card-head">
          <h2>Account Settings</h2>
          <p>Manage your profile and security.</p>
        </div>

        {msg && <div className={`sv-msg ${msg.startsWith('✓') ? 'sv-msg-ok' : 'sv-msg-err'}`}>{msg}</div>}

        <form className="sv-form" onSubmit={handleSubmit}>

          {/* ── Name ────────────────────────────────────────────────────── */}
          <div className="sv-field">
            <label htmlFor="sv-name">Full Name</label>
            <input id="sv-name" type="text" value={form.name} onChange={update('name')} placeholder="Full name" required />
          </div>

          {/* ── Email ───────────────────────────────────────────────────── */}
          <div className="sv-field">
            <label htmlFor="sv-email">Email Address</label>
            <input id="sv-email" type="email" value={form.email} onChange={update('email')} placeholder="you@teazzers.com" required />
          </div>

          {/* ── Role ────────────────────────────────────────────────────── */}
          <div className="sv-field">
            <label htmlFor="sv-role">Role</label>
            <select id="sv-role" value={form.role} onChange={update('role')}>
              <option value="admin">Admin</option>
              <option value="technician">Technician</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* ── Divider ─────────────────────────────────────────────────── */}
          <div className="sv-divider-row"><span>Change Password</span></div>

          {/* ── Current password ────────────────────────────────────────── */}
          <div className="sv-field">
            <label htmlFor="sv-curr">Current Password</label>
            <input id="sv-curr" type="password" value={form.currPass} onChange={update('currPass')} placeholder="Enter current password" autoComplete="current-password" />
          </div>

          {/* ── New password ────────────────────────────────────────────── */}
          <div className="sv-field">
            <label htmlFor="sv-new">New Password</label>
            <input id="sv-new" type="password" value={form.newPass} onChange={update('newPass')} placeholder="Min. 6 characters" autoComplete="new-password" />
          </div>

          {/* ── Confirm new password ────────────────────────────────────── */}
          <div className="sv-field">
            <label htmlFor="sv-confirm">Confirm New Password</label>
            <input id="sv-confirm" type="password" value={form.confirmPass} onChange={update('confirmPass')} placeholder="Re-enter new password" autoComplete="new-password" />
          </div>

          {/* ── Actions ─────────────────────────────────────────────────── */}
          <div className="sv-actions">
            <button type="button" className="sv-btn-reset" onClick={() => {
              setForm({ name:user.name, email:user.email, role:user.role, currPass:'', newPass:'', confirmPass:'' });
              setMsg('');
            }}>Reset</button>
            <button type="submit" className="sv-btn-save" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
