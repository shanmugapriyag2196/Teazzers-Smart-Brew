import { useState, useEffect, useRef } from 'react';
import './ChatBot.css';

const API_URL = '/api/chat';

const ChatBot = ({ selectedIssue }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your Teazzers Smart Brew assistant. Ask me anything about troubleshooting, maintenance, or configuration." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

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

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
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

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>Teazzers Assistant</h3>
        <div className="chatbot-status">{isLoading ? 'Typing...' : 'Online'}</div>
      </div>
      <div className="chatbot-messages" ref={messagesEndRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
      </div>
      <form className="chatbot-form" onSubmit={sendMessage}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about troubleshooting..." disabled={isLoading} />
        <button type="submit" disabled={isLoading || !input.trim()}>Send</button>
      </form>
    </div>
  );
};

export default ChatBot;
