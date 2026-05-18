import ChatBot from '../components/ChatBot';

export default function AIAssistantView() {
  return (
    <div className="ai-layout">
      {/* Left – Recent History sidebar */}
      <div className="ai-sidebar">
        <div className="ai-sidebar-header">Recent History</div>
        <div className="ai-history-list">
          <button className="ai-history-item">
            <div className="hist-icon">🤖</div>
            <div className="hist-query">How do I troubleshoot power issues?</div>
            <div className="hist-time">2 min ago</div>
          </button>
          <button className="ai-history-item">
            <div className="hist-icon">🤖</div>
            <div className="hist-query">Machine not heating properly</div>
            <div className="hist-time">15 min ago</div>
          </button>
          <button className="ai-history-item">
            <div className="hist-icon">🤖</div>
            <div className="hist-query">Water leaking from bottom</div>
            <div className="hist-time">1 hr ago</div>
          </button>
          <button className="ai-history-item">
            <div className="hist-icon">🤖</div>
            <div className="hist-query">Coffee tastes bitter</div>
            <div className="hist-time">2 hr ago</div>
          </button>
          <button className="ai-history-item">
            <div className="hist-icon">🤖</div>
            <div className="hist-query">Display not turning on</div>
            <div className="hist-time">Yesterday</div>
          </button>
        </div>
      </div>

      {/* Middle – Live Pinecone-powered chat area */}
      <div className="ai-chat-area">
        <ChatBot selectedIssue={null} />
      </div>
    </div>
  );
}
