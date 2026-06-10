const request = require('supertest')
const mongoose = require('mongoose')
const express = require('express')
const jwt = require('jsonwebtoken')

require('dotenv').config()

const workspaceRoutes = require('../routes/workspaceRoutes')
const connectDB = require('../config/db')
const User = require('../models/User')
const Workspace = require('../models/Workspace')

const app = express()
app.use(express.json())
app.use('/api/workspace', workspaceRoutes)

let testUser
let testToken
let testWorkspaceId

beforeAll(async () => {
  await connectDB()

  // Create a test user
  testUser = await User.create({
    name: 'Workspace Test User',
    email: 'wstest_jest@neuraliq.com',
    password: 'testpass123'
  })

  testToken = jwt.sign(
    { id: testUser._id },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  )
})

afterAll(async () => {
  await User.deleteMany({ email: 'wstest_jest@neuraliq.com' })
  await Workspace.deleteMany({ userId: testUser._id })
  await mongoose.connection.close()
})

describe('Workspace Routes', () => {

  describe('POST /api/workspace', () => {
    it('should create a new workspace', async () => {
      const res = await request(app)
        .post('/api/workspace')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Test Workspace' })

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.workspace.name).toBe('Test Workspace')
      expect(res.body.workspace.shareCode).toMatch(/^NEURO-/)

      testWorkspaceId = res.body.workspace._id
    })

    it('should reject workspace creation without auth', async () => {
      const res = await request(app)
        .post('/api/workspace')
        .send({ name: 'Unauthorized Workspace' })

      expect(res.statusCode).toBe(401)
    })
  })

  describe('GET /api/workspace', () => {
    it('should return workspaces for authenticated user', async () => {
      const res = await request(app)
        .get('/api/workspace')
        .set('Authorization', `Bearer ${testToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.workspaces)).toBe(true)
      expect(res.body.workspaces.length).toBeGreaterThan(0)
    })

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/workspace')

      expect(res.statusCode).toBe(401)
    })
  })

  describe('PATCH /api/workspace/:workspaceId/rename', () => {
    it('should rename workspace when owner', async () => {
      const res = await request(app)
        .patch(`/api/workspace/${testWorkspaceId}/rename`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Renamed Workspace' })

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('DELETE /api/workspace/:workspaceId', () => {
    it('should delete workspace when owner', async () => {
      const res = await request(app)
        .delete(`/api/workspace/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${testToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

})