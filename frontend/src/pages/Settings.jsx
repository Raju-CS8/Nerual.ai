import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { uploadAvatarAPI, updateNameAPI } from '../api'

export default function Settings({ activePage, setActivePage, user, setUser, onLogout }) {
  // ✅ All state preserved exactly
  const [uploading,    setUploading]    = useState(false)
  const [success,      setSuccess]      = useState('')
  const [preview,      setPreview]      = useState(user?.avatar || null)
  const [editingName,  setEditingName]  = useState(false)
  const [newName,      setNewName]      = useState(user?.name || '')
  const [savingName,   setSavingName]   = useState(false)

  // ✅ All logic preserved exactly
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)
    setUploading(true)
    try {
      const data = await uploadAvatarAPI(file)
      if (data.success) {
        localStorage.setItem('neuraliq_user', JSON.stringify(data.user))
        if (setUser) setUser(data.user)
        setSuccess('Profile picture updated!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch { alert('Upload failed') }
    setUploading(false)
  }

  const handleNameSave = async () => {
    if (!newName.trim() || newName.trim() === user?.name) { setEditingName(false); return }
    setSavingName(true)
    try {
      const data = await updateNameAPI(newName.trim())
      if (data.success) {
        localStorage.setItem('neuraliq_user', JSON.stringify(data.user))
        if (setUser) setUser(data.user)
        setSuccess('Name updated!')
        setTimeout(() => setSuccess(''), 3000)
        setEditingName(false)
      } else { alert(data.error || 'Could not update name') }
    } catch { alert('Could not update name') }
    setSavingName(false)
  }

  const isPro = user?.plan === 'pro'

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
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '27px', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Settings
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.32)', marginTop: '7px', fontSize: '14px' }}>
            Manage your account and preferences
          </p>
        </div>

        {/* ✅ Success toast */}
        {success && (
          <div style={{
            marginBottom: '20px', padding: '13px 18px', borderRadius: '12px',
            background: 'rgba(16,185,129,0.09)', border: '1px solid rgba(16,185,129,0.22)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }} className="fade-in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{ color: '#6ee7b7', fontSize: '13px', fontWeight: 600 }}>{success}</span>
          </div>
        )}

        <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── Profile card ──────────────────────────────── */}
          <div style={{ ...card, padding: '28px' }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: '15px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Profile Settings
            </h2>

            {/* Avatar + info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {preview ? (
                  <img src={preview} alt="avatar" style={{
                    width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover',
                    border: '3px solid rgba(124,58,237,0.4)',
                    boxShadow: '0 0 20px rgba(124,58,237,0.2)',
                  }} />
                ) : (
                  <div style={{
                    width: '84px', height: '84px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    border: '3px solid rgba(124,58,237,0.4)',
                    boxShadow: '0 0 20px rgba(124,58,237,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', fontWeight: 800, color: 'white',
                  }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}

                {/* Edit overlay */}
                <label style={{
                  position: 'absolute', bottom: '2px', right: '2px',
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  border: '2px solid #08080f',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'transform 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                </label>
              </div>

              {/* User info */}
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>{user?.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '13px', marginTop: '4px' }}>{user?.email}</p>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isPro ? (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.25))', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.35)' }}>
                      ✦ Pro Plan
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      Free Plan
                    </span>
                  )}
                  {uploading && (
                    <span style={{ fontSize: '11px', color: '#67e8f9', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid rgba(6,182,212,0.3)', borderTop: '1.5px solid #06b6d4', animation: 'spin 0.7s linear infinite' }} />
                      Uploading…
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Change avatar button */}
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.28)',
              color: '#c4b5fd', cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: 'Inter, sans-serif',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.22)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.14)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.28)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Change Profile Picture
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </label>
            <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '11px', marginTop: '8px' }}>
              Max 5MB · JPG, PNG, WEBP supported
            </p>
          </div>

          {/* ── Account info card ─────────────────────────── */}
          <div style={{ ...card, padding: '28px' }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Account Info
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {/* ✅ Editable name row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 16px', borderRadius: '11px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
              >
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Full Name
                  </p>
                  {editingName ? (
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                      style={{
                        background: 'transparent', border: 'none', borderBottom: '1px solid rgba(124,58,237,0.5)',
                        color: 'white', fontSize: '14px', fontWeight: 500, outline: 'none',
                        fontFamily: 'Inter, sans-serif', paddingBottom: '2px', width: '200px',
                      }}
                      autoFocus
                    />
                  ) : (
                    <p style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>{user?.name}</p>
                  )}
                </div>

                {editingName ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={handleNameSave} disabled={savingName}
                      style={{ padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'opacity 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      {savingName ? '…' : 'Save'}
                    </button>
                    <button onClick={() => { setEditingName(false); setNewName(user?.name) }}
                      style={{ padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingName(true)}
                    style={{ padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, color: '#c4b5fd', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.12)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.22)' }}
                  >
                    Edit
                  </button>
                )}
              </div>

              {/* Static info rows */}
              {[
                { label: 'Email Address', value: user?.email },
                { label: 'Plan', value: isPro ? '✦ Pro Plan' : 'Free Plan', color: isPro ? '#c4b5fd' : 'rgba(255,255,255,0.55)' },
                {
                  label: 'Tokens Used',
                  value: user?.plan !== 'pro'
                    ? `${(user?.tokensUsed || 0).toLocaleString()} / 100,000`
                    : `${(user?.tokensUsed || 0).toLocaleString()} (Unlimited)`,
                },
                { label: 'Documents Processed', value: user?.documentsProcessed || 0 },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 16px', borderRadius: '11px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
                >
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {row.label}
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: row.color || 'white' }}>
                    {row.value}
                  </p>
                </div>
              ))}

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />

              {/* Upgrade CTA for free users */}
              {!isPro && (
                <button
                  onClick={() => setActivePage('Pricing')}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '11px', fontSize: '13px', fontWeight: 700,
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white',
                    border: 'none', cursor: 'pointer', boxShadow: '0 2px 16px rgba(124,58,237,0.32)',
                    transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1';   e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  Upgrade to Pro — ₹499/mo
                </button>
              )}

              {/* Sign out */}
              <button
                onClick={onLogout}
                style={{
                  width: '100%', padding: '11px', borderRadius: '11px', fontSize: '13px', fontWeight: 600,
                  background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.16)',
                  color: 'rgba(248,113,113,0.75)', cursor: 'pointer',
                  transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.28)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.color = 'rgba(248,113,113,0.75)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.16)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}