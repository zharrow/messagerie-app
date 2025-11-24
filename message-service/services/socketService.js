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
        const { conversationId, content, attachments, replyTo } = data;

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
          readBy: [{ userId, readAt: new Date() }],
          reactions: [],
          replyTo: replyTo || null,
          createdAt: new Date()
        };

        conversation.messages.push(message);
        conversation.lastMessage = {
          content: content || (attachments?.length ? '📎 Fichier' : ''),
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

    // Handle adding reaction to message
    socket.on('add_reaction', async (data) => {
      try {
        const { conversationId, messageId, emoji } = data;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const message = conversation.messages.id(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(
          r => r.userId === userId && r.emoji === emoji
        );

        if (!existingReaction) {
          message.reactions.push({
            emoji,
            userId,
            createdAt: new Date()
          });
          await conversation.save();
        }

        // Broadcast to all participants
        io.to(`conversation:${conversationId}`).emit('reaction_added', {
          conversationId,
          messageId,
          reaction: { emoji, userId, createdAt: new Date() }
        });

      } catch (error) {
        console.error('Add reaction error:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    // Handle removing reaction from message
    socket.on('remove_reaction', async (data) => {
      try {
        const { conversationId, messageId, emoji } = data;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const message = conversation.messages.id(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Remove the reaction
        message.reactions = message.reactions.filter(
          r => !(r.userId === userId && r.emoji === emoji)
        );
        await conversation.save();

        // Broadcast to all participants
        io.to(`conversation:${conversationId}`).emit('reaction_removed', {
          conversationId,
          messageId,
          emoji,
          userId
        });

      } catch (error) {
        console.error('Remove reaction error:', error);
        socket.emit('error', { message: 'Failed to remove reaction' });
      }
    });

    // Handle editing message
    socket.on('edit_message', async (data) => {
      try {
        const { conversationId, messageId, content } = data;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const message = conversation.messages.id(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Only the sender can edit
        if (message.from !== userId) {
          socket.emit('error', { message: 'Not authorized to edit this message' });
          return;
        }

        // Cannot edit deleted messages
        if (message.deletedAt) {
          socket.emit('error', { message: 'Cannot edit deleted message' });
          return;
        }

        message.content = content;
        message.editedAt = new Date();
        await conversation.save();

        // Broadcast to all participants
        io.to(`conversation:${conversationId}`).emit('message_edited', {
          conversationId,
          messageId,
          content,
          editedAt: message.editedAt
        });

      } catch (error) {
        console.error('Edit message error:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle deleting message
    socket.on('delete_message', async (data) => {
      try {
        const { conversationId, messageId } = data;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const message = conversation.messages.id(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Only the sender can delete
        if (message.from !== userId) {
          socket.emit('error', { message: 'Not authorized to delete this message' });
          return;
        }

        // Soft delete
        message.deletedAt = new Date();
        message.content = '';
        await conversation.save();

        // Broadcast to all participants
        io.to(`conversation:${conversationId}`).emit('message_deleted', {
          conversationId,
          messageId,
          deletedAt: message.deletedAt
        });

      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
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
        const readAt = new Date();

        conversation.messages.forEach(message => {
          // Check if user already read this message
          const alreadyRead = message.readBy.some(r =>
            (typeof r === 'object' && r.userId === userId) || r === userId
          );

          if (!alreadyRead) {
            message.readBy.push({ userId, readAt });
            updated = true;
          }
        });

        if (updated) {
          await conversation.save();

          // Notify other participants with timestamp
          socket.to(`conversation:${conversationId}`).emit('messages_read', {
            conversationId,
            userId,
            readAt
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
