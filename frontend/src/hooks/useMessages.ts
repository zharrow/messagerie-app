import { useMessageInput } from './useMessageInput';
import { useMessageEdit } from './useMessageEdit';
import { useMessageDeletion } from './useMessageDeletion';
import { useMessageReactions } from './useMessageReactions';
import type { Conversation, Message } from '@/types/chat';

export const useMessages = (
  selectedConversation: Conversation | null,
  userId?: number,
  getMessageContent?: (message: Message) => string
) => {
  const input = useMessageInput(selectedConversation);
  const edit = useMessageEdit(selectedConversation, getMessageContent);
  const deletion = useMessageDeletion(selectedConversation);
  const reactions = useMessageReactions(selectedConversation, userId);

  return {
    // Input
    messageInput: input.messageInput,
    setMessageInput: input.setMessageInput,
    isEncrypting: input.isEncrypting,
    sendMessage: input.sendMessage,
    sendMessageWithFiles: input.sendMessageWithFiles,

    // Edit
    editingMessageId: edit.editingMessageId,
    editContent: edit.editContent,
    setEditContent: edit.setEditContent,
    handleEditMessage: edit.handleEditMessage,
    handleSaveEdit: edit.handleSaveEdit,
    handleCancelEdit: edit.handleCancelEdit,

    // Deletion
    deletingMessageId: deletion.deletingMessageId,
    handleDeleteMessage: deletion.handleDeleteMessage,
    confirmDeleteMessage: deletion.confirmDeleteMessage,
    cancelDeleteMessage: deletion.cancelDeleteMessage,

    // Reactions
    hoveredMessageId: reactions.hoveredMessageId,
    setHoveredMessageId: reactions.setHoveredMessageId,
    showEmojiPicker: reactions.showEmojiPicker,
    setShowEmojiPicker: reactions.setShowEmojiPicker,
    handleReaction: reactions.handleReaction,
  };
};
