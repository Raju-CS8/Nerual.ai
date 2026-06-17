import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { getWorkspacesAPI, removeCollaboratorAPI, updateCollaboratorRoleAPI } from '../api'

// ✅ Constants preserved exactly
const ROLES    = ['Admin', 'Developer', 'Designer', 'Analyst', 'Manager', 'Viewer']
const STATUSES = ['Online', 'Offline', 'Busy']

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

  const getStatusColor = (status) => {
    if (status === 'Online') return '#10b981'
    if (status === 'Busy')   return '#f59e0b'
    return '#6b7280'
  }

  const getStatusBg = (status) => {
    if (status === 'Online') return 'rgba(16,185,129,0.12)'
    if (status === 'Busy')   return 'rgba(245,158,11,0.12)'
    return 'rgba(107,114,128,0.12)'
  }

  const avatarColors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

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

  // ── Shared card style ──────────────────────────────────────
  const card = {
    background: 'linear-gradient(160deg, #16162a 0%, #0f0f1a 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 60% at 20% -5%, rgba(124,58,237,0.1) 0%, #08080f 65%)',
    }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }} className="page-enter">

        {/* ── Header ──────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '27px', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Team
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.32)', marginTop: '7px', fontSize: '14px' }}>
              Logged in as&nbsp;
              <span style={{ color: 'rgba(196,181,253,0.85)', fontWeight: 500 }}>{user?.name}</span>
            </p>
          </div>
          <button
            onClick={() => setActivePage('Workspace')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: 'white',
              border: 'none', cursor: 'pointer', boxShadow: '0 2px 16px rgba(124,58,237,0.32)',
              transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1';   e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Invite Teammate
          </button>
        </div>

        {/* ── Stats row ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Workspaces', value: workspaces.length, icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            ), color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
            { label: 'Teammates', value: teammates.length, icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            ), color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
            { label: 'Documents', value: totalDocs, icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            ), color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
            { label: 'Active Now', value: teammates.length > 0 ? teammates.length : '–', icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fcd34d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            ), color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
          ].map((stat, i) => (
            <div key={i} style={{ ...card, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stat.icon}
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', background: `${stat.bg}`, color: stat.color, border: `1px solid ${stat.color}33` }}>
                  Live
                </span>
              </div>
              <p style={{ fontSize: '32px', fontWeight: 800, color: 'white', letterSpacing: '-0.04em', lineHeight: 1 }}>{stat.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '12px', marginTop: '5px' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Main grid ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', marginBottom: '16px' }}>

          {/* Teammate management table */}
          <div style={{ ...card, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>Teammate Management</h2>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 11px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {teammates.length} collaborator{teammates.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 120px 120px 70px 100px', gap: '12px', padding: '0 10px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
              {['', 'Name', 'Role', 'Status', 'Joined', 'Actions'].map((h, i) => (
                <span key={i} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>{h}</span>
              ))}
            </div>

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '10px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid rgba(124,58,237,0.2)', borderTop: '2px solid #7c3aed', animation: 'spin 0.7s linear infinite' }} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Loading teammates…</span>
              </div>
            ) : teammates.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '12px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 600, marginBottom: '5px' }}>No teammates yet</p>
                  <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '12px', maxWidth: '260px', lineHeight: '1.6' }}>
                    Create a workspace, share the code, and invite teammates to collaborate
                  </p>
                </div>
                <button onClick={() => setActivePage('Workspace')}
                  style={{ padding: '9px 20px', borderRadius: '9px', fontSize: '12px', fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 10px rgba(124,58,237,0.3)', fontFamily: 'Inter, sans-serif' }}>
                  Go to Workspace
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {teammates.map((t, i) => {
                  const role      = getRole(t)
                  const status    = getStatus(t)
                  const canManage = isOwnerOfTeammate(t)
                  const isSaving  = saving[t.email]
                  const changed   = hasChanges(t)

                  return (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '36px 1fr 120px 120px 70px 100px',
                      gap: '12px', alignItems: 'center', padding: '10px',
                      borderRadius: '10px', transition: 'all 0.15s',
                      border: changed ? '1px solid rgba(124,58,237,0.28)' : '1px solid rgba(255,255,255,0.04)',
                      background: changed ? 'rgba(124,58,237,0.05)' : 'transparent',
                    }}
                      onMouseEnter={e => { if (!changed) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { if (!changed) e.currentTarget.style.background = 'transparent' }}
                    >
                      {/* Avatar */}
                      {t.avatar ? (
                        <img src={t.avatar} alt={t.name} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${avatarColors[i % avatarColors.length]}55` }} />
                      ) : (
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(135deg, ${avatarColors[i % avatarColors.length]}, ${avatarColors[(i + 1) % avatarColors.length]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'white' }}>
                          {t.name?.[0]?.toUpperCase()}
                        </div>
                      )}

                      {/* Name + workspaces */}
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: 'white', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.workspaces.join(', ')}</p>
                      </div>

                      {/* Role select */}
                      <select
                        value={role}
                        onChange={e => canManage && handleRoleChange(t, e.target.value)}
                        disabled={!canManage}
                        style={{
                          fontSize: '11px', fontWeight: 600, padding: '5px 8px', borderRadius: '7px', outline: 'none',
                          background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.26)',
                          color: '#c4b5fd', cursor: canManage ? 'pointer' : 'not-allowed',
                          opacity: canManage ? 1 : 0.5, fontFamily: 'Inter, sans-serif', width: '100%',
                        }}>
                        {ROLES.map(r => <option key={r} value={r} style={{ background: '#0f0f1a' }}>{r}</option>)}
                      </select>

                      {/* Status select */}
                      <select
                        value={status}
                        onChange={e => canManage && handleStatusChange(t, e.target.value)}
                        disabled={!canManage}
                        style={{
                          fontSize: '11px', fontWeight: 600, padding: '5px 8px', borderRadius: '7px', outline: 'none',
                          background: getStatusBg(status), border: `1px solid ${getStatusColor(status)}44`,
                          color: getStatusColor(status), cursor: canManage ? 'pointer' : 'not-allowed',
                          opacity: canManage ? 1 : 0.5, fontFamily: 'Inter, sans-serif', width: '100%',
                        }}>
                        {STATUSES.map(s => <option key={s} value={s} style={{ background: '#0f0f1a' }}>{s}</option>)}
                      </select>

                      {/* Joined */}
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{timeAgo(t.joinedAt)}</p>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {canManage && changed && (
                          <button
                            onClick={() => saveRoleStatus(t)}
                            disabled={isSaving}
                            style={{ padding: '5px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: 'rgba(124,58,237,0.22)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.35)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.35)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.22)'}
                            title="Save changes"
                          >
                            {isSaving ? '…' : (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => setActivePage('Workspace')}
                          title="View workspace"
                          style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(6,182,212,0.1)', border: 'none', cursor: 'pointer', color: '#67e8f9', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(6,182,212,0.1)'}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>

                        {canManage && (
                          <button
                            onClick={() => handleRemoveTeammate(t)}
                            title="Remove teammate"
                            style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Project collaboration */}
            <div style={{ ...card, padding: '20px' }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>Project Collaboration</h3>
              {workspaces.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', textAlign: 'center', padding: '16px 0' }}>No workspaces yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {workspaces.slice(0, 3).map((ws, i) => {
                    const progress = Math.min((ws.documents.length / 5) * 100, 100)
                    const colors   = ['#7c3aed', '#06b6d4', '#10b981']
                    const color    = colors[i % 3]
                    return (
                      <div key={i} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: 'white', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ws.name}</p>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginTop: '1px' }}>{ws.documents.length} documents</p>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color }}>{Math.max(Math.round(progress), ws.documents.length > 0 ? 20 : 5)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
                          <div style={{ height: '100%', borderRadius: '999px', width: `${Math.max(progress, ws.documents.length > 0 ? 20 : 5)}%`, background: `linear-gradient(90deg, ${color}, ${colors[(i + 1) % 3]})`, transition: 'width 0.6s ease' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex' }}>
                            {ws.collaborators?.slice(0, 3).map((c, j) => (
                              <div key={j} style={{ width: '20px', height: '20px', borderRadius: '50%', background: `linear-gradient(135deg, ${avatarColors[j % 5]}, ${avatarColors[(j + 1) % 5]})`, border: '1.5px solid rgba(255,255,255,0.15)', marginLeft: j > 0 ? '-5px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: 'white' }}>
                                {c.name?.[0]?.toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '10px' }}>{ws.collaborators?.length || 0} members</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Task distribution chart */}
            <div style={{ ...card, padding: '20px' }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Task Distribution</h3>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', marginBottom: '16px' }}>Documents per workspace</p>

              {workspaces.length === 0 || totalDocs === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: '8px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', textAlign: 'center' }}>Upload documents to see distribution</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px', marginBottom: '8px' }}>
                    {workspaces.slice(0, 5).map((ws, i) => {
                      const maxDocs = Math.max(...workspaces.map(w => w.documents.length), 1)
                      const height  = Math.max((ws.documents.length / maxDocs) * 100, 8)
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                          <div style={{ width: '100%', borderRadius: '4px 4px 2px 2px', height: `${height}%`, background: `linear-gradient(180deg, ${avatarColors[i % 5]}, ${avatarColors[i % 5]}66)`, transition: 'height 0.5s ease' }} />
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {workspaces.slice(0, 5).map((ws, i) => (
                      <p key={i} style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,0.28)', fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ws.name.slice(0, 5)}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Activity feed ─────────────────────────────────── */}
        <div style={{ ...card, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>Live Activity Feed</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'pulseGlow 2s ease-in-out infinite' }} />
                <span style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 600 }}>Live</span>
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>
                {teammates.length} members · Real-time
              </span>
            </div>
          </div>

          {activityFeed.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 0', gap: '10px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>No activity yet</p>
              <p style={{ color: 'rgba(255,255,255,0.16)', fontSize: '12px' }}>Upload documents to workspaces to see activity</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activityFeed.slice(0, 6).map((activity, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 14px', borderRadius: '11px', transition: 'all 0.15s',
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.045)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${avatarColors[i % 5]}, ${avatarColors[(i + 1) % 5]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'white' }}>
                    {activity.user?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                      <span style={{ fontWeight: 600, color: '#c4b5fd' }}>{activity.user}</span>
                      {' '}{activity.action}
                    </p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', marginTop: '2px' }}>
                      in <span style={{ color: '#67e8f9' }}>{activity.workspace}</span> · {timeAgo(activity.time)}
                    </p>
                  </div>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}