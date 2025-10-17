/**
 * React chatbot example
 * Demonstrates React hooks integration
 */

import React, { useState } from 'react';
import { usePromptAPI } from '../../src/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const { prompt, ready, loading, error, quota } = usePromptAPI({
    systemPrompt: 'You are a helpful and friendly AI assistant.',
    temperature: 0.7,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ready) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await prompt(input);
      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error.message}</p>
        <p>Make sure you're using Chrome 128+ with the Prompt API enabled.</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="loading">
        <h2>Loading AI Model...</h2>
        <p>This may take a moment on first load.</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <header>
        <h1>AI Chatbot</h1>
        {quota && (
          <div className="quota">
            Quota: {quota.percentageUsed.toFixed(1)}% used
            {quota.percentageUsed > 70 && <span className="warning"> ⚠️ High usage</span>}
          </div>
        )}
      </header>

      <div className="messages">
        {messages.length === 0 && (
          <div className="welcome">
            <p>👋 Welcome! I'm your AI assistant. How can I help you today?</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">{message.content}</div>
          </div>
        ))}

        {isTyping && (
          <div className="message assistant typing">
            <div className="message-content">Typing...</div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={!ready || loading}
        />
        <button type="submit" disabled={!ready || loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;

