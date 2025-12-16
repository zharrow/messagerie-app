import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, messagesApi } from '@/services/api';
import { sendMessage as socketSendMessage } from '@/services/socket';
import gsap from 'gsap';

// Hooks
import { useUserCache } from '@/hooks/useUserCache';
import { useConversations } from '@/hooks/useConversations';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { useMessages } from '@/hooks/useMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useGifSearch } from '@/hooks/useGifSearch';
import { useMessageDecryption } from '@/hooks/useMessageDecryption';

// Components
import ConversationSidebar from '@/components/chat/ConversationSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import GifPicker from '@/components/chat/GifPicker';
import CreateGroupModal from '@/components/chat/CreateGroupModal';
import DeleteMessageModal from '@/components/chat/DeleteMessageModal';
import ProfileSidebar from '@/components/chat/ProfileSidebar';
import GroupSettingsModal from '@/components/chat/GroupSettingsModal';
import { FireAnimation } from '@/components/ui/FireAnimation';

// Types
import type { Conversation } from '@/types/chat';

const Chat = () => {
  const { user, logout } = useAuth();
  const [showUserList, setShowUserList] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showFireAnimation, setShowFireAnimation] = useState(false);

  // Mobile navigation state
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // GSAP refs for mobile animations
  const sidebarRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { users, setUsers, getUserDisplayName, getUserInitials } = useUserCache(user);

  const {
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    selectConversation,
    createGroup,
    getConversationName,
  } = useConversations(user?.id);

  // Hook de déchiffrement E2EE (must be before useSocketEvents and useMessages)
  const { getMessageContent, decryptMessages, invalidateMessageCache } = useMessageDecryption(user?.id);

  const { typingUsers, onlineUsers } = useSocketEvents({
    selectedConversation,
    setConversations,
    setSelectedConversation,
    invalidateMessageCache,
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
    sendMessageWithFiles,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteMessage,
    confirmDeleteMessage,
    cancelDeleteMessage,
    handleReaction,
  } = useMessages(selectedConversation, user?.id, getMessageContent);

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

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // GSAP animation for Sidebar (exit left)
  useLayoutEffect(() => {
    if (!isMobile || !sidebarRef.current) return;

    if (!showMobileChat && !showProfileSidebar) {
      // Show sidebar (slower and smoother)
      gsap.fromTo(
        sidebarRef.current,
        { x: '-100%' },
        {
          x: 0,
          duration: 0.6,
          ease: 'power1.out',
        }
      );
    } else {
      // Hide sidebar (slide left)
      gsap.to(sidebarRef.current, {
        x: '-100%',
        duration: 0.5,
        ease: 'power1.in',
      });
    }
  }, [showMobileChat, showProfileSidebar, isMobile]);

  // GSAP animation for Chat (enter/exit right)
  useLayoutEffect(() => {
    if (!isMobile || !chatRef.current) return;

    if (showMobileChat && selectedConversation) {
      // Show chat (slide in from right - very slow and smooth)
      gsap.fromTo(
        chatRef.current,
        { x: '100%' },
        {
          x: 0,
          duration: 0.8,
          ease: 'power1.inOut',
        }
      );
    } else if (chatRef.current.style.transform !== '') {
      // Hide chat (slide out to right - faster)
      gsap.to(chatRef.current, {
        x: '100%',
        duration: 0.35,
        ease: 'power2.in',
      });
    }
  }, [showMobileChat, selectedConversation, isMobile]);

  // GSAP animation for ProfileSidebar (enter/exit right)
  useLayoutEffect(() => {
    if (!isMobile || !profileRef.current) return;

    if (showProfileSidebar && selectedConversation) {
      // Show profile (slide in from right - slower and smoother)
      gsap.fromTo(
        profileRef.current,
        { x: '100%' },
        {
          x: 0,
          duration: 0.6,
          ease: 'power1.out',
        }
      );
    } else if (profileRef.current.style.transform !== '') {
      // Hide profile (slide out to right)
      gsap.to(profileRef.current, {
        x: '100%',
        duration: 0.5,
        ease: 'power1.in',
      });
    }
  }, [showProfileSidebar, selectedConversation, isMobile]);

  // Handle mobile conversation selection
  const handleMobileSelectConversation = (conversation: Conversation) => {
    selectConversation(conversation);
    if (isMobile) {
      setShowMobileChat(true);
    }
  };

  // Handle mobile back navigation (ProfileSidebar → Chat → Sidebar)
  const handleMobileBack = () => {
    if (showProfileSidebar) {
      // If ProfileSidebar is open, close it and return to Chat
      setShowProfileSidebar(false);
    } else {
      // If Chat is open, close it and return to Sidebar
      setShowMobileChat(false);
      setShowProfileSidebar(false);
    }
  };

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

  // Handle create group/conversation
  const handleCreateGroup = async (groupName: string, selectedUserIds: number[]) => {
    try {
      await createGroup(groupName, selectedUserIds);
      setShowUserList(false);
    } catch (error) {
      console.error('Failed to create conversation/group:', error);
      alert('Erreur lors de la création de la conversation');
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

  // Handle open group settings
  const handleOpenGroupSettings = () => {
    setShowGroupSettings(true);
    loadUsers(); // Load users for adding members
  };

  // Handle add members to group
  const handleAddMembers = async (userIds: number[]) => {
    if (!selectedConversation) return;
    try {
      const updatedConversation = await messagesApi.addParticipants(selectedConversation._id, userIds);
      setSelectedConversation(updatedConversation);
      // Update in conversations list
      setConversations((prev) =>
        prev.map((c) => (c._id === updatedConversation._id ? updatedConversation : c))
      );
    } catch (error) {
      console.error('Failed to add members:', error);
      throw error;
    }
  };

  // Handle remove member from group
  const handleRemoveMember = async (userId: number) => {
    if (!selectedConversation) return;
    try {
      const updatedConversation = await messagesApi.removeParticipant(selectedConversation._id, userId);
      setSelectedConversation(updatedConversation);
      // Update in conversations list
      setConversations((prev) =>
        prev.map((c) => (c._id === updatedConversation._id ? updatedConversation : c))
      );
    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  };

  // Handle delete group
  const handleDeleteGroup = async () => {
    if (!selectedConversation) return;
    try {
      await messagesApi.deleteConversation(selectedConversation._id);
      // Remove from conversations list
      setConversations((prev) => prev.filter((c) => c._id !== selectedConversation._id));
      setSelectedConversation(null);
      setShowGroupSettings(false);
      setShowProfileSidebar(false);
    } catch (error) {
      console.error('Failed to delete group:', error);
      throw error;
    }
  };

  // Handle /fire command
  const handleFireCommand = async () => {
    if (!selectedConversation) return;

    // Show fire animation
    setShowFireAnimation(true);

    // Wait for animation to complete (4 seconds)
    setTimeout(async () => {
      try {
        // Delete the conversation
        await messagesApi.deleteConversation(selectedConversation._id);

        // Remove from conversations list
        setConversations((prev) => prev.filter((c) => c._id !== selectedConversation._id));
        setSelectedConversation(null);
        setShowProfileSidebar(false);
        setShowGroupSettings(false);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        alert('Erreur lors de la destruction de la conversation');
      } finally {
        setShowFireAnimation(false);
      }
    }, 4000);
  };

  return (
    <div className="h-screen flex bg-gray-50 relative overflow-hidden">
      {/* Create Group/Conversation Modal */}
      <CreateGroupModal
        isOpen={showUserList}
        users={users}
        loadingUsers={loadingUsers}
        currentUserId={user?.id || 0}
        onClose={() => setShowUserList(false)}
        onCreateGroup={handleCreateGroup}
      />

      {/* Desktop Layout: Sidebar + Chat */}
      {!isMobile && (
        <>
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
                  onToggleProfile={() => setShowProfileSidebar(!showProfileSidebar)}
                  isMobile={false}
                  onBack={handleMobileBack}
                />

                {/* Messages */}
                <MessageList
                  conversation={selectedConversation}
                  userId={user?.id}
                  editingMessageId={editingMessageId}
                  editContent={editContent}
                  hoveredMessageId={hoveredMessageId}
                  showEmojiPicker={showEmojiPicker}
                  getMessageContent={getMessageContent}
                  decryptMessages={decryptMessages}
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
                  onSendMessageWithFiles={sendMessageWithFiles}
                  onOpenGifPicker={handleOpenGifPicker}
                  onFireCommand={handleFireCommand}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white">
                <p className="text-gray-500">
                  Sélectionnez une conversation pour commencer
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mobile Layout: Sliding Panels (GSAP Animated) */}
      {isMobile && (
        <div className="flex-1 relative overflow-hidden">
          {/* Conversations List (Mobile) */}
          {!showMobileChat && !showProfileSidebar && (
            <div
              ref={sidebarRef}
              className="absolute inset-0 z-10 bg-white"
              style={{ transform: 'translateX(-100%)' }}
            >
              <ConversationSidebar
                user={user}
                conversations={conversations}
                selectedConversation={selectedConversation}
                typingUsers={typingUsers}
                onlineUsers={onlineUsers}
                onLogout={logout}
                onNewConversation={handleOpenUserList}
                onSelectConversation={handleMobileSelectConversation}
                getConversationName={(conv) => getConversationName(conv, getUserDisplayName)}
                getUserInitials={getUserInitials}
                getUserDisplayName={getUserDisplayName}
              />
            </div>
          )}

          {/* Chat View (Mobile) - Slides in from right */}
          {showMobileChat && selectedConversation && (
            <div
              ref={chatRef}
              className="absolute inset-0 z-20 flex flex-col bg-white"
              style={{ transform: 'translateX(100%)' }}
            >
              {/* Chat header */}
              <ChatHeader
                conversationName={getConversationName(selectedConversation, getUserDisplayName)}
                typingUsers={typingUsers}
                conversationId={selectedConversation._id}
                currentUserId={user?.id}
                getUserDisplayName={getUserDisplayName}
                onToggleProfile={() => setShowProfileSidebar(!showProfileSidebar)}
                isMobile={true}
                onBack={handleMobileBack}
              />

              {/* Messages */}
              <MessageList
                conversation={selectedConversation}
                userId={user?.id}
                editingMessageId={editingMessageId}
                editContent={editContent}
                hoveredMessageId={hoveredMessageId}
                showEmojiPicker={showEmojiPicker}
                getMessageContent={getMessageContent}
                decryptMessages={decryptMessages}
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
                onSendMessageWithFiles={sendMessageWithFiles}
                onOpenGifPicker={handleOpenGifPicker}
                onFireCommand={handleFireCommand}
              />
            </div>
          )}

          {/* Profile Sidebar (Mobile) - Slides in from right */}
          {showProfileSidebar && selectedConversation && (
            <div
              ref={profileRef}
              className="absolute inset-0 z-30 bg-white"
              style={{ transform: 'translateX(100%)' }}
            >
              <ProfileSidebar
                isOpen={showProfileSidebar}
                conversation={selectedConversation}
                currentUserId={user?.id || 0}
                onClose={() => setShowProfileSidebar(false)}
                getUserDisplayName={getUserDisplayName}
                getUserInitials={getUserInitials}
                onlineUsers={onlineUsers}
                onOpenGroupSettings={handleOpenGroupSettings}
                isMobile={true}
              />
            </div>
          )}
        </div>
      )}

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

      {/* Profile Sidebar (Desktop only) */}
      {!isMobile && (
        <ProfileSidebar
          isOpen={showProfileSidebar}
          conversation={selectedConversation}
          currentUserId={user?.id || 0}
          onClose={() => setShowProfileSidebar(false)}
          getUserDisplayName={getUserDisplayName}
          getUserInitials={getUserInitials}
          onlineUsers={onlineUsers}
          onOpenGroupSettings={handleOpenGroupSettings}
          isMobile={false}
        />
      )}

      {/* Group Settings Modal */}
      {selectedConversation?.isGroup && (
        <GroupSettingsModal
          isOpen={showGroupSettings}
          conversation={selectedConversation}
          currentUserId={user?.id || 0}
          users={users}
          onClose={() => setShowGroupSettings(false)}
          onAddMembers={handleAddMembers}
          onRemoveMember={handleRemoveMember}
          onDeleteGroup={handleDeleteGroup}
          getUserDisplayName={getUserDisplayName}
          getUserInitials={getUserInitials}
          onlineUsers={onlineUsers}
        />
      )}

      {/* Fire Animation */}
      {showFireAnimation && <FireAnimation duration={4000} />}
    </div>
  );
};

export default Chat;
