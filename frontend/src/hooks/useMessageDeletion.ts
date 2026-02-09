import { useState } from 'react';
import { deleteMessage } from '@/services/socket';
import type { Conversation } from '@/types/chat';

export const useMessageDeletion = (selectedConversation: Conversation | null) => {
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  const handleDeleteMessage = (messageId: string) => {
    setDeletingMessageId(messageId);
  };

  const confirmDeleteMessage = () => {
    if (!selectedConversation || !deletingMessageId) return;
    deleteMessage(selectedConversation._id, deletingMessageId);
    setDeletingMessageId(null);
  };

  const cancelDeleteMessage = () => {
    setDeletingMessageId(null);
  };

  return {
    deletingMessageId,
    handleDeleteMessage,
    confirmDeleteMessage,
    cancelDeleteMessage,
  };
};
