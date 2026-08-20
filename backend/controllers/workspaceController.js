const Groq = require('groq-sdk')
const Workspace = require('../models/Workspace')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─────────────────────────────────────────────
// RAG CHUNKING UTILITY
// Splits text into overlapping chunks so large
// documents don't get truncated to 8,000 chars.
// ─────────────────────────────────────────────
const chunkText = (text, chunkSize = 1500, overlap = 200) => {
  const chunks = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end))
    if (end === text.length) break
    start += chunkSize - overlap
  }
  return chunks
}

/**
 * Simple keyword-based chunk retrieval.
 * Scores each chunk by how many query words appear in it.
 * Returns the top N most relevant chunks.
 */
const retrieveRelevantChunks = (chunks, query, topN = 4) => {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)

  const scored = chunks.map((chunk, i) => {
    const lower = chunk.toLowerCase()
    const score = queryWords.reduce((acc, word) => {
      // Count occurrences
      const count = (lower.match(new RegExp(word, 'g')) || []).length
      return acc + count
    }, 0)
    return { chunk, score, index: i }
  })

  // Sort by score desc, keep order among ties (preserve document order)
  scored.sort((a, b) => b.score - a.score || a.index - b.index)

  // Always return at least the first chunk even if score is 0
  const top = scored.slice(0, topN)
  top.sort((a, b) => a.index - b.index) // restore document order
  return top.map(s => s.chunk)
}

// ─────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────

const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { userId: req.user.id },
        { 'collaborators.userId': req.user.id }
      ]
    })
      .sort({ updatedAt: -1 })
      .select('name documents messages updatedAt shareCode collaborators userId')

    // Strip raw chunk arrays from documents before sending to client
    // (chunks can be large; client only needs fileName, uploadedBy etc.)
    const sanitized = workspaces.map(ws => {
      const obj = ws.toObject()
      obj.documents = obj.documents.map(({ chunks, ...rest }) => rest)
      // Ensure collaborator _id is serialized as string for frontend use
      obj.collaborators = obj.collaborators.map(c => ({
        ...c,
        _id: c._id?.toString(),
        userId: c.userId?.toString()
      }))
      return obj
    })

    res.json({ success: true, workspaces: sanitized })
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch workspaces' })
  }
}

const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body
    const workspace = await Workspace.create({
      userId: req.user.id,
      name: name || 'My Workspace',
      documents: [],
      messages: []
    })

    const obj = workspace.toObject()
    obj.documents = obj.documents.map(({ chunks, ...rest }) => rest)
    res.json({ success: true, workspace: obj })
  } catch (error) {
    res.status(500).json({ error: 'Could not create workspace' })
  }
}

const joinWorkspace = async (req, res) => {
  try {
    const { shareCode } = req.body
    const workspace = await Workspace.findOne({ shareCode: shareCode.toUpperCase().trim() })

    if (!workspace) return res.status(404).json({ error: 'Invalid share code. Workspace not found.' })
    if (workspace.userId.toString() === req.user.id) return res.status(400).json({ error: 'You are the owner of this workspace!' })

    const alreadyJoined = workspace.collaborators.some(c => c.userId.toString() === req.user.id)

    if (!alreadyJoined) {
      workspace.collaborators.push({
        userId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: 'Viewer',   // default role on join
        status: 'Online'
      })
      await workspace.save()
    }

    const obj = workspace.toObject()
    obj.documents = obj.documents.map(({ chunks, ...rest }) => rest)
    obj.collaborators = obj.collaborators.map(c => ({
      ...c,
      _id: c._id?.toString(),
      userId: c.userId?.toString()
    }))
    res.json({ success: true, workspace: obj })
  } catch (error) {
    res.status(500).json({ error: 'Could not join workspace' })
  }
}

/**
 * addDocument
 * ─────────────
 * • Extracts full text from PDF/DOCX/TXT
 * • Chunks the full text with overlap (no 8k limit)
 * • Stores both extractedText (first 8k for quick preview) and chunks[]
 * • Role check: any member can upload (requireMember in routes)
 */
const addDocument = async (req, res) => {
  try {
    const { workspaceId } = req.params
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const fileBuffer = req.file.buffer
    let extractedText = ''

    if (req.file.originalname.toLowerCase().endsWith('.pdf')) {
      const pdfParse = require('pdf-parse/lib/pdf-parse.js')
      const pdfData = await pdfParse(fileBuffer)
      extractedText = pdfData.text
    } else if (req.file.originalname.toLowerCase().endsWith('.docx')) {
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer: fileBuffer })
      extractedText = result.value
    } else {
      extractedText = fileBuffer.toString('utf-8')
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'Could not extract text from file' })
    }

    // ✅ Chunk the full text
    const chunks = chunkText(extractedText)

    const workspace = await Workspace.findOneAndUpdate(
      {
        _id: workspaceId,
        $or: [
          { userId: req.user.id },
          { 'collaborators.userId': req.user.id }
        ]
      },
      {
        $push: {
          documents: {
            fileName: req.file.originalname,
            // First 8k for quick preview/fallback
            extractedText: extractedText.slice(0, 8000),
            // Full document in chunks
            chunks,
            uploadedBy: req.user.name,
            uploadedBy_id: req.user.id
          }
        }
      },
      { new: true }
    )

    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })

    // Strip chunks before sending to client
    const obj = workspace.toObject()
    obj.documents = obj.documents.map(({ chunks: _c, ...rest }) => rest)

    res.json({
      success: true,
      workspace: obj,
      message: `${req.file.originalname} added successfully (${chunks.length} chunks indexed)`
    })
  } catch (error) {
    console.error('Add document error:', error.message)
    res.status(500).json({ error: 'Failed to add document', details: error.message })
  }
}

/**
 * chatWithWorkspace
 * ─────────────────
 * ✅ CRITICAL BUG FIXED: combinedContext is now injected into Groq system prompt.
 * ✅ Uses RAG: retrieves only the most relevant chunks per query.
 */
const chatWithWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params
    const { message, history = [] } = req.body

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { userId: req.user.id },
        { 'collaborators.userId': req.user.id }
      ]
    })

    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })

    const hasDocuments = workspace.documents.length > 0
    const currentUser = req.user.name

    // RAG: retrieve relevant chunks per document
    let contextBlock = ''
    if (hasDocuments) {
      const relevantParts = workspace.documents.map((doc, i) => {
        const allChunks = doc.chunks?.length > 0 ? doc.chunks : [doc.extractedText]
        const relevant = retrieveRelevantChunks(allChunks, message, 3)
        return `--- Document ${i + 1}: ${doc.fileName} ---\n${relevant.join('\n...\n')}`
      })
      contextBlock = relevantParts.join('\n\n')
    }

    // Build Jarvis-style system prompt — strictly one-on-one per sender
    const jarvisRules = `You are NEURALIQ AI — a Jarvis-style assistant inside a shared workspace.
You are like a smart third person sitting in the room with the team.
Multiple people may use this workspace at different times, but you ALWAYS respond only to whoever is speaking RIGHT NOW.

THE PERSON SPEAKING TO YOU RIGHT NOW IS: ${currentUser}

ABSOLUTE RULES (never break these):
1. Your entire response must be directed at ${currentUser} only.
2. Never mention, greet, or address any other person's name in your reply.
3. Ignore any other names you see in the chat history — they were from a different moment.
4. When ${currentUser} asks something, answer ${currentUser} and only ${currentUser}.
5. Do not say things like "feel free to jump in" to anyone else.`

    const systemPrompt = hasDocuments
      ? `${jarvisRules}

You have access to the following workspace documents. Use them to answer accurately.
=== DOCUMENTS ===
${contextBlock}
=== END ===

Answer ${currentUser}'s question using the documents. Use markdown formatting.`
      : `${jarvisRules}

No documents uploaded yet. Answer ${currentUser}'s question directly and helpfully.`

    // Only keep recent history from the CURRENT session (last 6 messages)
    // and sanitize content to remove any other user names that leaked in
    const collaboratorNames = workspace.collaborators.map(c => c.name)
    const cleanHistory = history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map(m => {
        let content = m.content
        // Strip any collaborator names that appear in old AI responses
        collaboratorNames.forEach(name => {
          if (name && name !== currentUser) {
            content = content.replace(new RegExp(name, 'g'), '[another user]')
          }
        })
        return { role: m.role, content }
      })

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...cleanHistory,
        { role: 'user', content: message }
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.6,
      max_tokens: 1500
    })

    const reply = completion.choices[0]?.message?.content || 'No response'

    await Workspace.findByIdAndUpdate(workspaceId, {
      $push: {
        messages: [
          { role: 'user', content: message, userName: req.user.name },
          { role: 'assistant', content: reply, userName: 'NEURALIQ AI' }
        ]
      }
    })

    res.json({ success: true, reply })
  } catch (error) {
    console.error('Workspace chat error:', error.message)
    res.status(500).json({ error: 'Chat failed' })
  }
}


/**
 * deleteDocument
 * ✅ Role-enforced via requireAdminOrOwner in routes
 */
const deleteDocument = async (req, res) => {
  try {
    const { workspaceId, docIndex } = req.params
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { userId: req.user.id },
        { 'collaborators.userId': req.user.id, 'collaborators.role': 'Admin' }
      ]
    })

    if (!workspace) return res.status(404).json({ error: 'Workspace not found or insufficient permissions' })

    workspace.documents.splice(parseInt(docIndex), 1)
    await workspace.save()

    const obj = workspace.toObject()
    obj.documents = obj.documents.map(({ chunks, ...rest }) => rest)

    res.json({ success: true, workspace: obj })
  } catch {
    res.status(500).json({ error: 'Could not delete document' })
  }
}

/**
 * deleteWorkspace
 * ✅ Role-enforced via requireOwner in routes
 */
const deleteWorkspace = async (req, res) => {
  try {
    await Workspace.findOneAndDelete({
      _id: req.params.workspaceId,
      userId: req.user.id
    })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Could not delete workspace' })
  }
}

/**
 * renameWorkspace
 * ✅ Role-enforced via requireOwner in routes
 */
const renameWorkspace = async (req, res) => {
  try {
    const { name } = req.body
    const workspace = await Workspace.findOneAndUpdate(
      { _id: req.params.workspaceId, userId: req.user.id },
      { name },
      { new: true }
    )
    res.json({ success: true, workspace })
  } catch {
    res.status(500).json({ error: 'Could not rename workspace' })
  }
}

/**
 * removeCollaborator
 * ✅ Role-enforced via requireAdminOrOwner in routes
 */
const removeCollaborator = async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      _id: req.params.workspaceId,
      $or: [
        { userId: req.user.id },
        { 'collaborators.userId': req.user.id, 'collaborators.role': 'Admin' }
      ]
    })

    if (!workspace) return res.status(403).json({ error: 'Permission denied' })

    workspace.collaborators.splice(parseInt(req.params.collabIndex), 1)
    await workspace.save()

    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Could not remove collaborator' })
  }
}

const leaveWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId)
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })

    workspace.collaborators = workspace.collaborators.filter(
      c => c.userId.toString() !== req.user.id
    )

    await workspace.save()
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Could not leave workspace' })
  }
}

const clearChatHistory = async (req, res) => {
  try {
    await Workspace.findOneAndUpdate(
      {
        _id: req.params.workspaceId,
        $or: [
          { userId: req.user.id },
          { 'collaborators.userId': req.user.id }
        ]
      },
      { $set: { messages: [] } },
      { new: true }
    )
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Could not clear history' })
  }
}

/**
 * updateCollaboratorRole  ← NEW
 * Owner or Admin can change another collaborator's role/status.
 */
const updateCollaboratorRole = async (req, res) => {
  try {
    const { workspaceId, collabId } = req.params
    const { role, status } = req.body

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { userId: req.user.id },
        { 'collaborators.userId': req.user.id, 'collaborators.role': 'Admin' }
      ]
    })

    if (!workspace) return res.status(403).json({ error: 'Permission denied' })

    const collab = workspace.collaborators.id(collabId)
    if (!collab) return res.status(404).json({ error: 'Collaborator not found' })

    if (role) collab.role = role
    if (status) collab.status = status

    await workspace.save()
    res.json({ success: true, collaborator: collab })
  } catch (err) {
    res.status(500).json({ error: 'Could not update collaborator' })
  }
}


/**
 * getNotes — load saved editor content
 */
const getNotes = async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      _id: req.params.workspaceId,
      $or: [
        { userId: req.user.id },
        { 'collaborators.userId': req.user.id }
      ]
    }).select('notes')

    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })
    res.json({ success: true, notes: workspace.notes || '' })
  } catch {
    res.status(500).json({ error: 'Could not fetch notes' })
  }
}

/**
 * saveNotes — persist editor HTML to DB
 */
const saveNotes = async (req, res) => {
  try {
    const { notes } = req.body
    await Workspace.findOneAndUpdate(
      {
        _id: req.params.workspaceId,
        $or: [
          { userId: req.user.id },
          { 'collaborators.userId': req.user.id }
        ]
      },
      { $set: { notes } },
      { new: true }
    )
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Could not save notes' })
  }
}

module.exports = {
  getWorkspaces,
  createWorkspace,
  joinWorkspace,
  addDocument,
  chatWithWorkspace,
  deleteDocument,
  deleteWorkspace,
  renameWorkspace,
  removeCollaborator,
  leaveWorkspace,
  clearChatHistory,
  updateCollaboratorRole,
  getNotes,
  saveNotes
}