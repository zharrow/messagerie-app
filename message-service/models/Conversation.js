const mongoose = require('mongoose');

// Attachment schema for files/images
const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  }
}, { _id: false });

// Reaction schema for emoji reactions
const reactionSchema = new mongoose.Schema({
  emoji: {
    type: String,
    required: true
  },
  userId: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Read receipt with timestamp
const readReceiptSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true
  },
  readAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  from: {
    type: Number,
    required: true
  },
  content: {
    type: String,
    required: function() {
      // Content is required only if there are no attachments
      return !this.attachments || this.attachments.length === 0;
    }
  },
  attachments: [attachmentSchema],
  readBy: [readReceiptSchema],
  reactions: [reactionSchema],
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  // Edit tracking
  editedAt: {
    type: Date,
    default: null
  },
  // Soft delete
  deletedAt: {
    type: Date,
    default: null
  },
  // E2EE fields
  encrypted: {
    type: Boolean,
    default: false
  },
  // Encrypted payload for each recipient device
  // Format: { "userId:deviceId": "encryptedData", ... }
  encryptedPayloads: {
    type: Map,
    of: String,
    default: null
  },
  // Nonce for encryption (if using authenticated encryption)
  nonce: {
    type: String,
    default: null
  },
  // Sender's device ID
  senderDeviceId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  // For private conversations: 2 participants
  // For group conversations: 2+ participants
  participants: [{
    type: Number,
    required: true
  }],
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    default: null
  },
  groupAdmin: {
    type: Number,
    default: null
  },
  messages: [messageSchema],
  lastMessage: {
    content: String,
    from: Number,
    createdAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

// Update updatedAt on save
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
