import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Sidebar from '../components/Sidebar'
import { sendMessageAPI, getChatsAPI, getChatAPI, renameChatAPI, deleteChatAPI } from '../api'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'

// ✅ Markdown renderer — logic preserved exactly
const MarkdownMessage = ({ content }) => (
  <div style={{ color: 'rgba(240,238,255,0.88)', fontSize: '13.5px', lineHeight: '1.72' }}>
    <ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    code: ({ inline, children, ...props }) => inline
      ? <code
          style={{
            padding: '2px 7px',
            borderRadius: '5px',
            fontSize: '12px',
            fontFamily: 'JetBrains Mono, monospace',
            background: 'rgba(124,58,237,0.22)',
            color: '#ddd6fe'
          }}
          {...props}
        >
          {children}
        </code>
      : <pre
          style={{
            padding: '14px 16px',
            borderRadius: '10px',
            overflowX: 'auto',
            margin: '10px 0',
            background: 'rgba(0,0,0,0.38)',
            border: '1px solid rgba(255,255,255,0.07)'
          }}
        >
          <code
            style={{
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#86efac'
            }}
            {...props}
          >
            {children}
          </code>
        </pre>,

    p: ({ children }) =>
      <p style={{ marginBottom: '8px' }}>{children}</p>,

    ul: ({ children }) =>
      <ul style={{ paddingLeft: '18px', marginBottom: '8px' }}>{children}</ul>,

    ol: ({ children }) =>
      <ol style={{ paddingLeft: '18px', marginBottom: '8px' }}>{children}</ol>,

    li: ({ children }) =>
      <li style={{ marginBottom: '3px' }}>{children}</li>,

    strong: ({ children }) =>
      <strong style={{ color: 'white', fontWeight: 600 }}>{children}</strong>,

    h1: ({ children }) =>
      <h1 style={{
        fontSize: '17px',
        fontWeight: 700,
        color: 'white',
        marginBottom: '8px'
      }}>
        {children}
      </h1>,

    h2: ({ children }) =>
      <h2 style={{
        fontSize: '15px',
        fontWeight: 700,
        color: 'white',
        marginBottom: '6px'
      }}>
        {children}
      </h2>,

    h3: ({ children }) =>
      <h3 style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'white',
        marginBottom: '5px'
      }}>
        {children}
      </h3>,

    table: ({ children }) =>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        margin: '12px 0'
      }}>
        {children}
      </table>,

    th: ({ children }) =>
      <th style={{
        padding: '8px',
        textAlign: 'left',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        {children}
      </th>,
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

export default function Chat({ activePage, setActivePage, user }) {
  // ✅ All state preserved exactly
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello ${user?.name || 'there'}! I am NEURALIQ AI. How can I help you today?` }
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
    setMessages([{ role: 'assistant', content: `Hello ${user?.name || 'there'}! I am NEURALIQ AI. How can I help you today?` }])
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
        setMessages([{ role: 'assistant', content: `Hello ${user?.name || 'there'}! I am NEURALIQ AI. How can I help you today?` }])
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

  // ✅ Export logic preserved exactly
  const exportAsPDF = async () => {
    setExporting(true); setShowExportMenu(false)
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15; const maxWidth = pageWidth - margin * 2; let y = 20
      pdf.setFontSize(20); pdf.setTextColor(124, 58, 237)
      pdf.text('NEURALIQ. Chat Export', margin, y); y += 8
      pdf.setFontSize(10); pdf.setTextColor(150, 150, 150)
      pdf.text(`Exported by: ${user?.name} | ${new Date().toLocaleString()}`, margin, y); y += 10
      pdf.setDrawColor(124, 58, 237); pdf.line(margin, y, pageWidth - margin, y); y += 8
      for (const msg of messages.filter(m => m.role !== 'system')) {
        if (y > 270) { pdf.addPage(); y = 20 }
        pdf.setFontSize(9)
        pdf.setTextColor(msg.role === 'user' ? 124 : 6, msg.role === 'user' ? 58 : 182, msg.role === 'user' ? 237 : 212)
        pdf.text(msg.role === 'user' ? `${user?.name}:` : 'NEURALIQ AI:', margin, y); y += 5
        pdf.setFontSize(10); pdf.setTextColor(50, 50, 50)
        const lines = pdf.splitTextToSize(msg.content, maxWidth)
        for (const line of lines) { if (y > 275) { pdf.addPage(); y = 20 }; pdf.text(line, margin, y); y += 5 }
        y += 4
      }
      pdf.save(`NEURALIQ-chat-${Date.now()}.pdf`)
    } catch (err) { alert('Export failed: ' + err.message) }
    setExporting(false)
  }

  const exportAsWord = async () => {
    setExporting(true); setShowExportMenu(false)
    try {
      const docChildren = [
        new Paragraph({ text: 'NEURALIQ. Chat Export', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: `Exported by: ${user?.name} | ${new Date().toLocaleString()}`, color: '888888', size: 20 })] }),
        new Paragraph({ text: '' }),
      ]
      for (const msg of messages.filter(m => m.role !== 'system')) {
        docChildren.push(
          new Paragraph({ children: [new TextRun({ text: msg.role === 'user' ? `${user?.name}:` : 'NEURALIQ AI:', bold: true, color: msg.role === 'user' ? '7c3aed' : '06b6d4', size: 22 })] }),
          new Paragraph({ children: [new TextRun({ text: msg.content, size: 22 })] }),
          new Paragraph({ text: '' }),
        )
      }
      const doc = new Document({ sections: [{ children: docChildren }] })
      const blob = await Packer.toBlob(doc)
      saveAs(blob, `NEURALIQ-chat-${Date.now()}.docx`)
    } catch (err) { alert('Export failed: ' + err.message) }
    setExporting(false)
  }

  // ── Shared styles ──────────────────────────────────────────
  const S = {
    iconBtn: {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
    },
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 60% at 20% -5%, rgba(124,58,237,0.1) 0%, #08080f 65%)',
    }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} />

      {/* ── Conversation history sidebar ───────────────────── */}
      <div style={{
        width: '224px', display: 'flex', flexDirection: 'column', flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.055)',
        background: 'rgba(255,255,255,0.012)',
        padding: '16px 10px',
        gap: '8px',
      }}>

        {/* New chat button */}
        <button
          onClick={startNewChat}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '10px', marginBottom: '6px',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white',
            border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
            boxShadow: '0 2px 14px rgba(124,58,237,0.32)', transition: 'all 0.15s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1';   e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Chat
        </button>

        {/* Section label */}
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', padding: '0 3px' }}>
          Recent
        </p>

        {/* Conversation list */}
        {conversations.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', padding: '6px 3px' }}>
            No conversations yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, overflowY: 'auto' }}>
            {conversations.map((c) => {
              const isActive = c._id === chatId
              return (
                <div
                  key={c._id}
                  style={{
                    position: 'relative', borderRadius: '9px', transition: 'all 0.15s ease',
                    border: isActive ? '1px solid rgba(124,58,237,0.32)' : '1px solid transparent',
                    background: isActive ? 'rgba(124,58,237,0.12)' : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }
                    e.currentTarget.querySelector('.c-actions').style.opacity = '1'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }
                    e.currentTarget.querySelector('.c-actions').style.opacity = '0'
                  }}
                >
                  <button
                    onClick={() => loadChat(c._id)}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 36px 10px 10px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {renamingId === c._id ? (
                      <input
                        type="text" value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRename(c._id); if (e.key === 'Escape') setRenamingId(null) }}
                        onBlur={() => handleRename(c._id)}
                        style={{ width: '100%', fontSize: '12px', color: 'white', background: 'transparent', outline: 'none', borderBottom: '1px solid rgba(124,58,237,0.5)', fontFamily: 'Inter, sans-serif' }}
                        autoFocus onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <p style={{ fontSize: '12px', fontWeight: 500, color: isActive ? '#c4b5fd' : 'rgba(255,255,255,0.62)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.title}
                      </p>
                    )}
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.24)', marginTop: '3px' }}>
                      {timeAgo(c.updatedAt)}
                    </p>
                  </button>

                  {/* Rename / Delete actions */}
                  <div className="c-actions" style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '2px', opacity: 0, transition: 'opacity 0.15s ease' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenamingId(c._id); setRenameValue(c.title) }}
                      style={{ ...S.iconBtn, width: '22px', height: '22px', borderRadius: '5px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
                      title="Rename"
                      onMouseEnter={e => e.currentTarget.style.color = '#c4b5fd'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteChat(c._id) }}
                      style={{ ...S.iconBtn, width: '22px', height: '22px', borderRadius: '5px', background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                      title="Delete"
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Main chat panel ────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '16px 28px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
          background: 'rgba(255,255,255,0.01)',
        }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'white', letterSpacing: '-0.025em' }}>
              AI Chat
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '12px', marginTop: '2px' }}>
              {user?.name || 'User'} · GPT-OSS 120B via Groq
            </p>
          </div>

          {/* Export */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={messages.length <= 1}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '8px 16px', borderRadius: '9px', fontSize: '12px', fontWeight: 600,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                color: messages.length <= 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.62)',
                cursor: messages.length <= 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease', fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => { if (messages.length > 1) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white' }}}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = messages.length <= 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.62)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {exporting ? 'Exporting…' : 'Export'}
            </button>

            {showExportMenu && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 50,
                background: '#13132a', border: '1px solid rgba(124,58,237,0.28)',
                borderRadius: '12px', overflow: 'hidden', minWidth: '172px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
              }}>
                {[
                  { label: 'Export as PDF',  action: exportAsPDF,  color: '#f87171' },
                  { label: 'Export as Word', action: exportAsWord, color: '#93c5fd' },
                ].map((item, i) => (
                  <button key={i} onClick={item.action}
                    style={{
                      width: '100%', padding: '11px 16px', textAlign: 'left',
                      fontSize: '13px', color: 'rgba(255,255,255,0.78)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '9px',
                      fontFamily: 'Inter, sans-serif', transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.055)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}
              className="fade-in"
            >
              {/* Avatar */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user'
                  ? 'rgba(124,58,237,0.22)'
                  : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                border: '2px solid rgba(124,58,237,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '13px', color: 'white',
              }}>
                {msg.role === 'user' ? (
                  user?.name?.[0]?.toUpperCase() || '?'
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z"/>
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z"/>
                  </svg>
                )}
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: '600px',
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '18px 5px 18px 18px' : '5px 18px 18px 18px',
                background: msg.role === 'user'
                  ? 'rgba(124,58,237,0.16)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(124,58,237,0.26)' : 'rgba(255,255,255,0.07)'}`,
              }}>
                <p style={{
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em',
                  marginBottom: '7px', textTransform: 'uppercase',
                  color: msg.role === 'user' ? '#c4b5fd' : '#67e8f9',
                }}>
                  {msg.role === 'user' ? (user?.name || 'You') : 'NEURALIQ AI'}
                </p>
                {msg.role === 'assistant'
                  ? <MarkdownMessage content={msg.content} />
                  : <p style={{ color: 'rgba(240,238,255,0.88)', fontSize: '13.5px', lineHeight: '1.72', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                }
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: '12px' }} className="fade-in">
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                border: '2px solid rgba(124,58,237,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z"/>
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z"/>
                </svg>
              </div>
              <div style={{
                padding: '14px 18px', borderRadius: '5px 18px 18px 18px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                {[0, 150, 300].map((delay, i) => (
                  <div key={i} style={{
                    width: '7px', height: '7px', borderRadius: '50%', background: '#7c3aed',
                    animation: `bounceDot 1.2s ease-in-out ${delay}ms infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{
          padding: '16px 28px', flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.055)',
          background: 'rgba(255,255,255,0.01)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

            {/* File shortcut */}
            <button
              onClick={() => setActivePage('Files')}
              title="Upload a file"
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
                padding: '11px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(255,255,255,0.48)', cursor: 'pointer', transition: 'all 0.15s ease',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.78)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.48)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              File
            </button>

            {/* Text input */}
            <input
              type="text"
              placeholder="Ask anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1, padding: '11px 18px', borderRadius: '10px', outline: 'none',
                color: 'white', fontSize: '14px', fontFamily: 'Inter, sans-serif',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)' }}
              onBlur={e =>  { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none' }}
            />

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: '7px',
                padding: '11px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                background: loading ? 'rgba(124,58,237,0.32)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: 'white', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 2px 14px rgba(124,58,237,0.36)',
                transition: 'all 0.15s ease', fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Send
            </button>
          </div>

          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.16)', marginTop: '9px', textAlign: 'center' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}