import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';
import './App.css';

function App() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <div className="app">
      <header>
        <h1>Teazzers Smart Brew</h1>
      </header>
      <main className="main-content">
        <Dashboard onCategorySelect={setSelectedCategory} />
        <ChatBot />
      </main>
    </div>
  );
}

export default App;