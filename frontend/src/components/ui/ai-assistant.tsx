"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X, Loader2, Maximize2, Minimize2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AIAssistantProps {
  /** "panel" = sidebar overlay, "page" = full-page view */
  mode?: "panel" | "page";
  /** Called when the close button is clicked (panel mode only) */
  onClose?: () => void;
}

const AIAssistant = ({ mode = "page", onClose }: AIAssistantProps) => {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Send message to the real backend
  const sendToBackend = async (userMessage: string) => {
    setIsTyping(true);

    try {
      // 1) POST to FastAPI backend without Auth
      const chatRes = await fetch(`${API_URL}/api/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!chatRes.ok) {
        const errData = await chatRes.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${chatRes.status})`);
      }

      const data = await chatRes.json();
      setMessages((prev) => [...prev, { text: data.reply, isUser: false }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        { text: `⚠️ ${msg}`, isUser: false },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() === "" || isTyping) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { text: userMessage, isUser: true }]);
    setInput("");
    sendToBackend(userMessage);
  };

  const clearChat = () => {
    setMessages([]);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const containerHeight = mode === "panel" ? "h-full" : "max-w-4xl h-[calc(100vh-200px)] min-h-[600px] mt-8";

  return (
    <div className={`w-full mx-auto ${containerHeight} bg-gradient-to-br from-slate-900 to-indigo-950 ${mode === "panel" ? "" : "rounded-2xl"} overflow-hidden shadow-2xl border border-indigo-500/20 flex flex-col`}>
      {/* Header */}
      <div className="bg-indigo-600/30 backdrop-blur-sm p-4 border-b border-indigo-500/30 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-indigo-300 h-5 w-5" />
          <h2 className="text-white font-medium">Ghost-Merchant AI</h2>
        </div>
        <div className="flex items-center space-x-2">
          {mode === "panel" && (
            <a
              href="/brand/chat"
              className="text-indigo-200 hover:text-white transition-colors"
              title="Open full page"
            >
              <Maximize2 className="h-4 w-4" />
            </a>
          )}
          {mode === "page" && (
            <button
              onClick={clearChat}
              className="text-indigo-200 hover:text-white transition-colors text-xs uppercase tracking-wide"
            >
              Clear
            </button>
          )}
          {mode === "panel" && onClose && (
            <button
              onClick={onClose}
              className="text-indigo-200 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-900/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-12 w-12 text-indigo-400 mb-4" />
            <h3 className="text-indigo-200 text-xl mb-2">
              How can I help you today?
            </h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Ask me about VPP strategy, budget allocation, or campaign planning.
              I already know your brand profile!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl ${
                    msg.isUser
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20"
                      : "bg-slate-700/60 text-slate-100 rounded-tl-none border border-slate-600/50 shadow-md shadow-slate-900/20"
                  } animate-fade-in`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-2xl bg-slate-700/60 text-slate-100 rounded-tl-none border border-slate-600/50">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className={`p-4 border-t ${
          isFocused
            ? "border-indigo-500/70 bg-slate-800/80"
            : "border-slate-700/50 bg-slate-800/30"
        } transition-colors duration-200 shrink-0`}
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type your message..."
            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-full py-3 pl-4 pr-12 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={input.trim() === "" || isTyping}
            className={`absolute right-1 rounded-full p-2 ${
              input.trim() === "" || isTyping
                ? "text-slate-500 bg-slate-700/50 cursor-not-allowed"
                : "text-white bg-indigo-600 hover:bg-indigo-500"
            } transition-colors`}
          >
            {isTyping ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIAssistant;
