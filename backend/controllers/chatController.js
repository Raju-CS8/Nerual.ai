const Groq = require('groq-sdk')
const User = require('../models/User')
const Chat = require('../models/Chat')
const Usage = require('../models/Usage')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const getToday = () => new Date().toISOString().split('T')[0]

const sendMessage = async (req, res) => {
  try {
    const { message, chatId, history = [] } = req.body

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Block free users who exceeded token limit
    if (req.user.plan === 'free' && req.user.tokensUsed >= 100000) {
      return res.status(403).json({
        error: 'Token limit reached! Please upgrade to Pro to continue chatting.',
        limitReached: true
      })
    }

    const model = 'llama-3.3-70b-versatile'

    // ✅ Build full conversation with memory
    const conversationMessages = [
      {
        role: 'system',
        content: req.user.plan === 'pro'
          ? `You are NEURALIQ AI Pro. You have full memory of this conversation.
             Provide detailed, comprehensive, and insightful responses.
             Always remember what was discussed earlier in this chat.`
          : `You are NEURALIQ AI. You have full memory of this conversation.
             Be concise and helpful. Always remember what was discussed earlier in this chat.`
      },
      // ✅ Include all previous messages for memory
      ...history
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(-20) // last 20 messages to avoid token overflow
        .map(msg => ({
          role: msg.role,
          content: msg.content
        })),
      // Current new message
      { role: 'user', content: message }
    ]

    const completion = await groq.chat.completions.create({
      messages: conversationMessages,
      model,
      temperature: 0.7,
      max_tokens: req.user.plan === 'pro' ? 2048 : 1024,
    })

    const reply = completion.choices[0]?.message?.content || 'No response'
    const tokensUsed = completion.usage?.total_tokens || 0

    // Update total tokens in User
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { tokensUsed: tokensUsed }
    })

    // Track daily usage
    await Usage.findOneAndUpdate(
      { userId: req.user.id, date: getToday() },
      { $inc: { tokensUsed: tokensUsed, messagesCount: 1 } },
      { upsert: true, new: true }
    )

    // Save to chat history in DB
    let chat
    if (chatId) {
      chat = await Chat.findByIdAndUpdate(chatId, {
        $push: {
          messages: [
            { role: 'user', content: message },
            { role: 'assistant', content: reply }
          ]
        }
      }, { new: true })
    } else {
      const title = message.slice(0, 40) + (message.length > 40 ? '...' : '')
      chat = await Chat.create({
        userId: req.user.id,
        title,
        messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: reply }
        ]
      })
    }

    res.json({ success: true, reply, tokensUsed, chatId: chat._id })

  } catch (error) {
    console.error('Chat error:', error.message)
    res.status(500).json({ error: 'AI service error', details: error.message })
  }
}

const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .select('title updatedAt')
      .limit(20)
    res.json({ success: true, chats })
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch chats' })
  }
}

const getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user.id })
    if (!chat) return res.status(404).json({ error: 'Chat not found' })
    res.json({ success: true, chat })
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch chat' })
  }
}

const getUsageStats = async (req, res) => {
  try {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })

    const usageRecords = await Usage.find({
      userId: req.user.id,
      date: { $in: last7Days }
    })

    const usageMap = {}
    usageRecords.forEach(r => { usageMap[r.date] = r })

    const stats = last7Days.map(date => ({
      date,
      label: date.slice(5).replace('-', '/'),
      tokensUsed: usageMap[date]?.tokensUsed || 0,
      messagesCount: usageMap[date]?.messagesCount || 0,
      documentsCount: usageMap[date]?.documentsCount || 0,
    }))

    res.json({ success: true, stats })
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch stats' })
  }
}

module.exports = { sendMessage, getChats, getChat, getUsageStats }