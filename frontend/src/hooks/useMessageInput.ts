import { useState } from 'react';
import { sendMessage as socketSendMessage } from '@/services/socket';
import { useAuth } from '@/contexts/AuthContext';
import { encryptForConversation } from '@/services/encryption';
import { userApi, messagesApi } from '@/services/api';
import type { Conversation } from '@/types/chat';

export const useMessageInput = (selectedConversation: Conversation | null) => {
  const { isEncryptionEnabled } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !selectedConversation) return;

    if (isEncryptionEnabled) {
      setIsEncrypting(true);
      try {
        const encryptedMessage = await encryptForConversation(
          content.trim(),
          selectedConversation.participants,
          userApi.getBulkPublicKeys
        );

        if (encryptedMessage) {
          socketSendMessage(selectedConversation._id, '[Chiffré]', encryptedMessage);
        } else {
          // Fallback: send unencrypted if encryption fails
          socketSendMessage(selectedConversation._id, content.trim());
        }
      } catch (error) {
        console.error('Erreur lors du chiffrement:', error);
        socketSendMessage(selectedConversation._id, content.trim());
      } finally {
        setIsEncrypting(false);
      }
    } else {
      socketSendMessage(selectedConversation._id, content.trim());
    }

    setMessageInput('');
  };

  const sendMessageWithFiles = async (files: File[]) => {
    if (!selectedConversation || files.length === 0) return;

    try {
      const uploadResponse = await messagesApi.uploadFiles(files);
      const attachments = uploadResponse.attachments;
      const messageContent = messageInput.trim() || `${files.length} fichier(s) partagé(s)`;
      socketSendMessage(selectedConversation._id, messageContent, undefined, attachments);
      setMessageInput('');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Erreur lors de l\'envoi des fichiers');
    }
  };

  return {
    messageInput,
    setMessageInput,
    isEncrypting,
    sendMessage,
    sendMessageWithFiles,
  };
};
