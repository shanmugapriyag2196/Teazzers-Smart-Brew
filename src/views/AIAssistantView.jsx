import ChatBot from '../components/ChatBot';

export default function AIAssistantView({ selectedConversation, onConversationHandled }) {
  return (
    <div className="ai-chat-area">
      <ChatBot
        selectedIssue={null}
        selectedConversation={selectedConversation}
        onConversationHandled={onConversationHandled}
      />
    </div>
  );
}
