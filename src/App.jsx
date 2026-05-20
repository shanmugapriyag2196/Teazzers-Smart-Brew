import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DashboardView from './views/DashboardView';
import AIAssistantView from './views/AIAssistantView';
import IssuesCountView from './views/IssuesCountView';
import IssueCategoriesView from './views/IssueCategoriesView';
import UsersView from './views/UsersView';
import SettingsView from './views/SettingsView';
import LoginView from './views/LoginView';
import CreateAccountView from './views/CreateAccountView';
import './App.css';

// Make auth-mode setter globally accessible so auth pages can communicate
// with App without importing App directly (avoids circular deps).
window.__setAuthMode = null;

function App() {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'create' | 'app'
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Wire setter so child components can call it via window
  useEffect(() => {
    window.__setAuthMode = setAuthMode;
    return () => { window.__setAuthMode = null; };
  }, []);

  const handleLogin = () => setAuthMode('app');

  const handleConversationSelect = (item) => {
    setSelectedConversation(item);
    setActiveView('ai-assistant');
  };

  const views = {
    'dashboard':        <DashboardView />,
    'ai-assistant':     <AIAssistantView selectedConversation={selectedConversation} onConversationHandled={() => setSelectedConversation(null)} />,
    'issues-count':     <IssuesCountView />,
    'issue-categories': <IssueCategoriesView onConversationSelect={handleConversationSelect} />,
    'users':            <UsersView />,
    'settings':         <SettingsView />,
  };

  const current = views[activeView] || <DashboardView />;

  // ── Auth gate ────────────────────────────────────────────────────────────
  if (authMode === 'login') {
    return <LoginView onLogin={handleLogin} />;
  }
  if (authMode === 'create') {
    return <CreateAccountView onCreated={handleLogin} />;
  }
  // ── Authenticated app ────────────────────────────────────────────────────
  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {current}
    </Layout>
  );
}

export default App;
