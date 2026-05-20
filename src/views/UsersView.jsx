import { useState, useEffect } from 'react';
import { loadUsers } from '../utils/pineconeUserService';
import './UsersView.css';

export default function UsersView() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]       = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // ── Load users from Pinecone ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    loadUsers()
      .then(data => { if (!cancelled) { setUsers(data); setErr(null); } })
      .catch(e  => { if (!cancelled) setErr(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

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
      {loading && (
        <div style={{padding:'32px',textAlign:'center',color:'#8b5cf6',fontSize:'1.1rem'}}>
          Loading users\u2026
        </div>
      )}
      {err && (
        <div style={{padding:'12px 32px',color:'#dc2626',fontSize:'.85rem',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:'10px',margin:'0 0 16px'}}>
          {err}
        </div>
      )}
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
                    {({admin:'Admin',technician:'Technician',user:'User'}[user.role]) || user.role}
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
