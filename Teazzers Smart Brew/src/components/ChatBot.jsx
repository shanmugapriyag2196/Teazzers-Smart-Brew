import { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const PINECONE_ASSISTANT_URL = 'https://prod-1-data.ke.pinecone.io/assistant/chat/teazzers-data';

function ChatBot({ selectedIssue }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hello! I'm your Teazzers Smart Brew assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedIssue) {
      const issueMessages = {
        'power-electrical': "I see you're interested in Power & Electrical Issues. What specific problem are you experiencing?",
        'brewing': "I see you're interested in Brewing Issues. Tell me more about your brewing concerns.",
        'heating': "I see you're interested in Heating Issues. Please describe the heating problem you're facing.",
        'leaking': "I see you're interested in Leaking Issues. Where do you notice the leak?",
        'configuration': "I see you're interested in Configuration Issues. What settings are you trying to configure?",
        'servicing-maintenance': "I see you're interested in Servicing & Maintenance. What maintenance task do you need help with?"
      };
      const botMessage = {
        id: Date.now(),
        type: 'bot',
        text: issueMessages[selectedIssue] || "How can I assist you with your Teazzers Smart Brew?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }
  }, [selectedIssue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch(PINECONE_ASSISTANT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          context: selectedIssue ? { issueType: selectedIssue } : {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }

      const data = await response.json();
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: data.response || data.message || "I'm processing your request. Let me check our knowledge base.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: "I'm having trouble connecting to the support system. Please try again later or contact support directly at support.teazzers.com",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chatbot">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-icon">🤖</span>
          <div>
            <h2>Teazzers Assistant</h2>
            <span className="status-badge">Online</span>
          </div>
        </div>
        <p className="chatbot-description">Powered by Pinecone AI</p>
      </div>

      <div className="messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.type}`}>
            <div className="message-avatar">
              {msg.type === 'bot' ? '🤖' : '👤'}
            </div>
            <div className="message-content">
              <p>{msg.text}</p>
              <span className="message-time">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message bot">
            <div className="message-avatar">🤖</div>
            <div className="message-content typing">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your question..."
          disabled={isTyping}
          className="chat-input"
        />
        <button type="submit" disabled={isTyping || !inputValue.trim()} className="send-button">
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatBot;
