import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AvatarStatus from '@/components/ui/AvatarStatus';
import ShinyText from '@/components/ui/ShinyText';
import OvOLogo from '@/components/ui/OvOLogo';
import { Settings, MessageSquarePlus, Search, Users, MoreHorizontal } from 'lucide-react';
import type { Conversation, User } from '@/types/chat';

interface ConversationSidebarProps {
  user: User | null;
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  typingUsers: Map<string, Set<number>>;
  onlineUsers: Set<number>;
  onLogout: () => void;
  onNewConversation: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  getConversationName: (conversation: Conversation) => string;
  getUserInitials: (userId: number) => string;
  getUserDisplayName: (userId: number) => string;
}

const ConversationSidebar = ({
  user,
  conversations,
  selectedConversation,
  typingUsers,
  onlineUsers,
  onLogout,
  onNewConversation,
  onSelectConversation,
  getConversationName,
  getUserInitials,
  getUserDisplayName,
}: ConversationSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

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
        className="text-xs text-primary-600"
      />
    );
  };

  const filteredConversations = conversations.filter((conv) =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-[360px] border-r flex flex-col bg-white">
      {/* Header with user info */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <OvOLogo size={28} className="text-primary-600" />
            <h1 className="text-2xl font-bold">OvO</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewConversation}
              className="h-9 w-9 rounded-full hover:bg-gray-100"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-gray-100"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="h-9 w-9 rounded-full hover:bg-gray-100"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher dans Messenger"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-100 border-0 rounded-full focus-visible:ring-1 focus-visible:ring-primary-500"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">
              {searchQuery ? 'Aucun résultat trouvé' : 'Aucune conversation'}
            </p>
            {!searchQuery && (
              <p className="text-xs mt-2">Créez une nouvelle conversation pour commencer</p>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const otherParticipantId = conversation.participants.find((p) => p !== user?.id);
            const avatarInitials = conversation.isGroup ? 'G' : (otherParticipantId ? getUserInitials(otherParticipantId) : 'U');
            const isOtherOnline = otherParticipantId ? onlineUsers.has(otherParticipantId) : false;
            const isSelected = selectedConversation?._id === conversation._id;

            return (
              <div
                key={conversation._id}
                onClick={() => onSelectConversation(conversation)}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <AvatarStatus
                      fallback={avatarInitials}
                      isOnline={!conversation.isGroup && isOtherOnline}
                      className="h-14 w-14"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`font-medium truncate ${isSelected ? 'text-primary-600' : 'text-gray-900'}`}>
                        {getConversationName(conversation)}
                      </p>
                      {conversation.isGroup && (
                        <Users className="h-3.5 w-3.5 text-gray-400 ml-1 flex-shrink-0" />
                      )}
                    </div>
                    {getTypingIndicator(conversation._id) || (
                      conversation.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage.content}
                        </p>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar;
