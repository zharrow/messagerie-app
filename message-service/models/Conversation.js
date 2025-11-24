const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type: Number,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    type: String
  }],
  readBy: [{
    type: Number
  }],
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
