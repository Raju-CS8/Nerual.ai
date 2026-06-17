import { useState, useEffect } from 'react'

export default function Sidebar({ activePage, setActivePage, user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    {
      name: 'Dashboard',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      )
    },
    {
      name: 'Chat',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )
    },
    {
      name: 'Files',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      )
    },
    {
      name: 'Workspace',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      )
    },
    {
      name: 'Team',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )
    },
    {
      name: 'Pricing',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      )
    },
    {
      name: 'Settings',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      )
    },
  ]

  // ✅ Escape key — logic preserved exactly
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setIsOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ✅ Navigate and close drawer — logic preserved exactly
  const handleNav = (name) => {
    setActivePage(name)
    setIsOpen(false)
  }

  const sidebarContent = (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', width: '240px',
      background: 'linear-gradient(180deg, #0d0d1f 0%, #08080f 100%)',
      borderRight: '1px solid rgba(255,255,255,0.055)',
      padding: '20px 12px',
    }}>

      {/* ── Logo ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Logo icon */}
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 18px rgba(124,58,237,0.45)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z"/>
            </svg>
          </div>
          {/* Wordmark */}
          <div style={{ lineHeight: 1 }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '15px', letterSpacing: '-0.02em' }}>NEURAL</span>
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, fontSize: '15px' }}>IQ</span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden"
          style={{
            width: '28px', height: '28px', borderRadius: '7px', cursor: 'pointer',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── User card ──────────────────────────────────────── */}
      <div style={{
        marginBottom: '20px', padding: '12px 14px',
        background: 'rgba(124,58,237,0.08)',
        border: '1px solid rgba(124,58,237,0.15)',
        borderRadius: '13px',
        display: 'flex', alignItems: 'center', gap: '11px',
      }}>
        {user?.avatar ? (
          <img src={user.avatar} alt="avatar" style={{
            width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
            border: '2px solid rgba(124,58,237,0.4)',
          }} />
        ) : (
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            border: '2px solid rgba(124,58,237,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '15px', color: 'white',
          }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <p style={{
            color: 'white', fontWeight: 600, fontSize: '13px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {user?.name || 'User'}
          </p>
          {user?.plan === 'pro' ? (
            <span style={{
              display: 'inline-block', marginTop: '3px',
              fontSize: '10px', fontWeight: 700, padding: '1px 8px', borderRadius: '999px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(6,182,212,0.4))',
              color: '#e9d5ff', border: '1px solid rgba(124,58,237,0.35)',
            }}>✦ PRO</span>
          ) : (
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>Free Plan</p>
          )}
        </div>
      </div>

      {/* ── Section label ─────────────────────────────────── */}
      <p style={{
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)',
        padding: '0 8px', marginBottom: '6px',
      }}>
        Menu
      </p>

      {/* ── Nav items ──────────────────────────────────────── */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {navItems.map((item) => {
          const active = activePage === item.name
          return (
            <button
              key={item.name}
              onClick={() => handleNav(item.name)}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px', textAlign: 'left',
                cursor: 'pointer', border: 'none', outline: 'none',
                width: '100%', fontFamily: 'Inter, sans-serif',
                background: active ? 'rgba(124,58,237,0.16)' : 'transparent',
                color: active ? '#c4b5fd' : 'rgba(255,255,255,0.42)',
                fontWeight: active ? 600 : 500, fontSize: '13.5px',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.78)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.42)'
                }
              }}
            >
              {/* Active indicator bar */}
              {active && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: '3px', height: '55%', borderRadius: '0 3px 3px 0',
                  background: 'linear-gradient(180deg, #7c3aed, #06b6d4)',
                }} />
              )}

              {/* Icon */}
              <span style={{ opacity: active ? 1 : 0.65, transition: 'opacity 0.15s', display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>

              {/* Label */}
              <span>{item.name}</span>

              {/* Active dot */}
              {active && (
                <div style={{
                  marginLeft: 'auto',
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: '#7c3aed', boxShadow: '0 0 7px #7c3aed',
                }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* ── Divider ───────────────────────────────────────── */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '14px 4px' }} />

      {/* ── Logout ────────────────────────────────────────── */}
      <button
        onClick={onLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '10px', width: '100%',
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.14)',
          color: 'rgba(248,113,113,0.75)', cursor: 'pointer',
          fontSize: '13.5px', fontWeight: 500, fontFamily: 'Inter, sans-serif',
          textAlign: 'left', outline: 'none', transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(239,68,68,0.13)'
          e.currentTarget.style.color = '#f87171'
          e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(239,68,68,0.07)'
          e.currentTarget.style.color = 'rgba(248,113,113,0.75)'
          e.currentTarget.style.borderColor = 'rgba(239,68,68,0.14)'
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>Sign Out</span>
      </button>
    </div>
  )

  return (
    <>
      {/* ── Hamburger (mobile only) ─────────────────────── */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden"
        style={{
          position: 'fixed', top: '16px', left: '16px', zIndex: 50,
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'rgba(124,58,237,0.22)', border: '1px solid rgba(124,58,237,0.35)',
          color: '#c4b5fd', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* ── Desktop sidebar (always visible) ──────────────── */}
      <div className="hidden md:flex flex-col h-screen flex-shrink-0">
        {sidebarContent}
      </div>

      {/* ── Mobile drawer ─────────────────────────────────── */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden"
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
            }}
          />
          {/* Drawer */}
          <div
            className="md:hidden slide-in-left"
            style={{
              position: 'fixed', left: 0, top: 0, height: '100%', zIndex: 50,
              boxShadow: '6px 0 40px rgba(124,58,237,0.22)',
            }}>
            {sidebarContent}
          </div>
        </>
      )}
    </>
  )
}