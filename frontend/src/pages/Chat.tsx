import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/services/api';
import { sendMessage as socketSendMessage } from '@/services/socket';

// Hooks
import { useUserCache } from '@/hooks/useUserCache';
import { useConversations } from '@/hooks/useConversations';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { useMessages } from '@/hooks/useMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useGifSearch } from '@/hooks/useGifSearch';

// Components
import ConversationSidebar from '@/components/chat/ConversationSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import GifPicker from '@/components/chat/GifPicker';
import UserListModal from '@/components/chat/UserListModal';
import DeleteMessageModal from '@/components/chat/DeleteMessageModal';

const Chat = () => {
  const { user, logout } = useAuth();
  const [showUserList, setShowUserList] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Custom hooks
  const { usersCache, users, setUsers, getUserDisplayName, getUserInitials } = useUserCache();

  const {
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    selectConversation,
    createConversation,
    getConversationName,
  } = useConversations(user?.id);

  const { typingUsers, onlineUsers } = useSocketEvents({
    selectedConversation,
    setConversations,
    setSelectedConversation,
  });

  const {
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
  } = useMessages(selectedConversation, user?.id);

  const { handleTyping, stopTypingIndicator } = useTypingIndicator(selectedConversation?._id || null);

  const {
    gifSearchQuery,
    setGifSearchQuery,
    gifResults,
    loadingGifs,
    loadTrendingGifs,
    resetGifSearch,
  } = useGifSearch();

  const [showGifPicker, setShowGifPicker] = useState(false);

  // Load users for the modal
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await userApi.listUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle user selection
  const handleStartConversation = async (targetUser: any) => {
    try {
      await createConversation(targetUser);
      setShowUserList(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  // Handle send message with typing indicator
  const handleSendMessage = () => {
    sendMessage(messageInput);
    stopTypingIndicator();
  };

  // Handle input change with typing indicator
  const handleInputChange = (value: string) => {
    setMessageInput(value);
    handleTyping();
  };

  // Handle GIF selection
  const handleSendGif = (gifUrl: string) => {
    if (!selectedConversation) return;
    socketSendMessage(selectedConversation._id, gifUrl);
    setShowGifPicker(false);
    resetGifSearch();
  };

  // Handle open GIF picker
  const handleOpenGifPicker = () => {
    setShowGifPicker(true);
  };

  // Handle close GIF picker
  const handleCloseGifPicker = () => {
    setShowGifPicker(false);
    resetGifSearch();
  };

  // Handle open user list
  const handleOpenUserList = () => {
    setShowUserList(true);
    loadUsers();
  };

  return (
    <div className="h-screen flex bg-background">
      {/* User List Modal */}
      <UserListModal
        isOpen={showUserList}
        users={users}
        loadingUsers={loadingUsers}
        onClose={() => setShowUserList(false)}
        onSelectUser={handleStartConversation}
      />

      {/* Sidebar */}
      <ConversationSidebar
        user={user}
        conversations={conversations}
        selectedConversation={selectedConversation}
        typingUsers={typingUsers}
        onlineUsers={onlineUsers}
        onLogout={logout}
        onNewConversation={handleOpenUserList}
        onSelectConversation={selectConversation}
        getConversationName={(conv) => getConversationName(conv, getUserDisplayName)}
        getUserInitials={getUserInitials}
        getUserDisplayName={getUserDisplayName}
      />

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <ChatHeader
              conversationName={getConversationName(selectedConversation, getUserDisplayName)}
              typingUsers={typingUsers}
              conversationId={selectedConversation._id}
              currentUserId={user?.id}
              getUserDisplayName={getUserDisplayName}
            />

            {/* Messages */}
            <MessageList
              conversation={selectedConversation}
              userId={user?.id}
              editingMessageId={editingMessageId}
              editContent={editContent}
              hoveredMessageId={hoveredMessageId}
              showEmojiPicker={showEmojiPicker}
              onHover={setHoveredMessageId}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onEditContentChange={setEditContent}
              onReaction={handleReaction}
              onToggleEmojiPicker={setShowEmojiPicker}
            />

            {/* Input */}
            <MessageInput
              messageInput={messageInput}
              onInputChange={handleInputChange}
              onSendMessage={handleSendMessage}
              onOpenGifPicker={handleOpenGifPicker}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">
              Sélectionnez une conversation pour commencer
            </p>
          </div>
        )}
      </div>

      {/* GIF Picker Modal */}
      <GifPicker
        isOpen={showGifPicker}
        searchQuery={gifSearchQuery}
        gifResults={gifResults}
        loadingGifs={loadingGifs}
        onSearchChange={setGifSearchQuery}
        onSelectGif={handleSendGif}
        onClose={handleCloseGifPicker}
        onLoadTrending={loadTrendingGifs}
      />

      {/* Delete Message Modal */}
      <DeleteMessageModal
        isOpen={!!deletingMessageId}
        onClose={cancelDeleteMessage}
        onConfirm={confirmDeleteMessage}
      />
    </div>
  );
};

export default Chat;
