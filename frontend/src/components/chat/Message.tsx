import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SplitText from '@/components/ui/SplitText';
import { Pencil, Trash2, SmilePlus } from 'lucide-react';
import { isGifUrl, formatMessageTime, groupReactionsByEmoji, EMOJI_LIST } from '@/utils/chatHelpers';
import type { Message as MessageType } from '@/types/chat';

interface MessageProps {
  message: MessageType;
  isOwn: boolean;
  isNew: boolean;
  isLastInGroup: boolean;
  isEditing: boolean;
  editContent: string;
  hoveredMessageId: string | null;
  showEmojiPicker: string | null;
  userId?: number;
  onHover: (id: string | null) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditContentChange: (content: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleEmojiPicker: (messageId: string | null) => void;
}

const Message = ({
  message,
  isOwn,
  isNew,
  isLastInGroup,
  isEditing,
  editContent,
  hoveredMessageId,
  showEmojiPicker,
  userId,
  onHover,
  onEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  onEditContentChange,
  onReaction,
  onToggleEmojiPicker,
}: MessageProps) => {
  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => onHover(message._id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="relative flex items-center gap-2">
        {/* Edit/Delete buttons for own messages */}
        {isOwn && !isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(message._id)}
              title="Modifier"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(message._id)}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Message content */}
        <div className="relative">
          {isEditing ? (
            <div className="min-w-[300px] max-w-[500px] space-y-2 p-3 rounded-lg bg-background border">
              <Input
                value={editContent}
                onChange={(e) => onEditContentChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit();
                  if (e.key === 'Escape') onCancelEdit();
                }}
                className="bg-background"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={onSaveEdit}>
                  Enregistrer
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`inline-block max-w-[450px] px-4 py-2.5 rounded-2xl shadow-sm ${
                isOwn
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted rounded-bl-md'
              }`}
            >
              {isGifUrl(message.content) ? (
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
                <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
              )}
              {isLastInGroup && (
                <p
                  className={`text-[10px] mt-1 ${
                    isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground/70'
                  }`}
                >
                  {formatMessageTime(message.createdAt)}
                </p>
              )}
            </div>
          )}

          {/* Reactions display */}
          {!isEditing && message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(groupReactionsByEmoji(message.reactions)).map(([emoji, count]) => {
                const userReacted = message.reactions?.some(
                  (r) => r.emoji === emoji && r.userId === userId
                );
                return (
                  <button
                    key={emoji}
                    onClick={() => onReaction(message._id, emoji)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                      userReacted
                        ? 'bg-primary/20 border border-primary'
                        : 'bg-muted hover:bg-muted/80 border border-transparent'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="text-xs">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Emoji picker button */}
          {!isEditing && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 bg-background border shadow-sm"
                onClick={() => onToggleEmojiPicker(showEmojiPicker === message._id ? null : message._id)}
                title="Réagir"
              >
                <SmilePlus className="h-3 w-3" />
              </Button>

              {/* Emoji picker popup */}
              {showEmojiPicker === message._id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-background border rounded-lg shadow-lg p-2 flex gap-1 z-10">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onReaction(message._id, emoji)}
                      className="w-8 h-8 hover:bg-muted rounded transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reaction button for received messages */}
        {!isOwn && !isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleEmojiPicker(showEmojiPicker === message._id ? null : message._id)}
              title="Réagir"
            >
              <SmilePlus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
