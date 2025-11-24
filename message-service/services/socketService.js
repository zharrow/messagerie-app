const { Server } = require('socket.io');
const { validateSocketToken } = require('../middlewares/auth');
const Conversation = require('../models/Conversation');

let io;

// Store connected users: userId -> Set of socket ids
const connectedUsers = new Map();

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    path: '/messages/socket.io'
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const user = await validateSocketToken(token);
    if (!user) {
      return next(new Error('Invalid token'));
    }

    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`User ${userId} connected via WebSocket`);

    // Add user to connected users
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);

    // Join user's conversation rooms
    joinUserConversations(socket, userId);

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, attachments } = data;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const message = {
          from: userId,
          content,
          attachments: attachments || [],
          readBy: [userId],
          createdAt: new Date()
        };

        conversation.messages.push(message);
        conversation.lastMessage = {
          content,
          from: userId,
          createdAt: message.createdAt
        };

        await conversation.save();

        const savedMessage = conversation.messages[conversation.messages.length - 1];

        // Broadcast to all participants in the conversation
        io.to(`conversation:${conversationId}`).emit('new_message', {
          conversationId,
          message: savedMessage
        });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing_start', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false
      });
    });

    // Handle marking messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId } = data;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });

        if (!conversation) return;

        let updated = false;
        conversation.messages.forEach(message => {
          if (!message.readBy.includes(userId)) {
            message.readBy.push(userId);
            updated = true;
          }
        });

        if (updated) {
          await conversation.save();

          // Notify other participants
          socket.to(`conversation:${conversationId}`).emit('messages_read', {
            conversationId,
            userId
          });
        }
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Handle joining a specific conversation room
    socket.on('join_conversation', (data) => {
      const { conversationId } = data;
      socket.join(`conversation:${conversationId}`);
    });

    // Handle leaving a conversation room
    socket.on('leave_conversation', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);

      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }

      // Notify others that user is offline
      socket.broadcast.emit('user_offline', { userId });
    });
  });

  return io;
};

// Join all conversation rooms for a user
const joinUserConversations = async (socket, userId) => {
  try {
    const conversations = await Conversation.find({
      participants: userId
    }).select('_id');

    conversations.forEach(conv => {
      socket.join(`conversation:${conv._id}`);
    });
  } catch (error) {
    console.error('Error joining conversations:', error);
  }
};

// Check if a user is online
const isUserOnline = (userId) => {
  return connectedUsers.has(userId) && connectedUsers.get(userId).size > 0;
};

// Get all online users
const getOnlineUsers = () => {
  return Array.from(connectedUsers.keys());
};

// Emit to specific user (all their sockets)
const emitToUser = (userId, event, data) => {
  const userSockets = connectedUsers.get(userId);
  if (userSockets) {
    userSockets.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  }
};

module.exports = {
  initializeSocket,
  isUserOnline,
  getOnlineUsers,
  emitToUser
};
