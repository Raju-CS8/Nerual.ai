// server.js
const express = require('express')
const cors = require('cors')
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

const app = express()
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
app.use('/auth', googleAuthRoutes)

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'NEURALIQ API is running 🚀' })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || 'Something went wrong' })
})

app.listen(PORT, () => {
  console.log(`✅ NEURALIQ backend running at http://localhost:${PORT}`)
})