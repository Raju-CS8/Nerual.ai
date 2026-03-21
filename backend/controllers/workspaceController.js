const Groq = require('groq-sdk')
const Workspace = require('../models/Workspace')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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
    res.json({ success: true, workspaces })
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
    res.json({ success: true, workspace })
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
      workspace.collaborators.push({ userId: req.user.id, name: req.user.name, email: req.user.email })
      await workspace.save()
    }
    res.json({ success: true, workspace })
  } catch (error) {
    res.status(500).json({ error: 'Could not join workspace' })
  }
}

const addDocument = async (req, res) => {
  try {
    const { workspaceId } = req.params
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    // ✅ memoryStorage — file is in req.file.buffer, no disk access needed
    const fileBuffer = req.file.buffer
    let extractedText = ''

    if (req.file.originalname.toLowerCase().endsWith('.pdf')) {
      // ✅ Use pdf-parse/lib directly to avoid ENOENT test-file bug
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

    if (!extractedText.trim()) return res.status(400).json({ error: 'Could not extract text from file' })

    const workspace = await Workspace.findOneAndUpdate(
      { _id: workspaceId, $or: [{ userId: req.user.id }, { 'collaborators.userId': req.user.id }] },
      { $push: { documents: { fileName: req.file.originalname, extractedText: extractedText.slice(0, 8000), uploadedBy: req.user.name } } },
      { new: true }
    )
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })
    res.json({ success: true, workspace, message: `${req.file.originalname} added successfully` })
  } catch (error) {
    console.error('Add document error:', error.message)
    res.status(500).json({ error: 'Failed to add document', details: error.message })
  }
}

const chatWithWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params
    const { message, history = [] } = req.body

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [{ userId: req.user.id }, { 'collaborators.userId': req.user.id }]
    })
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })

    const hasDocuments = workspace.documents.length > 0
    const combinedContext = hasDocuments
      ? workspace.documents.map((doc, i) => `--- Document ${i + 1}: ${doc.fileName} ---\n${doc.extractedText}`).join('\n\n')
      : ''

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: hasDocuments
            ? `You are NEURALIQ AI with access to ${workspace.documents.length} document(s).
Answer questions about ALL documents, compare them, find similarities/differences, create summaries, generate flashcards.
Always reference which document you're talking about when relevant.
DOCUMENTS: ${workspace.documents.map((d, i) => `${i + 1}. ${d.fileName} (uploaded by ${d.uploadedBy})`).join('\n')}
CONTENT: ${combinedContext.slice(0, 12000)}`
            : `You are NEURALIQ AI, a collaborative team assistant.
Help the team with questions, analysis, brainstorming, coding, and any tasks.
Be concise, professional, and helpful. This is a shared workspace — multiple users may be collaborating.`
        },
        ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
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
    res.status(500).json({ error: 'Chat failed', details: error.message })
  }
}

const deleteDocument = async (req, res) => {
  try {
    const { workspaceId, docIndex } = req.params
    const workspace = await Workspace.findOne({ _id: workspaceId, userId: req.user.id })
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })
    workspace.documents.splice(parseInt(docIndex), 1)
    await workspace.save()
    res.json({ success: true, workspace })
  } catch (error) {
    res.status(500).json({ error: 'Could not delete document' })
  }
}

const deleteWorkspace = async (req, res) => {
  try {
    await Workspace.findOneAndDelete({ _id: req.params.workspaceId, userId: req.user.id })
    res.json({ success: true, message: 'Workspace deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Could not delete workspace' })
  }
}

const renameWorkspace = async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
    const workspace = await Workspace.findOneAndUpdate(
      { _id: req.params.workspaceId, userId: req.user.id },
      { name: name.trim() },
      { new: true }
    )
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })
    res.json({ success: true, workspace })
  } catch (error) {
    res.status(500).json({ error: 'Could not rename workspace' })
  }
}

const removeCollaborator = async (req, res) => {
  try {
    const workspace = await Workspace.findOne({ _id: req.params.workspaceId, userId: req.user.id })
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })
    workspace.collaborators.splice(parseInt(req.params.collabIndex), 1)
    await workspace.save()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Could not remove collaborator' })
  }
}

module.exports = { getWorkspaces, createWorkspace, joinWorkspace, addDocument, chatWithWorkspace, deleteDocument, deleteWorkspace, renameWorkspace, removeCollaborator }