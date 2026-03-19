const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'] },
      content: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  title: { type: String, default: 'New Chat' },
}, { timestamps: true })

module.exports = mongoose.model('Chat', chatSchema)