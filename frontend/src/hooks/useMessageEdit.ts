import { useState } from 'react';
import { editMessage } from '@/services/socket';
import { useAuth } from '@/contexts/AuthContext';
import { encryptForConversation } from '@/services/encryption';
import { userApi } from '@/services/api';
import type { Conversation, Message } from '@/types/chat';

export const useMessageEdit = (
  selectedConversation: Conversation | null,
  getMessageContent?: (message: Message) => string
) => {
  const { isEncryptionEnabled } = useAuth();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleEditMessage = (messageId: string) => {
    const message = selectedConversation?.messages.find(m => m._id === messageId);
    if (message) {
      const content = getMessageContent ? getMessageContent(message) : message.content;
      setEditingMessageId(messageId);
      setEditContent(content);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedConversation || !editingMessageId || !editContent.trim()) return;

    const originalMessage = selectedConversation.messages.find(m => m._id === editingMessageId);

    if (originalMessage?.encrypted && isEncryptionEnabled) {
      try {
        const encryptedMessage = await encryptForConversation(
          editContent.trim(),
          selectedConversation.participants,
          userApi.getBulkPublicKeys
        );

        if (encryptedMessage) {
          editMessage(selectedConversation._id, editingMessageId, '[Chiffré]', encryptedMessage);
        } else {
          editMessage(selectedConversation._id, editingMessageId, editContent.trim());
        }
      } catch (error) {
        console.error('Erreur lors du rechiffrement:', error);
        editMessage(selectedConversation._id, editingMessageId, editContent.trim());
      }
    } else {
      editMessage(selectedConversation._id, editingMessageId, editContent.trim());
    }

    setEditingMessageId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  return {
    editingMessageId,
    editContent,
    setEditContent,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
  };
};
