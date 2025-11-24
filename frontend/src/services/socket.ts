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

// Socket event helpers
export const sendMessage = (conversationId: string, content: string, attachments?: string[]) => {
  if (socket) {
    socket.emit('send_message', { conversationId, content, attachments });
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

export default socket;
