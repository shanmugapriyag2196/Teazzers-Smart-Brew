import './IssueCategoriesView.css';

const issueDetails = [
  { id: 1,  title: 'Power supply tripping intermittently',         category: 'Power & Electrical',  severity: 'High',   status: 'open',    date: '2026-05-18',  machine: 'TSB-001' },
  { id: 2,  title: 'Brew temperature lower than set point',        category: 'Brewing',            severity: 'Medium', status: 'pending',  date: '2026-05-17',  machine: 'TSB-003' },
  { id: 3,  title: 'Steam wand not producing enough pressure',     category: 'Heating',            severity: 'Low',    status: 'open',    date: '2026-05-17',  machine: 'TSB-002' },
  { id: 4,  title: 'Water leaking from rear drain hose',          category: 'Leaking',            severity: 'High',   status: 'open',    date: '2026-05-16',  machine: 'TSB-005' },
  { id: 5,  title: 'Wi-Fi configuration keeps resetting',         category: 'Configuration',      severity: 'Low',    status: 'pending',  date: '2026-05-16',  machine: 'TSB-001' },
  { id: 6,  title: 'Grinder blade making unusual noise',          category: 'Other',              severity: 'Medium', status: 'open',    date: '2026-05-15',  machine: 'TSB-004' },
  { id: 7,  title: 'Display flickering on startup',               category: 'Power & Electrical', severity: 'Medium', status: 'pending',  date: '2026-05-15',  machine: 'TSB-002' },
  { id: 8,  title: 'Milk not steaming at correct temperature',     category: 'Heating',            severity: 'Medium', status: 'resolved', date: '2026-05-14',  machine: 'TSB-003' },
  { id: 9,  title: 'Bean hopper not seating properly',            category: 'Other',              severity: 'Low',    status: 'resolved', date: '2026-05-14',  machine: 'TSB-004' },
  { id: 10, title: 'Drip tray overflowing after brew cycle',      category: 'Leaking',            severity: 'Medium', status: 'open',    date: '2026-05-13',  machine: 'TSB-005' },
];

const severityBadge = (s) => {
  const map = { High: 'danger', Medium: 'warning', Low: 'success' };
  return <span className={`sev-pill ${map[s] || 'default'}`}>{s}</span>;
};

const statusPill = (s) => (
  <span className={`status-pill ${s}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
);

export default function IssueCategoriesView() {
  return (
    <div className="issue-view">
      <div className="page-header">
        <h2>Issue Categories</h2>
        <p>Detailed view of all reported issues across the Teazzers Smart Brew fleet.</p>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Machine</th>
              <th>Reported</th>
            </tr>
          </thead>
          <tbody>
            {issueDetails.map((issue) => (
              <tr key={issue.id}>
                <td>{issue.id}</td>
                <td style={{ fontWeight: 500 }}>{issue.title}</td>
                <td>{issue.category}</td>
                <td>{severityBadge(issue.severity)}</td>
                <td>{statusPill(issue.status)}</td>
                <td><code>{issue.machine}</code></td>
                <td>{issue.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
