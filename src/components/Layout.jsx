import { useState } from 'react';
import { useUser } from '../context/UserContext';
import './Layout.css';

const navItems = [
  { id: 'dashboard',       label: 'Dashboard', icon: '◻' },
  { id: 'ai-assistant',    label: 'AI Assistant', icon: '◉' },
  { id: 'issues-count',    label: 'Issue Count', icon: '📊' },
  { id: 'issue-categories', label: 'Issue Categories', icon: '▣' },
  { id: 'users',           label: 'Users', icon: '◈' },
  { id: 'settings',        label: 'Settings', icon: '⚙' },
];

export default function Layout({ activeView, onViewChange, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
    if (window.__setAuthMode) window.__setAuthMode('login');
  };

  return (
    <div className="layout">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">☕</div>
          {!collapsed && <h1>TEAZZERS</h1>}
          {!collapsed && <span className="brand-sub">SmartBrew Support</span>}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}

          {/* ── Divider above the user block ───────────────────────────────── */}
          {!collapsed && <div className="sidebar-divider" />}
        </nav>

        {/* ── Bottom: user email + logout pill ─────────────────────────────── */}
        {user?.email && (
          <div className={`sidebar-user ${collapsed ? 'collapsed' : ''}`}>
            {!collapsed && (
              <span className="su-email" title={user.email}>{user.email}</span>
            )}
            <button className="su-logout-btn" onClick={handleLogout} title="Sign out">
              &#9077; {collapsed ? '' : 'Logout'}
            </button>
          </div>
        )}

        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '◀' : '▶'}
        </button>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
