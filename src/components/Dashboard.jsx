import React, { useState } from 'react';
import './Dashboard.css';

const Dashboard = ({ onCategorySelect }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    { id: 1, name: 'Power & Electrical Issues', icon: '⚡' },
    { id: 2, name: 'Brewing Issues', icon: '🫖' },
    { id: 3, name: 'Heating Issues', icon: '🔥' },
    { id: 4, name: 'Leaking Issues', icon: '💧' },
    { id: 5, name: 'Configuration Issues', icon: '⚙️' },
    { id: 6, name: 'Servicing and Maintenance', icon: '🔧' }
  ];

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    onCategorySelect(category);
  };

  return (
    <div className="dashboard">
      <h2>Teazzers Smart Brew Dashboard</h2>
      <div className="categories-grid">
        {categories.map(category => (
          <div
            key={category.id}
            className={`category-card ${selectedCategory && selectedCategory.id === category.id ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category)}
          >
            <div className="category-icon">{category.icon}</div>
            <h3>{category.name}</h3>
          </div>
        ))}
      </div>
      {selectedCategory && (
        <div className="selected-category">
          <p>Selected: <strong>{selectedCategory.name}</strong></p>
          <p>Ask the chatbot for troubleshooting steps and maintenance guidance.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;