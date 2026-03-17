import { useState, useEffect, useRef } from 'react';
import { issuesAPI } from '../services/api';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hello! I'm the CivicAI assistant. I can help you report issues, check status, or answer questions. How can I help?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await issuesAPI.chat(userMessage);
      setMessages(prev => [...prev, { type: 'bot', text: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { type: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>CivicAI Assistant</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>
              ✕
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.type}`}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="chat-message bot" style={{ opacity: 0.6 }}>
                Typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              disabled={loading}
            />
            <button className="btn btn-primary btn-sm" onClick={sendMessage} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      )}
      <button className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)} title="Chat with AI Assistant">
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
