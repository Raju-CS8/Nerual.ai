// controllers/fileController.js
const Groq = require('groq-sdk')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Upload and summarize
const uploadAndSummarize = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    console.log('File received:', req.file.originalname)

    // ✅ With memoryStorage, file is in req.file.buffer — no disk read needed
    const fileBuffer = req.file.buffer

    let extractedText = ''

    if (
      req.file.mimetype === 'application/pdf' ||
      req.file.originalname.toLowerCase().endsWith('.pdf')
    ) {
      const pdfParse = require('pdf-parse')
      const pdfData = await pdfParse(fileBuffer)
      extractedText = pdfData.text
    } else if (req.file.originalname.toLowerCase().endsWith('.docx')) {
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer: fileBuffer })
      extractedText = result.value
    } else {
      // .txt files
      extractedText = fileBuffer.toString('utf-8')
    }

    const truncatedText = extractedText.slice(0, 8000)

    if (!truncatedText.trim()) {
      return res.status(400).json({ error: 'Could not extract text from file.' })
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are NEURALIQ AI. Summarize the following document clearly.
Structure your response as:

**Executive Summary:**
(2-3 sentences)

**Key Points:**
- Point 1
- Point 2
- Point 3

**Action Items:**
- Item 1 (if applicable)`
        },
        {
          role: 'user',
          content: `Summarize this document:\n\n${truncatedText.slice(0, 4000)}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 1024,
    })

    const summary = completion.choices[0]?.message?.content || 'Could not generate summary'

    const User = require('../models/User')
    await User.findByIdAndUpdate(req.user.id, { $inc: { documentsProcessed: 1 } })

    res.json({
      success: true,
      fileName: req.file.originalname,
      summary,
      extractedText: truncatedText
    })

  } catch (error) {
    console.error('File error:', error.message)
    res.status(500).json({ error: 'File processing failed', details: error.message })
  }
}

// Chat about PDF
const chatWithPDF = async (req, res) => {
  try {
    const { question, pdfText } = req.body

    if (!question || !pdfText) {
      return res.status(400).json({ error: 'Question and PDF text are required' })
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are NEURALIQ AI. You have been given a document to analyze.
Answer questions about it accurately and helpfully.
If asked to create flashcards, format them as Q: ... A: ...
If asked for key points, use bullet points.
Always base your answers on the document content provided.

DOCUMENT CONTENT:
${pdfText.slice(0, 6000)}`
        },
        {
          role: 'user',
          content: question
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    })

    const reply = completion.choices[0]?.message?.content || 'No response'

    res.json({ success: true, reply })

  } catch (error) {
    console.error('PDF chat error:', error.message)
    res.status(500).json({ error: 'Chat failed', details: error.message })
  }
}

module.exports = { uploadAndSummarize, chatWithPDF }