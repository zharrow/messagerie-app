import { useRef, useEffect } from 'react';
import Message from './Message';
import { isLastInMessageGroup } from '@/utils/chatHelpers';
import type { Conversation, Message as MessageType } from '@/types/chat';

interface MessageListProps {
  conversation: Conversation;
  userId?: number;
  editingMessageId: string | null;
  editContent: string;
  hoveredMessageId: string | null;
  showEmojiPicker: string | null;
  onHover: (id: string | null) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditContentChange: (content: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleEmojiPicker: (messageId: string | null) => void;
}

const MessageList = ({
  conversation,
  userId,
  editingMessageId,
  editContent,
  hoveredMessageId,
  showEmojiPicker,
  onHover,
  onEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  onEditContentChange,
  onReaction,
  onToggleEmojiPicker,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-1">
      {conversation.messages?.map((message, index) => {
        const isOwn = message.from === userId;
        const isNew = index === conversation.messages.length - 1;
        const isLastInGroup = isLastInMessageGroup(index, conversation.messages, message.from);

        // Add spacing between groups
        const prevMessage = index > 0 ? conversation.messages[index - 1] : null;
        const isNewGroup = !prevMessage || prevMessage.from !== message.from;

        return (
          <div key={message._id} className={isNewGroup && index > 0 ? 'mt-4' : ''}>
            <Message
              message={message}
              isOwn={isOwn}
              isNew={isNew}
              isLastInGroup={isLastInGroup}
              isEditing={editingMessageId === message._id}
              editContent={editContent}
              hoveredMessageId={hoveredMessageId}
              showEmojiPicker={showEmojiPicker}
              userId={userId}
              onHover={onHover}
              onEdit={onEdit}
              onDelete={onDelete}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onEditContentChange={onEditContentChange}
              onReaction={onReaction}
              onToggleEmojiPicker={onToggleEmojiPicker}
            />
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
