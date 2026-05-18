import { useState } from 'react';
import './AIAssistantView.css';

const INITIAL_MESSAGES = [
  { id: 1,   query: 'How do I troubleshoot power issues?',       time: '2 min ago',  response: 'Check the power cable connection first, then verify the voltage supply. If the issue persists, inspect the internal fuse and reset the main breaker. Contact a certified electrician if there are signs of burning or sparking.' },
  { id: 2,   query: 'Machine not heating properly',            time: '15 min ago', response: 'This could be due to scale buildup in the heating element. Run a descaling cycle first. Check the temperature sensor calibration and verify the heating element resistance with a multimeter.' },
  { id: 3,   query: 'Water leaking from bottom',               time: '1 hr ago',   response: 'Inspect the drain hose and pump filter for blockages. Check the door seal for wear and the water inlet valve for leaks. Tighten any loose connections underneath the machine.' },
  { id: 4,   query: 'Coffee tastes bitter',                    time: '2 hr ago',   response: 'Clean the brew group, replace the water filter if due, and descale the machine. Check that the grind size setting is appropriate for your beans. Over-extraction is the most common cause.' },
  { id: 5,   query: 'Display not turning on',                  time: 'Yesterday',   response: 'Verify the machine is plugged into a working outlet. Check the power switch and reset the circuit breaker. If the display remains blank, the main control board may need replacement.' },
];

export default function AIAssistantView() {
  const [activeHistory, setActiveHistory] = useState(INITIAL_MESSAGES[0]);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: INITIAL_MESSAGES[0].response },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Based on your query about "${input}", I recommend checking the relevant troubleshooting guide in the Issue Categories section. If the problem persists, please open a new support ticket with the serial number of your Teazzers Smart Brew machine and a description of the issue.`
      }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="ai-layout">
      {/* Left – Chat History */}
      <div className="ai-sidebar">
        <div className="ai-sidebar-header">Recent History</div>
        <div className="ai-history-list">
          {INITIAL_MESSAGES.map((msg, i) => (
            <button
              key={msg.id}
              className={`ai-history-item ${activeHistory?.id === msg.id ? 'active' : ''}`}
              onClick={() => {
                setActiveHistory(msg);
                setMessages([{ role: 'assistant', text: msg.response }]);
              }}
            >
              <div className="hist-icon">🤖</div>
              <div className="hist-query">{msg.query}</div>
              <div className="hist-time">{msg.time}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Middle – Chat Area */}
      <div className="ai-chat-area">
        <div className="ai-chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-msg ${msg.role}`}>
              <div className="ai-msg-header">
                <span className="ai-msg-label">{msg.role === 'user' ? 'You' : 'AI Assistant'}</span>
              </div>
              <div className="ai-msg-bubble">{msg.text}</div>
            </div>
          ))}
          {isTyping && (
            <div className="ai-msg assistant">
              <div className="ai-msg-header">
                <span className="ai-msg-label">AI Assistant</span>
              </div>
              <div className="ai-msg-bubble">Thinking<span className="typing-dots">...</span></div>
            </div>
          )}
        </div>

        <form className="ai-chat-input" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about troubleshooting, maintenance, or configuration..."
          />
          <button type="submit" disabled={!input.trim() || isTyping}>Send</button>
        </form>
      </div>
    </div>
  );
}
