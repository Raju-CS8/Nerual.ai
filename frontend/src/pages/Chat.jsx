import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import Sidebar from '../components/Sidebar'
import { sendMessageAPI, getChatsAPI, getChatAPI, renameChatAPI, deleteChatAPI } from '../api'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'

const MarkdownMessage = ({ content }) => (
  <ReactMarkdown
    className="text-gray-200 text-sm leading-relaxed"
    components={{
      code: ({ inline, children, ...props }) => inline
        ? <code className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(124,58,237,0.3)', color: '#e2d9f3' }} {...props}>{children}</code>
        : <pre className="p-3 rounded-lg overflow-x-auto my-2" style={{ background: 'rgba(0,0,0,0.3)' }}><code className="text-xs font-mono text-green-300" {...props}>{children}</code></pre>,
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
      h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
      h2: ({ children }) => <h2 className="text-base font-bold text-white mb-2">{children}</h2>,
      h3: ({ children }) => <h3 className="text-sm font-bold text-white mb-1">{children}</h3>,
    }}>
    {content}
  </ReactMarkdown>
)

const timeAgo = (date) => {
  const diff = new Date() - new Date(date)
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'Just now'
}

export default function Chat({ activePage, setActivePage, user }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello ${user?.name || 'there'}! I am NEURALIQ AI. How can I help you today?` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatId, setChatId] = useState(null)
  const [conversations, setConversations] = useState([])
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const bottomRef = useRef(null)

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
          content: data.limitReached ? '🚫 Token limit reached! Please upgrade to Pro to continue chatting.' : `Error: ${data.error}`
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

  const exportAsPDF = async () => {
    setExporting(true)
    setShowExportMenu(false)
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15
      const maxWidth = pageWidth - margin * 2
      let y = 20
      pdf.setFontSize(20)
      pdf.setTextColor(124, 58, 237)
      pdf.text('NEURALIQ. Chat Export', margin, y)
      y += 8
      pdf.setFontSize(10)
      pdf.setTextColor(150, 150, 150)
      pdf.text(`Exported by: ${user?.name} | ${new Date().toLocaleString()}`, margin, y)
      y += 10
      pdf.setDrawColor(124, 58, 237)
      pdf.line(margin, y, pageWidth - margin, y)
      y += 8
      for (const msg of messages.filter(m => m.role !== 'system')) {
        if (y > 270) { pdf.addPage(); y = 20 }
        pdf.setFontSize(9)
        pdf.setTextColor(msg.role === 'user' ? 124 : 6, msg.role === 'user' ? 58 : 182, msg.role === 'user' ? 237 : 212)
        pdf.text(msg.role === 'user' ? `${user?.name}:` : 'NEURALIQ AI:', margin, y)
        y += 5
        pdf.setFontSize(10)
        pdf.setTextColor(50, 50, 50)
        const lines = pdf.splitTextToSize(msg.content, maxWidth)
        for (const line of lines) {
          if (y > 275) { pdf.addPage(); y = 20 }
          pdf.text(line, margin, y)
          y += 5
        }
        y += 4
      }
      pdf.save(`NEURALIQ-chat-${Date.now()}.pdf`)
    } catch (err) { alert('Export failed: ' + err.message) }
    setExporting(false)
  }

  const exportAsWord = async () => {
    setExporting(true)
    setShowExportMenu(false)
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

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1a0533 0%, #050816 60%)' }}>

      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} />

      <div className="w-56 flex flex-col py-4 px-3 gap-2 flex-shrink-0"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        <button onClick={startNewChat}
          className="w-full py-2 px-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-80 mb-2"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
          + New Chat
        </button>

        <p className="text-xs text-gray-500 px-2 uppercase tracking-widest">Recent</p>

        {conversations.length === 0 ? (
          <p className="text-xs text-gray-600 px-2 mt-2">No conversations yet</p>
        ) : (
          conversations.map((c) => (
            <div key={c._id} className="group relative rounded-xl transition-all"
              style={{
                border: c._id === chatId ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
                background: c._id === chatId ? 'rgba(124,58,237,0.1)' : 'transparent'
              }}>
              <button onClick={() => loadChat(c._id)} className="w-full text-left px-3 py-3 pr-14">
                {renamingId === c._id ? (
                  <input type="text" value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRename(c._id); if (e.key === 'Escape') setRenamingId(null) }}
                    onBlur={() => handleRename(c._id)}
                    className="w-full text-xs text-white bg-transparent outline-none border-b border-purple-400"
                    autoFocus onClick={(e) => e.stopPropagation()} />
                ) : (
                  <p className="text-white text-xs truncate">{c.title}</p>
                )}
                <p className="text-gray-600 text-xs mt-1">{timeAgo(c.updatedAt)}</p>
              </button>
              <div className="absolute right-2 top-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={(e) => { e.stopPropagation(); setRenamingId(c._id); setRenameValue(c.title) }}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-purple-400 hover:bg-white/10 transition-all text-xs">✏️</button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteChat(c._id) }}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-white/10 transition-all text-xs">🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="px-8 py-5 flex-shrink-0 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h1 className="text-2xl font-bold text-white">
              <span className="font-bold">NEURALIQ.</span>
              <span className="font-light"> AI Chat</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Welcome, {user?.name || 'User'}</p>
          </div>

          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={messages.length <= 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: messages.length <= 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                cursor: messages.length <= 1 ? 'not-allowed' : 'pointer'
              }}>
              {exporting ? '⏳ Exporting...' : '📥 Export Chat'}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-12 rounded-xl overflow-hidden z-50"
                style={{ background: '#0f0a1e', border: '1px solid rgba(124,58,237,0.3)', minWidth: '160px' }}>
                <button onClick={exportAsPDF} className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-all">📄 Export as PDF</button>
                <button onClick={exportAsWord} className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-all">📝 Export as Word</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed44, #06b6d444)' : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  border: '2px solid rgba(124,58,237,0.4)'
                }}>
                {msg.role === 'user' ? (user?.name?.[0]?.toUpperCase() || '?') : 'N'}
              </div>
              <div className="max-w-xl px-5 py-4 rounded-2xl"
                style={{
                  background: msg.role === 'user' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)'
                }}>
                <p className="text-xs font-semibold mb-1" style={{ color: msg.role === 'user' ? '#a78bfa' : '#06b6d4' }}>
                  {msg.role === 'user' ? (user?.name || 'You') : 'NEURALIQ AI'}
                </p>
                {msg.role === 'assistant'
                  ? <MarkdownMessage content={msg.content} />
                  : <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                }
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>N</div>
              <div className="px-5 py-4 rounded-2xl flex items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#7c3aed', animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#7c3aed', animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#7c3aed', animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-8 py-5 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setActivePage('Files')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80 flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              📎 File Upload
            </button>
            <input type="text" placeholder="Type your message..."
              value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              className="flex-1 py-3 px-5 rounded-xl outline-none text-white placeholder-gray-600"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <button onClick={sendMessage} disabled={loading}
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 flex items-center gap-2 flex-shrink-0"
              style={{ background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              ➤ Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}