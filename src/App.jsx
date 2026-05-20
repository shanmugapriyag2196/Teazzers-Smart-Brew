import { useState } from 'react';
import Layout from './components/Layout';
import DashboardView from './views/DashboardView';
import AIAssistantView from './views/AIAssistantView';
import IssuesCountView from './views/IssuesCountView';
import IssueCategoriesView from './views/IssueCategoriesView';
import UsersView from './views/UsersView';
import SettingsView from './views/SettingsView';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedConversation, setSelectedConversation] = useState(null);

  const handleConversationSelect = (item) => {
    setSelectedConversation(item);
    setActiveView('ai-assistant');
  };

  const views = {
    'dashboard':       <DashboardView />,
    'ai-assistant':    <AIAssistantView selectedConversation={selectedConversation} onConversationHandled={() => setSelectedConversation(null)} />,
    'issues-count':    <IssuesCountView />,
    'issue-categories': <IssueCategoriesView onConversationSelect={handleConversationSelect} />,
    'users':           <UsersView />,
    'settings':        <SettingsView />,
  };

  const current = views[activeView] || <DashboardView />;

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {current}
    </Layout>
  );
}

export default App;
