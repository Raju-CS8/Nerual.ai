import { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { sendMessageAPI, getChatsAPI, getChatAPI } from '../api'

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
    {
      role: 'assistant',
      content: `Hello ${user?.name || 'there'}! I am NEURALIQ AI. How can I help you today?`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatId, setChatId] = useState(null)
  const [conversations, setConversations] = useState([])
  const bottomRef = useRef(null)

  // Load chats on mount — no dependency warning
  useEffect(() => {
    let mounted = true
    getChatsAPI()
      .then(data => {
        if (mounted && data.success) setConversations(data.chats)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const refreshChats = () => {
    getChatsAPI()
      .then(data => { if (data.success) setConversations(data.chats) })
      .catch(() => {})
  }

  const loadChat = async (id) => {
    try {
      const data = await getChatAPI(id)
      if (data.success) {
        setChatId(id)
        setMessages(data.chat.messages)
      }
    } catch {
      console.log('Could not load chat')
    }
  }

  const startNewChat = () => {
    setChatId(null)
    setMessages([{
      role: 'assistant',
      content: `Hello ${user?.name || 'there'}! I am NEURALIQ AI. How can I help you today?`
    }])
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
          content: `Error: ${data.error}`
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply
        }])
        if (!chatId) setChatId(data.chatId)
        refreshChats()
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error connecting to server!'
      }])
    }

    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1a0533 0%, #050816 60%)' }}
    >
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} />

      {/* Chat History Panel */}
      <div
        className="w-56 flex flex-col py-4 px-3 gap-2 flex-shrink-0"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={startNewChat}
          className="w-full py-2 px-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-80 mb-2"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
        >
          + New Chat
        </button>

        <p className="text-xs text-gray-500 px-2 uppercase tracking-widest">Recent</p>

        {conversations.length === 0 ? (
          <p className="text-xs text-gray-600 px-2 mt-2">No conversations yet</p>
        ) : (
          conversations.map((c) => (
            <button
              key={c._id}
              onClick={() => loadChat(c._id)}
              className="text-left px-3 py-3 rounded-xl transition-all hover:bg-white/5"
              style={{
                border: c._id === chatId
                  ? '1px solid rgba(124,58,237,0.4)'
                  : '1px solid rgba(255,255,255,0.06)',
                background: c._id === chatId ? 'rgba(124,58,237,0.1)' : 'transparent'
              }}
            >
              <p className="text-white text-xs truncate">{c.title}</p>
              <p className="text-gray-600 text-xs mt-1">{timeAgo(c.updatedAt)}</p>
            </button>
          ))
        )}
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        <div
          className="px-8 py-6 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h1 className="text-2xl font-bold text-white">
            <span className="font-bold">NEURALIQ.</span>
            <span className="font-light"> AI Chat</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Welcome, {user?.name || 'User'}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #7c3aed44, #06b6d444)'
                    : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  border: '2px solid rgba(124,58,237,0.4)'
                }}
              >
                {msg.role === 'user' ? (user?.name?.[0]?.toUpperCase() || '?') : 'N'}
              </div>

              <div
                className="max-w-xl px-5 py-4 rounded-2xl"
                style={{
                  background: msg.role === 'user'
                    ? 'rgba(124,58,237,0.2)'
                    : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <p
                  className="text-xs font-semibold mb-1"
                  style={{ color: msg.role === 'user' ? '#a78bfa' : '#06b6d4' }}
                >
                  {msg.role === 'user' ? (user?.name || 'You') : 'NEURALIQ AI'}
                </p>
                <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
              >
                N
              </div>
              <div
                className="px-5 py-4 rounded-2xl flex items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#7c3aed', animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#7c3aed', animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#7c3aed', animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div
          className="px-8 py-5 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActivePage('Files')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80 flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
            >
              📎 File Upload
            </button>

            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 py-3 px-5 rounded-xl outline-none text-white placeholder-gray-600"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 flex items-center gap-2 flex-shrink-0"
              style={{
                background: loading
                  ? 'rgba(124,58,237,0.4)'
                  : 'linear-gradient(135deg, #7c3aed, #6d28d9)'
              }}
            >
              ➤ Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}