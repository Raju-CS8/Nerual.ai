import { useState, useRef } from 'react'
import Sidebar from '../components/Sidebar'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Files({ activePage, setActivePage, user, onLogout }) {
  // ✅ All state preserved exactly
  const [uploading,    setUploading]    = useState(false)
  const [progress,     setProgress]     = useState(0)
  const [fileName,     setFileName]     = useState(null)
  const [error,        setError]        = useState('')
  const [dragOver,     setDragOver]     = useState(false)
  const [pdfText,      setPdfText]      = useState(null)
  const [chunks,       setChunks]       = useState([])
  const [messages,     setMessages]     = useState([])
  const [input,        setInput]        = useState('')
  const [chatLoading,  setChatLoading]  = useState(false)
  const fileInputRef = useRef(null)
  const bottomRef    = useRef(null)

  // ✅ All logic preserved exactly
  const handleFile = async (file) => {
    if (!file) return
    const allowed = ['.pdf', '.txt', '.docx']
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowed.includes(ext)) { setError('Only PDF, TXT, and DOCX files are allowed'); return }

    setError(''); setPdfText(null); setChunks([]); setMessages([])
    setFileName(file.name); setUploading(true); setProgress(0)

    const interval = setInterval(() => {
      setProgress(prev => { if (prev >= 90) { clearInterval(interval); return 90 }; return prev + 10 })
    }, 300)

    try {
      const token = localStorage.getItem('neuraliq_token')
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${BASE_URL}/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (res.status === 401) {
        localStorage.removeItem('neuraliq_token')
        localStorage.removeItem('neuraliq_user')
        localStorage.removeItem('neuraliq_page')
        window.location.reload()
        return
      }

      const data = await res.json()
      clearInterval(interval); setProgress(100)

      if (data.error) { setError(data.error) }
      else {
        setPdfText(data.extractedText)
        setChunks(data.chunks || [])
        setMessages([{ role: 'assistant', content: data.summary }])
      }
    } catch { setError('Upload failed. Make sure backend is running.') }

    setUploading(false)
  }

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }

  const sendQuestion = async () => {
    if (!input.trim() || !pdfText) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    const currentInput = input; setInput(''); setChatLoading(true)

    try {
      const token = localStorage.getItem('neuraliq_token')
      const res = await fetch(`${BASE_URL}/files/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ question: currentInput, pdfText, chunks: chunks.length > 0 ? chunks : undefined })
      })

      if (res.status === 401) {
        localStorage.removeItem('neuraliq_token')
        localStorage.removeItem('neuraliq_user')
        localStorage.removeItem('neuraliq_page')
        window.location.reload()
        return
      }

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || 'No response' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to server.' }])
    }

    setChatLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuestion() } }

  // ── Quick question suggestions ─────────────────────────────
  const suggestions = ['"Summarize this document"', '"Create flashcards"', '"What are the key points?"', '"Explain section 2"']

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 60% at 20% -5%, rgba(124,58,237,0.1) 0%, #08080f 65%)',
    }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Header ──────────────────────────────────────── */}
        <div style={{
          padding: '20px 32px', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.055)',
          background: 'rgba(255,255,255,0.01)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'white', letterSpacing: '-0.025em' }}>
              File Upload
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '12px', marginTop: '3px' }}>
              Upload a document and chat with it using AI
            </p>
          </div>
          {/* File type badges */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['PDF', 'DOCX', 'TXT'].map(type => (
              <span key={type} style={{
                padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#c4b5fd',
              }}>{type}</span>
            ))}
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', gap: '0', overflow: 'hidden' }}>

          {/* Left panel — upload */}
          <div style={{
            width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px',
            padding: '20px 16px', borderRight: '1px solid rgba(255,255,255,0.055)',
            overflowY: 'auto',
          }}>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                borderRadius: '16px', padding: '28px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '12px', cursor: 'pointer',
                transition: 'all 0.2s ease', minHeight: '200px',
                background: dragOver ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.025)',
                border: `2px dashed ${dragOver ? 'rgba(124,58,237,0.7)' : 'rgba(124,58,237,0.3)'}`,
                boxShadow: dragOver ? '0 0 24px rgba(124,58,237,0.15) inset' : 'none',
              }}>
              {/* Upload icon */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: dragOver ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                  {dragOver ? 'Drop it here!' : 'Drag & drop or browse'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
                  PDF, DOCX, TXT · Max 50MB
                </p>
              </div>

              <button style={{
                padding: '8px 20px', borderRadius: '9px', fontSize: '12px', fontWeight: 700,
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: 'white',
                border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(124,58,237,0.3)',
                fontFamily: 'Inter, sans-serif',
              }}>
                Browse Files
              </button>

              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx" style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])} />
            </div>

            {/* Upload progress */}
            {uploading && (
              <div style={{ padding: '16px', borderRadius: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'white', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fileName}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '1px' }}>Uploading… {progress}%</p>
                  </div>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '999px', width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #06b6d4)', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}

            {/* File ready */}
            {fileName && !uploading && pdfText && (
              <div style={{ padding: '14px', borderRadius: '13px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'white', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fileName}</p>
                    <p style={{ color: '#6ee7b7', fontSize: '11px', marginTop: '1px' }}>
                      Ready · {chunks.length > 0 ? `${chunks.length} chunks indexed` : 'Loaded'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ padding: '12px 14px', borderRadius: '11px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)' }}>
                <p style={{ fontSize: '12px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </p>
              </div>
            )}

            {/* Tips */}
            {!pdfText && !uploading && (
              <div style={{ padding: '16px', borderRadius: '13px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '11px', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Try asking…
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {suggestions.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(124,58,237,0.5)', flexShrink: 0 }} />
                      <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '12px' }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel — chat */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Chat header */}
            <div style={{
              padding: '14px 24px', flexShrink: 0,
              borderBottom: '1px solid rgba(255,255,255,0.055)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(124,58,237,0.3)',
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z"/>
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z"/>
                </svg>
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>NEURALIQ AI</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '1px' }}>
                  {pdfText ? `Chatting about: ${fileName}` : 'Upload a file to start chatting'}
                </p>
              </div>

              {/* Status dot */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: pdfText ? '#10b981' : 'rgba(255,255,255,0.2)', boxShadow: pdfText ? '0 0 6px #10b981' : 'none' }} />
                <span style={{ fontSize: '11px', color: pdfText ? '#6ee7b7' : 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                  {pdfText ? 'Ready' : 'Waiting'}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Empty state */}
              {messages.length === 0 && !uploading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '14px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 600, marginBottom: '5px' }}>No document loaded</p>
                    <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '13px', maxWidth: '260px', lineHeight: '1.6' }}>
                      Upload a PDF, DOCX, or TXT file and I'll analyze it for you
                    </p>
                  </div>
                </div>
              )}

              {/* Analyzing spinner */}
              {uploading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(124,58,237,0.2)', borderTop: '2px solid #7c3aed', animation: 'spin 0.7s linear infinite' }} />
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '13px' }}>Analyzing your document…</p>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }} className="fade-in">
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                    background: msg.role === 'user' ? 'rgba(124,58,237,0.22)' : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    border: '2px solid rgba(124,58,237,0.28)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '12px', color: 'white',
                  }}>
                    {msg.role === 'user' ? user?.name?.[0]?.toUpperCase() : 'N'}
                  </div>
                  <div style={{
                    maxWidth: '72%', padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    background: msg.role === 'user' ? 'rgba(124,58,237,0.16)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(124,58,237,0.26)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px', color: msg.role === 'user' ? '#c4b5fd' : '#67e8f9' }}>
                      {msg.role === 'user' ? user?.name : 'NEURALIQ AI'}
                    </p>
                    <p style={{ color: 'rgba(240,238,255,0.88)', fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}

              {/* Loading dots */}
              {chatLoading && (
                <div style={{ display: 'flex', gap: '12px' }} className="fade-in">
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', color: 'white', flexShrink: 0 }}>N</div>
                  <div style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {[0, 150, 300].map((delay, i) => (
                      <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7c3aed', animation: `bounceDot 1.2s ease-in-out ${delay}ms infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '16px 24px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.055)', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder={pdfText ? 'Ask anything about your document…' : 'Upload a file first…'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!pdfText || chatLoading}
                  style={{
                    flex: 1, padding: '11px 18px', borderRadius: '10px', outline: 'none',
                    color: 'white', fontSize: '13.5px', fontFamily: 'Inter, sans-serif',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                    opacity: pdfText ? 1 : 0.45, transition: 'border-color 0.15s, box-shadow 0.15s, opacity 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)' }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  onClick={sendQuestion}
                  disabled={!pdfText || chatLoading}
                  style={{
                    padding: '11px 22px', borderRadius: '10px', fontWeight: 700, fontSize: '13px',
                    color: 'white', border: 'none', fontFamily: 'Inter, sans-serif',
                    background: pdfText && !chatLoading ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(124,58,237,0.3)',
                    cursor: pdfText && !chatLoading ? 'pointer' : 'not-allowed',
                    boxShadow: pdfText && !chatLoading ? '0 2px 14px rgba(124,58,237,0.32)' : 'none',
                    opacity: pdfText ? 1 : 0.45, transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '7px',
                  }}
                  onMouseEnter={e => { if (pdfText && !chatLoading) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
                  onMouseLeave={e => { e.currentTarget.style.opacity = pdfText ? '1' : '0.45'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Ask
                </button>
              </div>
              {pdfText && (
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.16)', marginTop: '8px', textAlign: 'center' }}>
                  Enter to send · Responses powered by GPT-OSS 120B
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}