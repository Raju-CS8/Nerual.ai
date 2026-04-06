import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import Sidebar from '../components/Sidebar'
import { useSocket } from '../hooks/useSocket'
import {
  getWorkspacesAPI, createWorkspaceAPI, addDocumentToWorkspaceAPI,
  chatWithWorkspaceAPI, deleteDocumentAPI, deleteWorkspaceAPI,
  joinWorkspaceAPI, renameWorkspaceAPI
} from '../api'

const MarkdownMessage = ({ content }) => (
  <div className="text-gray-200 text-sm leading-relaxed">
    <ReactMarkdown
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
  </div>
)

export default function Workspace({ activePage, setActivePage, user, onLogout }) {
  const [workspaces, setWorkspaces] = useState([])
  const [activeWorkspace, setActiveWorkspace] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [shareCode, setShareCode] = useState('')
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typingUser, setTypingUser] = useState(null)
  const [showShareCode, setShowShareCode] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)
  const typingTimeout = useRef(null)
  const activeWorkspaceRef = useRef(null)

  const userId = user?._id || user?.id

  useEffect(() => { activeWorkspaceRef.current = activeWorkspace }, [activeWorkspace])

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
    onUsersOnline: (users) => setOnlineUsers(users),
    onUserJoined: ({ userName: joinedUser }) => {
      if (joinedUser !== user?.name) {
        setMessages(prev => [...prev, { role: 'system', content: `👋 ${joinedUser} joined the workspace`, userName: 'System' }])
      }
    },
    onUserLeft: ({ userName: leftUser }) => {
      setMessages(prev => [...prev, { role: 'system', content: `👋 ${leftUser} left the workspace`, userName: 'System' }])
    },
    onUserTyping: ({ userName: typingName }) => { if (typingName !== user?.name) setTypingUser(typingName) },
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
        const savedMessages = (data.workspace.messages || []).map(m => ({
          role: m.role, content: m.content, userName: m.userName
        }))
        if (savedMessages.length > 0) {
          setMessages([...savedMessages, { role: 'system', content: `✅ You joined "${data.workspace.name}"!`, userName: 'System' }])
        } else {
          setMessages([{ role: 'assistant', content: `✅ Joined workspace "${data.workspace.name}"! You can now collaborate!`, userName: 'NEURALIQ AI' }])
        }
        setShareCode('')
        setJoining(false)
      } else { setJoinError(data.error || 'Invalid share code') }
    } catch { setJoinError('Could not join workspace') }
  }

  const selectWorkspace = (ws) => {
    setActiveWorkspace(ws)
    setOnlineUsers([])
    const savedMessages = (ws.messages || []).map(m => ({
      role: m.role, content: m.content, userName: m.userName
    }))
    if (savedMessages.length > 0) {
      setMessages([...savedMessages, { role: 'system', content: `— You rejoined "${ws.name}" —`, userName: 'System' }])
    } else {
      setMessages([{
        role: 'assistant',
        content: `Workspace "${ws.name}" loaded with ${ws.documents.length} document(s). ${ws.collaborators?.length > 0 ? `${ws.collaborators.length} collaborator(s).` : ''} Ask me anything!`,
        userName: 'NEURALIQ AI'
      }])
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
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ "${file.name}" added! You now have ${data.workspace.documents.length} document(s).`,
          userName: 'NEURALIQ AI'
        }])
        emitMessage('document_added', { workspaceId: activeWorkspace._id, fileName: file.name, userName: user?.name })
      } else { alert(data.error) }
    } catch { alert('Upload failed') }
    setUploading(false)
  }

  const deleteDocument = async (docIndex) => {
    if (!activeWorkspace) return
    try {
      const data = await deleteDocumentAPI(activeWorkspace._id, docIndex)
      if (data.success) {
        setActiveWorkspace(data.workspace)
        setWorkspaces(prev => prev.map(w => w._id === data.workspace._id ? data.workspace : w))
      }
    } catch { alert('Could not delete document') }
  }

  const handleDeleteWorkspace = async (workspaceId) => {
    if (!window.confirm('Delete this workspace permanently?')) return
    try {
      await deleteWorkspaceAPI(workspaceId)
      setWorkspaces(prev => prev.filter(w => w._id !== workspaceId))
      if (activeWorkspace?._id === workspaceId) { setActiveWorkspace(null); setMessages([]) }
    } catch { alert('Could not delete workspace') }
  }

  const handleRenameWorkspace = async (id) => {
    if (!renameValue.trim()) { setRenamingId(null); return }
    try {
      const data = await renameWorkspaceAPI(id, renameValue)
      if (data.success) {
        setWorkspaces(prev => prev.map(w => w._id === id ? { ...w, name: renameValue } : w))
        if (activeWorkspace?._id === id) setActiveWorkspace(prev => ({ ...prev, name: renameValue }))
      }
    } catch { console.log('Could not rename') }
    setRenamingId(null)
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeWorkspace) return
    const userMsg = { role: 'user', content: input, userName: user?.name }
    setMessages(prev => [...prev, userMsg])
    const currentInput = input
    setInput('')
    setLoading(true)
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

  const isOwner = activeWorkspace?.userId?.toString() === userId
  const isWsOwner = (ws) => ws.userId?.toString() === userId

  const quickPrompts = ['Summarize all documents', 'Compare the documents', 'What are the key differences?', 'Create flashcards from all docs', 'List the main topics covered', 'What are the action items?']

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1a0533 0%, #050816 60%)' }}>

      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div className="w-64 flex flex-col py-4 px-3 gap-3 flex-shrink-0"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Workspaces</p>
          <div className="flex gap-1">
            <button onClick={() => { setJoining(!joining); setCreating(false) }}
              className="text-xs px-2 py-1 rounded-lg text-cyan-400 hover:bg-cyan-400/10 transition-all">Join</button>
            <button onClick={() => { setCreating(!creating); setJoining(false) }}
              className="text-xs px-2 py-1 rounded-lg text-purple-400 hover:bg-purple-400/10 transition-all">+ New</button>
          </div>
        </div>

        {creating && (
          <div className="flex flex-col gap-2">
            <input type="text" placeholder="Workspace name..." value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createWorkspace()}
              className="w-full py-2 px-3 rounded-lg outline-none text-white text-sm placeholder-gray-600"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} autoFocus />
            <button onClick={createWorkspace} className="py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>Create</button>
          </div>
        )}

        {joining && (
          <div className="flex flex-col gap-2">
            <input type="text" placeholder="Enter share code..." value={shareCode}
              onChange={(e) => setShareCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinWorkspace()}
              className="w-full py-2 px-3 rounded-lg outline-none text-white text-sm placeholder-gray-600 uppercase"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(6,182,212,0.3)' }} autoFocus />
            {joinError && <p className="text-red-400 text-xs">{joinError}</p>}
            <button onClick={handleJoinWorkspace} className="py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>Join Workspace</button>
          </div>
        )}

        <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
          {workspaces.length === 0 ? (
            <p className="text-xs text-gray-600 px-1">No workspaces yet!</p>
          ) : (
            workspaces.map(ws => (
              <div key={ws._id}
                className="px-3 py-3 rounded-xl cursor-pointer transition-all group"
                style={{
                  background: activeWorkspace?._id === ws._id ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                  border: activeWorkspace?._id === ws._id ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)'
                }}
                onClick={() => selectWorkspace(ws)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {renamingId === ws._id ? (
                        <input type="text" value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRenameWorkspace(ws._id); if (e.key === 'Escape') setRenamingId(null) }}
                          onBlur={() => handleRenameWorkspace(ws._id)}
                          className="w-full text-xs text-white bg-transparent outline-none border-b border-purple-400"
                          autoFocus onClick={(e) => e.stopPropagation()} />
                      ) : (
                        <p className="text-white text-xs font-medium truncate">{ws.name}</p>
                      )}
                      {!isWsOwner(ws) && <span className="text-xs text-cyan-400 flex-shrink-0">shared</span>}
                    </div>
                    <p className="text-gray-600 text-xs mt-1">
                      {ws.documents.length} doc{ws.documents.length !== 1 ? 's' : ''}
                      {ws.collaborators?.length > 0 && ` · ${ws.collaborators.length} collab`}
                    </p>
                  </div>
                  {isWsOwner(ws) && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all ml-1 flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); setRenamingId(ws._id); setRenameValue(ws.name) }}
                        className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-purple-400 hover:bg-white/10 transition-all text-xs">✏️</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteWorkspace(ws._id) }}
                        className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-white/10 transition-all text-xs">🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 flex-shrink-0 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h1 className="text-2xl font-bold text-white">
              <span className="font-bold">NEURALIQ.</span>
              <span className="font-light"> Workspace</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {activeWorkspace ? `📁 ${activeWorkspace.name}` : 'Select or create a workspace'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onlineUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400 text-xs">{onlineUsers.length} online</span>
                <div className="flex -space-x-1">
                  {onlineUsers.slice(0, 3).map((u, i) => (
                    <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: '1px solid rgba(255,255,255,0.2)' }}
                      title={u.name}>{u.name?.[0]?.toUpperCase()}</div>
                  ))}
                </div>
              </div>
            )}

            {activeWorkspace && isOwner && (
              <div className="relative">
                <button onClick={() => setShowShareCode(!showShareCode)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                  style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4' }}>
                  🔗 Share
                </button>
                {showShareCode && (
                  <div className="absolute right-0 top-12 rounded-xl p-4 z-50 w-64"
                    style={{ background: '#0f0a1e', border: '1px solid rgba(124,58,237,0.3)' }}>
                    <p className="text-gray-400 text-xs mb-2">Share this code with collaborators:</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold text-lg tracking-widest flex-1">{activeWorkspace.shareCode}</p>
                      <button onClick={() => copyShareCode(activeWorkspace.shareCode)}
                        className="px-3 py-1 rounded-lg text-xs text-white"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>Copy</button>
                    </div>
                    <p className="text-gray-600 text-xs mt-2">Anyone with this code can join</p>
                  </div>
                )}
              </div>
            )}

            {activeWorkspace && (
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-80"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                {uploading ? '⏳ Uploading...' : '📎 Add Document'}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx" className="hidden"
              onChange={(e) => { handleFileUpload(e.target.files[0]); e.target.value = '' }} />
          </div>
        </div>

        {!activeWorkspace ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl">📁</div>
            <h2 className="text-white text-xl font-medium">Select a Workspace</h2>
            <p className="text-gray-500 text-sm text-center max-w-sm">Create a workspace and collaborate with others in real-time!</p>
            <div className="flex gap-3">
              <button onClick={() => setCreating(true)}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>+ Create Workspace</button>
              <button onClick={() => setJoining(true)}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>🔗 Join with Code</button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-52 flex flex-col py-4 px-3 gap-2 flex-shrink-0"
              style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-gray-500 uppercase tracking-widest px-1">Documents</p>

              {activeWorkspace.documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center">
                  <span className="text-3xl">📄</span>
                  <p className="text-gray-600 text-xs">No documents yet!</p>
                </div>
              ) : (
                activeWorkspace.documents.map((doc, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg flex flex-col gap-1 group"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm flex-shrink-0">📄</span>
                      <p className="text-white text-xs truncate flex-1">{doc.fileName}</p>
                      {isOwner && (
                        <button onClick={() => deleteDocument(i)}
                          className="text-gray-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 text-xs flex-shrink-0">✕</button>
                      )}
                    </div>
                    {doc.uploadedBy && <p className="text-gray-600 text-xs pl-6">by {doc.uploadedBy}</p>}
                  </div>
                ))
              )}

              {activeWorkspace.documents.length > 0 && (
                <div className="mt-2 px-2 py-2 rounded-lg text-center"
                  style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <p className="text-purple-400 text-xs font-medium">
                    {activeWorkspace.documents.length} doc{activeWorkspace.documents.length !== 1 ? 's' : ''} loaded
                  </p>
                </div>
              )}

              {activeWorkspace.collaborators?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 uppercase tracking-widest px-1 mb-2">Collaborators</p>
                  {activeWorkspace.collaborators.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <p className="text-gray-400 text-xs truncate">{c.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">

                {messages.length <= 1 && activeWorkspace.documents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {quickPrompts.map((prompt, i) => (
                      <button key={i} onClick={() => setInput(prompt)}
                        className="px-3 py-2 rounded-lg text-xs text-purple-300 transition-all hover:opacity-80"
                        style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i}>
                    {msg.role === 'system' ? (
                      <div className="flex justify-center">
                        <span className="text-xs text-gray-600 px-3 py-1 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.04)' }}>{msg.content}</span>
                      </div>
                    ) : (
                      <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                          style={{
                            background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed44, #06b6d444)' : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                            border: '2px solid rgba(124,58,237,0.4)'
                          }}>
                          {msg.role === 'user' ? msg.userName?.[0]?.toUpperCase() || '?' : 'N'}
                        </div>
                        <div className="max-w-2xl px-4 py-3 rounded-2xl"
                          style={{
                            background: msg.role === 'user' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)'
                          }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: msg.role === 'user' ? '#a78bfa' : '#06b6d4' }}>
                            {msg.userName || (msg.role === 'user' ? user?.name : 'NEURALIQ AI')}
                          </p>
                          {msg.role === 'assistant'
                            ? <MarkdownMessage content={msg.content} />
                            : <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          }
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {typingUser && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(124,58,237,0.3)', border: '2px solid rgba(124,58,237,0.4)' }}>
                      {typingUser[0]?.toUpperCase()}
                    </div>
                    <div className="px-4 py-3 rounded-2xl flex items-center gap-1"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="text-gray-500 text-xs">{typingUser} is typing</span>
                      <div className="flex gap-1 ml-1">
                        <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-gray-500" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-gray-500" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-gray-500" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {loading && (
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

              <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-3">
                  <input type="text" placeholder="Chat with your team or ask about documents..."
                    value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} disabled={loading}
                    className="flex-1 py-3 px-5 rounded-xl outline-none text-white placeholder-gray-600"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <button onClick={sendMessage} disabled={loading}
                    className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                    ➤ Ask
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}