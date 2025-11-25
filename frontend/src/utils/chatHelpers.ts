export const isGifUrl = (content: string): boolean => {
  return /^https?:\/\/.*\.(gif|tenor\.com.*)/i.test(content);
};

export const formatMessageTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const isLastInMessageGroup = (
  messageIndex: number,
  messages: any[],
  currentFrom: number
): boolean => {
  const nextMessage = messageIndex < messages.length - 1
    ? messages[messageIndex + 1]
    : null;
  return !nextMessage || nextMessage.from !== currentFrom;
};

export const groupReactionsByEmoji = (
  reactions: Array<{ emoji: string; userId: number; createdAt: string }>
): Record<string, number> => {
  return reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

export const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
