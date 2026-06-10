const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')

const {
  getWorkspaces, createWorkspace, joinWorkspace, addDocument,
  chatWithWorkspace, deleteDocument, deleteWorkspace,
  renameWorkspace, removeCollaborator,
  leaveWorkspace, clearChatHistory, updateCollaboratorRole
} = require('../controllers/workspaceController')

const { protect } = require('../middleware/authMiddleware')
const { requireOwner, requireAdminOrOwner, requireMember } = require('../middleware/roleMiddleware')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.docx']
    const ext = path.extname(file.originalname).toLowerCase()
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only PDF, TXT, DOCX allowed'))
  }
})

// ── Public to members ─────────────────────────────────────────
router.get('/', protect, getWorkspaces)
router.post('/', protect, createWorkspace)
router.post('/join', protect, joinWorkspace)

// Any member can chat, upload, clear history, leave
router.post('/:workspaceId/chat', protect, requireMember, chatWithWorkspace)
router.post('/:workspaceId/documents', protect, requireMember, upload.single('file'), addDocument)
router.delete('/:workspaceId/messages', protect, requireMember, clearChatHistory)
router.delete('/:workspaceId/leave', protect, leaveWorkspace)

// ── Admin or Owner only ───────────────────────────────────────
router.delete('/:workspaceId/documents/:docIndex', protect, requireAdminOrOwner, deleteDocument)
router.delete('/:workspaceId/collaborator/:collabIndex', protect, requireAdminOrOwner, removeCollaborator)
router.patch('/:workspaceId/collaborator/:collabId/role', protect, requireAdminOrOwner, updateCollaboratorRole)

// ── Owner only ────────────────────────────────────────────────
router.patch('/:workspaceId/rename', protect, requireOwner, renameWorkspace)
router.delete('/:workspaceId', protect, requireOwner, deleteWorkspace)

module.exports = router