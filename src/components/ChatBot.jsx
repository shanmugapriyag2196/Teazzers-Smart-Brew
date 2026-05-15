import { useState, useEffect, useRef } from 'react';
import './ChatBot.css';

const ChatBot = ({ selectedIssue }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const ASSISTANT_URL = import.meta.env.VITE_PINECONE_ASSISTANT_URL || 
    'https://prod-1-data.ke.pinecone.io/assistant/chat/teazzers-data';

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
      const botMessage = {
        role: 'assistant',
        content: issueMessages[selectedIssue] || "How can I assist you with your Teazzers Smart Brew?"
      };
      setMessages(prev => [...prev, botMessage]);
    }
  }, [selectedIssue]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: input }]);

    try {
      const response = await fetch(ASSISTANT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input }
          ]
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const assistantMessage = data.message || data.content || 
        (data.choices && data.choices[0] && data.choices[0].message?.content) ||
        'Sorry, I could not process that.';

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('ChatBot Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I'm having trouble connecting right now. Please try again later or contact support at support.teazzers.com. (Error: ${error.message})`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>Teazzers Assistant</h3>
        <div className="chatbot-status">
          {isLoading ? 'Typing...' : 'Online'}
        </div>
      </div>
      <div className="chatbot-messages" ref={messagesEndRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <form className="chatbot-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about troubleshooting..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBot;
