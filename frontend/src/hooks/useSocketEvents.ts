import { useEffect, useState } from 'react';
import { getSocket } from '@/services/socket';
import type { Conversation, Message } from '@/types/chat';

interface UseSocketEventsProps {
  selectedConversation: Conversation | null;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setSelectedConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
}

export const useSocketEvents = ({
  selectedConversation,
  setConversations,
  setSelectedConversation,
}: UseSocketEventsProps) => {
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<number>>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

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

    const handleReactionAdded = (data: { conversationId: string; messageId: string; reaction: { emoji: string; userId: number; createdAt: string } }) => {
      if (selectedConversation?._id === data.conversationId) {
        setSelectedConversation((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map((msg) =>
              msg._id === data.messageId
                ? {
                    ...msg,
                    reactions: [...(msg.reactions || []), data.reaction],
                  }
                : msg
            ),
          };
        });
      }
    };

    const handleReactionRemoved = (data: { conversationId: string; messageId: string; emoji: string; userId: number }) => {
      if (selectedConversation?._id === data.conversationId) {
        setSelectedConversation((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map((msg) =>
              msg._id === data.messageId
                ? {
                    ...msg,
                    reactions: (msg.reactions || []).filter(
                      (r) => !(r.emoji === data.emoji && r.userId === data.userId)
                    ),
                  }
                : msg
            ),
          };
        });
      }
    };

    const handleMessageEdited = (data: { conversationId: string; messageId: string; content: string; editedAt: string }) => {
      console.log('[FRONTEND] Received message_edited event:', data);
      if (selectedConversation?._id === data.conversationId) {
        setSelectedConversation((prev) => {
          if (!prev) return null;
          console.log('[FRONTEND] Updating message', data.messageId, 'with content:', data.content);
          return {
            ...prev,
            messages: prev.messages.map((msg) =>
              msg._id === data.messageId
                ? { ...msg, content: data.content }
                : msg
            ),
          };
        });
      }
    };

    const handleMessageDeleted = (data: { conversationId: string; messageId: string }) => {
      if (selectedConversation?._id === data.conversationId) {
        setSelectedConversation((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.filter((msg) => msg._id !== data.messageId),
          };
        });
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('reaction_added', handleReactionAdded);
    socket.on('reaction_removed', handleReactionRemoved);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('reaction_added', handleReactionAdded);
      socket.off('reaction_removed', handleReactionRemoved);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [selectedConversation, setConversations, setSelectedConversation]);

  return {
    typingUsers,
    onlineUsers,
  };
};
