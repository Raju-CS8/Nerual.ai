import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Sidebar from '../components/Sidebar'
import { sendMessageAPI, getChatsAPI, getChatAPI, renameChatAPI, deleteChatAPI } from '../api'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'

const BRAND_NAME = 'Mural'
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

const btnGhost =
  'inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-2 text-xs font-medium ' +
  'text-ink-2 transition-colors hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-50'

// ✅ Markdown renderer — logic preserved exactly (only styling changed)
const MarkdownMessage = ({ content }) => (
  <div className="text-[14px] leading-[1.7] text-ink">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: ({ inline, children, ...props }) => inline
          ? <code {...props} className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[12.5px] text-ink">
              {children}
            </code>
          : <pre className="my-3 overflow-x-auto rounded-lg border border-line bg-sunken p-4">
              <code {...props} className="font-mono text-[12.5px] text-ink">
                {children}
              </code>
            </pre>,

        p:  ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-2.5 list-disc pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2.5 list-decimal pl-5">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,

        h1: ({ children }) => <h1 className="mb-2 mt-4 font-display text-2xl tracking-tight text-ink">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-2 mt-4 text-[16px] font-semibold text-ink">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-1.5 mt-3 text-[14px] font-semibold text-ink">{children}</h3>,

        table: ({ children }) => (
          <div className="my-3 overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-b border-line-strong px-2.5 py-2 text-left font-medium text-ink">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border-b border-line px-2.5 py-2 text-ink-2">{children}</td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-3 border-l-2 border-line-strong pl-3 text-ink-2">{children}</blockquote>
        ),
        a: ({ children, ...props }) => (
          <a {...props} className="text-accent underline underline-offset-2 hover:text-accent-hover">{children}</a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
)

// ✅ timeAgo — logic preserved exactly
const timeAgo = (date) => {
  const diff = new Date() - new Date(date)
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (days  > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins  > 0) return `${mins}m ago`
  return 'Just now'
}

export default function Chat({ activePage, setActivePage, user, onLogout }) {
  // ✅ All state preserved exactly
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello ${user?.name || 'there'}! I am ${AI_NAME}. How can I help you today?` }
  ])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [chatId, setChatId]             = useState(null)
  const [conversations, setConversations] = useState([])
  const [exporting, setExporting]       = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [renamingId, setRenamingId]     = useState(null)
  const [renameValue, setRenameValue]   = useState('')
  const bottomRef = useRef(null)

  // ✅ All logic preserved exactly
  useEffect(() => {
    let mounted = true
    getChatsAPI().then(data => { if (mounted && data.success) setConversations(data.chats) }).catch(() => {})
    return () => { mounted = false }
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const refreshChats = () => {
    getChatsAPI().then(data => { if (data.success) setConversations(data.chats) }).catch(() => {})
  }

  const loadChat = async (id) => {
    try {
      const data = await getChatAPI(id)
      if (data.success) { setChatId(id); setMessages(data.chat.messages) }
    } catch { console.log('Could not load chat') }
  }

  const startNewChat = () => {
    setChatId(null)
    setMessages([{ role: 'assistant', content: `Hello ${user?.name || 'there'}! I am ${AI_NAME}. How can I help you today?` }])
  }

  const handleRename = async (id) => {
    if (!renameValue.trim()) { setRenamingId(null); return }
    try {
      const data = await renameChatAPI(id, renameValue)
      if (data.success) setConversations(prev => prev.map(c => c._id === id ? { ...c, title: renameValue } : c))
    } catch { console.log('Could not rename') }
    setRenamingId(null)
  }

  const handleDeleteChat = async (id) => {
    try {
      await deleteChatAPI(id)
      setConversations(prev => prev.filter(c => c._id !== id))
      if (chatId === id) {
        setChatId(null)
        setMessages([{ role: 'assistant', content: `Hello ${user?.name || 'there'}! I am ${AI_NAME}. How can I help you today?` }])
      }
    } catch { console.log('Could not delete chat') }
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    try {
      const data = await sendMessageAPI(input, chatId, messages)
      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.limitReached
            ? '🚫 Token limit reached! Please upgrade to Pro to continue chatting.'
            : `Error: ${data.error}`
        }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        if (!chatId) setChatId(data.chatId)
        refreshChats()
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to server!' }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // ✅ Export logic preserved exactly (brand text + colors updated)
  const exportAsPDF = async () => {
    setExporting(true); setShowExportMenu(false)
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15; const maxWidth = pageWidth - margin * 2; let y = 20
      pdf.setFontSize(20); pdf.setTextColor(15, 118, 110)
      pdf.text(`${BRAND_NAME}. Chat Export`, margin, y); y += 8
      pdf.setFontSize(10); pdf.setTextColor(150, 150, 150)
      pdf.text(`Exported by: ${user?.name} | ${new Date().toLocaleString()}`, margin, y); y += 10
      pdf.setDrawColor(15, 118, 110); pdf.line(margin, y, pageWidth - margin, y); y += 8
      for (const msg of messages.filter(m => m.role !== 'system')) {
        if (y > 270) { pdf.addPage(); y = 20 }
        pdf.setFontSize(9)
        pdf.setTextColor(msg.role === 'user' ? 15 : 95, msg.role === 'user' ? 118 : 94, msg.role === 'user' ? 110 : 88)
        pdf.text(msg.role === 'user' ? `${user?.name}:` : `${AI_NAME}:`, margin, y); y += 5
        pdf.setFontSize(10); pdf.setTextColor(50, 50, 50)
        const lines = pdf.splitTextToSize(msg.content, maxWidth)
        for (const line of lines) { if (y > 275) { pdf.addPage(); y = 20 }; pdf.text(line, margin, y); y += 5 }
        y += 4
      }
      pdf.save(`${BRAND_NAME.toLowerCase()}-chat-${Date.now()}.pdf`)
    } catch (err) { alert('Export failed: ' + err.message) }
    setExporting(false)
  }

  const exportAsWord = async () => {
    setExporting(true); setShowExportMenu(false)
    try {
      const docChildren = [
        new Paragraph({ text: `${BRAND_NAME}. Chat Export`, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: `Exported by: ${user?.name} | ${new Date().toLocaleString()}`, color: '888888', size: 20 })] }),
        new Paragraph({ text: '' }),
      ]
      for (const msg of messages.filter(m => m.role !== 'system')) {
        docChildren.push(
          new Paragraph({ children: [new TextRun({ text: msg.role === 'user' ? `${user?.name}:` : `${AI_NAME}:`, bold: true, color: msg.role === 'user' ? '0F766E' : '5F5E58', size: 22 })] }),
          new Paragraph({ children: [new TextRun({ text: msg.content, size: 22 })] }),
          new Paragraph({ text: '' }),
        )
      }
      const doc = new Document({ sections: [{ children: docChildren }] })
      const blob = await Packer.toBlob(doc)
      saveAs(blob, `${BRAND_NAME.toLowerCase()}-chat-${Date.now()}.docx`)
    } catch (err) { alert('Export failed: ' + err.message) }
    setExporting(false)
  }

  const exportItems = [
    { label: 'Export as PDF',  action: exportAsPDF },
    { label: 'Export as Word', action: exportAsWord },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      {/* ── Conversation history ─────────────────────────────── */}
      <aside className="flex w-56 shrink-0 flex-col gap-2 border-r border-line bg-surface px-2.5 pb-4 pt-16 md:pt-4">

        <button onClick={startNewChat} className={`${btnPrimary} w-full`}>
          <Icon size={13}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>
          New Chat
        </button>

        <p className="px-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-ink-2">Recent</p>

        {conversations.length === 0 ? (
          <p className="px-1 py-1.5 text-xs text-ink-2">No conversations yet</p>
        ) : (
          <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
            {conversations.map((c) => {
              const isActive = c._id === chatId
              return (
                <div
                  key={c._id}
                  className={`group relative rounded-md border transition-colors ${
                    isActive ? 'border-accent/25 bg-accent-soft' : 'border-transparent hover:bg-sunken'
                  }`}
                >
                  <button
                    onClick={() => loadChat(c._id)}
                    className="w-full py-2 pl-2.5 pr-14 text-left"
                  >
                    {renamingId === c._id ? (
                      <input
                        type="text" value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRename(c._id); if (e.key === 'Escape') setRenamingId(null) }}
                        onBlur={() => handleRename(c._id)}
                        className="w-full border-b border-accent bg-transparent text-[13px] text-ink outline-none"
                        autoFocus onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <p className={`truncate text-[13px] font-medium ${isActive ? 'text-accent' : 'text-ink'}`}>
                        {c.title}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-ink-2">{timeAgo(c.updatedAt)}</p>
                  </button>

                  {/* Rename / Delete actions */}
                  <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenamingId(c._id); setRenameValue(c.title) }}
                      className="flex h-6 w-6 items-center justify-center rounded text-ink-2 transition-colors hover:bg-line hover:text-ink"
                      title="Rename" aria-label="Rename chat"
                    >
                      <Icon size={12}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </Icon>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteChat(c._id) }}
                      className="flex h-6 w-6 items-center justify-center rounded text-ink-2 transition-colors hover:bg-danger-soft hover:text-danger"
                      title="Delete" aria-label="Delete chat"
                    >
                      <Icon size={12}>
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </Icon>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </aside>

      {/* ── Main chat panel ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h1 className="font-display text-2xl leading-none tracking-tight text-ink">AI Chat</h1>
            <p className="mt-1.5 text-xs text-ink-2">
              {user?.name || 'User'} • GPT-OSS 120B via Groq
            </p>
          </div>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={messages.length <= 1}
              className={btnGhost}
            >
              <Icon size={13}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </Icon>
              {exporting ? 'Exporting…' : 'Export'}
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-[176px] overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
                {exportItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-ink transition-colors hover:bg-sunken"
                  >
                    <span className="text-ink-2">
                      <Icon size={13}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </Icon>
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-7">
            {messages.map((msg, i) => (
              <div key={i} className="fade-in flex gap-3.5">
                {/* Avatar */}
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  msg.role === 'user' ? 'bg-sunken text-ink-2' : 'bg-accent text-accent-on'
                }`}>
                  {msg.role === 'user'
                    ? (user?.name?.[0]?.toUpperCase() || '?')
                    : <span className="font-display text-[15px] leading-none">{BRAND_NAME.charAt(0)}</span>}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 text-xs font-medium text-ink-2">
                    {msg.role === 'user' ? (user?.name || 'You') : AI_NAME}
                  </p>
                  {msg.role === 'assistant'
                    ? <MarkdownMessage content={msg.content} />
                    : <p className="whitespace-pre-wrap rounded-lg bg-sunken px-4 py-3 text-[14px] leading-[1.7] text-ink">
                        {msg.content}
                      </p>
                  }
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
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

        {/* Input bar */}
        <div className="shrink-0 border-t border-line px-6 py-4">
          <div className="mx-auto flex max-w-3xl items-center gap-2.5">

            {/* File shortcut */}
            <button
              onClick={() => setActivePage('Files')}
              title="Upload a file"
              className={`${btnGhost} shrink-0 py-2.5`}
            >
              <Icon>
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </Icon>
              File
            </button>

            {/* Text input */}
            <input
              type="text"
              placeholder="Ask anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-w-0 flex-1 rounded-md border border-line-strong bg-surface px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-3 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={loading}
              className={`${btnPrimary} shrink-0 px-5 py-2.5`}
            >
              <Icon>
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </Icon>
              Send
            </button>
          </div>

          <p className="mt-2.5 text-center text-xs text-ink-2">
            Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}