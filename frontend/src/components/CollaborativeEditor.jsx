import { useEffect, useState, useCallback, startTransition } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const BRAND_NAME = 'NeuralIQ'

// Muted but distinct per-user cursor colors (white label text stays readable)
const CURSOR_COLORS = ['#0F766E', '#B54708', '#1D4ED8', '#BE185D', '#4D7C0F', '#6D28D9']
const hashColor = (name = '') => {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return CURSOR_COLORS[Math.abs(h) % CURSOR_COLORS.length]
}

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000').replace(/^http/, 'ws')
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Icon = ({ size = 14, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const SAVE_STATUS = {
  saved:   { text: 'Saved',    dot: 'bg-success' },
  saving:  { text: 'Saving…',  dot: 'bg-warning' },
  unsaved: { text: 'Unsaved',  dot: 'bg-danger'  },
}

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
          <title>${BRAND_NAME} Notes</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 20px; }
            pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
            code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; }
            blockquote { border-left: 4px solid #0F766E; padding-left: 16px; color: #555; }
            .header { border-bottom: 2px solid #0F766E; padding-bottom: 12px; margin-bottom: 24px; }
            .meta { color: #888; font-size: 12px; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${BRAND_NAME} — Workspace Notes</h1>
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

  const status = SAVE_STATUS[saveStatus]

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface">

      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-ink-2">
            <Icon size={15}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </Icon>
          </span>
          <p className="text-sm font-medium text-ink">Collaborative Notes</p>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
            isConnected ? 'bg-success-soft text-success' : 'bg-sunken text-ink-2'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-success' : 'bg-ink-3'}`} />
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
          {/* ✅ Save status indicator */}
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.text}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!canEdit && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-sunken px-2.5 py-1 text-xs text-ink-2">
              <Icon size={12}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Icon>
              View only
            </span>
          )}
          {/* ✅ PDF Download button */}
          <button
            onClick={downloadAsPDF}
            className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
          >
            <Icon size={13}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </Icon>
            Download PDF
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {canEdit && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-1 border-b border-line bg-bg px-4 py-2">
          {[
            { cmd: 'bold',   label: 'B',  title: 'Bold',          style: { fontWeight: 700 },                 active: isActive('bold') },
            { cmd: 'italic', label: 'I',  title: 'Italic',        style: { fontStyle: 'italic' },             active: isActive('italic') },
            { cmd: 'strike', label: 'S',  title: 'Strikethrough', style: { textDecoration: 'line-through' },  active: isActive('strike') },
            { cmd: 'code',   label: '<>', title: 'Inline code',   active: isActive('code') },
          ].map(({ cmd, label, title, style, active }) => (
            <ToolBtn key={cmd} onClick={() => execCommand(cmd)} active={active} title={title} style={style}>{label}</ToolBtn>
          ))}
          <Divider />
          {[
            { cmd: 'h1', label: 'H1', title: 'Heading 1', active: isActive('heading', { level: 1 }) },
            { cmd: 'h2', label: 'H2', title: 'Heading 2', active: isActive('heading', { level: 2 }) },
          ].map(({ cmd, label, title, active }) => (
            <ToolBtn key={cmd} onClick={() => execCommand(cmd)} active={active} title={title}>{label}</ToolBtn>
          ))}
          <Divider />
          {[
            { cmd: 'bullet',     label: '• List',   title: 'Bullet list',   active: isActive('bulletList') },
            { cmd: 'ordered',    label: '1. List',  title: 'Numbered list', active: isActive('orderedList') },
            { cmd: 'blockquote', label: 'Quote',    title: 'Quote',         active: isActive('blockquote') },
            { cmd: 'codeBlock',  label: '{ }',      title: 'Code block',    active: isActive('codeBlock') },
            { cmd: 'hr',         label: 'Divider',  title: 'Horizontal rule' },
          ].map(({ cmd, label, title, active }) => (
            <ToolBtn key={cmd} onClick={() => execCommand(cmd)} active={active} title={title}>{label}</ToolBtn>
          ))}
          <Divider />
          <ToolBtn onClick={() => execCommand('undo')} title="Undo">
            <Icon size={13}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></Icon>
          </ToolBtn>
          <ToolBtn onClick={() => execCommand('redo')} title="Redo">
            <Icon size={13}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></Icon>
          </ToolBtn>
        </div>
      )}

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <style>{editorStyles}</style>
        {isConnected ? (
          <EditorContent
            editor={editor}
            style={{ pointerEvents: canEdit ? 'auto' : 'none', opacity: canEdit ? 1 : 0.7 }}
          />
        ) : (
          <div className="flex h-32 items-center justify-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
            <span className="text-sm text-ink-2">Connecting to live editor...</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ToolBtn({ children, onClick, active, title, style }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active ? true : undefined}
      style={style}
      className={`flex min-h-[28px] min-w-[28px] items-center justify-center rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-accent/30 bg-accent-soft text-accent'
          : 'border-transparent text-ink-2 hover:bg-sunken hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-1 h-4 w-px flex-shrink-0 bg-line-strong" />
}

const editorStyles = `
.collaborative-editor-content { outline: none; min-height: 300px; color: rgb(var(--c-ink)); font-size: 15px; line-height: 1.75; caret-color: rgb(var(--c-accent)); }
.collaborative-editor-content p { margin-bottom: 0.7rem; }
.collaborative-editor-content p.is-editor-empty:first-child::before { content: "Start writing... changes sync live with your team"; color: rgb(var(--c-ink-3)); pointer-events: none; float: left; height: 0; }
.collaborative-editor-content h1 { font-family: "Instrument Serif", Georgia, serif; font-size: 2rem; font-weight: 400; letter-spacing: -0.015em; line-height: 1.15; color: rgb(var(--c-ink)); margin: 1.25rem 0 0.6rem; }
.collaborative-editor-content h2 { font-size: 1.25rem; font-weight: 600; letter-spacing: -0.01em; color: rgb(var(--c-ink)); margin: 1rem 0 0.45rem; }
.collaborative-editor-content strong { color: rgb(var(--c-ink)); font-weight: 600; }
.collaborative-editor-content em { font-style: italic; }
.collaborative-editor-content s { color: rgb(var(--c-ink-2)); }
.collaborative-editor-content code { background: rgb(var(--c-sunken)); color: rgb(var(--c-ink)); padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: 'Geist Mono', 'Fira Code', monospace; }
.collaborative-editor-content pre { background: rgb(var(--c-sunken)); border: 1px solid rgb(var(--c-line)); border-radius: 8px; padding: 12px 16px; margin: 0.85rem 0; overflow-x: auto; }
.collaborative-editor-content pre code { background: none; padding: 0; color: rgb(var(--c-ink)); font-size: 13px; }
.collaborative-editor-content blockquote { border-left: 3px solid rgb(var(--c-accent)); padding-left: 1rem; color: rgb(var(--c-ink-2)); margin: 0.85rem 0; }
.collaborative-editor-content ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.7rem; }
.collaborative-editor-content ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.7rem; }
.collaborative-editor-content li { margin-bottom: 0.25rem; }
.collaborative-editor-content hr { border: none; border-top: 1px solid rgb(var(--c-line-strong)); margin: 1.4rem 0; }
.collaboration-cursor__caret { border-left: 2px solid; border-right: 2px solid; margin-left: -1px; margin-right: -1px; pointer-events: none; word-break: normal; }
.collaboration-cursor__label { border-radius: 3px 3px 3px 0; color: #fff; font-size: 10px; font-weight: 600; left: -1px; line-height: normal; padding: 2px 6px; position: absolute; top: -1.4em; user-select: none; white-space: nowrap; pointer-events: none; }
`