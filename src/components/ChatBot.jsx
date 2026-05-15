import React, { useState, useEffect, useRef } from 'react';
import './ChatBot.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Pinecone Assistant API endpoint and key from environment variables
  const ASSISTANT_URL = process.env.VITE_PINECONE_ASSISTANT_URL || 
    'https://prod-1-data.ke.pinecone.io/assistant/chat/teazzers-data';
  const API_KEY = process.env.VITE_PINECONE_API_KEY;

  // Debug logging (do not expose actual key)
  useEffect(() => {
    console.log(`[ChatBot] VITE_PINECONE_ASSISTANT_URL: ${ASSISTANT_URL}`);
    console.log(`[ChatBot] VITE_PINECONE_API_KEY present: ${!!API_KEY}`);
  }, [ASSISTANT_URL, API_KEY]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Check if API key is missing
      if (!API_KEY) {
        throw new Error('API key not configured. Please set VITE_PINECONE_API_KEY in your environment variables.');
      }

      const response = await fetch(ASSISTANT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Pinecone Assistant API expects an 'Api-Key' header
          'Api-Key': API_KEY
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          // You can add context about selected category here if needed
        })
      });

      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use the status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Adjust based on the actual response structure from Pinecone Assistant
      const assistantMessage = data.message || data.content || 
        (data.choices && data.choices[0] && data.choices[0].message?.content) ||
        'Sorry, I could not process that.';

      // Add assistant response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('ChatBot Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
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