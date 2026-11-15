import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { getWorkspacesAPI, removeCollaboratorAPI, updateCollaboratorRoleAPI } from '../api'

// ✅ Constants preserved exactly
const ROLES    = ['Admin', 'Developer', 'Designer', 'Analyst', 'Manager', 'Viewer']
const STATUSES = ['Online', 'Offline', 'Busy']

const Icon = ({ size = 14, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const cardCls = 'rounded-lg border border-line bg-surface'
const sectionLabel = 'text-[11px] font-medium uppercase tracking-wider text-ink-2'
const ROW_GRID = 'grid grid-cols-[36px_1fr_120px_120px_70px_104px] items-center gap-3'

// Display-only: status → token classes
const statusClasses = (status) => {
  if (status === 'Online') return 'border-success/30 bg-success-soft text-success'
  if (status === 'Busy')   return 'border-warning/30 bg-warning-soft text-warning'
  return 'border-line-strong bg-sunken text-ink-2'
}

const selectBase =
  'w-full rounded-md border px-2 py-1.5 text-xs font-medium outline-none transition-colors ' +
  'focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50'

export default function Team({ activePage, setActivePage, user, onLogout }) {
  // ✅ All state preserved exactly
  const [workspaces,      setWorkspaces]      = useState([])
  const [loading,         setLoading]         = useState(true)
  const [saving,          setSaving]          = useState({})
  const [roleOverrides,   setRoleOverrides]   = useState({})
  const [statusOverrides, setStatusOverrides] = useState({})

  const userId = user?._id || user?.id

  // ✅ Logic preserved exactly
  useEffect(() => {
    getWorkspacesAPI()
      .then(data => { if (data.success) setWorkspaces(data.workspaces); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // ✅ Teammates map — preserved exactly
  const teammatesMap = {}
  workspaces.forEach(ws => {
    ws.collaborators?.forEach(c => {
      const key = c.email
      if (!teammatesMap[key]) {
        teammatesMap[key] = {
          _id: c._id,
          name: c.name, email: c.email, avatar: c.avatar || null,
          joinedAt: c.joinedAt, role: c.role || 'Viewer', status: c.status || 'Online',
          workspaces: [], workspaceObjs: []
        }
      }
      teammatesMap[key].workspaces.push(ws.name)
      teammatesMap[key].workspaceObjs.push(ws)
    })
  })
  const teammates = Object.values(teammatesMap)

  // ✅ Activity feed — preserved exactly
  const activityFeed = []
  workspaces.forEach(ws => {
    ws.documents?.forEach(doc => {
      activityFeed.push({ type: 'document', user: doc.uploadedBy || 'Someone', action: `uploaded "${doc.fileName}"`, workspace: ws.name, time: doc.uploadedAt })
    })
  })
  activityFeed.sort((a, b) => new Date(b.time) - new Date(a.time))

  const totalDocs = workspaces.reduce((acc, ws) => acc + ws.documents.length, 0)

  // ✅ All helpers preserved exactly
  const timeAgo = (date) => {
    if (!date) return 'recently'
    const diff = new Date() - new Date(date)
    const days  = Math.floor(diff / 86400000)
    const hours = Math.floor(diff / 3600000)
    const mins  = Math.floor(diff / 60000)
    if (days  > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (mins  > 0) return `${mins}m ago`
    return 'Just now'
  }

  const getRole   = (t) => roleOverrides[t.email]   ?? t.role
  const getStatus = (t) => statusOverrides[t.email] ?? t.status

  const isOwnerOfTeammate = (t) => t.workspaceObjs.some(w => w.userId?.toString() === userId)

  const handleRoleChange   = (t, newRole)   => setRoleOverrides(prev => ({ ...prev, [t.email]: newRole }))
  const handleStatusChange = (t, newStatus) => setStatusOverrides(prev => ({ ...prev, [t.email]: newStatus }))

  // ✅ Save logic preserved exactly
  const saveRoleStatus = async (t) => {
    const role   = getRole(t)
    const status = getStatus(t)
    const ownedWs = t.workspaceObjs.find(w => w.userId?.toString() === userId)
    if (!ownedWs) { alert('You can only update roles in workspaces you own.'); return }
    const collab = ownedWs.collaborators?.find(c => c.email === t.email)
    if (!collab?._id) { alert('Could not find collaborator ID.'); return }

    setSaving(prev => ({ ...prev, [t.email]: true }))
    try {
      const data = await updateCollaboratorRoleAPI(ownedWs._id, collab._id, role, status)
      if (data.success) {
        setWorkspaces(prev => prev.map(w => {
          if (w._id !== ownedWs._id) return w
          return { ...w, collaborators: w.collaborators.map(c => c.email === t.email ? { ...c, role, status } : c) }
        }))
        setRoleOverrides(prev => { const n = { ...prev }; delete n[t.email]; return n })
        setStatusOverrides(prev => { const n = { ...prev }; delete n[t.email]; return n })
      } else { alert(data.error || 'Could not update role') }
    } catch { alert('Could not update role') }
    setSaving(prev => ({ ...prev, [t.email]: false }))
  }

  // ✅ Remove logic preserved exactly
  const handleRemoveTeammate = async (t) => {
    if (!window.confirm(`Remove ${t.name} from workspace?`)) return
    try {
      const ws = t.workspaceObjs.find(w => w.userId?.toString() === userId)
      if (!ws) return alert('You can only remove teammates from workspaces you own')
      const collabIndex = ws.collaborators.findIndex(c => c.email === t.email)
      if (collabIndex === -1) return
      const data = await removeCollaboratorAPI(ws._id, collabIndex)
      if (data.error) { alert(data.error); return }
      setWorkspaces(prev => prev.map(w => {
        if (w._id !== ws._id) return w
        return { ...w, collaborators: w.collaborators.filter((_, i) => i !== collabIndex) }
      }))
    } catch { alert('Could not remove teammate') }
  }

  const hasChanges = (t) =>
    (roleOverrides[t.email]   !== undefined && roleOverrides[t.email]   !== t.role) ||
    (statusOverrides[t.email] !== undefined && statusOverrides[t.email] !== t.status)

  // ── Display data ──
  const stats = [
    { label: 'Workspaces', value: workspaces.length, icon: (
      <Icon size={18}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></Icon>
    )},
    { label: 'Teammates', value: teammates.length, icon: (
      <Icon size={18}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>
    )},
    { label: 'Documents', value: totalDocs, icon: (
      <Icon size={18}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Icon>
    )},
    { label: 'Active Now', value: teammates.length > 0 ? teammates.length : '–', icon: (
      <Icon size={18}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Icon>
    )},
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div className="page-enter flex-1 overflow-y-auto px-5 pb-10 pt-16 md:px-10 md:pt-9">
        <div className="mx-auto max-w-[1400px]">

          {/* ── Header ── */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-4xl tracking-tight text-ink">Team</h1>
              <p className="mt-1.5 text-sm text-ink-2">
                Logged in as <span className="font-medium text-ink">{user?.name}</span>
              </p>
            </div>
            <button
              onClick={() => setActivePage('Workspace')}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-[13px] font-medium text-accent-on transition-colors hover:bg-accent-hover"
            >
              <Icon><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>
              Invite Teammate
            </button>
          </div>

          {/* ── Stats row ── */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, i) => (
              <div key={i} className={`${cardCls} p-5`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-accent">
                    {stat.icon}
                  </div>
                  <span className="rounded-full bg-sunken px-2 py-0.5 text-[10px] font-medium text-ink-2">Live</span>
                </div>
                <p className="font-display text-4xl leading-none tracking-tight text-ink tabular-nums">{stat.value}</p>
                <p className="mt-2 text-xs text-ink-2">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Main grid ── */}
          <div className="mb-4 grid gap-4 xl:grid-cols-[1fr_320px]">

            {/* Teammate management table */}
            <div className={`${cardCls} min-w-0 p-6`}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-medium text-ink">Teammate Management</h2>
                <span className="rounded-full border border-line bg-sunken px-2.5 py-1 text-[11px] font-medium text-ink-2">
                  {teammates.length} collaborator{teammates.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[720px]">
                  {/* Column headers */}
                  <div className={`${ROW_GRID} mb-2 border-b border-line px-2.5 pb-2.5`}>
                    {['', 'Name', 'Role', 'Status', 'Joined', 'Actions'].map((h, i) => (
                      <span key={i} className={sectionLabel}>{h}</span>
                    ))}
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center gap-2.5 py-12">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
                      <span className="text-[13px] text-ink-2">Loading teammates…</span>
                    </div>
                  ) : teammates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-bg text-ink-2">
                        <Icon size={24}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>
                      </div>
                      <div className="text-center">
                        <p className="mb-1 text-sm font-medium text-ink">No teammates yet</p>
                        <p className="max-w-[260px] text-xs leading-relaxed text-ink-2">
                          Create a workspace, share the code, and invite teammates to collaborate
                        </p>
                      </div>
                      <button
                        onClick={() => setActivePage('Workspace')}
                        className="rounded-md bg-accent px-5 py-2 text-xs font-medium text-accent-on transition-colors hover:bg-accent-hover"
                      >
                        Go to Workspace
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {teammates.map((t, i) => {
                        const role      = getRole(t)
                        const status    = getStatus(t)
                        const canManage = isOwnerOfTeammate(t)
                        const isSaving  = saving[t.email]
                        const changed   = hasChanges(t)

                        return (
                          <div
                            key={i}
                            className={`${ROW_GRID} rounded-md border p-2.5 transition-colors ${
                              changed
                                ? 'border-accent/30 bg-accent-soft/60'
                                : 'border-transparent hover:bg-bg'
                            }`}
                          >
                            {/* Avatar */}
                            {t.avatar ? (
                              <img src={t.avatar} alt={t.name} className="h-9 w-9 rounded-full border border-line object-cover" />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sunken text-[13px] font-medium text-ink-2">
                                {t.name?.[0]?.toUpperCase()}
                              </div>
                            )}

                            {/* Name + workspaces */}
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-ink">{t.name}</p>
                              <p className="mt-px truncate text-[11px] text-ink-2">{t.workspaces.join(', ')}</p>
                            </div>

                            {/* Role select */}
                            <select
                              value={role}
                              onChange={e => canManage && handleRoleChange(t, e.target.value)}
                              disabled={!canManage}
                              aria-label={`Role for ${t.name}`}
                              className={`${selectBase} border-line-strong bg-surface text-ink`}
                            >
                              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>

                            {/* Status select */}
                            <select
                              value={status}
                              onChange={e => canManage && handleStatusChange(t, e.target.value)}
                              disabled={!canManage}
                              aria-label={`Status for ${t.name}`}
                              className={`${selectBase} ${statusClasses(status)}`}
                            >
                              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>

                            {/* Joined */}
                            <p className="text-[11px] text-ink-2">{timeAgo(t.joinedAt)}</p>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              {canManage && changed && (
                                <button
                                  onClick={() => saveRoleStatus(t)}
                                  disabled={isSaving}
                                  title="Save changes"
                                  aria-label="Save changes"
                                  className="flex h-7 min-w-[28px] items-center justify-center rounded-md bg-accent px-2 text-xs font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60"
                                >
                                  {isSaving ? '…' : <Icon size={12}><polyline points="20 6 9 17 4 12"/></Icon>}
                                </button>
                              )}

                              <button
                                onClick={() => setActivePage('Workspace')}
                                title="View workspace"
                                aria-label="View workspace"
                                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
                              >
                                <Icon size={13}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Icon>
                              </button>

                              {canManage && (
                                <button
                                  onClick={() => handleRemoveTeammate(t)}
                                  title="Remove teammate"
                                  aria-label="Remove teammate"
                                  className="flex h-7 w-7 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-danger-soft hover:text-danger"
                                >
                                  <Icon size={13}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Icon>
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">

              {/* Project collaboration */}
              <div className={`${cardCls} p-5`}>
                <h3 className="mb-4 text-sm font-medium text-ink">Project Collaboration</h3>
                {workspaces.length === 0 ? (
                  <p className="py-4 text-center text-xs text-ink-2">No workspaces yet</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {workspaces.slice(0, 3).map((ws, i) => {
                      const progress = Math.min((ws.documents.length / 5) * 100, 100)
                      const shown    = Math.max(progress, ws.documents.length > 0 ? 20 : 5)
                      return (
                        <div key={i} className="rounded-md border border-line bg-bg p-3.5 transition-colors hover:border-line-strong">
                          <div className="mb-2.5 flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                              <Icon size={14}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></Icon>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-ink">{ws.name}</p>
                              <p className="mt-px text-[11px] text-ink-2">{ws.documents.length} documents</p>
                            </div>
                            <span className="text-[11px] font-medium text-accent tabular-nums">
                              {Math.max(Math.round(progress), ws.documents.length > 0 ? 20 : 5)}%
                            </span>
                          </div>
                          <div className="mb-2.5 h-1 w-full overflow-hidden rounded-full bg-sunken">
                            <div
                              className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                              style={{ width: `${shown}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex">
                              {ws.collaborators?.slice(0, 3).map((c, j) => (
                                <div
                                  key={j}
                                  className={`flex h-5 w-5 items-center justify-center rounded-full border border-bg bg-sunken text-[9px] font-medium text-ink-2 ${j > 0 ? '-ml-1.5' : ''}`}
                                >
                                  {c.name?.[0]?.toUpperCase()}
                                </div>
                              ))}
                            </div>
                            <p className="text-[11px] text-ink-2">{ws.collaborators?.length || 0} members</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Task distribution chart */}
              <div className={`${cardCls} p-5`}>
                <h3 className="mb-1 text-sm font-medium text-ink">Task Distribution</h3>
                <p className="mb-4 text-xs text-ink-2">Documents per workspace</p>

                {workspaces.length === 0 || totalDocs === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <span className="text-ink-3">
                      <Icon size={26}><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></Icon>
                    </span>
                    <p className="text-center text-xs text-ink-2">Upload documents to see distribution</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex h-20 items-end gap-1.5">
                      {workspaces.slice(0, 5).map((ws, i) => {
                        const maxDocs = Math.max(...workspaces.map(w => w.documents.length), 1)
                        const height  = Math.max((ws.documents.length / maxDocs) * 100, 8)
                        return (
                          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end">
                            <div
                              className="w-full rounded-t-sm bg-accent transition-[height] duration-500 ease-out"
                              style={{ height: `${height}%` }}
                            />
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex gap-1.5">
                      {workspaces.slice(0, 5).map((ws, i) => (
                        <p key={i} className="flex-1 truncate text-center text-[10px] text-ink-2">
                          {ws.name.slice(0, 5)}
                        </p>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Activity feed ── */}
          <div className={`${cardCls} p-6`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-medium text-ink">Live Activity Feed</h2>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  <span className="text-[11px] font-medium text-success">Live</span>
                </div>
                <span className="text-[11px] text-ink-2">{teammates.length} members • Real-time</span>
              </div>
            </div>

            {activityFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-9">
                <span className="text-ink-3"><Icon size={30}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Icon></span>
                <p className="text-[13px] text-ink-2">No activity yet</p>
                <p className="text-xs text-ink-3">Upload documents to workspaces to see activity</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {activityFeed.slice(0, 6).map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3.5 rounded-md border border-line bg-bg px-3.5 py-3 transition-colors hover:border-line-strong"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sunken text-[13px] font-medium text-ink-2">
                      {activity.user?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-ink">
                        <span className="font-medium">{activity.user}</span>{' '}
                        <span className="text-ink-2">{activity.action}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-2">
                        in <span className="text-accent">{activity.workspace}</span> • {timeAgo(activity.time)}
                      </p>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sunken text-ink-2">
                      <Icon size={14}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Icon>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}