import { useState, useRef } from 'react';
import { startTyping, stopTyping } from '@/services/socket';

export const useTypingIndicator = (conversationId: string | null) => {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTyping = () => {
    if (!conversationId) return;

    startTyping(conversationId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 2000);
  };

  const stopTypingIndicator = () => {
    if (conversationId) {
      stopTyping(conversationId);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  return {
    handleTyping,
    stopTypingIndicator,
  };
};
