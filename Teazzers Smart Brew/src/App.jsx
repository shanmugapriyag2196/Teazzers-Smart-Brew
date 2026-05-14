import { useState } from 'react'
import Dashboard from './components/Dashboard'
import ChatBot from './components/ChatBot'
import './App.css'

function App() {
  const [selectedIssue, setSelectedIssue] = useState(null)

  return (
    <div className="app-container">
      <Dashboard onSelectIssue={setSelectedIssue} selectedIssue={selectedIssue} />
      <ChatBot selectedIssue={selectedIssue} />
    </div>
  )
}

export default App
