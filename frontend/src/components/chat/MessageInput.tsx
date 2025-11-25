import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfettiButton } from '@/components/ui/ConfettiButton';
import { Send, Clapperboard } from 'lucide-react';

interface MessageInputProps {
  messageInput: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onOpenGifPicker: () => void;
}

const MessageInput = ({
  messageInput,
  onInputChange,
  onSendMessage,
  onOpenGifPicker,
}: MessageInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSendMessage();
    }
  };

  return (
    <div className="p-4 border-t">
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenGifPicker}
          title="Envoyer un GIF"
        >
          <Clapperboard className="h-5 w-5" />
        </Button>
        <ConfettiButton />
        <Input
          placeholder="Écrivez un message..."
          value={messageInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={onSendMessage}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
