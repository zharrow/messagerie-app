import ShinyText from '@/components/ui/ShinyText';

interface ChatHeaderProps {
  conversationName: string;
  typingUsers: Map<string, Set<number>>;
  conversationId: string;
  currentUserId?: number;
  getUserDisplayName: (userId: number) => string;
}

const ChatHeader = ({
  conversationName,
  typingUsers,
  conversationId,
  currentUserId,
  getUserDisplayName,
}: ChatHeaderProps) => {
  const getTypingIndicator = () => {
    const typing = typingUsers.get(conversationId);
    if (!typing || typing.size === 0) return null;

    const typingArray = Array.from(typing).filter((id) => id !== currentUserId);
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
    <div className="p-4 border-b">
      <h2 className="font-semibold">{conversationName}</h2>
      {getTypingIndicator()}
    </div>
  );
};

export default ChatHeader;
