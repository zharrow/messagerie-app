import { useState } from 'react';
import { sendMessage as socketSendMessage, editMessage, deleteMessage, addReaction, removeReaction } from '@/services/socket';
import { useAuth } from '@/contexts/AuthContext';
import { encryptionService } from '@/services/encryption';
import { userApi, messagesApi } from '@/services/api';
import type { Conversation, Message } from '@/types/chat';

export const useMessages = (
  selectedConversation: Conversation | null,
  userId?: number,
  getMessageContent?: (message: Message) => string
) => {
  const { isEncryptionEnabled } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !selectedConversation) return;

    // Si le chiffrement est activé, chiffrer le message
    if (isEncryptionEnabled) {
      setIsEncrypting(true);
      try {
        // Récupérer les clés privées de l'utilisateur
        const keyPair = encryptionService.loadKeyPair();
        if (!keyPair) {
          console.error('Clés de chiffrement non disponibles');
          socketSendMessage(selectedConversation._id, content.trim());
          setMessageInput('');
          return;
        }

        // Récupérer les clés publiques de TOUS les participants (y compris soi-même)
        // Important: L'expéditeur doit pouvoir déchiffrer ses propres messages
        const participantIds = selectedConversation.participants;
        if (participantIds.length === 0) {
          console.error('Aucun participant trouvé');
          return;
        }

        const { keys: recipientKeys } = await userApi.getBulkPublicKeys(participantIds);
        console.log('[ENCRYPT] Chiffrement pour les participants:', participantIds);

        // Chiffrer le message pour chaque destinataire
        const encryptedMessage = encryptionService.encryptMessage(
          content.trim(),
          recipientKeys,
          keyPair.privateKey,
          keyPair.deviceId
        );

        // Envoyer le message chiffré
        socketSendMessage(selectedConversation._id, '[Chiffré]', encryptedMessage);
        setMessageInput('');
      } catch (error) {
        console.error('Erreur lors du chiffrement du message:', error);
        // Fallback: envoyer en clair si le chiffrement échoue
        socketSendMessage(selectedConversation._id, content.trim());
        setMessageInput('');
      } finally {
        setIsEncrypting(false);
      }
    } else {
      // Pas de chiffrement, envoi normal
      socketSendMessage(selectedConversation._id, content.trim());
      setMessageInput('');
    }
  };

  const handleEditMessage = (messageId: string) => {
    const message = selectedConversation?.messages.find(m => m._id === messageId);
    if (message) {
      // Use decrypted content if available, otherwise fall back to raw content
      const content = getMessageContent ? getMessageContent(message) : message.content;
      console.log('Editing message:', messageId, 'Content:', content);
      setEditingMessageId(messageId);
      setEditContent(content);
    } else {
      console.error('Message not found:', messageId);
    }
  };

  const handleSaveEdit = async () => {
    console.log('Saving edit - MessageId:', editingMessageId, 'Content:', editContent);
    if (!selectedConversation || !editingMessageId || !editContent.trim()) {
      console.warn('Cannot save edit - missing data:', {
        hasConversation: !!selectedConversation,
        editingMessageId,
        editContentTrimmed: editContent.trim()
      });
      return;
    }

    // Trouver le message original pour vérifier s'il était chiffré
    const originalMessage = selectedConversation.messages.find(m => m._id === editingMessageId);

    // Si le message original était chiffré ET que le chiffrement est activé
    if (originalMessage?.encrypted && isEncryptionEnabled) {
      try {
        // Rechiffrer le nouveau contenu
        const keyPair = encryptionService.loadKeyPair();
        if (!keyPair) {
          console.error('Clés de chiffrement non disponibles pour l\'édition');
          editMessage(selectedConversation._id, editingMessageId, editContent.trim());
          setEditingMessageId(null);
          setEditContent('');
          return;
        }

        // Récupérer les clés publiques de tous les participants
        const participantIds = selectedConversation.participants;
        const { keys: recipientKeys } = await userApi.getBulkPublicKeys(participantIds);
        console.log('[EDIT] Rechiffrement pour les participants:', participantIds);

        // Rechiffrer le message édité
        const encryptedMessage = encryptionService.encryptMessage(
          editContent.trim(),
          recipientKeys,
          keyPair.privateKey,
          keyPair.deviceId
        );

        // Envoyer le message chiffré avec les données de chiffrement
        editMessage(selectedConversation._id, editingMessageId, '[Chiffré]', encryptedMessage);

      } catch (error) {
        console.error('Erreur lors du rechiffrement du message édité:', error);
        // Fallback: envoyer en clair
        editMessage(selectedConversation._id, editingMessageId, editContent.trim());
      }
    } else {
      // Message non chiffré, envoi normal
      editMessage(selectedConversation._id, editingMessageId, editContent.trim());
    }

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

  const sendMessageWithFiles = async (files: File[]) => {
    if (!selectedConversation || files.length === 0) return;

    try {
      // Upload files
      const uploadResponse = await messagesApi.uploadFiles(files);
      const attachments = uploadResponse.attachments; // Use attachments instead of filenames

      // Send message with file attachments via Socket
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
    editingMessageId,
    editContent,
    setEditContent,
    hoveredMessageId,
    setHoveredMessageId,
    showEmojiPicker,
    setShowEmojiPicker,
    deletingMessageId,
    isEncrypting,
    sendMessage,
    sendMessageWithFiles,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteMessage,
    confirmDeleteMessage,
    cancelDeleteMessage,
    handleReaction,
  };
};
