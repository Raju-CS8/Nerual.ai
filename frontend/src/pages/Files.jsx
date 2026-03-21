import { useState, useRef } from 'react'
import Sidebar from '../components/Sidebar'

export default function Files({ activePage, setActivePage, user, onLogout }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [pdfText, setPdfText] = useState(null) // store extracted text
  const [messages, setMessages] = useState([])  // chat messages
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return

    const allowed = ['.pdf', '.txt', '.docx']
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowed.includes(ext)) {
      setError('Only PDF, TXT, and DOCX files are allowed')
      return
    }

    setError('')
    setPdfText(null)
    setMessages([])
    setFileName(file.name)
    setUploading(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return 90 }
        return prev + 10
      })
    }, 300)

    try {
      const token = localStorage.getItem('neuraliq_token')
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('https://nerual-ai.onrender.com/api/files/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      const data = await res.json()
      clearInterval(interval)
      setProgress(100)

      if (data.error) {
        setError(data.error)
      } else {
        setPdfText(data.extractedText)
        // Add initial AI summary as first message
        setMessages([{
          role: 'assistant',
          content: data.summary
        }])
      }
    } catch {
      setError('Upload failed. Make sure backend is running.')
    }

    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const sendQuestion = async () => {
    if (!input.trim() || !pdfText) return

    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setChatLoading(true)

    try {
      const token = localStorage.getItem('neuraliq_token')
      const res = await fetch('https://nerual-ai.onrender.com/api/files/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: input, pdfText })
      })
      const data = await res.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || data.error || 'No response'
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error connecting to server.'
      }])
    }

    setChatLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendQuestion()
    }
  }

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1a0533 0%, #050816 60%)' }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-8 py-6 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h1 className="text-2xl font-bold text-white">
            <span className="font-bold">NEURALIQ.</span>
            <span className="font-light"> File Upload.</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back, {user?.name}.</p>
        </div>

        <div className="flex-1 flex gap-6 p-6 overflow-hidden">

          {/* Left — Upload Panel */}
          <div className="w-80 flex flex-col gap-4 flex-shrink-0">

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
              style={{
                background: dragOver ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
                border: `2px dashed ${dragOver ? 'rgba(124,58,237,0.8)' : 'rgba(124,58,237,0.4)'}`,
                minHeight: '200px'
              }}>
              <span className="text-4xl">📎</span>
              <p className="text-white font-medium text-center text-sm">
                Drag & drop or browse
              </p>
              <p className="text-gray-500 text-xs text-center">PDF, DOCX, TXT (Max 50MB)</p>
              <button className="px-4 py-2 rounded-xl text-white text-sm font-medium"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{fileName}</p>
                    <p className="text-gray-500 text-xs">Uploading... {progress}%</p>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-2 rounded-full transition-all"
                    style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }} />
                </div>
              </div>
            )}

            {/* Current File */}
            {fileName && !uploading && pdfText && (
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
                <div className="flex items-center gap-2">
                  <span>📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{fileName}</p>
                    <p className="text-green-400 text-xs">✓ Ready to chat</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Tips */}
            {!pdfText && !uploading && (
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-gray-400 text-xs font-medium mb-2">After uploading you can ask:</p>
                <div className="flex flex-col gap-2">
                  {['"Summarize this document"', '"Create flashcards"', '"What are the key points?"', '"Explain section 2"'].map((tip, i) => (
                    <p key={i} className="text-gray-600 text-xs">💡 {tip}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Chat Panel */}
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Chat Header */}
            <div className="px-6 py-4 flex items-center gap-3 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>N</div>
              <div>
                <p className="text-white font-bold text-sm">NEURALIQ AI</p>
                <p className="text-gray-500 text-xs">
                  {pdfText ? `Chatting about: ${fileName}` : 'Upload a file to start chatting'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
              {messages.length === 0 && !uploading && (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <span className="text-5xl">🤖</span>
                  <p className="text-gray-500 text-sm text-center">
                    Upload a PDF and I'll analyze it for you.<br/>
                    Then ask me anything about the document!
                  </p>
                </div>
              )}

              {uploading && (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  <p className="text-gray-400 text-sm">Analyzing your document...</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #7c3aed44, #06b6d444)'
                        : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                      border: '2px solid rgba(124,58,237,0.4)'
                    }}>
                    {msg.role === 'user' ? user?.name?.[0]?.toUpperCase() : 'N'}
                  </div>
                  <div className="max-w-lg px-4 py-3 rounded-2xl"
                    style={{
                      background: msg.role === 'user' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                    <p className="text-xs font-semibold mb-1"
                      style={{ color: msg.role === 'user' ? '#a78bfa' : '#06b6d4' }}>
                      {msg.role === 'user' ? user?.name : 'NEURALIQ AI'}
                    </p>
                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>N</div>
                  <div className="px-4 py-3 rounded-2xl flex items-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#7c3aed', animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#7c3aed', animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#7c3aed', animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={pdfText ? 'Ask anything about your document...' : 'Upload a file first...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!pdfText || chatLoading}
                  className="flex-1 py-3 px-4 rounded-xl outline-none text-white placeholder-gray-600"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    opacity: pdfText ? 1 : 0.5
                  }}
                />
                <button
                  onClick={sendQuestion}
                  disabled={!pdfText || chatLoading}
                  className="px-5 py-3 rounded-xl font-semibold text-white transition-all"
                  style={{
                    background: pdfText ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(124,58,237,0.3)',
                    opacity: pdfText ? 1 : 0.5
                  }}>
                  ➤ Ask
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}