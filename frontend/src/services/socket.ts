import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost';

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    path: '/messages/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;

// Attachment interface
interface Attachment {
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
}

// Socket event helpers
export const sendMessage = (
  conversationId: string,
  content: string,
  attachments?: Attachment[],
  replyTo?: string
) => {
  if (socket) {
    socket.emit('send_message', { conversationId, content, attachments, replyTo });
  }
};

export const startTyping = (conversationId: string) => {
  if (socket) {
    socket.emit('typing_start', { conversationId });
  }
};

export const stopTyping = (conversationId: string) => {
  if (socket) {
    socket.emit('typing_stop', { conversationId });
  }
};

export const markMessagesRead = (conversationId: string) => {
  if (socket) {
    socket.emit('mark_read', { conversationId });
  }
};

export const joinConversation = (conversationId: string) => {
  if (socket) {
    socket.emit('join_conversation', { conversationId });
  }
};

export const leaveConversation = (conversationId: string) => {
  if (socket) {
    socket.emit('leave_conversation', { conversationId });
  }
};

// Reaction helpers
export const addReaction = (conversationId: string, messageId: string, emoji: string) => {
  if (socket) {
    socket.emit('add_reaction', { conversationId, messageId, emoji });
  }
};

export const removeReaction = (conversationId: string, messageId: string, emoji: string) => {
  if (socket) {
    socket.emit('remove_reaction', { conversationId, messageId, emoji });
  }
};

// Edit/Delete helpers
export const editMessage = (conversationId: string, messageId: string, content: string) => {
  if (socket) {
    socket.emit('edit_message', { conversationId, messageId, content });
  }
};

export const deleteMessage = (conversationId: string, messageId: string) => {
  if (socket) {
    socket.emit('delete_message', { conversationId, messageId });
  }
};

export default socket;
