import './DashboardView.css';

const issueData = [
  { id: 'power', name: 'Power & Electrical Issues', icon: '⚡', count: 12, trend: '+3', badge: 'warning' },
  { id: 'brewing', name: 'Brewing Issues', icon: '☕', count: 7,  trend: '+1', badge: 'warning' },
  { id: 'heating', name: 'Heating Issues', icon: '🔥', count: 4,  trend: '-2', badge: 'danger' },
  { id: 'leaking', name: 'Leaking Issues', icon: '💧', count: 9,  trend: '+4', badge: 'danger' },
  { id: 'config',  name: 'Configuration Issues', icon: '⚙️', count: 3,  trend: '0',  badge: 'warning' },
  { id: 'other',   name: 'Other Issues', icon: '📋', count: 5,  trend: '+2', badge: 'warning' },
];

export default function DashboardView() {
  return (
    <div className="dashboard-view" style={{ padding: 0 }}>
      <div className="page-header">
        <h2>Welcome Back, Admin</h2>
        <p>Here's what's happening with your Teazzers Smart Brew system today.</p>
      </div>

      <p className="section-title">Issue Categories Overview</p>
      <div className="cards-grid">
        {issueData.map((item) => (
          <div key={item.id} className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">{item.name}</span>
              <span className="stat-card-icon">{item.icon}</span>
            </div>
            <div className="stat-card-count">{item.count}</div>
            <div className="stat-card-footer">
              <span className={`stat-badge ${item.badge}`}>{item.trend} today</span>
              <span>Active issues</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
