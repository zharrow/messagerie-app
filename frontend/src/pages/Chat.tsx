import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { messagesApi, userApi } from '@/services/api';
import { getSocket, sendMessage as socketSendMessage, startTyping, stopTyping, markMessagesRead, joinConversation } from '@/services/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AvatarStatus from '@/components/ui/AvatarStatus';
import SplitText from '@/components/ui/SplitText';
import ShinyText from '@/components/ui/ShinyText';
import { LogOut, Send, Plus, Users, X, MessageCircle, Image, Clapperboard, Search } from 'lucide-react';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface Message {
  _id: string;
  from: number;
  content: string;
  createdAt: string;
  readBy: number[];
}

interface Conversation {
  _id: string;
  participants: number[];
  isGroup: boolean;
  groupName?: string;
  messages: Message[];
  lastMessage?: {
    content: string;
    from: number;
    createdAt: string;
  };
}

const Chat = () => {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<number>>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersCache, setUsersCache] = useState<Map<number, User>>(new Map());

  // GIF picker state
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifResults, setGifResults] = useState<any[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load users cache at startup (for displaying names)
  useEffect(() => {
    const loadUsersCache = async () => {
      try {
        const data = await userApi.listUsers();
        const cache = new Map<number, User>();
        data.forEach((u: User) => cache.set(u.id, u));
        setUsersCache(cache);
        setUsers(data);
      } catch (error) {
        console.error('Failed to load users cache:', error);
      }
    };

    loadUsersCache();
  }, []);

  // Load conversations
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

  // Load users when modal opens (refresh the list)
  useEffect(() => {
    if (showUserList) {
      loadUsers();
    }
  }, [showUserList]);

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

  // Socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (data: { conversationId: string; message: Message }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === data.conversationId
            ? {
                ...conv,
                messages: [...(conv.messages || []), data.message],
                lastMessage: {
                  content: data.message.content,
                  from: data.message.from,
                  createdAt: data.message.createdAt,
                },
              }
            : conv
        )
      );

      if (selectedConversation?._id === data.conversationId) {
        setSelectedConversation((prev) =>
          prev
            ? {
                ...prev,
                messages: [...(prev.messages || []), data.message],
              }
            : null
        );
      }
    };

    const handleUserTyping = (data: { conversationId: string; userId: number; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        const convTyping = newMap.get(data.conversationId) || new Set();

        if (data.isTyping) {
          convTyping.add(data.userId);
        } else {
          convTyping.delete(data.userId);
        }

        newMap.set(data.conversationId, convTyping);
        return newMap;
      });
    };

    const handleUserOnline = (data: { userId: number }) => {
      setOnlineUsers((prev) => new Set(prev).add(data.userId));
    };

    const handleUserOffline = (data: { userId: number }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  }, [selectedConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  // Select conversation
  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      const fullConversation = await messagesApi.getConversation(conversation._id);
      setSelectedConversation(fullConversation);
      // Join the socket room to receive real-time messages
      joinConversation(conversation._id);
      markMessagesRead(conversation._id);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    socketSendMessage(selectedConversation._id, messageInput.trim());
    setMessageInput('');
    stopTyping(selectedConversation._id);
  };

  // Handle typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (selectedConversation) {
      startTyping(selectedConversation._id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(selectedConversation._id);
      }, 2000);
    }
  };

  // Search GIFs using Tenor API
  const searchGifs = useCallback(async (query: string) => {
    if (query.length < 2) {
      setGifResults([]);
      return;
    }
    setLoadingGifs(true);
    try {
      const apiKey = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ';
      const limit = 20;
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&limit=${limit}&media_filter=gif`
      );
      const data = await response.json();
      setGifResults(data.results || []);
    } catch (error) {
      console.error('Failed to search GIFs:', error);
      setGifResults([]);
    } finally {
      setLoadingGifs(false);
    }
  }, []);

  // Load trending GIFs on mount
  useEffect(() => {
    const loadTrendingGifs = async () => {
      if (!showGifPicker) return;
      setLoadingGifs(true);
      try {
        const apiKey = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ';
        const limit = 20;
        const response = await fetch(
          `https://tenor.googleapis.com/v2/featured?key=${apiKey}&limit=${limit}&media_filter=gif`
        );
        const data = await response.json();
        setGifResults(data.results || []);
      } catch (error) {
        console.error('Failed to load trending GIFs:', error);
      } finally {
        setLoadingGifs(false);
      }
    };
    if (showGifPicker && gifResults.length === 0 && !gifSearchQuery) {
      loadTrendingGifs();
    }
  }, [showGifPicker, gifResults.length, gifSearchQuery]);

  // Debounce GIF search
  useEffect(() => {
    if (!gifSearchQuery) return;
    const debounce = setTimeout(() => searchGifs(gifSearchQuery), 500);
    return () => clearTimeout(debounce);
  }, [gifSearchQuery, searchGifs]);

  // Send GIF as message
  const handleSendGif = (gifUrl: string) => {
    if (!selectedConversation) return;
    socketSendMessage(selectedConversation._id, gifUrl);
    setShowGifPicker(false);
    setGifSearchQuery('');
    setGifResults([]);
  };

  // Start conversation with user
  const handleStartConversation = async (targetUser: User) => {
    try {
      const conversation = await messagesApi.createConversation({
        participants: [targetUser.id],
      });
      setConversations((prev) => {
        // Check if conversation already exists
        const exists = prev.find(c => c._id === conversation._id);
        if (exists) return prev;
        return [conversation, ...prev];
      });
      setSelectedConversation(conversation);
      // Join the socket room to receive real-time messages
      joinConversation(conversation._id);
      setShowUserList(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  // Get user display name from cache
  const getUserDisplayName = (userId: number): string => {
    const cachedUser = usersCache.get(userId);
    if (cachedUser) {
      return `${cachedUser.first_name} ${cachedUser.last_name}`;
    }
    return `Utilisateur ${userId}`;
  };

  // Get user initials from cache
  const getUserInitials = (userId: number): string => {
    const cachedUser = usersCache.get(userId);
    if (cachedUser) {
      return `${cachedUser.first_name?.[0] || ''}${cachedUser.last_name?.[0] || ''}`;
    }
    return 'U';
  };

  // Get conversation display name
  const getConversationName = (conversation: Conversation) => {
    if (conversation.isGroup && conversation.groupName) {
      return conversation.groupName;
    }
    const otherParticipant = conversation.participants.find((p) => p !== user?.id);
    if (otherParticipant) {
      return getUserDisplayName(otherParticipant);
    }
    return 'Conversation';
  };

  // Get typing indicator for conversation
  const getTypingIndicator = (conversationId: string) => {
    const typing = typingUsers.get(conversationId);
    if (!typing || typing.size === 0) return null;

    const typingArray = Array.from(typing).filter((id) => id !== user?.id);
    if (typingArray.length === 0) return null;

    const typingUserName = getUserDisplayName(typingArray[0]);
    return (
      <ShinyText
        text={`${typingUserName} est en train d'écrire...`}
        speed={2}
        className="text-sm text-muted-foreground"
      />
    );
  };

  return (
    <div className="h-screen flex bg-background">
      {/* User List Modal */}
      {showUserList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Nouvelle conversation</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowUserList(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loadingUsers ? (
                <div className="p-8 text-center text-muted-foreground">
                  Chargement des utilisateurs...
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Aucun autre utilisateur trouvé
                </div>
              ) : (
                users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleStartConversation(u)}
                    className="p-4 border-b cursor-pointer hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    <AvatarStatus
                      fallback={`${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`}
                      isOnline={false}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{u.first_name} {u.last_name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AvatarStatus
              fallback={`${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`}
              isOnline={true}
            />
            <div>
              <p className="font-medium">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* New conversation button */}
        <div className="p-4 border-b">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowUserList(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle conversation
          </Button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Aucune conversation</p>
              <p className="text-sm mt-2">Cliquez sur "Nouvelle conversation" pour commencer</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const otherParticipantId = conversation.participants.find((p) => p !== user?.id);
              const avatarInitials = conversation.isGroup ? 'G' : (otherParticipantId ? getUserInitials(otherParticipantId) : 'U');
              const isOtherOnline = otherParticipantId ? onlineUsers.has(otherParticipantId) : false;

              return (
              <div
                key={conversation._id}
                onClick={() => handleSelectConversation(conversation)}
                className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                  selectedConversation?._id === conversation._id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <AvatarStatus
                    fallback={avatarInitials}
                    isOnline={!conversation.isGroup && isOtherOnline}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {getConversationName(conversation)}
                    </p>
                    {conversation.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage.content}
                      </p>
                    )}
                    {getTypingIndicator(conversation._id)}
                  </div>
                  {conversation.isGroup && (
                    <Users className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b">
              <h2 className="font-semibold">{getConversationName(selectedConversation)}</h2>
              {getTypingIndicator(selectedConversation._id)}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
              {selectedConversation.messages?.map((message, index) => {
                const isOwn = message.from === user?.id;
                const isNew = index === selectedConversation.messages.length - 1;

                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.content.match(/^https?:\/\/.*\.(gif|tenor\.com.*)/i) ? (
                        <img
                          src={message.content}
                          alt="GIF"
                          className="max-w-full rounded-lg max-h-60 object-cover"
                          loading="lazy"
                        />
                      ) : isNew && !isOwn ? (
                        <SplitText
                          text={message.content}
                          delay={30}
                          duration={0.3}
                          from={{ opacity: 0, y: 10 }}
                          to={{ opacity: 1, y: 0 }}
                        />
                      ) : (
                        <p>{message.content}</p>
                      )}
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowGifPicker(!showGifPicker)}
                  title="Envoyer un GIF"
                >
                  <Clapperboard className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Écrivez un message..."
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
      {showGifPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl mx-4 h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Choisir un GIF</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowGifPicker(false);
                  setGifSearchQuery('');
                  setGifResults([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Rechercher un GIF..."
                  className="pl-9"
                  value={gifSearchQuery}
                  onChange={(e) => setGifSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* GIF Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingGifs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : gifResults.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {gifResults.map((gif) => {
                    const gifUrl = gif.media_formats?.gif?.url || gif.media_formats?.tinygif?.url;
                    return (
                      <button
                        key={gif.id}
                        onClick={() => handleSendGif(gifUrl)}
                        className="relative aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity bg-muted"
                      >
                        <img
                          src={gifUrl}
                          alt={gif.content_description || 'GIF'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Clapperboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {gifSearchQuery
                        ? 'Aucun GIF trouvé'
                        : 'Recherchez un GIF ou parcourez les tendances'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                Propulsé par Tenor
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
