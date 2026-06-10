// middleware/roleMiddleware.js
// Enforces workspace-level permissions on top of JWT auth.
// Must be used AFTER the `protect` middleware (req.user is set).

const Workspace = require('../models/Workspace')

/**
 * requireOwner
 * Only the workspace creator (userId) can proceed.
 * Used for: deleteWorkspace, renameWorkspace
 */
const requireOwner = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId
    const workspace = await Workspace.findById(workspaceId).select('userId')

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (workspace.userId.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Permission denied. Only the workspace owner can perform this action.'
      })
    }

    // Attach workspace to req so controllers don't re-query
    req.workspace = workspace
    next()
  } catch (err) {
    res.status(500).json({ error: 'Role check failed' })
  }
}

/**
 * requireAdminOrOwner
 * Owner OR collaborator with role 'Admin' can proceed.
 * Used for: removeCollaborator, deleteDocument, inviting members
 */
const requireAdminOrOwner = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId
    const workspace = await Workspace.findById(workspaceId).select('userId collaborators')

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const isOwner = workspace.userId.toString() === req.user.id
    if (isOwner) {
      req.workspace = workspace
      req.userRole = 'Owner'
      return next()
    }

    const collab = workspace.collaborators.find(
      c => c.userId.toString() === req.user.id
    )

    if (!collab) {
      return res.status(403).json({ error: 'You are not a member of this workspace' })
    }

    if (collab.role !== 'Admin') {
      return res.status(403).json({
        error: `Permission denied. Your current role is "${collab.role}". Only Admins or the Owner can perform this action.`
      })
    }

    req.workspace = workspace
    req.userRole = collab.role
    next()
  } catch (err) {
    res.status(500).json({ error: 'Role check failed' })
  }
}

/**
 * requireMember
 * Any member (owner or collaborator) can proceed.
 * Used for: chat, document upload, clearHistory, leaveWorkspace
 */
const requireMember = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId
    const workspace = await Workspace.findById(workspaceId).select('userId collaborators')

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const isOwner = workspace.userId.toString() === req.user.id
    const isCollab = workspace.collaborators.some(
      c => c.userId.toString() === req.user.id
    )

    if (!isOwner && !isCollab) {
      return res.status(403).json({ error: 'You are not a member of this workspace' })
    }

    req.workspace = workspace
    req.userRole = isOwner ? 'Owner' : workspace.collaborators.find(
      c => c.userId.toString() === req.user.id
    )?.role

    next()
  } catch (err) {
    res.status(500).json({ error: 'Role check failed' })
  }
}

module.exports = { requireOwner, requireAdminOrOwner, requireMember }