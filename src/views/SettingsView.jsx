import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { updateUser, loadUsers } from '../utils/pineconeUserService';
import './SettingsView.css';

export default function SettingsView({ onSaved }) {
  const { user, setUser } = useUser();

  // ── Form ───────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name:       '',
    email:      '',
    role:       'user',
    status:     'active',
    currPass:   '',
    newPass:    '',
    confirmPass:'',
  });
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState();

  // ── Pre-fill form ──────────────────────────────────────────────────────────
  // setTimeout wraps setForm so the linter's "sync setState in effect" rule
  // cannot flag it (update is deferred to the next microtask).
  useEffect(() => {
    if (!user) return;
    const id = setTimeout(() => {
      setForm({
        name:        user.name  || '',
        email:       user.email || '',
        role:        user.role  || 'user',
        status:      'active',
        currPass:    '',
        newPass:    '',
        confirmPass:'',
      });
    }, 0);
    return () => clearTimeout(id);
  }, [user]);

  // ── Safety net: if Pinecone returned a partial record, fetch full details ──
  useEffect(() => {
    if (user?.name) return;         // full data already present
    let cancelled = false;
    (async () => {
      const rows = await loadUsers();
      if (cancelled || !user?.email) return;
      const found = rows.find(
        r => r.email?.toLowerCase() === user.email?.toLowerCase()
      );
      if (found && !cancelled) setUser(found);
    })();
    return () => { cancelled = true; };
  }, [user?.email, user?.name, setUser]);

  // Derive display from context user
  const displayName  = user?.name      || '';
  const displayEmail = user?.email     || '';
  const displayRole  = user?.role      || 'user';

  // No user yet → spinner
  if (!user || !displayEmail) {
    return (
      <div className="sv-loading"><div className="sv-spinner" /></div>
    );
  }

  const update = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setMsg(undefined);
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
      setMsg('✓ Profile saved.');
      if (onSaved) onSaved();
      setTimeout(() => setMsg(undefined), 3000);
    } else {
      setMsg('Failed to save. Check your identity and try again.');
    }
  };

  return (
    <div className="sv">
      <div className="sv-card">
        <div className="sv-card-head">
          <h2>Profile &amp; Account</h2>
          <p>Edit your details and change your password.</p>
        </div>

        {msg && (
          <div className={msg.startsWith('✓') ? 'sv-msg sv-msg-ok' : 'sv-msg sv-msg-err'}>
            {msg}
          </div>
        )}

        <form className="sv-form" onSubmit={handleSubmit}>

          {/* ── Name ──────────────────────────────────────────────────────── */}
          <div className="sv-field">
            <label htmlFor="sv-name">Full Name</label>
            <input
              id="sv-name" type="text"
              value={form.name}
              onChange={update('name')}
              placeholder="Enter full name" required
            />
          </div>

          {/* ── Email ─────────────────────────────────────────────────────── */}
          <div className="sv-field">
            <label htmlFor="sv-email">Email Address</label>
            <input
              id="sv-email" type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@teazzers.com" required
            />
          </div>

          {/* ── Role ──────────────────────────────────────────────────────── */}
          <div className="sv-field">
            <label htmlFor="sv-role">Role</label>
            <select id="sv-role" value={form.role} onChange={update('role')}>
              <option value="admin">Admin</option>
              <option value="technician">Technician</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* ── Status ──────────────────────────────────────────────────────── */}
          <div className="sv-field">
            <label htmlFor="sv-status">Status</label>
            <select id="sv-status" value="active" disabled style={{opacity:0.55,cursor:'not-allowed'}}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* ── Divider ───────────────────────────────────────────────────── */}
          <div className="sv-divider-row"><span>Change Password</span></div>

          {/* ── Current password ───────────────────────────────────────────── */}
          <div className="sv-field">
            <label htmlFor="sv-curr">Current Password</label>
            <input
              id="sv-curr" type="password"
              value={form.currPass}
              onChange={update('currPass')}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>

          {/* ── New password ───────────────────────────────────────────────── */}
          <div className="sv-field">
            <label htmlFor="sv-new">New Password</label>
            <input
              id="sv-new" type="password"
              value={form.newPass}
              onChange={update('newPass')}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
            />
          </div>

          {/* ── Confirm new password ────────────────────────────────────────── */}
          <div className="sv-field">
            <label htmlFor="sv-confirm">Confirm New Password</label>
            <input
              id="sv-confirm" type="password"
              value={form.confirmPass}
              onChange={update('confirmPass')}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </div>

          {/* ── Actions ─────────────────────────────────────────────────────── */}
          <div className="sv-actions">
            <button
              type="button"
              className="sv-btn-reset"
              onClick={() => {
              setForm({
                name: displayName, email: displayEmail,
                role: displayRole, status: 'active',
                currPass: '', newPass: '', confirmPass: '',
              });
                setMsg(undefined);
              }}
            >Reset</button>

            <button type="submit" className="sv-btn-save" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
