const Joi = require('joi');

// Schema for creating a conversation
const createConversationSchema = Joi.object({
  participants: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .messages({
      'array.base': 'Participants must be an array',
      'array.min': 'At least one participant is required',
      'any.required': 'Participants are required'
    }),

  isGroup: Joi.boolean()
    .default(false),

  groupName: Joi.when('isGroup', {
    is: true,
    then: Joi.string().min(1).max(100).required().messages({
      'string.empty': 'Group name is required for group conversations',
      'string.max': 'Group name must be less than 100 characters',
      'any.required': 'Group name is required for group conversations'
    }),
    otherwise: Joi.optional()
  })
});

// Schema for sending a message
const sendMessageSchema = Joi.object({
  content: Joi.string()
    .max(5000)
    .when('attachments', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required()
    })
    .messages({
      'string.max': 'Message content must be less than 5000 characters',
      'any.required': 'Message content or attachments are required'
    }),

  attachments: Joi.array()
    .items(
      Joi.object({
        filename: Joi.string().required(),
        originalName: Joi.string().required(),
        url: Joi.string().required(),
        mimeType: Joi.string().required(),
        size: Joi.number().integer().positive().required()
      })
    )
    .max(5)
    .optional()
    .messages({
      'array.max': 'Maximum 5 attachments allowed'
    }),

  replyTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid message ID format'
    }),

  // E2EE fields
  encrypted: Joi.boolean().optional(),

  encryptedPayloads: Joi.object()
    .pattern(
      Joi.string(),
      Joi.string()
    )
    .optional(),

  nonce: Joi.string().optional(),

  senderDeviceId: Joi.string().optional()
});

// Schema for adding participants
const addParticipantsSchema = Joi.object({
  participantId: Joi.number()
    .integer()
    .positive()
    .when('participantIds', {
      is: Joi.exist(),
      then: Joi.forbidden(),
      otherwise: Joi.optional()
    }),

  participantIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .when('participantId', {
      is: Joi.exist(),
      then: Joi.forbidden(),
      otherwise: Joi.optional()
    })
}).or('participantId', 'participantIds').messages({
  'object.missing': 'Either participantId or participantIds is required'
});

// Schema for search messages
const searchMessagesSchema = Joi.object({
  q: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Search query must be at least 2 characters',
      'string.max': 'Search query must be less than 100 characters',
      'any.required': 'Search query is required'
    }),

  conversationId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid conversation ID format'
    })
});

// Schema for get messages (pagination)
const getMessagesSchema = Joi.object({
  before: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Invalid date format (use ISO 8601)'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
});

module.exports = {
  createConversationSchema,
  sendMessageSchema,
  addParticipantsSchema,
  searchMessagesSchema,
  getMessagesSchema
};
