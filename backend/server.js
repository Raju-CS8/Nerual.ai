const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const session = require('express-session')
const passport = require('passport')
require('./config/passport')

const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const chatRoutes = require('./routes/chatRoutes')
const fileRoutes = require('./routes/fileRoutes')
const googleAuthRoutes = require('./routes/googleAuth')
const subscriptionRoutes = require('./routes/subscriptionRoutes')
const workspaceRoutes = require('./routes/workspaceRoutes')

const app = express()
const server = http.createServer(app)

// ✅ Socket.io setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 5000

connectDB()

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.use(session({
  secret: process.env.JWT_SECRET || 'neuraliq_secret',
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

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

// ✅ Track online users per workspace
const workspaceUsers = {}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Join workspace room
  socket.on('join_workspace', ({ workspaceId, userName }) => {
    socket.join(workspaceId)
    socket.workspaceId = workspaceId
    socket.userName = userName

    // Track online users
    if (!workspaceUsers[workspaceId]) {
      workspaceUsers[workspaceId] = []
    }
    workspaceUsers[workspaceId] = workspaceUsers[workspaceId].filter(u => u.id !== socket.id)
    workspaceUsers[workspaceId].push({ id: socket.id, name: userName })

    // Notify everyone in room
    io.to(workspaceId).emit('users_online', workspaceUsers[workspaceId])
    socket.to(workspaceId).emit('user_joined', { userName })

    console.log(`${userName} joined workspace ${workspaceId}`)
  })

  // Broadcast message to workspace
  socket.on('workspace_message', ({ workspaceId, message, userName, role }) => {
    socket.to(workspaceId).emit('new_message', { message, userName, role })
  })

  // Broadcast AI response to workspace
  socket.on('ai_response', ({ workspaceId, message, role }) => {
    socket.to(workspaceId).emit('new_message', { message, userName: 'NEURALIQ AI', role })
  })

  // User is typing
  socket.on('typing', ({ workspaceId, userName }) => {
    socket.to(workspaceId).emit('user_typing', { userName })
  })

  // User stopped typing
  socket.on('stop_typing', ({ workspaceId }) => {
    socket.to(workspaceId).emit('user_stop_typing')
  })

  // Document added
  socket.on('document_added', ({ workspaceId, fileName, userName }) => {
    socket.to(workspaceId).emit('workspace_updated', {
      type: 'document_added',
      fileName,
      userName
    })
  })

  // Disconnect
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

// ✅ Use server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(`✅ NEURALIQ backend running at http://localhost:${PORT}`)
})