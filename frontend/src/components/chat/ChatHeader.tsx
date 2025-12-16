import { Button } from '@/components/ui/button';
import ShinyText from '@/components/ui/ShinyText';
import { EncryptionBadge } from '@/components/EncryptionBadge';
import { Phone, Video, Info, ArrowLeft } from 'lucide-react';

interface ChatHeaderProps {
  conversationName: string;
  typingUsers: Map<string, Set<number>>;
  conversationId: string;
  currentUserId?: number;
  getUserDisplayName: (userId: number) => string;
  onToggleProfile?: () => void;
  isMobile?: boolean;
  onBack?: () => void;
}

const ChatHeader = ({
  conversationName,
  typingUsers,
  conversationId,
  currentUserId,
  getUserDisplayName,
  onToggleProfile,
  isMobile = false,
  onBack,
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
        className="text-xs text-primary-600"
      />
    );
  };

  return (
    <div className="px-5 py-3 border-b bg-white shadow-sm">
      <div className="flex items-center justify-between">
        {/* Back button for mobile */}
        {isMobile && onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 rounded-full hover:bg-gray-100 mr-2"
          >
            <ArrowLeft className="h-5 w-5 text-primary-600" />
          </Button>
        )}

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-lg truncate">{conversationName}</h2>
          {getTypingIndicator()}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100">
            <Phone className="h-5 w-5 text-primary-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100">
            <Video className="h-5 w-5 text-primary-600" />
          </Button>
          <EncryptionBadge variant="compact" />
          {onToggleProfile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleProfile}
              className="h-10 w-10 rounded-full hover:bg-gray-100"
            >
              <Info className="h-5 w-5 text-primary-600" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
