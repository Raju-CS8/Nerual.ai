const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const session = require('express-session')
const passport = require('passport')
require('./config/passport')

const rateLimit = require('express-rate-limit')

const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const chatRoutes = require('./routes/chatRoutes')
const fileRoutes = require('./routes/fileRoutes')
const googleAuthRoutes = require('./routes/googleAuth')
const subscriptionRoutes = require('./routes/subscriptionRoutes')
const workspaceRoutes = require('./routes/workspaceRoutes')

const app = express()
app.set('trust proxy', 1)
const server = http.createServer(app)

// ✅ Allowed origins — hardcoded + env fallback
const allowedOrigins = [
  'http://localhost:5173',
  'https://nerual-ai.vercel.app',
  'https://nerual-ai-rajus-projects-12ec0415.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean)

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

const PORT = process.env.PORT || 5000

connectDB()

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.error('CORS blocked origin:', origin)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

app.use(express.json())

app.use(session({
  secret: process.env.JWT_SECRET || 'neuraliq_secret',
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

// ✅ Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
})

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Sending too fast! Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
})

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many uploads. Please wait an hour.' },
  standardHeaders: true,
  legacyHeaders: false
})

app.use('/api', generalLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/signup', authLimiter)
app.use('/api/chat', chatLimiter)
app.use('/api/files', uploadLimiter)

// ✅ Routes
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/subscription', subscriptionRoutes)
app.use('/api/workspace', workspaceRoutes)
app.use('/auth', googleAuthRoutes)

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'NEURALIQ API is running 🚀' })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || 'Something went wrong' })
})

// ✅ Socket.io
const workspaceUsers = {}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join_workspace', ({ workspaceId, userName }) => {
    socket.join(workspaceId)
    socket.workspaceId = workspaceId
    socket.userName = userName

    if (!workspaceUsers[workspaceId]) workspaceUsers[workspaceId] = []
    workspaceUsers[workspaceId] = workspaceUsers[workspaceId].filter(u => u.id !== socket.id)
    workspaceUsers[workspaceId].push({ id: socket.id, name: userName })

    io.to(workspaceId).emit('users_online', workspaceUsers[workspaceId])
    socket.to(workspaceId).emit('user_joined', { userName })
  })

  socket.on('workspace_message', ({ workspaceId, message, userName, role }) => {
    socket.to(workspaceId).emit('new_message', { message, userName, role })
  })

  socket.on('ai_response', ({ workspaceId, message, role }) => {
    socket.to(workspaceId).emit('new_message', { message, userName: 'NEURALIQ AI', role })
  })

  socket.on('typing', ({ workspaceId, userName }) => {
    socket.to(workspaceId).emit('user_typing', { userName })
  })

  socket.on('stop_typing', ({ workspaceId }) => {
    socket.to(workspaceId).emit('user_stop_typing')
  })

  socket.on('document_added', ({ workspaceId, fileName, userName }) => {
    socket.to(workspaceId).emit('workspace_updated', { type: 'document_added', fileName, userName })
  })

  socket.on('disconnect', () => {
    const { workspaceId, userName } = socket
    if (workspaceId && workspaceUsers[workspaceId]) {
      workspaceUsers[workspaceId] = workspaceUsers[workspaceId].filter(u => u.id !== socket.id)
      io.to(workspaceId).emit('users_online', workspaceUsers[workspaceId])
      socket.to(workspaceId).emit('user_left', { userName })
    }
    console.log('User disconnected:', socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`✅ NEURALIQ backend running at http://localhost:${PORT}`)
})