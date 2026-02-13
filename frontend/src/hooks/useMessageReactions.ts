import { useState } from 'react';
import { addReaction, removeReaction } from '@/services/socket';
import type { Conversation } from '@/types/chat';

export const useMessageReactions = (
  selectedConversation: Conversation | null,
  userId?: number
) => {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  const handleReaction = (messageId: string, emoji: string) => {
    if (!selectedConversation || !userId) return;

    const message = selectedConversation.messages.find(m => m._id === messageId);
    const userReaction = message?.reactions?.find(r => r.userId === userId && r.emoji === emoji);

    if (userReaction) {
      removeReaction(selectedConversation._id, messageId, emoji);
    } else {
      addReaction(selectedConversation._id, messageId, emoji);
    }

    setShowEmojiPicker(null);
  };

  return {
    hoveredMessageId,
    setHoveredMessageId,
    showEmojiPicker,
    setShowEmojiPicker,
    handleReaction,
  };
};
