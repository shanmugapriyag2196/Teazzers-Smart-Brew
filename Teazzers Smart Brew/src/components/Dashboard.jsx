import { useState } from 'react';
import './Dashboard.css';

const issueCategories = [
  {
    id: 'power-electrical',
    title: 'Power & Electrical Issues',
    icon: '⚡',
    description: 'Power supply failures, electrical faults, voltage issues',
    status: 'active'
  },
  {
    id: 'brewing',
    title: 'Brewing Issues',
    icon: '☕',
    description: 'Temperature control, brewing time, extraction problems',
    status: 'active'
  },
  {
    id: 'heating',
    title: 'Heating Issues',
    icon: '🔥',
    description: 'Heater malfunctions, temperature inconsistency, overheating',
    status: 'active'
  },
  {
    id: 'leaking',
    title: 'Leaking Issues',
    icon: '💧',
    description: 'Water leaks, seal failures, pipe connections',
    status: 'active'
  },
  {
    id: 'configuration',
    title: 'Configuration Issues',
    icon: '⚙️',
    description: 'Settings problems, firmware updates, network connectivity',
    status: 'active'
  },
  {
    id: 'servicing-maintenance',
    title: 'Servicing & Maintenance',
    icon: '🔧',
    description: 'Scheduled maintenance, part replacements, cleaning',
    status: 'active'
  }
];

function Dashboard({ onSelectIssue, selectedIssue }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Teazzers Smart Brew</h1>
        <p className="dashboard-subtitle">Issue Monitoring & Support Dashboard</p>
      </div>
      <div className="issues-grid">
        {issueCategories.map((issue) => (
          <div
            key={issue.id}
            className={`issue-card ${selectedIssue === issue.id ? 'selected' : ''} ${hoveredId === issue.id ? 'hovered' : ''}`}
            onClick={() => onSelectIssue(issue.id)}
            onMouseEnter={() => setHoveredId(issue.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="issue-icon">{issue.icon}</div>
            <h3 className="issue-title">{issue.title}</h3>
            <p className="issue-description">{issue.description}</p>
            <div className="issue-status">
              <span className={`status-indicator ${issue.status}`}></span>
              <span className="status-text">{issue.status === 'active' ? 'Needs Attention' : 'Normal'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
