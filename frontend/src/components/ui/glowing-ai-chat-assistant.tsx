"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Link, Code, Mic, Send, Info, Bot, X, Maximize2 } from 'lucide-react';
import { AnimatedAIChat } from './animated-ai-chat';

const FloatingAiAssistant = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const maxChars = 2000;
  const chatRef = useRef<HTMLDivElement>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    setCharCount(value.length);
  };

  const handleSend = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
      setCharCount(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Close chat when clicking outside & handle remote open
  useEffect(() => {
    const handleRemoteOpen = () => {
      setIsChatOpen(true);
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (chatRef.current && !chatRef.current.contains(target)) {
        if (!target.closest('.floating-ai-button')) {
          setIsChatOpen(false);
        }
      }
    };

    document.addEventListener('open-chat', handleRemoteOpen);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('open-chat', handleRemoteOpen);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating 3D Glowing AI Logo */}
      <button 
        className={`floating-ai-button relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 transform ${
          isChatOpen ? 'rotate-90' : 'rotate-0'
        }`}
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.8) 0%, rgba(168,85,247,0.8) 100%)',
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.7), 0 0 40px rgba(124, 58, 237, 0.5), 0 0 60px rgba(109, 40, 217, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* 3D effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-30"></div>
        
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
        
        {/* AI Icon */}
        <div className="relative z-10">
        { isChatOpen ? <X /> :  <Bot className="w-8 h-8 text-white" />}
        </div>
        
        {/* Glowing animation */}
        <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-indigo-500"></div>
      </button>

      {isExpanded && (
        <div className="fixed inset-0 z-[100] bg-black">
          <AnimatedAIChat onClose={() => setIsExpanded(false)} />
        </div>
      )}

      {/* Chat Interface */}
      {isChatOpen && !isExpanded && (
        <div 
          ref={chatRef}
          className="absolute bottom-20 right-0 w-max max-w-[500px] transition-all duration-300 origin-bottom-right"
          style={{
            animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          }}
        >
          <div className="relative flex flex-col rounded-3xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl backdrop-blur-3xl overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-4 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-zinc-400">AI Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium bg-zinc-800/60 text-zinc-300 rounded-2xl">
                  GPT-4
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl">
                  Pro
                </span>
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="p-1.5 rounded-full hover:bg-zinc-700/50 transition-colors"
                  title="Expand to Fullscreen"
                >
                  <Maximize2 className="w-4 h-4 text-zinc-400" />
                </button>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-700/50 transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Input Section */}
            <div className="relative overflow-hidden">
              <textarea
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={4}
                className="w-full px-6 py-4 bg-transparent border-none outline-none resize-none text-base font-normal leading-relaxed min-h-[120px] text-zinc-100 placeholder-zinc-500 scrollbar-none"
                placeholder="What would you like to explore today? Ask anything, share ideas, or request assistance..."
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              />
              <div 
                className="absolute inset-0 bg-gradient-to-t from-zinc-800/5 to-transparent pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(39, 39, 42, 0.05), transparent)' }}
              ></div>
            </div>

            {/* Controls Section */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Attachment Group */}
                  <div className="flex items-center gap-1.5 p-1 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
                    {/* Minimal file upload */}
                    <button className="group relative p-2.5 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 hover:scale-105 hover:-rotate-3 transform">
                      <Paperclip className="w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-12" />
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm">
                        Upload Asset
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95"></div>
                      </div>
                    </button>
                  </div>

                  {/* Voice Button */}
                  <button className="group relative p-2.5 bg-transparent border border-zinc-700/30 rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 hover:scale-110 hover:rotate-2 transform hover:border-red-500/30">
                    <Mic className="w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-3" />
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm">
                      Voice input
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95"></div>
                    </div>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Character Counter */}
                  <div className="text-xs font-medium text-zinc-500">
                    <span>{charCount}</span>/<span className="text-zinc-400">{maxChars}</span>
                  </div>

                  {/* Send Button */}
                  <button 
                    onClick={handleSend}
                    className="group relative p-3 bg-gradient-to-r from-red-600 to-red-500 border-none rounded-xl cursor-pointer transition-all duration-300 text-white shadow-lg hover:from-red-500 hover:to-red-400 hover:scale-110 hover:shadow-red-500/30 hover:shadow-xl active:scale-95 transform hover:-rotate-2 hover:animate-pulse"
                    style={{
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(239, 68, 68, 0.4)',
                      animation: 'none'
                    }}
                    onMouseEnter={(e: any) => {
                      e.target.style.animation = 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite';
                    }}
                    onMouseLeave={(e: any) => {
                      e.target.style.animation = 'none';
                    }}
                  >
                    <Send className="w-5 h-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:rotate-12 group-hover:scale-110" />
                    
                    {/* Animated background glow */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600 to-red-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-lg transform scale-110"></div>
                    
                    {/* Ripple effect on click */}
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      <div className="absolute inset-0 bg-white/20 transform scale-0 group-active:scale-100 transition-transform duration-200 rounded-xl"></div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Footer Info */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/50 text-xs text-zinc-500 gap-6">
                <div className="flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  <span>
                    Press <kbd className="px-1.5 py-1 bg-zinc-800 border border-zinc-600 rounded text-zinc-400 font-mono text-xs shadow-sm">Shift + Enter</kbd> for new line
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>All systems operational</span>
                </div>
              </div>
            </div>

            {/* Floating Overlay */}
            <div 
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ 
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), transparent, rgba(147, 51, 234, 0.05))' 
              }}
            ></div>
          </div>
        </div>
      )}
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(1.1);
            opacity: 0;
          }
        }
        
        .floating-ai-button:hover {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.9), 0 0 50px rgba(124, 58, 237, 0.7), 0 0 70px rgba(109, 40, 217, 0.5);
        }
      `}</style>
    </div>
  );
};

export { FloatingAiAssistant };
