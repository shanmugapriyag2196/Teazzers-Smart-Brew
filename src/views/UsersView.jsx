import { useState } from 'react';
import './UsersView.css';

// ── Seed data — cleared when real auth is wired ─────────────────────────
const SEED_USERS = [
  { id: 1, name: 'Admin User',    email: 'admin@teazzers.com',    role: 'admin',    status: 'active', lastLogin: '2026-05-20 09:14' },
  { id: 2, name: 'Tech Support',  email: 'support@teazzers.com',  role: 'technician', status: 'active', lastLogin: '2026-05-20 08:52' },
  { id: 3, name: 'John Smith',    email: 'john@teazzers.com',     role: 'user',      status: 'active', lastLogin: '2026-05-19 16:30' },
  { id: 4, name: 'Priya G',       email: 'priya@teazzers.com',    role: 'admin',    status: 'active', lastLogin: '2026-05-19 14:00' },
  { id: 5, name: 'Aarav Patel',   email: 'aarav@teazzers.com',    role: 'user',      status: 'inactive', lastLogin: '2026-04-15 11:22' },
  { id: 6, name: 'Anita Roy',     email: 'anita@teazzers.com',    role: 'technician', status: 'active', lastLogin: '2026-05-18 10:05' },
  { id: 7, name: 'David Lee',     email: 'david@teazzers.com',    role: 'user',      status: 'active', lastLogin: '2026-05-17 09:41' },
  { id: 8, name: 'Mary K',        email: 'mary@teazzers.com',     role: 'user',      status: 'inactive', lastLogin: '2026-03-02 08:10' },
];

const ROLE_LABEL = { admin: 'Admin', technician: 'Technician', user: 'User' };

export default function UsersView() {
  const [users, setUsers]   = useState(SEED_USERS);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);   // null = add mode, object = edit mode

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // ── Edit button opens form in edit mode ───────────────────────────────
  const handleEdit = (user) => {
    setEditUser(user);
    setShowForm(true);
  };

  // ── Add button opens form in add mode ─────────────────────────────────
  const handleAdd = () => {
    setEditUser(null);
    setShowForm(true);
  };

  // ── Save (add or edit) ────────────────────────────────────────────────
  const handleSave = (e) => {
    e.preventDefault();
    const form = e.target;
    const name     = form.uName.value.trim();
    const email    = form.uEmail.value.trim();
    const role     = form.uRole.value;
    const status   = form.uStatus.value;

    if (!name || !email) return;

    if (editUser) {
      // update existing
      setUsers(prev => prev.map(u =>
        u.id === editUser.id ? { ...u, name, email, role, status } : u,
      ));
    } else {
      // add new
      const newId = Math.max(0, ...users.map(u => u.id)) + 1;
      setUsers(prev => [...prev, {
        id: newId,
        name,
        email,
        role,
        status,
        lastLogin: '—',
      }]);
    }
    setShowForm(false);
    setEditUser(null);
  };

  // ── Cancel ────────────────────────────────────────────────────────────
  const handleCancel = () => {
    setShowForm(false);
    setEditUser(null);
  };

  // ── Modal overlay ─────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div className="uv-overlay">
        <div className="uv-modal">
          <div className="uv-modal-head">
            <h3>{editUser ? 'Edit User' : 'Create New Account'}</h3>
            <button className="uv-modal-close" onClick={handleCancel}>×</button>
          </div>
          <form className="uv-form" onSubmit={handleSave}>
            <div className="uv-field">
              <label htmlFor="uName">Full Name</label>
              <input id="uName" name="uName" type="text"
                     defaultValue={editUser?.name || ''}
                     placeholder="Enter full name" required />
            </div>
            <div className="uv-field">
              <label htmlFor="uEmail">Email Address</label>
              <input id="uEmail" name="uEmail" type="email"
                     defaultValue={editUser?.email || ''}
                     placeholder="user@example.com" required />
            </div>
            <div className="uv-field-row">
              <div className="uv-field">
                <label htmlFor="uRole">Role</label>
                <select id="uRole" name="uRole" defaultValue={editUser?.role || 'user'}>
                  <option value="admin">Admin</option>
                  <option value="technician">Technician</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div className="uv-field">
                <label htmlFor="uStatus">Status</label>
                <select id="uStatus" name="uStatus" defaultValue={editUser?.status || 'active'}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="uv-modal-actions">
              <button type="button" className="uv-btn-cancel" onClick={handleCancel}>Cancel</button>
              <button type="submit" className="uv-btn-save">
                {editUser ? 'Update User' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Main table page ───────────────────────────────────────────────────
  return (
    <div className="uv">
      <div className="page-header">
        <h2>Users</h2>
        <p>Manage Teazzers Smart Brew user accounts and access roles.</p>
      </div>

      <div className="uv-toolbar">
        <span className="uv-count">{users.length} users</span>
        <button className="uv-btn-add" onClick={handleAdd}>
          <span className="uv-icon-add">+</span> Add User
        </button>
      </div>

      <div className="uv-table-wrap">
        <table className="uv-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th width="140">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ fontWeight: 600 }}>{user.name}</td>
                <td style={{ color: '#64748b' }}>{user.email}</td>
                <td>
                  <span className={`uv-role-pill uv-role-${user.role}`}>
                    {ROLE_LABEL[user.role] || user.role}
                  </span>
                </td>
                <td>
                  <span className={`uv-status-pill uv-status-${user.status}`}>
                    {user.status === 'active' ? '● Active' : '○ Inactive'}
                  </span>
                </td>
                <td style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{user.lastLogin}</td>
                <td>
                  <div className="uv-actions">
                    <button className="uv-btn-icon uv-btn-edit" title="Edit user" onClick={() => handleEdit(user)}>
                      ✎
                    </button>
                    <button className="uv-btn-icon uv-btn-del" title="Delete user" onClick={() => handleDelete(user.id)}>
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
