import ChatBot from '../components/ChatBot';

export default function AIAssistantView() {
  return (
    <div className="ai-chat-area">
      <ChatBot selectedIssue={null} />
    </div>
  );
}
