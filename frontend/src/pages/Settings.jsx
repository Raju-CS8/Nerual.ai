import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { uploadAvatarAPI, updateNameAPI } from '../api'

const Icon = ({ size = 14, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const cardCls = 'rounded-lg border border-line bg-surface p-6'
const rowCls = 'flex items-center justify-between gap-3 rounded-md border border-line bg-bg px-4 py-3'
const rowLabel = 'text-[11px] font-medium uppercase tracking-wider text-ink-2'

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

  // Static account rows (display only)
  const infoRows = [
    { label: 'Email Address', value: user?.email },
    { label: 'Plan', value: isPro ? 'Pro Plan' : 'Free Plan', accent: isPro },
    {
      label: 'Tokens Used',
      value: user?.plan !== 'pro'
        ? `${(user?.tokensUsed || 0).toLocaleString()} / 100,000`
        : `${(user?.tokensUsed || 0).toLocaleString()} (Unlimited)`,
    },
    { label: 'Documents Processed', value: user?.documentsProcessed || 0 },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div className="page-enter flex-1 overflow-y-auto px-5 pb-12 pt-16 md:px-10 md:pt-9">
        <div className="mx-auto max-w-2xl">

          {/* ── Header ── */}
          <div className="mb-8">
            <h1 className="font-display text-4xl tracking-tight text-ink">Settings</h1>
            <p className="mt-1.5 text-sm text-ink-2">Manage your account and preferences</p>
          </div>

          {/* ✅ Success toast */}
          {success && (
            <div role="status" className="fade-in mb-5 flex items-center gap-2.5 rounded-lg border border-success/25 bg-success-soft px-4 py-3 text-success">
              <Icon size={16}><polyline points="20 6 9 17 4 12"/></Icon>
              <span className="text-[13px] font-medium">{success}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">

            {/* ── Profile card ── */}
            <div className={cardCls}>
              <h2 className="mb-6 flex items-center gap-2 text-[15px] font-medium text-ink">
                <span className="text-ink-2">
                  <Icon size={16}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>
                </span>
                Profile Settings
              </h2>

              {/* Avatar + info */}
              <div className="mb-6 flex items-center gap-6">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {preview ? (
                    <img src={preview} alt="avatar" className="h-20 w-20 rounded-full border border-line-strong object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-line-strong bg-accent-soft font-display text-3xl text-accent">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* Edit overlay */}
                  <label
                    className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-surface bg-accent text-accent-on transition-colors hover:bg-accent-hover"
                    title="Change profile picture"
                  >
                    <Icon size={12}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </Icon>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>

                {/* User info */}
                <div className="min-w-0">
                  <p className="truncate font-display text-2xl leading-tight tracking-tight text-ink">{user?.name}</p>
                  <p className="mt-1 truncate text-[13px] text-ink-2">{user?.email}</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    {isPro ? (
                      <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent">
                        Pro Plan
                      </span>
                    ) : (
                      <span className="rounded-full bg-sunken px-2.5 py-0.5 text-[11px] font-medium text-ink-2">
                        Free Plan
                      </span>
                    )}
                    {uploading && (
                      <span className="flex items-center gap-1.5 text-[11px] text-ink-2">
                        <span className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-line-strong border-t-accent" />
                        Uploading…
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Change avatar button */}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-surface px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-sunken">
                <Icon>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </Icon>
                Change Profile Picture
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
              <p className="mt-2 text-[11px] text-ink-2">Max 5MB • JPG, PNG, WEBP supported</p>
            </div>

            {/* ── Account info card ── */}
            <div className={cardCls}>
              <h2 className="mb-5 flex items-center gap-2 text-[15px] font-medium text-ink">
                <span className="text-ink-2">
                  <Icon size={16}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Icon>
                </span>
                Account Info
              </h2>

              <div className="flex flex-col gap-2">

                {/* ✅ Editable name row */}
                <div className={rowCls}>
                  <div className="min-w-0">
                    <p className={`${rowLabel} mb-1`}>Full Name</p>
                    {editingName ? (
                      <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                        className="w-52 max-w-full border-b border-accent bg-transparent pb-0.5 text-sm font-medium text-ink outline-none"
                        autoFocus
                      />
                    ) : (
                      <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
                    )}
                  </div>

                  {editingName ? (
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={handleNameSave}
                        disabled={savingName}
                        className="rounded-md bg-accent px-3.5 py-1.5 text-xs font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60"
                      >
                        {savingName ? '…' : 'Save'}
                      </button>
                      <button
                        onClick={() => { setEditingName(false); setNewName(user?.name) }}
                        className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingName(true)}
                      className="shrink-0 rounded-md border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {/* Static info rows */}
                {infoRows.map((row, i) => (
                  <div key={i} className={rowCls}>
                    <p className={rowLabel}>{row.label}</p>
                    <p className={`truncate text-[13px] font-medium ${row.accent ? 'text-accent' : 'text-ink'}`}>
                      {row.value}
                    </p>
                  </div>
                ))}

                <div className="my-2 h-px bg-line" />

                {/* Upgrade CTA for free users */}
                {!isPro && (
                  <button
                    onClick={() => setActivePage('Pricing')}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 text-[13px] font-medium text-accent-on transition-colors hover:bg-accent-hover"
                  >
                    <Icon><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>
                    Upgrade to Pro — ₹499/mo
                  </button>
                )}

                {/* Sign out */}
                <button
                  onClick={onLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-danger/25 bg-danger-soft px-4 py-2.5 text-[13px] font-medium text-danger transition-colors hover:border-danger/50"
                >
                  <Icon>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </Icon>
                  Sign Out
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}