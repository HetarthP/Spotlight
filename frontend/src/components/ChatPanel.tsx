"use client";

import React, { useState, useEffect } from "react";
import AIAssistant from "@/components/ui/ai-assistant";

/**
 * Slide-in sidebar panel with the AI assistant. Renders on all pages via layout.
 * Listens for the "open-chat" event dispatched by the navbar link.
 */
export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    document.addEventListener("open-chat", handleOpen);
    return () => document.removeEventListener("open-chat", handleOpen);
  }, []);

  return (
    <>
      {/* ── Chat Widget ──────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] h-[600px] max-h-[85vh] shadow-2xl rounded-2xl overflow-hidden animate-slide-in-right border border-indigo-500/20">
          <AIAssistant mode="panel" onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}
