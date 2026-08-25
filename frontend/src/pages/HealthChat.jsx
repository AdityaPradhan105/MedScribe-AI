import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import VoiceInteraction from '../components/VoiceInteraction';
import {
  Send,
  Volume2,
  AlertOctagon,
  Bot,
  User,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const HealthChat = () => {
  const { t, language } = useLanguage();
  const { speakText, stopSpeaking } = useAccessibility();
  const messagesEndRef = useRef(null);

  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState(() => {
    const cached = localStorage.getItem('medscribe_chat_history');
    return cached ? JSON.parse(cached) : [
      {
        id: 'welcome',
        sender: 'model',
        text: 'Hello! I am MedScribe AI, your AI health assistant. You can ask me any health questions or ask me to explain a medicine or prescription details. How can I help you today?',
        disclaimer: 'Disclaimer: This is an AI assistant and not a substitute for a real doctor.'
      }
    ];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('medscribe_chat_history', JSON.stringify(chatHistory));
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend || textToSend.trim() === '') return;

    // Append user message
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim()
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    // Prepare full history for context (exclude id and keep format: sender, text)
    const historyPayload = chatHistory.map((msg) => ({
      sender: msg.sender,
      text: msg.text
    }));

    try {
      const res = await api.sendChatMessage(historyPayload, textToSend.trim(), language);
      if (res.success) {
        const modelMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'model',
          text: res.data.message,
          disclaimer: res.data.disclaimer
        };
        setChatHistory((prev) => [...prev, modelMsg]);
        // Auto read answer aloud
        speakText(res.data.message);
      } else {
        const errorMsg = res.message === 'SERVER_BUSY' ? t('rateLimit') : (res.message || 'Failed to get a response.');
        setError(errorMsg);
        speakText(errorMsg);
      }
    } catch (err) {
      setError('Connection error. Could not reach AI server.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceResult = (text) => {
    setInput(text);
    handleSend(text);
  };

  const clearChat = () => {
    if (window.confirm('Clear all chat history?')) {
      stopSpeaking();
      setChatHistory([
        {
          id: 'welcome',
          sender: 'model',
          text: 'History cleared. How can I help you today?',
          disclaimer: 'Disclaimer: This is an AI assistant.'
        }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[78vh] max-w-4xl mx-auto bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl overflow-hidden shadow-sm">
      
      {/* Chat Header */}
      <div className="px-5 py-3.5 bg-gray-50 dark:bg-navy-900 border-b border-gray-100 dark:border-navy-850 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8.5 h-8.5 rounded-lg bg-healthcare-500 flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-gray-800 dark:text-white">
              MedScribe AI Assistant
            </h4>
            <span className="text-xs text-green-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              Online
            </span>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-1.8 text-gray-400 hover:text-red-500 dark:hover:bg-navy-800 rounded-lg transition-all"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Warning Alert Banner */}
      <div className="p-3 bg-red-50/70 dark:bg-red-950/20 border-b border-red-50 dark:border-red-950/50 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
        <p className="font-semibold leading-relaxed">
          <strong>Important Safety Notice:</strong> This AI assistant provides general health information. It does <strong>not</strong> prescribe medical treatments and is <strong>not</strong> a replacement for a doctor. In emergency cases, visit the nearest hospital or call 112 immediately.
        </p>
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-navy-950">
        {chatHistory.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : ''}`}>
              {!isUser && (
                <div className="w-8.5 h-8.5 rounded-lg bg-healthcare-100 dark:bg-healthcare-950 text-healthcare-700 dark:text-healthcare-400 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-5 h-5" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl p-3.5 text-sm shadow-sm relative group ${
                  isUser
                    ? 'bg-healthcare-500 text-white rounded-tr-none'
                    : 'bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-850 rounded-tl-none text-gray-800 dark:text-gray-200'
                }`}
              >
                <p>{msg.text}</p>
                {msg.disclaimer && (
                  <p className="text-[10px] text-gray-400 dark:text-navy-450 mt-1.5 italic">
                    {msg.disclaimer}
                  </p>
                )}

                {/* Speaker icon overlay for system replies */}
                {!isUser && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="absolute right-2 bottom-2 p-1.5 bg-gray-50 dark:bg-navy-700 text-gray-400 hover:text-healthcare-500 dark:hover:text-healthcare-400 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Speak answer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {isUser && (
                <div className="w-8.5 h-8.5 rounded-lg bg-gray-200 dark:bg-navy-800 text-gray-650 dark:text-navy-300 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8.5 h-8.5 rounded-lg bg-healthcare-100 dark:bg-healthcare-950 text-healthcare-700 dark:text-healthcare-400 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-5 h-5 animate-bounce" />
            </div>
            <div className="max-w-[70%] bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-850 rounded-2xl rounded-tl-none p-3.5 shadow-sm flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-healthcare-500 animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 rounded-full bg-healthcare-500 animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-healthcare-500 animate-bounce delay-225" />
              </div>
              <span>MedScribe AI is thinking...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 text-center font-bold">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input panel */}
      <div className="p-4 bg-gray-50 dark:bg-navy-900 border-t border-gray-100 dark:border-navy-850 flex items-center gap-2">
        <VoiceInteraction onResult={handleVoiceResult} placeholder="Speak your health query..." />
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500 dark:focus:ring-healthcare-600 text-gray-800 dark:text-white"
          placeholder="Type your message here..."
        />

        <button
          onClick={() => handleSend()}
          disabled={loading || input.trim() === ''}
          className="p-3 bg-healthcare-500 hover:bg-healthcare-600 disabled:bg-healthcare-300 text-white rounded-2xl shadow-md transition-all focus:outline-none"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </div>

    </div>
  );
};

export default HealthChat;
