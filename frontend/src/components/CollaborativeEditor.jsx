import { useEffect, useState, useCallback, startTransition } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const CURSOR_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
const hashColor = (name = '') => {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return CURSOR_COLORS[Math.abs(h) % CURSOR_COLORS.length]
}

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000').replace(/^http/, 'ws')
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function CollaborativeEditor({ workspaceId, userName, isOwner, userRole }) {
  const [ydoc, setYdoc] = useState(null)
  const [provider, setProvider] = useState(null)
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'unsaved'

  // ✅ Load saved notes from DB when workspace opens
  useEffect(() => {
    if (!workspaceId) return
    const token = localStorage.getItem('neuraliq_token')
    fetch(`${BASE_URL}/workspace/${workspaceId}/notes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.notes) {
          // Store in localStorage as fallback while Yjs loads
          localStorage.setItem(`notes_${workspaceId}`, data.notes)
        }
      })
      .catch(() => {})
  }, [workspaceId])

  // ✅ Setup Yjs + WebSocket
  useEffect(() => {
    if (!workspaceId) return

    const doc = new Y.Doc()
    const ws = new WebsocketProvider(
      `${SOCKET_URL}/yjs`,
      `workspace-${workspaceId}`,
      doc,
      { connect: true }
    )

    ws.awareness.setLocalStateField('user', {
      name: userName || 'Anonymous',
      color: hashColor(userName)
    })

    startTransition(() => {
      setYdoc(doc)
      setProvider(ws)
    })

    return () => {
      ws.destroy()
      doc.destroy()
      startTransition(() => {
        setYdoc(null)
        setProvider(null)
      })
    }
  }, [workspaceId, userName])

  const editor = useEditor(
    {
      extensions: ydoc && provider
        ? [
            StarterKit.configure({ history: false }),
            Collaboration.configure({ document: ydoc }),
            CollaborationCursor.configure({
              provider,
              user: { name: userName || 'Anonymous', color: hashColor(userName) }
            })
          ]
        : [StarterKit.configure({ history: false })],
      editorProps: {
        attributes: { class: 'collaborative-editor-content' }
      }
    },
    [!!ydoc, !!provider]
  )

  // ✅ Auto-save to DB every 30 seconds
  useEffect(() => {
    if (!editor || !workspaceId) return

    const saveNotes = async () => {
      const html = editor.getHTML()
      if (!html || html === '<p></p>') return

      setSaveStatus('saving')
      try {
        const token = localStorage.getItem('neuraliq_token')
        await fetch(`${BASE_URL}/workspace/${workspaceId}/notes`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ notes: html })
        })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('unsaved')
      }
    }

    const interval = setInterval(saveNotes, 30000)

    // Also save on editor content change (debounced)
    let debounceTimer
    const handleUpdate = () => {
      setSaveStatus('unsaved')
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(saveNotes, 3000)
    }

    editor.on('update', handleUpdate)

    return () => {
      clearInterval(interval)
      clearTimeout(debounceTimer)
      editor.off('update', handleUpdate)
      // Save on unmount
      saveNotes()
    }
  }, [editor, workspaceId])

  // ✅ PDF Download
  const downloadAsPDF = useCallback(() => {
    if (!editor) return
    const html = editor.getHTML()

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NEURALIQ Notes</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 20px; }
            pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
            code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; }
            blockquote { border-left: 4px solid #7c3aed; padding-left: 16px; color: #555; }
            .header { border-bottom: 2px solid #7c3aed; padding-bottom: 12px; margin-bottom: 24px; }
            .meta { color: #888; font-size: 12px; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NEURALIQ — Workspace Notes</h1>
            <p class="meta">Downloaded on ${new Date().toLocaleString()}</p>
          </div>
          ${html}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }, [editor])

  const execCommand = useCallback((cmd) => {
    if (!editor) return
    const chain = editor.chain().focus()
    switch (cmd) {
      case 'bold':       chain.toggleBold().run(); break
      case 'italic':     chain.toggleItalic().run(); break
      case 'strike':     chain.toggleStrike().run(); break
      case 'code':       chain.toggleCode().run(); break
      case 'h1':         chain.toggleHeading({ level: 1 }).run(); break
      case 'h2':         chain.toggleHeading({ level: 2 }).run(); break
      case 'bullet':     chain.toggleBulletList().run(); break
      case 'ordered':    chain.toggleOrderedList().run(); break
      case 'blockquote': chain.toggleBlockquote().run(); break
      case 'codeBlock':  chain.toggleCodeBlock().run(); break
      case 'hr':         chain.setHorizontalRule().run(); break
      case 'undo':       chain.undo().run(); break
      case 'redo':       chain.redo().run(); break
      default: break
    }
  }, [editor])

  const isActive = (type, opts) => editor?.isActive(type, opts) || false
  const canEdit = isOwner || ['Admin', 'Developer', 'Designer', 'Analyst', 'Manager'].includes(userRole)
  const isConnected = !!(ydoc && provider)

  const saveStatusLabel = {
    saved: { text: '✓ Saved', color: '#10b981' },
    saving: { text: '⏳ Saving...', color: '#f59e0b' },
    unsaved: { text: '● Unsaved', color: '#ef4444' }
  }[saveStatus]

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <span className="text-base">✏️</span>
          <p className="text-white text-sm font-semibold">Collaborative Notes</p>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{
            background: isConnected ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
            color: isConnected ? '#10b981' : '#6b7280',
            border: `1px solid ${isConnected ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`
          }}>
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
          {/* ✅ Save status indicator */}
          <span className="text-xs" style={{ color: saveStatusLabel.color }}>
            {saveStatusLabel.text}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!canEdit && (
            <span className="text-xs text-gray-500 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              🔒 View only
            </span>
          )}
          {/* ✅ PDF Download button */}
          <button onClick={downloadAsPDF}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa' }}>
            ⬇️ Download PDF
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {canEdit && (
        <div className="flex flex-wrap items-center gap-1 px-4 py-2 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { cmd: 'bold',   label: 'B',  style: { fontWeight: 700 },    active: isActive('bold') },
            { cmd: 'italic', label: 'I',  style: { fontStyle: 'italic' }, active: isActive('italic') },
            { cmd: 'strike', label: 'S̶',                                  active: isActive('strike') },
            { cmd: 'code',   label: '<>',                                  active: isActive('code') },
          ].map(({ cmd, label, style, active }) => (
            <ToolBtn key={cmd} onClick={() => execCommand(cmd)} active={active} style={style}>{label}</ToolBtn>
          ))}
          <Divider />
          {[
            { cmd: 'h1', label: 'H1', active: isActive('heading', { level: 1 }) },
            { cmd: 'h2', label: 'H2', active: isActive('heading', { level: 2 }) },
          ].map(({ cmd, label, active }) => (
            <ToolBtn key={cmd} onClick={() => execCommand(cmd)} active={active}>{label}</ToolBtn>
          ))}
          <Divider />
          {[
            { cmd: 'bullet',     label: '• List', active: isActive('bulletList') },
            { cmd: 'ordered',    label: '1. List', active: isActive('orderedList') },
            { cmd: 'blockquote', label: '❝',       active: isActive('blockquote') },
            { cmd: 'codeBlock',  label: '{ }',     active: isActive('codeBlock') },
            { cmd: 'hr',         label: '─' },
          ].map(({ cmd, label, active }) => (
            <ToolBtn key={cmd} onClick={() => execCommand(cmd)} active={active}>{label}</ToolBtn>
          ))}
          <Divider />
          <ToolBtn onClick={() => execCommand('undo')}>↩</ToolBtn>
          <ToolBtn onClick={() => execCommand('redo')}>↪</ToolBtn>
        </div>
      )}

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <style>{editorStyles}</style>
        {isConnected ? (
          <EditorContent
            editor={editor}
            style={{ pointerEvents: canEdit ? 'auto' : 'none', opacity: canEdit ? 1 : 0.7 }}
          />
        ) : (
          <div className="flex items-center justify-center h-32 gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
            <span className="text-gray-500 text-sm">Connecting to live editor...</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ToolBtn({ children, onClick, active, title, style }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        ...style,
        background: active ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.04)',
        border: active ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
        color: active ? '#a78bfa' : 'rgba(255,255,255,0.6)'
      }}
      className="px-2 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80 min-w-[28px]">
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-4 mx-1 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
}

const editorStyles = `
.collaborative-editor-content { outline: none; min-height: 300px; color: rgba(255,255,255,0.85); font-size: 14px; line-height: 1.75; caret-color: #a78bfa; }
.collaborative-editor-content p { margin-bottom: 0.6rem; }
.collaborative-editor-content p.is-editor-empty:first-child::before { content: "Start writing... changes sync live with your team"; color: rgba(255,255,255,0.2); pointer-events: none; float: left; height: 0; }
.collaborative-editor-content h1 { font-size: 1.5rem; font-weight: 700; color: #fff; margin: 1rem 0 0.5rem; }
.collaborative-editor-content h2 { font-size: 1.2rem; font-weight: 600; color: #fff; margin: 0.8rem 0 0.4rem; }
.collaborative-editor-content strong { color: #fff; font-weight: 600; }
.collaborative-editor-content em { color: #c4b5fd; }
.collaborative-editor-content s { color: rgba(255,255,255,0.4); }
.collaborative-editor-content code { background: rgba(124,58,237,0.2); color: #e2d9f3; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: 'Fira Code', monospace; }
.collaborative-editor-content pre { background: rgba(0,0,0,0.35); border-radius: 8px; padding: 12px 16px; margin: 0.75rem 0; overflow-x: auto; }
.collaborative-editor-content pre code { background: none; padding: 0; color: #86efac; font-size: 12px; }
.collaborative-editor-content blockquote { border-left: 3px solid rgba(124,58,237,0.6); padding-left: 1rem; color: rgba(255,255,255,0.55); margin: 0.75rem 0; }
.collaborative-editor-content ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.6rem; }
.collaborative-editor-content ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.6rem; }
.collaborative-editor-content li { margin-bottom: 0.25rem; }
.collaborative-editor-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 1.25rem 0; }
.collaboration-cursor__caret { border-left: 2px solid; border-right: 2px solid; margin-left: -1px; margin-right: -1px; pointer-events: none; word-break: normal; }
.collaboration-cursor__label { border-radius: 3px 3px 3px 0; color: #fff; font-size: 10px; font-weight: 600; left: -1px; line-height: normal; padding: 2px 6px; position: absolute; top: -1.4em; user-select: none; white-space: nowrap; pointer-events: none; }
`