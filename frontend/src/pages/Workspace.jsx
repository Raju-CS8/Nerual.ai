import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import Sidebar from '../components/Sidebar'
import CollaborativeEditor from '../components/CollaborativeEditor'
import { useSocket } from '../hooks/useSocket'
import {
  getWorkspacesAPI, createWorkspaceAPI, addDocumentToWorkspaceAPI,
  chatWithWorkspaceAPI, deleteDocumentAPI, deleteWorkspaceAPI,
  joinWorkspaceAPI, renameWorkspaceAPI, leaveWorkspaceAPI, clearChatHistoryAPI
} from '../api'

// ✅ Markdown renderer — logic preserved exactly
const MarkdownMessage = ({ content }) => (
  <div style={{ color: 'rgba(240,238,255,0.88)', fontSize: '13px', lineHeight: '1.7' }}>
    <ReactMarkdown
      components={{
        code: ({ inline, children, ...props }) => inline
          ? <code style={{ padding: '2px 6px', borderRadius: '5px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(124,58,237,0.22)', color: '#ddd6fe' }} {...props}>{children}</code>
          : <pre style={{ padding: '12px 14px', borderRadius: '9px', overflowX: 'auto', margin: '8px 0', background: 'rgba(0,0,0,0.38)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <code style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#86efac' }} {...props}>{children}</code>
            </pre>,
        p:      ({ children }) => <p style={{ marginBottom: '6px' }}>{children}</p>,
        ul:     ({ children }) => <ul style={{ paddingLeft: '16px', marginBottom: '6px' }}>{children}</ul>,
        ol:     ({ children }) => <ol style={{ paddingLeft: '16px', marginBottom: '6px' }}>{children}</ol>,
        li:     ({ children }) => <li style={{ marginBottom: '2px' }}>{children}</li>,
        strong: ({ children }) => <strong style={{ color: 'white', fontWeight: 600 }}>{children}</strong>,
        h1:     ({ children }) => <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>{children}</h1>,
        h2:     ({ children }) => <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '5px' }}>{children}</h2>,
        h3:     ({ children }) => <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>{children}</h3>,
      }}>
      {content}
    </ReactMarkdown>
  </div>
)

// ✅ Tab IDs preserved exactly
const TAB_CHAT   = 'chat'
const TAB_EDITOR = 'editor'

export default function Workspace({ activePage, setActivePage, user, onLogout }) {
  // ✅ ALL state preserved exactly
  const [workspaces,       setWorkspaces]       = useState([])
  const [activeWorkspace,  setActiveWorkspace]  = useState(null)
  const [messages,         setMessages]         = useState([])
  const [input,            setInput]            = useState('')
  const [loading,          setLoading]          = useState(false)
  const [uploading,        setUploading]        = useState(false)
  const [creating,         setCreating]         = useState(false)
  const [joining,          setJoining]          = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [shareCode,        setShareCode]        = useState('')
  const [onlineUsers,      setOnlineUsers]      = useState([])
  const [typingUser,       setTypingUser]       = useState(null)
  const [showShareCode,    setShowShareCode]    = useState(false)
  const [joinError,        setJoinError]        = useState('')
  const [renamingId,       setRenamingId]       = useState(null)
  const [renameValue,      setRenameValue]      = useState('')
  const [activeTab,        setActiveTab]        = useState(TAB_CHAT)

  const fileInputRef       = useRef(null)
  const bottomRef          = useRef(null)
  const typingTimeout      = useRef(null)
  const activeWorkspaceRef = useRef(null)

  const userId = user?._id || user?.id

  // ✅ ALL logic preserved exactly
  useEffect(() => { activeWorkspaceRef.current = activeWorkspace }, [activeWorkspace])

  const isOwner    = activeWorkspace?.userId?.toString() === userId
  const isWsOwner  = (ws) => ws.userId?.toString() === userId

  const currentUserRole = isOwner
    ? 'Owner'
    : activeWorkspace?.collaborators?.find(c => c.userId?.toString() === userId)?.role || 'Viewer'

  const socketCallbacks = {
    onNewMessage: ({ message, userName, role }) => {
      if (userName !== user?.name || role === 'assistant') {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1]
          if (lastMsg?.content === message && lastMsg?.userName === userName) return prev
          return [...prev, { role, content: message, userName }]
        })
      }
    },
    onUsersOnline:    (users) => setOnlineUsers(users),
    onUserJoined:     ({ userName: joinedUser }) => {
      if (joinedUser !== user?.name)
        setMessages(prev => [...prev, { role: 'system', content: `👋 ${joinedUser} joined the workspace`, userName: 'System' }])
    },
    onUserLeft:       ({ userName: leftUser }) => {
      setMessages(prev => [...prev, { role: 'system', content: `👋 ${leftUser} left the workspace`, userName: 'System' }])
    },
    onUserTyping:     ({ userName: typingName }) => { if (typingName !== user?.name) setTypingUser(typingName) },
    onUserStopTyping: () => setTypingUser(null),
    onWorkspaceUpdated: ({ type, fileName, userName: uploaderName }) => {
      if (type === 'document_added') {
        setMessages(prev => [...prev, { role: 'system', content: `📄 ${uploaderName} added "${fileName}"`, userName: 'System' }])
        getWorkspacesAPI().then(data => {
          if (data.success) {
            const updated = data.workspaces.find(w => w._id === activeWorkspaceRef.current?._id)
            if (updated) {
              setActiveWorkspace(updated)
              setWorkspaces(prev => prev.map(w => w._id === updated._id ? updated : w))
            }
          }
        })
      }
    }
  }

  const { emitMessage } = useSocket(activeWorkspace?._id, user?.name, socketCallbacks)

  useEffect(() => {
    let mounted = true
    getWorkspacesAPI().then(data => { if (mounted && data.success) setWorkspaces(data.workspaces) }).catch(() => {})
    return () => { mounted = false }
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) return
    try {
      const data = await createWorkspaceAPI(newWorkspaceName)
      if (data.success) {
        setWorkspaces(prev => [data.workspace, ...prev])
        setActiveWorkspace(data.workspace)
        setMessages([])
        setNewWorkspaceName('')
        setCreating(false)
        setActiveTab(TAB_CHAT)
      }
    } catch { alert('Could not create workspace') }
  }

  const handleJoinWorkspace = async () => {
    if (!shareCode.trim()) return
    setJoinError('')
    try {
      const data = await joinWorkspaceAPI(shareCode)
      if (data.success) {
        setWorkspaces(prev => {
          const exists = prev.find(w => w._id === data.workspace._id)
          return exists ? prev : [data.workspace, ...prev]
        })
        setActiveWorkspace(data.workspace)
        const savedMessages = (data.workspace.messages || []).map(m => ({ role: m.role, content: m.content, userName: m.userName }))
        if (savedMessages.length > 0) {
          setMessages([...savedMessages, { role: 'system', content: `✅ You joined "${data.workspace.name}"!`, userName: 'System' }])
        } else {
          setMessages([{ role: 'assistant', content: `✅ Joined workspace "${data.workspace.name}"! You can now collaborate!`, userName: 'NEURALIQ AI' }])
        }
        setShareCode('')
        setJoining(false)
        setActiveTab(TAB_CHAT)
      } else { setJoinError(data.error || 'Invalid share code') }
    } catch { setJoinError('Could not join workspace') }
  }

  const selectWorkspace = (ws) => {
    setActiveWorkspace(ws); setOnlineUsers([]); setActiveTab(TAB_CHAT)
    const savedMessages = (ws.messages || []).map(m => ({ role: m.role, content: m.content, userName: m.userName }))
    if (savedMessages.length > 0) {
      setMessages([...savedMessages, { role: 'system', content: `— You rejoined "${ws.name}" —`, userName: 'System' }])
    } else {
      setMessages([{ role: 'assistant', content: `Workspace "${ws.name}" loaded with ${ws.documents.length} document(s). ${ws.collaborators?.length > 0 ? `${ws.collaborators.length} collaborator(s).` : ''} Ask me anything!`, userName: 'NEURALIQ AI' }])
    }
  }

  const handleFileUpload = async (file) => {
    if (!activeWorkspace) return
    setUploading(true)
    try {
      const data = await addDocumentToWorkspaceAPI(activeWorkspace._id, file)
      if (data.success) {
        setActiveWorkspace(data.workspace)
        setWorkspaces(prev => prev.map(w => w._id === data.workspace._id ? data.workspace : w))
        setMessages(prev => [...prev, { role: 'assistant', content: `✅ "${file.name}" added! You now have ${data.workspace.documents.length} document(s). ${data.message || ''}`, userName: 'NEURALIQ AI' }])
        emitMessage('document_added', { workspaceId: activeWorkspace._id, fileName: file.name, userName: user?.name })
      } else { alert(data.error) }
    } catch { alert('Upload failed') }
    setUploading(false)
  }

  const deleteDocument = async (docIndex) => {
    if (!activeWorkspace) return
    if (currentUserRole === 'Viewer') { alert('Only Admins or the workspace Owner can delete documents.'); return }
    try {
      const data = await deleteDocumentAPI(activeWorkspace._id, docIndex)
      if (data.success) {
        setActiveWorkspace(data.workspace)
        setWorkspaces(prev => prev.map(w => w._id === data.workspace._id ? data.workspace : w))
      } else { alert(data.error || 'Could not delete document') }
    } catch { alert('Could not delete document') }
  }

  const handleDeleteWorkspace = async (workspaceId) => {
    if (!window.confirm('Delete this workspace permanently?')) return
    try {
      const data = await deleteWorkspaceAPI(workspaceId)
      if (data.error) { alert(data.error); return }
      setWorkspaces(prev => prev.filter(w => w._id !== workspaceId))
      if (activeWorkspace?._id === workspaceId) { setActiveWorkspace(null); setMessages([]) }
    } catch { alert('Could not delete workspace') }
  }

  const handleLeaveWorkspace = async (workspaceId) => {
    if (!window.confirm('Leave this workspace?')) return
    try {
      await leaveWorkspaceAPI(workspaceId)
      setWorkspaces(prev => prev.filter(w => w._id !== workspaceId))
      setActiveWorkspace(null); setMessages([])
    } catch { alert('Could not leave workspace') }
  }

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all chat history?')) return
    try {
      await clearChatHistoryAPI(activeWorkspace._id)
      setMessages([{ role: 'assistant', content: 'Chat history cleared!', userName: 'NEURALIQ AI' }])
    } catch { alert('Could not clear history') }
  }

  const handleRenameWorkspace = async (id) => {
    if (!renameValue.trim()) { setRenamingId(null); return }
    try {
      const data = await renameWorkspaceAPI(id, renameValue)
      if (data.success) {
        setWorkspaces(prev => prev.map(w => w._id === id ? { ...w, name: renameValue } : w))
        if (activeWorkspace?._id === id) setActiveWorkspace(prev => ({ ...prev, name: renameValue }))
      } else { alert(data.error || 'Could not rename workspace') }
    } catch { console.log('Could not rename') }
    setRenamingId(null)
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeWorkspace) return
    const userMsg = { role: 'user', content: input, userName: user?.name }
    setMessages(prev => [...prev, userMsg])
    const currentInput = input; setInput(''); setLoading(true)
    emitMessage('stop_typing', { workspaceId: activeWorkspace._id })
    emitMessage('workspace_message', { workspaceId: activeWorkspace._id, message: currentInput, userName: user?.name, role: 'user' })
    try {
      const data = await chatWithWorkspaceAPI(activeWorkspace._id, currentInput, messages)
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}`, userName: 'NEURALIQ AI' }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, userName: 'NEURALIQ AI' }])
        emitMessage('ai_response', { workspaceId: activeWorkspace._id, message: data.reply, role: 'assistant' })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to server!', userName: 'NEURALIQ AI' }])
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (activeWorkspace) {
      emitMessage('typing', { workspaceId: activeWorkspace._id, userName: user?.name })
      clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => emitMessage('stop_typing', { workspaceId: activeWorkspace._id }), 1500)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const copyShareCode = (code) => { navigator.clipboard.writeText(code); alert(`Share code copied: ${code}`) }

  const quickPrompts = ['Summarize all documents', 'Compare the documents', 'What are the key differences?', 'Create flashcards from all docs', 'List the main topics covered', 'What are the action items?']

  // ── Reusable small button style ────────────────────────────
  const headerBtn = (bg, border, color) => ({
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 13px', borderRadius: '9px', fontSize: '12px', fontWeight: 600,
    background: bg, border: `1px solid ${border}`, color, cursor: 'pointer',
    transition: 'all 0.15s ease', fontFamily: 'Inter, sans-serif',
  })

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 60% at 20% -5%, rgba(124,58,237,0.1) 0%, #08080f 65%)',
    }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      {/* ── Workspace list sidebar ──────────────────────────── */}
      <div style={{
        width: '220px', display: 'flex', flexDirection: 'column', flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.055)',
        background: 'rgba(255,255,255,0.012)',
        padding: '16px 10px', gap: '10px',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
            Workspaces
          </p>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => { setJoining(!joining); setCreating(false) }}
              style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#67e8f9', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              Join
            </button>
            <button onClick={() => { setCreating(!creating); setJoining(false) }}
              style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px', background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.24)', color: '#c4b5fd', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              + New
            </button>
          </div>
        </div>

        {/* Create form */}
        {creating && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input type="text" placeholder="Workspace name…" value={newWorkspaceName}
              onChange={e => setNewWorkspaceName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createWorkspace()}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '9px', outline: 'none', color: 'white', fontSize: '13px', fontFamily: 'Inter, sans-serif', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              autoFocus />
            <button onClick={createWorkspace}
              style={{ padding: '9px', borderRadius: '9px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 10px rgba(124,58,237,0.3)' }}>
              Create
            </button>
          </div>
        )}

        {/* Join form */}
        {joining && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input type="text" placeholder="Enter share code…" value={shareCode}
              onChange={e => setShareCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoinWorkspace()}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '9px', outline: 'none', color: 'white', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(6,182,212,0.3)', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(6,182,212,0.6)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(6,182,212,0.3)'}
              autoFocus />
            {joinError && <p style={{ fontSize: '11px', color: '#f87171' }}>{joinError}</p>}
            <button onClick={handleJoinWorkspace}
              style={{ padding: '9px', borderRadius: '9px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 10px rgba(6,182,212,0.25)' }}>
              Join Workspace
            </button>
          </div>
        )}

        {/* Workspace list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflowY: 'auto' }}>
          {workspaces.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', padding: '4px 2px' }}>No workspaces yet</p>
          ) : (
            workspaces.map(ws => {
              const active = activeWorkspace?._id === ws._id
              return (
                <div key={ws._id}
                  style={{
                    padding: '10px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s ease',
                    background: active ? 'rgba(124,58,237,0.14)' : 'rgba(255,255,255,0.02)',
                    border: active ? '1px solid rgba(124,58,237,0.28)' : '1px solid rgba(255,255,255,0.05)',
                  }}
                  onClick={() => selectWorkspace(ws)}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {renamingId === ws._id ? (
                          <input type="text" value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleRenameWorkspace(ws._id); if (e.key === 'Escape') setRenamingId(null) }}
                            onBlur={() => handleRenameWorkspace(ws._id)}
                            style={{ width: '100%', fontSize: '12px', color: 'white', background: 'transparent', outline: 'none', borderBottom: '1px solid rgba(124,58,237,0.5)', fontFamily: 'Inter, sans-serif' }}
                            autoFocus onClick={e => e.stopPropagation()} />
                        ) : (
                          <p style={{ fontSize: '12px', fontWeight: 600, color: active ? '#c4b5fd' : 'rgba(255,255,255,0.72)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ws.name}
                          </p>
                        )}
                        {!isWsOwner(ws) && (
                          <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '999px', background: 'rgba(6,182,212,0.1)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.2)', flexShrink: 0 }}>
                            shared
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', marginTop: '3px' }}>
                        {ws.documents.length} doc{ws.documents.length !== 1 ? 's' : ''}
                        {ws.collaborators?.length > 0 && ` · ${ws.collaborators.length} collab`}
                      </p>
                    </div>

                    {/* Owner actions */}
                    {isWsOwner(ws) && (
                      <div style={{ display: 'flex', gap: '2px', marginLeft: '4px', flexShrink: 0 }}>
                        <button onClick={e => { e.stopPropagation(); setRenamingId(ws._id); setRenameValue(ws.name) }}
                          style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#c4b5fd'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDeleteWorkspace(ws._id) }}
                          style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Main area ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top header */}
        <div style={{
          padding: '13px 24px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
          background: 'rgba(255,255,255,0.01)',
        }}>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 800, color: 'white', letterSpacing: '-0.022em' }}>
              {activeWorkspace ? activeWorkspace.name : 'Workspace'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '12px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              {activeWorkspace ? (
                <>
                  <span>{activeWorkspace.documents.length} document{activeWorkspace.documents.length !== 1 ? 's' : ''}</span>
                  {currentUserRole !== 'Owner' && (
                    <span style={{ padding: '1px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: 'rgba(124,58,237,0.14)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.24)' }}>
                      {currentUserRole}
                    </span>
                  )}
                </>
              ) : 'Select or create a workspace'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Online users pill */}
            {onlineUsers.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 11px', borderRadius: '999px', background: 'rgba(16,185,129,0.09)', border: '1px solid rgba(16,185,129,0.18)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                <span style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 600 }}>{onlineUsers.length} online</span>
                <div style={{ display: 'flex' }}>
                  {onlineUsers.slice(0, 3).map((u, i) => (
                    <div key={i} title={u.name} style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: '1.5px solid rgba(255,255,255,0.18)', marginLeft: i > 0 ? '-5px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: 'white' }}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share code (owner only) */}
            {activeWorkspace && isOwner && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowShareCode(!showShareCode)}
                  style={headerBtn('rgba(6,182,212,0.09)', 'rgba(6,182,212,0.22)', '#67e8f9')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Share
                </button>
                {showShareCode && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 50, background: '#13132a', border: '1px solid rgba(124,58,237,0.28)', borderRadius: '13px', padding: '16px', width: '248px', boxShadow: '0 8px 32px rgba(0,0,0,0.55)' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', marginBottom: '10px' }}>Share this code with collaborators:</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <p style={{ color: 'white', fontWeight: 800, fontSize: '15px', letterSpacing: '0.14em', flex: 1, fontFamily: 'JetBrains Mono, monospace' }}>{activeWorkspace.shareCode}</p>
                      <button onClick={() => copyShareCode(activeWorkspace.shareCode)}
                        style={{ padding: '5px 11px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: 'none', cursor: 'pointer' }}>
                        Copy
                      </button>
                    </div>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>Anyone with this code can join your workspace</p>
                  </div>
                )}
              </div>
            )}

            {/* Leave (non-owner) */}
            {activeWorkspace && !isOwner && (
              <button onClick={() => handleLeaveWorkspace(activeWorkspace._id)}
                style={headerBtn('rgba(239,68,68,0.09)', 'rgba(239,68,68,0.2)', '#f87171')}>
                Leave
              </button>
            )}

            {/* Clear chat */}
            {activeWorkspace && (
              <button onClick={handleClearHistory}
                style={headerBtn('rgba(255,255,255,0.05)', 'rgba(255,255,255,0.09)', 'rgba(255,255,255,0.44)')}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                Clear
              </button>
            )}

            {/* Add document */}
            {activeWorkspace && (
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 15px', borderRadius: '9px', fontSize: '12px', fontWeight: 700, background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: 'white', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 12px rgba(124,58,237,0.3)', transition: 'all 0.15s ease', fontFamily: 'Inter, sans-serif', opacity: uploading ? 0.6 : 1 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                {uploading ? 'Uploading…' : 'Add Doc'}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx" style={{ display: 'none' }}
              onChange={e => { handleFileUpload(e.target.files[0]); e.target.value = '' }} />
          </div>
        </div>

        {/* Empty state */}
        {!activeWorkspace ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px' }}>
            <div style={{ width: '76px', height: '76px', borderRadius: '22px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: 'white', fontSize: '19px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>Select a Workspace</h2>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '13px', maxWidth: '300px', lineHeight: '1.6' }}>Create or join a workspace to collaborate with your team in real-time</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setCreating(true)}
                style={{ padding: '11px 24px', borderRadius: '10px', fontWeight: 700, color: 'white', fontSize: '13px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 14px rgba(124,58,237,0.32)', fontFamily: 'Inter, sans-serif' }}>
                + Create Workspace
              </button>
              <button onClick={() => setJoining(true)}
                style={{ padding: '11px 24px', borderRadius: '10px', fontWeight: 700, color: 'white', fontSize: '13px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 14px rgba(6,182,212,0.22)', fontFamily: 'Inter, sans-serif' }}>
                Join with Code
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* Docs + Collabs inner sidebar */}
            <div style={{ width: '192px', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.055)', padding: '14px 10px', gap: '5px', overflowY: 'auto' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', padding: '0 2px', marginBottom: '6px' }}>
                Documents
              </p>

              {activeWorkspace.documents.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px 0', textAlign: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>No documents yet</p>
                </div>
              ) : (
                <>
                  {activeWorkspace.documents.map((doc, i) => (
                    <div key={i}
                      style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-start', gap: '7px', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)'; e.currentTarget.querySelector('.ddel')?.style && (e.currentTarget.querySelector('.ddel').style.opacity = '1') }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.querySelector('.ddel')?.style && (e.currentTarget.querySelector('.ddel').style.opacity = '0') }}
                    >
                      <svg width="12" height="12" style={{ flexShrink: 0, marginTop: '2px' }} viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{doc.fileName}</p>
                        {doc.uploadedBy && <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.24)', marginTop: '1px' }}>by {doc.uploadedBy}</p>}
                      </div>
                      {(isOwner || currentUserRole === 'Admin') && (
                        <button className="ddel" onClick={() => deleteDocument(i)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', opacity: 0, transition: 'opacity 0.15s', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '1px' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <div style={{ padding: '6px 10px', borderRadius: '7px', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.16)', textAlign: 'center', marginTop: '2px' }}>
                    <p style={{ fontSize: '10px', color: '#c4b5fd', fontWeight: 600 }}>
                      {activeWorkspace.documents.length} doc{activeWorkspace.documents.length !== 1 ? 's' : ''} loaded
                    </p>
                  </div>
                </>
              )}

              {/* Collaborators */}
              {activeWorkspace.collaborators?.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', padding: '0 2px', marginBottom: '6px' }}>
                    Collaborators
                  </p>
                  {activeWorkspace.collaborators.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 4px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.62)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                        {c.role && c.role !== 'Viewer' && <p style={{ fontSize: '9px', color: '#c4b5fd' }}>{c.role}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat / Editor panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Tab bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '10px 16px 0', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
                {[
                  { id: TAB_CHAT,   label: 'AI Chat', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                  { id: TAB_EDITOR, label: 'Notes',   icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                      cursor: 'pointer', border: 'none', fontFamily: 'Inter, sans-serif',
                      background: activeTab === tab.id ? 'rgba(124,58,237,0.13)' : 'transparent',
                      color: activeTab === tab.id ? '#c4b5fd' : 'rgba(255,255,255,0.34)',
                      fontSize: '12px', fontWeight: 600, borderRadius: '8px 8px 0 0',
                      borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
                      transition: 'all 0.15s ease',
                    }}>
                    {tab.icon}{tab.label}
                  </button>
                ))}
              </div>

              {/* ── Chat tab ── */}
              {activeTab === TAB_CHAT && (
                <>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Quick prompts */}
                    {messages.length <= 1 && activeWorkspace.documents.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
                        {quickPrompts.map((prompt, i) => (
                          <button key={i} onClick={() => setInput(prompt)}
                            style={{ padding: '6px 13px', borderRadius: '999px', fontSize: '11px', fontWeight: 500, color: '#c4b5fd', background: 'rgba(124,58,237,0.09)', border: '1px solid rgba(124,58,237,0.2)', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.09)'}>
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}

                    {messages.map((msg, i) => (
                      <div key={i}>
                        {msg.role === 'system' ? (
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.26)', padding: '4px 13px', borderRadius: '999px', background: 'rgba(255,255,255,0.04)' }}>
                              {msg.content}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '10px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: msg.role === 'user' ? 'rgba(124,58,237,0.2)' : 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: '1.5px solid rgba(124,58,237,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                              {msg.role === 'user' ? msg.userName?.[0]?.toUpperCase() || '?' : 'N'}
                            </div>
                            <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: msg.role === 'user' ? 'rgba(124,58,237,0.14)' : 'rgba(255,255,255,0.04)', border: `1px solid ${msg.role === 'user' ? 'rgba(124,58,237,0.24)' : 'rgba(255,255,255,0.07)'}` }}>
                              <p style={{ fontSize: '10px', fontWeight: 700, marginBottom: '5px', color: msg.role === 'user' ? '#c4b5fd' : '#67e8f9', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                {msg.userName || (msg.role === 'user' ? user?.name : 'NEURALIQ AI')}
                              </p>
                              {msg.role === 'assistant'
                                ? <MarkdownMessage content={msg.content} />
                                : <p style={{ color: 'rgba(240,238,255,0.88)', fontSize: '13px', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Typing user indicator */}
                    {typingUser && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(124,58,237,0.18)', border: '1.5px solid rgba(124,58,237,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#c4b5fd', flexShrink: 0 }}>
                          {typingUser[0]?.toUpperCase()}
                        </div>
                        <div style={{ padding: '10px 14px', borderRadius: '4px 14px 14px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)' }}>{typingUser} is typing</span>
                          {[0, 150, 300].map((delay, i) => (
                            <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(196,181,253,0.5)', animation: `bounceDot 1.2s ease-in-out ${delay}ms infinite` }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI loading */}
                    {loading && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0 }}>N</div>
                        <div style={{ padding: '10px 14px', borderRadius: '4px 14px 14px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {[0, 150, 300].map((delay, i) => (
                            <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7c3aed', animation: `bounceDot 1.2s ease-in-out ${delay}ms infinite` }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input */}
                  <div style={{ padding: '12px 16px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.055)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" placeholder="Chat with your team or ask about documents…"
                        value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} disabled={loading}
                        style={{ flex: 1, padding: '10px 15px', borderRadius: '10px', outline: 'none', color: 'white', fontSize: '13px', fontFamily: 'Inter, sans-serif', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)' }}
                        onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none' }} />
                      <button onClick={sendMessage} disabled={loading}
                        style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: 700, color: 'white', fontSize: '13px', background: loading ? 'rgba(124,58,237,0.32)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 2px 12px rgba(124,58,237,0.3)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        Ask
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── Editor tab ── */}
              {activeTab === TAB_EDITOR && (
                <div style={{ flex: 1, overflow: 'hidden', padding: '12px' }}>
                  <CollaborativeEditor
                    workspaceId={activeWorkspace._id}
                    userName={user?.name}
                    isOwner={isOwner}
                    userRole={currentUserRole}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}