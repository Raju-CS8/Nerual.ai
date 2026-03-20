import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { getWorkspacesAPI, removeCollaboratorAPI } from '../api'

const ROLES = ['Admin', 'Developer', 'Designer', 'Analyst', 'Manager']
const STATUSES = ['Online', 'Offline', 'Busy']

export default function Team({ activePage, setActivePage, user, onLogout }) {
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState({})
  const [selectedStatus, setSelectedStatus] = useState({})

  useEffect(() => {
    getWorkspacesAPI()
      .then(data => {
        if (data.success) setWorkspaces(data.workspaces)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const teammatesMap = {}
  workspaces.forEach(ws => {
    ws.collaborators?.forEach(c => {
      if (!teammatesMap[c.email]) {
        teammatesMap[c.email] = {
          name: c.name,
          email: c.email,
          avatar: c.avatar || null,
          joinedAt: c.joinedAt,
          workspaces: [],
          workspaceObjs: []
        }
      }
      teammatesMap[c.email].workspaces.push(ws.name)
      teammatesMap[c.email].workspaceObjs.push(ws)
    })
  })
  const teammates = Object.values(teammatesMap)

  const activityFeed = []
  workspaces.forEach(ws => {
    ws.documents?.forEach(doc => {
      activityFeed.push({
        type: 'document',
        user: doc.uploadedBy || 'Someone',
        action: `uploaded "${doc.fileName}"`,
        workspace: ws.name,
        time: doc.uploadedAt
      })
    })
  })
  activityFeed.sort((a, b) => new Date(b.time) - new Date(a.time))

  const totalDocs = workspaces.reduce((acc, ws) => acc + ws.documents.length, 0)

  const timeAgo = (date) => {
    if (!date) return 'recently'
    const diff = new Date() - new Date(date)
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor(diff / 3600000)
    const mins = Math.floor(diff / 60000)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (mins > 0) return `${mins}m ago`
    return 'Just now'
  }

  const getStatusColor = (status) => {
    if (status === 'Online') return '#10b981'
    if (status === 'Busy') return '#f59e0b'
    return '#6b7280'
  }

  const avatarColors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

  const handleRemoveTeammate = async (t) => {
    if (!window.confirm(`Remove ${t.name} from workspace?`)) return
    try {
      const ws = t.workspaceObjs.find(w => w.userId?.toString() === user?.id)
      if (!ws) return alert('You can only remove teammates from workspaces you own')
      const collabIndex = ws.collaborators.findIndex(c => c.email === t.email)
      if (collabIndex === -1) return
      await removeCollaboratorAPI(ws._id, collabIndex)
      setWorkspaces(prev => prev.map(w => {
        if (w._id === ws._id) {
          return { ...w, collaborators: w.collaborators.filter((_, i) => i !== collabIndex) }
        }
        return w
      }))
    } catch {
      alert('Could not remove teammate')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1a0533 0%, #050816 60%)' }}>

      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div className="flex-1 overflow-y-auto p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">
              <span className="font-bold">NEURALIQ.</span>
              <span className="font-light"> AI Team Collaboration</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Logged in as <span className="text-purple-400 font-medium">{user?.name}</span>
            </p>
          </div>
          <button
            onClick={() => setActivePage('Workspace')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}>
            + Invite New Teammate
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Workspaces', value: workspaces.length, icon: '📁', color: '#7c3aed' },
            { label: 'Teammates', value: teammates.length, icon: '👥', color: '#06b6d4' },
            { label: 'Documents', value: totalDocs, icon: '📄', color: '#10b981' },
            { label: 'Active Now', value: teammates.length > 0 ? teammates.length : '–', icon: '🟢', color: '#f59e0b' }
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl p-5 transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ background: `${stat.color}22`, color: stat.color, border: `1px solid ${stat.color}44` }}>
                  Live
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">

          {/* Teammate Management List */}
          <div className="col-span-2 rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Teammate Management List</h2>
              <span className="text-xs text-gray-500 px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                {teammates.length} collaborators
              </span>
            </div>

            <div className="grid gap-3 mb-3 px-3 text-xs text-gray-600 uppercase tracking-widest"
              style={{ gridTemplateColumns: '40px 1fr 100px 100px 80px 80px' }}>
              <span>Avatar</span>
              <span>Name</span>
              <span>Role</span>
              <span>Status</span>
              <span>Joined</span>
              <span>Actions</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
              </div>
            ) : teammates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="text-5xl">👥</span>
                <p className="text-gray-500 text-sm">No teammates yet</p>
                <p className="text-gray-600 text-xs text-center max-w-xs">
                  Create a workspace, share the code, and invite teammates to collaborate!
                </p>
                <button onClick={() => setActivePage('Workspace')}
                  className="px-5 py-2 rounded-xl text-sm text-white transition-all hover:opacity-80 mt-1"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                  Go to Workspace
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {teammates.map((t, i) => {
                  const role = selectedRole[t.email] || ROLES[i % ROLES.length]
                  const status = selectedStatus[t.email] || 'Online'
                  return (
                    <div key={i}
                      className="grid gap-3 items-center px-3 py-3 rounded-xl transition-all hover:bg-white/5"
                      style={{ gridTemplateColumns: '40px 1fr 100px 100px 80px 80px', border: '1px solid rgba(255,255,255,0.04)' }}>

                      {/* Avatar */}
                      {t.avatar ? (
                        <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover"
                          style={{ border: `2px solid ${avatarColors[i % avatarColors.length]}` }} />
                      ) : (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ background: `linear-gradient(135deg, ${avatarColors[i % avatarColors.length]}, ${avatarColors[(i+1) % avatarColors.length]})` }}>
                          {t.name?.[0]?.toUpperCase()}
                        </div>
                      )}

                      {/* Name + Email */}
                      <div>
                        <p className="text-white text-sm font-medium">{t.name}</p>
                        <p className="text-gray-600 text-xs truncate">{t.email}</p>
                      </div>

                      {/* Role */}
                      <select value={role}
                        onChange={(e) => setSelectedRole(prev => ({ ...prev, [t.email]: e.target.value }))}
                        className="text-xs rounded-lg px-2 py-1 outline-none cursor-pointer"
                        style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
                        {ROLES.map(r => <option key={r} value={r} style={{ background: '#0f0a1e' }}>{r}</option>)}
                      </select>

                      {/* Status */}
                      <select value={status}
                        onChange={(e) => setSelectedStatus(prev => ({ ...prev, [t.email]: e.target.value }))}
                        className="text-xs rounded-lg px-2 py-1 outline-none cursor-pointer"
                        style={{ background: `${getStatusColor(status)}22`, border: `1px solid ${getStatusColor(status)}44`, color: getStatusColor(status) }}>
                        {STATUSES.map(s => <option key={s} value={s} style={{ background: '#0f0a1e' }}>{s}</option>)}
                      </select>

                      {/* Joined */}
                      <p className="text-gray-500 text-xs">{timeAgo(t.joinedAt)}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:bg-white/10"
                          title="View workspace" onClick={() => setActivePage('Workspace')}
                          style={{ color: '#06b6d4' }}>
                          👁️
                        </button>
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:bg-red-400/10"
                          title="Remove teammate"
                          style={{ color: '#ef4444' }}
                          onClick={() => handleRemoveTeammate(t)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4">

            {/* Project Collaboration */}
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-white font-semibold mb-4">Project Collaboration</h3>
              {workspaces.length === 0 ? (
                <p className="text-gray-600 text-xs text-center py-4">No workspaces yet</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {workspaces.slice(0, 3).map((ws, i) => {
                    const progress = Math.min((ws.documents.length / 5) * 100, 100)
                    const colors = ['#7c3aed', '#06b6d4', '#10b981']
                    return (
                      <div key={i} className="rounded-xl p-3"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                            style={{ background: `${colors[i % 3]}33` }}>📁</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{ws.name}</p>
                            <p className="text-gray-600 text-xs">{ws.documents.length} documents</p>
                          </div>
                          <span className="text-xs font-bold" style={{ color: colors[i % 3] }}>
                            {Math.max(Math.round(progress), ws.documents.length > 0 ? 20 : 5)}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div className="h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.max(progress, ws.documents.length > 0 ? 20 : 5)}%`,
                              background: `linear-gradient(90deg, ${colors[i % 3]}, ${colors[(i+1) % 3]})`
                            }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-1">
                            {ws.collaborators?.slice(0, 3).map((c, j) => (
                              <div key={j} className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ background: `linear-gradient(135deg, ${avatarColors[j % 5]}, ${avatarColors[(j+1) % 5]})`, border: '1px solid rgba(255,255,255,0.2)' }}>
                                {c.name?.[0]?.toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <p className="text-gray-600 text-xs">Active Tasks</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Task Distribution Chart */}
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-white font-semibold mb-1">Task Distribution Chart</h3>
              <p className="text-gray-600 text-xs mb-4">Tasks per teammate</p>
              {workspaces.length === 0 ? (
                <p className="text-gray-600 text-xs text-center py-4">No data yet</p>
              ) : (
                <>
                  <div className="flex items-end gap-2 h-24 mb-1">
                    <div className="flex flex-col justify-between h-full text-right pr-1">
                      {['35%','25%','10%','0%'].map(l => (
                        <span key={l} className="text-gray-700" style={{ fontSize: '9px' }}>{l}</span>
                      ))}
                    </div>
                    {workspaces.slice(0, 5).map((ws, i) => {
                      const maxDocs = Math.max(...workspaces.map(w => w.documents.length), 1)
                      const height = Math.max((ws.documents.length / maxDocs) * 100, 8)
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t-md transition-all"
                            style={{ height: `${height}%`, background: `linear-gradient(180deg, ${avatarColors[i % 5]}, ${avatarColors[i % 5]}88)` }} />
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex gap-2 pl-6">
                    {workspaces.slice(0, 5).map((ws, i) => (
                      <p key={i} className="flex-1 text-center text-gray-600 truncate" style={{ fontSize: '9px' }}>
                        {ws.name.slice(0, 4)}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">Live Activity Feed</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Live</span>
              <span className="text-gray-600 text-xs ml-2">👥 {teammates.length} members</span>
              <span className="text-gray-600 text-xs">🕐 Real-time</span>
            </div>
          </div>

          {activityFeed.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <div className="text-center">
                <p className="text-gray-600 text-sm">No activity yet</p>
                <p className="text-gray-700 text-xs mt-1">Upload documents to workspaces to see activity!</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activityFeed.slice(0, 6).map((activity, i) => (
                <div key={i}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-white/5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${avatarColors[i % 5]}, ${avatarColors[(i+1) % 5]})` }}>
                    {activity.user?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="font-medium" style={{ color: '#a78bfa' }}>{activity.user}</span>
                      {' '}{activity.action}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      in <span className="text-cyan-400">{activity.workspace}</span> · {timeAgo(activity.time)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-lg">{activity.type === 'document' ? '📄' : '💬'}</span>
                    <button className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/10 transition-all">⋯</button>
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