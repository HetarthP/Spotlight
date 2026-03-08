"use client";

import React, { useState, useEffect } from "react";
import { FloatingAiAssistant } from "@/components/ui/glowing-ai-chat-assistant";

export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      // Small visual feedback or handling if needed
      // Currently, FloatingAiAssistant handles its own state. 
      // If we wanted to remotely open it, we'd add an exposed method or context.
    };
    document.addEventListener("open-chat", handleOpen);
    return () => document.removeEventListener("open-chat", handleOpen);
  }, []);

  return <FloatingAiAssistant />;
}
