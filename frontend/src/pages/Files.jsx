import { useState, useRef } from 'react'
import Sidebar from '../components/Sidebar'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const BRAND_NAME = 'NeuralIQ'
const AI_NAME = `${BRAND_NAME} AI`

const Icon = ({ size = 14, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-accent px-3.5 py-2 text-[13px] font-medium ' +
  'text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50'

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

  const canAsk = pdfText && !chatLoading

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line py-5 pl-16 pr-6 md:px-8">
          <div>
            <h1 className="font-display text-3xl leading-none tracking-tight text-ink">File Upload</h1>
            <p className="mt-2 text-[13px] text-ink-2">Upload a document and chat with it using AI</p>
          </div>
          {/* File type badges */}
          <div className="hidden gap-1.5 sm:flex">
            {['PDF', 'DOCX', 'TXT'].map(type => (
              <span key={type} className="rounded-full border border-line-strong bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-2">
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">

          {/* Left panel — upload */}
          <div className="flex shrink-0 flex-col gap-3 border-b border-line p-4 lg:w-[300px] lg:overflow-y-auto lg:border-b-0 lg:border-r">

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-5 py-7 transition-colors ${
                dragOver
                  ? 'border-accent bg-accent-soft'
                  : 'border-line-strong bg-surface hover:border-accent/50 hover:bg-bg'
              }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg border border-line transition-colors ${
                dragOver ? 'bg-surface text-accent' : 'bg-sunken text-ink-2'
              }`}>
                <Icon size={22}>
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </Icon>
              </div>

              <div className="text-center">
                <p className="mb-1 text-sm font-medium text-ink">
                  {dragOver ? 'Drop it here!' : 'Drag & drop or browse'}
                </p>
                <p className="text-xs text-ink-2">PDF, DOCX, TXT • Max 50MB</p>
              </div>

              <button type="button" className={`${btnPrimary} px-5 py-2 text-xs`}>
                Browse Files
              </button>

              <input
                ref={fileInputRef} type="file" accept=".pdf,.txt,.docx" className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="rounded-lg border border-line bg-surface p-4">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                    <Icon size={16}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Icon>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">{fileName}</p>
                    <p className="mt-px text-[11px] text-ink-2">Uploading… {progress}%</p>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* File ready */}
            {fileName && !uploading && pdfText && (
              <div className="rounded-lg border border-success/25 bg-success-soft p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface text-success">
                    <Icon size={15}><polyline points="20 6 9 17 4 12"/></Icon>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">{fileName}</p>
                    <p className="mt-px text-[11px] text-success">
                      Ready • {chunks.length > 0 ? `${chunks.length} chunks indexed` : 'Loaded'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3 text-xs text-danger">
                <span className="mt-px shrink-0">
                  <Icon size={13}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Icon>
                </span>
                {error}
              </div>
            )}

            {/* Tips */}
            {!pdfText && !uploading && (
              <div className="rounded-lg border border-line bg-surface p-4">
                <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-2">Try asking…</p>
                <div className="flex flex-col gap-2">
                  {suggestions.map((tip, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-accent" />
                      <p className="text-xs text-ink-2">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel — chat */}
          <div className="flex min-h-[460px] flex-1 flex-col overflow-hidden">

            {/* Chat header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-line px-6 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent">
                <span className="font-display text-xl leading-none text-accent-on">{BRAND_NAME.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{AI_NAME}</p>
                <p className="mt-px truncate text-xs text-ink-2">
                  {pdfText ? `Chatting about: ${fileName}` : 'Upload a file to start chatting'}
                </p>
              </div>

              {/* Status */}
              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${pdfText ? 'bg-success' : 'bg-ink-3'}`} />
                <span className={`text-xs font-medium ${pdfText ? 'text-success' : 'text-ink-2'}`}>
                  {pdfText ? 'Ready' : 'Waiting'}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-6">

                {/* Empty state */}
                {messages.length === 0 && !uploading && (
                  <div className="my-auto flex flex-col items-center gap-3.5 py-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-surface text-ink-2">
                      <Icon size={26}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </Icon>
                    </div>
                    <div className="text-center">
                      <p className="mb-1 text-sm font-medium text-ink">No document loaded</p>
                      <p className="max-w-[260px] text-[13px] leading-relaxed text-ink-2">
                        Upload a PDF, DOCX, or TXT file and I'll analyze it for you
                      </p>
                    </div>
                  </div>
                )}

                {/* Analyzing spinner */}
                {uploading && (
                  <div className="my-auto flex flex-col items-center gap-3.5 py-10">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
                    <p className="text-[13px] text-ink-2">Analyzing your document…</p>
                  </div>
                )}

                {/* Messages */}
                {messages.map((msg, i) => (
                  <div key={i} className="fade-in flex gap-3.5">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                      msg.role === 'user' ? 'bg-sunken text-ink-2' : 'bg-accent text-accent-on'
                    }`}>
                      {msg.role === 'user'
                        ? user?.name?.[0]?.toUpperCase()
                        : <span className="font-display text-[15px] leading-none">{BRAND_NAME.charAt(0)}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1.5 text-xs font-medium text-ink-2">
                        {msg.role === 'user' ? user?.name : AI_NAME}
                      </p>
                      <p className={`whitespace-pre-wrap text-[14px] leading-[1.7] text-ink ${
                        msg.role === 'user' ? 'rounded-lg bg-sunken px-4 py-3' : ''
                      }`}>
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Loading dots */}
                {chatLoading && (
                  <div className="fade-in flex gap-3.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-on">
                      <span className="font-display text-[15px] leading-none">{BRAND_NAME.charAt(0)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-2" aria-label="Thinking">
                      {[0, 150, 300].map((delay, i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 animate-[bounceDot_1.2s_ease-in-out_infinite] rounded-full bg-ink-2"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-line px-6 py-4">
              <div className="mx-auto flex max-w-3xl gap-2.5">
                <input
                  type="text"
                  placeholder={pdfText ? 'Ask anything about your document…' : 'Upload a file first…'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!pdfText || chatLoading}
                  className="min-w-0 flex-1 rounded-md border border-line-strong bg-surface px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-3 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  onClick={sendQuestion}
                  disabled={!pdfText || chatLoading}
                  className={`${btnPrimary} shrink-0 px-5 py-2.5`}
                >
                  <Icon><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Icon>
                  Ask
                </button>
              </div>
              {canAsk !== undefined && pdfText && (
                <p className="mt-2 text-center text-xs text-ink-2">
                  Enter to send • Responses powered by GPT-OSS 120B
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}