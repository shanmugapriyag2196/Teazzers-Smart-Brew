import { useState, useEffect, useCallback } from 'react';
import { UserProvider, useUser } from './context/UserContext';
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

function AppInner() {
  const [authMode, setAuthMode] = useState('login');
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { usersAll, setUser, refreshUsers, logout } = useUser();

  // Wire setter so Login / CreateAccount can switch into the app
  useEffect(() => {
    window.__setAuthMode = setAuthMode;
    return () => { window.__setAuthMode = null; };
  }, []);

  // ── Login → match Pinecone record → enter app ─────────────────────────
  const handleLogin = useCallback(async (email) => {
    if (usersAll.length === 0) await refreshUsers();
    const match = (usersAll || []).find(
      u => u.email?.toLowerCase() === email?.toLowerCase()
    );
    if (match) setUser(match);
    setAuthMode('app');
  }, [usersAll, refreshUsers, setUser]);

  // ── Logout → clear context + show Login page ───────────────────────────
  const handleLogout = useCallback(() => {
    logout();
    setActiveView('dashboard');
    setAuthMode('login');
  }, [logout, setAuthMode, setActiveView]);

  // ── After Settings save → refresh from Pinecone ────────────────────────
  const handleUserSaved = useCallback(async () => {
    await refreshUsers();
  }, [refreshUsers]);

  const handleConversationSelect = (item) => {
    setSelectedConversation(item);
    setActiveView('ai-assistant');
  };

  const views = {
    'dashboard':        <DashboardView onLogout={handleLogout} />,
    'ai-assistant':     <AIAssistantView selectedConversation={selectedConversation} onConversationHandled={() => setSelectedConversation(null)} />,
    'issues-count':     <IssuesCountView />,
    'issue-categories': <IssueCategoriesView onConversationSelect={handleConversationSelect} />,
    'users':            <UsersView />,
    'settings':         <SettingsView onSaved={handleUserSaved} />,
  };

  const current = views[activeView] || <DashboardView />;

  // ── Auth gate ───────────────────────────────────────────────────────────
  if (authMode === 'login')  return <LoginView onLogin={handleLogin} />;
  if (authMode === 'create') return <CreateAccountView onCreated={handleLogin} />;

  // ── Authenticated ───────────────────────────────────────────────────────
  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {current}
    </Layout>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppInner />
    </UserProvider>
  );
}
