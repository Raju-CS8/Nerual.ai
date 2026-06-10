const request = require('supertest')
const mongoose = require('mongoose')
const express = require('express')

// Load env
require('dotenv').config()

const authRoutes = require('../routes/authRoutes')
const connectDB = require('../config/db')

// Minimal express app for testing
const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)

beforeAll(async () => {
  await connectDB()
})

afterAll(async () => {
  // Clean up test user
  const User = require('../models/User')
  await User.deleteMany({ email: 'testuser_jest@neuraliq.com' })
  await mongoose.connection.close()
})

describe('Auth Routes', () => {

  describe('POST /api/auth/signup', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Jest Test User',
          email: 'testuser_jest@neuraliq.com',
          password: 'testpass123'
        })

      expect(res.statusCode).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.token).toBeDefined()
      expect(res.body.user.email).toBe('testuser_jest@neuraliq.com')
    })

    it('should reject signup with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'incomplete@test.com' })

      expect(res.statusCode).toBe(400)
      expect(res.body.error).toBeDefined()
    })

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Duplicate User',
          email: 'testuser_jest@neuraliq.com',
          password: 'testpass123'
        })

      expect(res.statusCode).toBe(400)
      expect(res.body.error).toMatch(/already registered/i)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser_jest@neuraliq.com',
          password: 'testpass123'
        })

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.token).toBeDefined()
    })

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser_jest@neuraliq.com',
          password: 'wrongpassword'
        })

      expect(res.statusCode).toBe(401)
      expect(res.body.error).toMatch(/invalid/i)
    })

    it('should reject login with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testuser_jest@neuraliq.com' })

      expect(res.statusCode).toBe(400)
      expect(res.body.error).toBeDefined()
    })
  })

})