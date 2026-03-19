const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const {
  getWorkspaces,
  createWorkspace,
  joinWorkspace,
  addDocument,
  chatWithWorkspace,
  deleteDocument,
  deleteWorkspace
} = require('../controllers/workspaceController')
const { protect } = require('../middleware/authMiddleware')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.docx']
    const ext = path.extname(file.originalname).toLowerCase()
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only PDF, TXT, DOCX allowed'))
  }
})

router.get('/', protect, getWorkspaces)
router.post('/', protect, createWorkspace)
router.post('/join', protect, joinWorkspace)
router.post('/:workspaceId/documents', protect, upload.single('file'), addDocument)
router.post('/:workspaceId/chat', protect, chatWithWorkspace)
router.delete('/:workspaceId/documents/:docIndex', protect, deleteDocument)
router.delete('/:workspaceId', protect, deleteWorkspace)

module.exports = router