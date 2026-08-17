import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Send, 
  MessageSquare, 
  X, 
  Bot,
  User,
  GraduationCap
} from 'lucide-react';

export const ChatPanel = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      text: "Hello! I am your AI Placement Mentor. Ask me anything about your prep roadmap, how to polish your resume, target company expectations, or 30-day strategies."
    }
  ]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const userText = message.trim();
    setMessage('');
    
    // Add user message to history
    const newHistory = [...chatHistory, { role: 'user', text: userText }];
    setChatHistory(newHistory);
    setSending(true);

    try {
      // Map chatHistory format to route expectation (role, text)
      const res = await api.post('/company/chat', {
        message: userText,
        history: newHistory.slice(0, -1) // Excluding the last user msg just added
      });

      setChatHistory([...newHistory, { role: 'assistant', text: res.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatHistory([
        ...newHistory,
        { role: 'assistant', text: "Sorry, I ran into an issue connecting. Please try again." }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button (visible only when chat is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-hover hover:scale-105 transition-all duration-200 z-50 animate-bounce"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="fixed top-0 right-0 w-96 h-screen bg-surface border-l border-border shadow-2xl flex flex-col justify-between z-50 animate-slideLeft">
          
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white">
                <GraduationCap size={20} />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-sm">AI Placement Mentor</h3>
                <span className="text-[10px] text-secondary font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                  Active & Ready
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-background/30">
            {chatHistory.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={idx} 
                  className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Avatar Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isUser ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                  }`}>
                    {isUser ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  {/* Speech bubble */}
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isUser 
                      ? 'bg-primary-light text-text-primary rounded-tr-none' 
                      : 'bg-surface border border-border text-text-primary rounded-tl-none shadow-sm'
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex gap-2 bg-surface">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
              placeholder="Ask mentor anything..."
              className="flex-1 bg-background border border-border rounded-button px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary/50"
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="p-2.5 bg-primary text-white hover:bg-primary-hover rounded-button shadow-md disabled:opacity-50 transition-colors"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatPanel;
