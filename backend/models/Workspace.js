const mongoose = require('mongoose')

const generateShareCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'NEURO-'
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const workspaceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'My Workspace'
  },
  shareCode: {
    type: String,
    unique: true,
    default: generateShareCode
  },
  collaborators: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      email: String,
      joinedAt: { type: Date, default: Date.now }
    }
  ],
  documents: [
    {
      fileName: String,
      extractedText: String,
      uploadedBy: String,
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'] },
      content: String,
      userName: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true })

module.exports = mongoose.model('Workspace', workspaceSchema)