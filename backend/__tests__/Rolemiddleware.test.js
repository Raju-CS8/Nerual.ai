const mongoose = require('mongoose')
require('dotenv').config()

const connectDB = require('../config/db')
const User = require('../models/User')
const Workspace = require('../models/Workspace')
const { requireOwner, requireAdminOrOwner, requireMember } = require('../middleware/roleMiddleware')

let owner, collaboratorAdmin, collaboratorViewer, workspace

const mockRes = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const mockReq = (userId, workspaceId) => ({
  user: { id: userId.toString() },
  params: { workspaceId: workspaceId.toString() }
})

beforeAll(async () => {
  await connectDB()

  owner = await User.create({ name: 'Owner', email: 'owner_jest@neuraliq.com', password: 'pass123' })
  collaboratorAdmin = await User.create({ name: 'Admin', email: 'admin_jest@neuraliq.com', password: 'pass123' })
  collaboratorViewer = await User.create({ name: 'Viewer', email: 'viewer_jest@neuraliq.com', password: 'pass123' })

  // Create workspace with collaborators — use $set after create to ensure role is saved
  workspace = await Workspace.create({
    userId: owner._id,
    name: 'Role Test Workspace',
    collaborators: []
  })

  // Push collaborators with role using direct update to bypass any schema issues
  await Workspace.findByIdAndUpdate(workspace._id, {
    $push: {
      collaborators: {
        $each: [
          { userId: collaboratorAdmin._id, name: 'Admin', email: 'admin_jest@neuraliq.com', role: 'Admin', status: 'Online' },
          { userId: collaboratorViewer._id, name: 'Viewer', email: 'viewer_jest@neuraliq.com', role: 'Viewer', status: 'Online' }
        ]
      }
    }
  })

  // Reload workspace
  workspace = await Workspace.findById(workspace._id)
})

afterAll(async () => {
  await User.deleteMany({ email: { $in: ['owner_jest@neuraliq.com', 'admin_jest@neuraliq.com', 'viewer_jest@neuraliq.com'] } })
  await Workspace.deleteMany({ name: 'Role Test Workspace' })
  await mongoose.connection.close()
})

describe('Role Middleware', () => {

  describe('requireOwner', () => {
    it('should allow workspace owner', async () => {
      const next = jest.fn()
      await requireOwner(mockReq(owner._id, workspace._id), mockRes(), next)
      expect(next).toHaveBeenCalled()
    })

    it('should block non-owner collaborator', async () => {
      const next = jest.fn()
      const res = mockRes()
      await requireOwner(mockReq(collaboratorAdmin._id, workspace._id), res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('requireAdminOrOwner', () => {
    it('should allow owner', async () => {
      const next = jest.fn()
      await requireAdminOrOwner(mockReq(owner._id, workspace._id), mockRes(), next)
      expect(next).toHaveBeenCalled()
    })

    it('should allow Admin role collaborator', async () => {
      const next = jest.fn()
      const res = mockRes()
      await requireAdminOrOwner(mockReq(collaboratorAdmin._id, workspace._id), res, next)
      expect(next).toHaveBeenCalled()
    })

    it('should block Viewer collaborator', async () => {
      const next = jest.fn()
      const res = mockRes()
      await requireAdminOrOwner(mockReq(collaboratorViewer._id, workspace._id), res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('requireMember', () => {
    it('should allow owner', async () => {
      const next = jest.fn()
      await requireMember(mockReq(owner._id, workspace._id), mockRes(), next)
      expect(next).toHaveBeenCalled()
    })

    it('should allow Viewer collaborator', async () => {
      const next = jest.fn()
      await requireMember(mockReq(collaboratorViewer._id, workspace._id), mockRes(), next)
      expect(next).toHaveBeenCalled()
    })

    it('should block stranger with no access', async () => {
      const next = jest.fn()
      const res = mockRes()
      const stranger = new mongoose.Types.ObjectId()
      await requireMember(mockReq(stranger, workspace._id), res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(next).not.toHaveBeenCalled()
    })
  })

})