import { Button } from '@/components/ui/button';
import AvatarStatus from '@/components/ui/AvatarStatus';
import ShinyText from '@/components/ui/ShinyText';
import { LogOut, Plus, Users } from 'lucide-react';
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
        <Button variant="ghost" size="icon" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* New conversation button */}
      <div className="p-4 border-b">
        <Button
          variant="outline"
          className="w-full"
          onClick={onNewConversation}
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
                onClick={() => onSelectConversation(conversation)}
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
  );
};

export default ConversationSidebar;
