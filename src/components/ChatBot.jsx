import { useState, useEffect, useRef } from 'react';
import './ChatBot.css';

const ASSISTANT_NAME = 'teazzers-data';
const ASSISTANT_URL = `https://prod-1-data.ke.pinecone.io/assistant/chat/${ASSISTANT_NAME}`;

const ChatBot = ({ selectedIssue }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const messagesEndRef = useRef(null);

  const API_KEY = import.meta.env.VITE_PINECONE_API_KEY;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      const botMessage = { role: 'assistant', content: issueMessages[selectedIssue] || "How can I help you with your Teazzers Smart Brew?" };
      setMessages(prev => [...prev, botMessage]);
    }
  }, [selectedIssue]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input.trim() };
    setInput('');
    setIsLoading(true);
    setError(null);
    setMessages(prev => [...prev, userMessage]);
    setExpanded(prev => ({ ...prev, [prev.length]: false }));

    if (!API_KEY) {
      const errMsg = 'PINECONE_API_KEY environment variable is missing. Set VITE_PINECONE_API_KEY in your Vercel environment variables.';
      setError(errMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: `Configuration error: ${errMsg}` }]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(ASSISTANT_URL, {
        method: 'POST',
        headers: {
          'Api-Key': API_KEY,
          'Content-Type': 'application/json',
          'X-Pinecone-Api-Version': '2025-10',
        },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          model: 'gpt-4o',
          stream: false,
        }),
      });

      if (!response.ok) {
        let detail = `${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          detail = errData.error || errData.message || errData.detail || detail;
        } catch { /* use status text */ }
        throw new Error(detail);
      }

      const data = await response.json();
      const content = data?.message?.content || 'Sorry, I could not process that.';
      setMessages(prev => [...prev, { role: 'assistant', content }]);
    } catch (err) {
      console.error('ChatBot Error:', err);
      setError(err.message);
      setMessages(prev => [...prev, { role: 'assistant', content: `Connection error: ${err.message}. Please contact support at support.teazzers.com.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (index) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>Teazzers Assistant</h3>
        <div className="chatbot-status">{isLoading ? 'Typing...' : 'Online'}</div>
      </div>
      <div className="chatbot-messages" ref={messagesEndRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className={`message-content ${msg.role}`}>{msg.content}</div>
            {msg.role === 'assistant' && msg.content.length > 300 && !expanded[index] && (
              <button className="more-btn" onClick={() => toggleExpand(index)}>
                More
              </button>
            )}
            {msg.role === 'assistant' && expanded[index] && (
              <button className="more-btn" onClick={() => toggleExpand(index)}>
                Show less
              </button>
            )}
          </div>
        ))}
      </div>
      <form className="chatbot-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about troubleshooting, maintenance, or configuration..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>Send</button>
      </form>
    </div>
  );
}

export default ChatBot;
