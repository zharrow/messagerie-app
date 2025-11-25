import { useState } from 'react';
import { sendMessage as socketSendMessage, editMessage, deleteMessage, addReaction, removeReaction } from '@/services/socket';
import type { Conversation, Message } from '@/types/chat';

export const useMessages = (selectedConversation: Conversation | null, userId?: number) => {
  const [messageInput, setMessageInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  const sendMessage = (content: string) => {
    if (!content.trim() || !selectedConversation) return;
    socketSendMessage(selectedConversation._id, content.trim());
    setMessageInput('');
  };

  const handleEditMessage = (messageId: string) => {
    const message = selectedConversation?.messages.find(m => m._id === messageId);
    if (message) {
      console.log('Editing message:', messageId, 'Content:', message.content);
      setEditingMessageId(messageId);
      setEditContent(message.content);
    } else {
      console.error('Message not found:', messageId);
    }
  };

  const handleSaveEdit = () => {
    console.log('Saving edit - MessageId:', editingMessageId, 'Content:', editContent);
    if (!selectedConversation || !editingMessageId || !editContent.trim()) {
      console.warn('Cannot save edit - missing data:', {
        hasConversation: !!selectedConversation,
        editingMessageId,
        editContentTrimmed: editContent.trim()
      });
      return;
    }
    editMessage(selectedConversation._id, editingMessageId, editContent.trim());
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

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
    messageInput,
    setMessageInput,
    editingMessageId,
    editContent,
    setEditContent,
    hoveredMessageId,
    setHoveredMessageId,
    showEmojiPicker,
    setShowEmojiPicker,
    deletingMessageId,
    sendMessage,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteMessage,
    confirmDeleteMessage,
    cancelDeleteMessage,
    handleReaction,
  };
};
