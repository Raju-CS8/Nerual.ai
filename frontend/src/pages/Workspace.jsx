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

const btnGhost =
  'inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium ' +
  'text-ink-2 transition-colors hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-50'

const inputCls =
  'w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-ink-3 ' +
  'transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60'

const sectionLabel = 'text-[11px] font-medium uppercase tracking-wider text-ink-2'

// ✅ Markdown renderer — logic preserved exactly (only styling changed)
const MarkdownMessage = ({ content }) => (
  <div className="text-[13.5px] leading-[1.7] text-ink">
    <ReactMarkdown
      components={{
        code: ({ inline, children, ...props }) => inline
          ? <code {...props} className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[12px] text-ink">{children}</code>
          : <pre className="my-2.5 overflow-x-auto rounded-lg border border-line bg-sunken p-3.5">
              <code {...props} className="font-mono text-[12px] text-ink">{children}</code>
            </pre>,
        p:      ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul:     ({ children }) => <ul className="mb-2 list-disc pl-5">{children}</ul>,
        ol:     ({ children }) => <ol className="mb-2 list-decimal pl-5">{children}</ol>,
        li:     ({ children }) => <li className="mb-0.5">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
        h1:     ({ children }) => <h1 className="mb-2 mt-3 font-display text-xl tracking-tight text-ink">{children}</h1>,
        h2:     ({ children }) => <h2 className="mb-1.5 mt-3 text-[15px] font-semibold text-ink">{children}</h2>,
        h3:     ({ children }) => <h3 className="mb-1 mt-2 text-[13.5px] font-semibold text-ink">{children}</h3>,
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
          setMessages([{ role: 'assistant', content: `✅ Joined workspace "${data.workspace.name}"! You can now collaborate!`, userName: AI_NAME }])
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
      setMessages([{ role: 'assistant', content: `Workspace "${ws.name}" loaded with ${ws.documents.length} document(s). ${ws.collaborators?.length > 0 ? `${ws.collaborators.length} collaborator(s).` : ''} Ask me anything!`, userName: AI_NAME }])
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
        setMessages(prev => [...prev, { role: 'assistant', content: `✅ "${file.name}" added! You now have ${data.workspace.documents.length} document(s). ${data.message || ''}`, userName: AI_NAME }])
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
      setMessages([{ role: 'assistant', content: 'Chat history cleared!', userName: AI_NAME }])
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
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}`, userName: AI_NAME }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, userName: AI_NAME }])
        emitMessage('ai_response', { workspaceId: activeWorkspace._id, message: data.reply, role: 'assistant' })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to server!', userName: AI_NAME }])
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

  const tabs = [
    { id: TAB_CHAT,   label: 'AI Chat', icon: <Icon size={13}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Icon> },
    { id: TAB_EDITOR, label: 'Notes',   icon: <Icon size={13}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon> },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      {/* ── Workspace list ──────────────────────────────────── */}
      <aside className="flex w-56 shrink-0 flex-col gap-3 border-r border-line bg-surface px-2.5 pb-4 pt-16 md:pt-4">

        {/* Header row */}
        <div className="flex items-center justify-between px-1">
          <p className={sectionLabel}>Workspaces</p>
          <div className="flex gap-1">
            <button
              onClick={() => { setJoining(!joining); setCreating(false) }}
              className="rounded border border-line-strong px-2 py-0.5 text-[11px] font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
            >
              Join
            </button>
            <button
              onClick={() => { setCreating(!creating); setJoining(false) }}
              className="rounded bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent/15"
            >
              + New
            </button>
          </div>
        </div>

        {/* Create form */}
        {creating && (
          <div className="flex flex-col gap-2">
            <input
              type="text" placeholder="Workspace name…" value={newWorkspaceName}
              onChange={e => setNewWorkspaceName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createWorkspace()}
              className={inputCls}
              autoFocus
            />
            <button onClick={createWorkspace} className={btnPrimary}>Create</button>
          </div>
        )}

        {/* Join form */}
        {joining && (
          <div className="flex flex-col gap-2">
            <input
              type="text" placeholder="Enter share code…" value={shareCode}
              onChange={e => setShareCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoinWorkspace()}
              className={`${inputCls} font-mono tracking-[0.12em]`}
              autoFocus
            />
            {joinError && <p className="text-[11px] text-danger">{joinError}</p>}
            <button onClick={handleJoinWorkspace} className={btnPrimary}>Join Workspace</button>
          </div>
        )}

        {/* Workspace list */}
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {workspaces.length === 0 ? (
            <p className="px-1 py-1 text-xs text-ink-2">No workspaces yet</p>
          ) : (
            workspaces.map(ws => {
              const active = activeWorkspace?._id === ws._id
              return (
                <div
                  key={ws._id}
                  onClick={() => selectWorkspace(ws)}
                  className={`cursor-pointer rounded-md border p-2.5 transition-colors ${
                    active ? 'border-accent/30 bg-accent-soft' : 'border-line bg-surface hover:bg-sunken'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {renamingId === ws._id ? (
                          <input
                            type="text" value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleRenameWorkspace(ws._id); if (e.key === 'Escape') setRenamingId(null) }}
                            onBlur={() => handleRenameWorkspace(ws._id)}
                            className="w-full border-b border-accent bg-transparent text-[13px] text-ink outline-none"
                            autoFocus onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <p className={`truncate text-[13px] font-medium ${active ? 'text-accent' : 'text-ink'}`}>
                            {ws.name}
                          </p>
                        )}
                        {!isWsOwner(ws) && (
                          <span className="shrink-0 rounded-full bg-sunken px-1.5 py-px text-[10px] text-ink-2">
                            shared
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink-2">
                        {ws.documents.length} doc{ws.documents.length !== 1 ? 's' : ''}
                        {ws.collaborators?.length > 0 && ` • ${ws.collaborators.length} collab`}
                      </p>
                    </div>

                    {/* Owner actions */}
                    {isWsOwner(ws) && (
                      <div className="ml-1 flex shrink-0 gap-0.5">
                        <button
                          onClick={e => { e.stopPropagation(); setRenamingId(ws._id); setRenameValue(ws.name) }}
                          className="flex h-5 w-5 items-center justify-center rounded text-ink-2 transition-colors hover:bg-line hover:text-ink"
                          title="Rename" aria-label="Rename workspace"
                        >
                          <Icon size={11}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon>
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteWorkspace(ws._id) }}
                          className="flex h-5 w-5 items-center justify-center rounded text-ink-2 transition-colors hover:bg-danger-soft hover:text-danger"
                          title="Delete" aria-label="Delete workspace"
                        >
                          <Icon size={11}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Icon>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-6 py-3.5">
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl leading-none tracking-tight text-ink">
              {activeWorkspace ? activeWorkspace.name : 'Workspace'}
            </h1>
            <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-2">
              {activeWorkspace ? (
                <>
                  <span>{activeWorkspace.documents.length} document{activeWorkspace.documents.length !== 1 ? 's' : ''}</span>
                  {currentUserRole !== 'Owner' && (
                    <span className="rounded-full bg-accent-soft px-2 py-px text-[10px] font-medium text-accent">
                      {currentUserRole}
                    </span>
                  )}
                </>
              ) : 'Select or create a workspace'}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Online users pill */}
            {onlineUsers.length > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                <span className="text-xs font-medium text-ink">{onlineUsers.length} online</span>
                <div className="flex">
                  {onlineUsers.slice(0, 3).map((u, i) => (
                    <div
                      key={i} title={u.name}
                      className={`flex h-5 w-5 items-center justify-center rounded-full border border-surface bg-accent-soft text-[10px] font-medium text-accent ${i > 0 ? '-ml-1.5' : ''}`}
                    >
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share code (owner only) */}
            {activeWorkspace && isOwner && (
              <div className="relative">
                <button onClick={() => setShowShareCode(!showShareCode)} className={btnGhost}>
                  <Icon size={12}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Icon>
                  Share
                </button>
                {showShareCode && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-line bg-surface p-4 shadow-pop">
                    <p className="mb-2.5 text-xs text-ink-2">Share this code with collaborators:</p>
                    <div className="flex items-center gap-2 rounded-md border border-line bg-bg px-3 py-2">
                      <p className="flex-1 font-mono text-[15px] font-semibold tracking-[0.14em] text-ink">
                        {activeWorkspace.shareCode}
                      </p>
                      <button
                        onClick={() => copyShareCode(activeWorkspace.shareCode)}
                        className="rounded bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-on transition-colors hover:bg-accent-hover"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] text-ink-2">Anyone with this code can join your workspace</p>
                  </div>
                )}
              </div>
            )}

            {/* Leave (non-owner) */}
            {activeWorkspace && !isOwner && (
              <button
                onClick={() => handleLeaveWorkspace(activeWorkspace._id)}
                className="inline-flex items-center gap-1.5 rounded-md border border-danger/25 bg-danger-soft px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:border-danger/50"
              >
                Leave
              </button>
            )}

            {/* Clear chat */}
            {activeWorkspace && (
              <button onClick={handleClearHistory} className={btnGhost}>
                <Icon size={12}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Icon>
                Clear
              </button>
            )}

            {/* Add document */}
            {activeWorkspace && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`${btnPrimary} py-1.5 text-xs`}
              >
                <Icon size={13}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></Icon>
                {uploading ? 'Uploading…' : 'Add Doc'}
              </button>
            )}
            <input
              ref={fileInputRef} type="file" accept=".pdf,.txt,.docx" className="hidden"
              onChange={e => { handleFileUpload(e.target.files[0]); e.target.value = '' }}
            />
          </div>
        </div>

        {/* Empty state */}
        {!activeWorkspace ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-surface text-ink-2">
              <Icon size={26}>
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </Icon>
            </div>
            <div className="text-center">
              <h2 className="font-display text-3xl tracking-tight text-ink">Select a Workspace</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-2">
                Create or join a workspace to collaborate with your team in real-time
              </p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setCreating(true)} className={`${btnPrimary} px-5 py-2.5`}>
                + Create Workspace
              </button>
              <button
                onClick={() => setJoining(true)}
                className="inline-flex items-center justify-center rounded-md border border-line-strong bg-surface px-5 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-sunken"
              >
                Join with Code
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">

            {/* Docs + Collabs inner sidebar */}
            <div className="flex w-48 shrink-0 flex-col gap-1.5 overflow-y-auto border-r border-line px-2.5 py-4">
              <p className={`${sectionLabel} mb-1 px-1`}>Documents</p>

              {activeWorkspace.documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                  <span className="text-ink-3">
                    <Icon size={22}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Icon>
                  </span>
                  <p className="text-xs text-ink-2">No documents yet</p>
                </div>
              ) : (
                <>
                  {activeWorkspace.documents.map((doc, i) => (
                    <div
                      key={i}
                      className="group flex items-start gap-2 rounded-md border border-line bg-surface px-2.5 py-2 transition-colors hover:border-line-strong"
                    >
                      <span className="mt-0.5 shrink-0 text-accent">
                        <Icon size={12}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Icon>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-ink">{doc.fileName}</p>
                        {doc.uploadedBy && <p className="mt-px text-[11px] text-ink-2">by {doc.uploadedBy}</p>}
                      </div>
                      {(isOwner || currentUserRole === 'Admin') && (
                        <button
                          onClick={() => deleteDocument(i)}
                          className="flex shrink-0 items-center rounded p-0.5 text-ink-2 opacity-0 transition-opacity hover:text-danger focus:opacity-100 group-hover:opacity-100"
                          title="Delete document" aria-label="Delete document"
                        >
                          <Icon size={11}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Icon>
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="mt-0.5 rounded-md bg-accent-soft px-2.5 py-1.5 text-center">
                    <p className="text-[11px] font-medium text-accent">
                      {activeWorkspace.documents.length} doc{activeWorkspace.documents.length !== 1 ? 's' : ''} loaded
                    </p>
                  </div>
                </>
              )}

              {/* Collaborators */}
              {activeWorkspace.collaborators?.length > 0 && (
                <div className="mt-4">
                  <p className={`${sectionLabel} mb-1.5 px-1`}>Collaborators</p>
                  {activeWorkspace.collaborators.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 px-1 py-1.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunken text-[10px] font-medium text-ink-2">
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs text-ink">{c.name}</p>
                        {c.role && c.role !== 'Viewer' && <p className="text-[10px] text-accent">{c.role}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat / Editor panel */}
            <div className="flex flex-1 flex-col overflow-hidden">

              {/* Tab bar */}
              <div className="flex shrink-0 items-center gap-1 border-b border-line px-4">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-accent text-ink'
                        : 'border-transparent text-ink-2 hover:text-ink'
                    }`}
                  >
                    {tab.icon}{tab.label}
                  </button>
                ))}
              </div>

              {/* ── Chat tab ── */}
              {activeTab === TAB_CHAT && (
                <>
                  <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">

                    {/* Quick prompts */}
                    {messages.length <= 1 && activeWorkspace.documents.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {quickPrompts.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => setInput(prompt)}
                            className="rounded-full border border-line-strong bg-surface px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}

                    {messages.map((msg, i) => (
                      <div key={i}>
                        {msg.role === 'system' ? (
                          <div className="flex justify-center">
                            <span className="rounded-full bg-sunken px-3 py-1 text-xs text-ink-2">
                              {msg.content}
                            </span>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                              msg.role === 'user' ? 'bg-sunken text-ink-2' : 'bg-accent text-accent-on'
                            }`}>
                              {msg.role === 'user'
                                ? msg.userName?.[0]?.toUpperCase() || '?'
                                : <span className="font-display text-[15px] leading-none">{BRAND_NAME.charAt(0)}</span>}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="mb-1 text-xs font-medium text-ink-2">
                                {msg.userName || (msg.role === 'user' ? user?.name : AI_NAME)}
                              </p>
                              {msg.role === 'assistant'
                                ? <MarkdownMessage content={msg.content} />
                                : <p className="whitespace-pre-wrap rounded-lg bg-sunken px-3.5 py-2.5 text-[13.5px] leading-[1.65] text-ink">
                                    {msg.content}
                                  </p>
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Typing user indicator */}
                    {typingUser && (
                      <div className="flex gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-medium text-ink-2">
                          {typingUser[0]?.toUpperCase()}
                        </div>
                        <div className="flex items-center gap-1.5 pt-1.5">
                          <span className="text-xs text-ink-2">{typingUser} is typing</span>
                          {[0, 150, 300].map((delay, i) => (
                            <span
                              key={i}
                              className="h-1 w-1 animate-[bounceDot_1.2s_ease-in-out_infinite] rounded-full bg-ink-2"
                              style={{ animationDelay: `${delay}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI loading */}
                    {loading && (
                      <div className="flex gap-3">
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

                  {/* Input */}
                  <div className="shrink-0 border-t border-line px-5 py-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Chat with your team or ask about documents…"
                        value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} disabled={loading}
                        className={`${inputCls} flex-1 py-2.5 text-sm`}
                      />
                      <button onClick={sendMessage} disabled={loading} className={`${btnPrimary} px-5`}>
                        <Icon size={13}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Icon>
                        Ask
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── Editor tab ── */}
              {activeTab === TAB_EDITOR && (
                <div className="flex-1 overflow-hidden p-3">
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