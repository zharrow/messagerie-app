import { useState, useEffect } from 'react';
import { messagesApi } from '@/services/api';
import { joinConversation, markMessagesRead } from '@/services/socket';
import type { Conversation, User } from '@/types/chat';

export const useConversations = (currentUserId?: number) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await messagesApi.getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    loadConversations();
  }, []);

  const selectConversation = async (conversation: Conversation) => {
    try {
      const fullConversation = await messagesApi.getConversation(conversation._id);
      setSelectedConversation(fullConversation);
      joinConversation(conversation._id);
      markMessagesRead(conversation._id);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const createConversation = async (targetUser: User) => {
    try {
      const conversation = await messagesApi.createConversation({
        participants: [targetUser.id],
      });
      setConversations((prev) => {
        const exists = prev.find(c => c._id === conversation._id);
        if (exists) return prev;
        return [conversation, ...prev];
      });
      setSelectedConversation(conversation);
      joinConversation(conversation._id);
      return conversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  };

  const getConversationName = (conversation: Conversation, getUserDisplayName: (id: number) => string) => {
    if (conversation.isGroup && conversation.groupName) {
      return conversation.groupName;
    }
    const otherParticipant = conversation.participants.find((p) => p !== currentUserId);
    if (otherParticipant) {
      return getUserDisplayName(otherParticipant);
    }
    return 'Conversation';
  };

  return {
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    selectConversation,
    createConversation,
    getConversationName,
  };
};
