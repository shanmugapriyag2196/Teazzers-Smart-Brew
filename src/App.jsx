import Layout from './components/Layout';
import DashboardView from './views/DashboardView';
import AIAssistantView from './views/AIAssistantView';
import IssueCategoriesView from './views/IssueCategoriesView';
import UsersView from './views/UsersView';
import SettingsView from './views/SettingsView';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const views = {
    'dashboard':       <DashboardView />,
    'ai-assistant':    <AIAssistantView />,
    'issue-categories': <IssueCategoriesView />,
    'users':           <UsersView />,
    'settings':        <SettingsView />,
  };

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {views[activeView]}
    </Layout>
  );
}

export default App;
