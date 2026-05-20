import { useState } from 'react';
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
        </nav>

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
