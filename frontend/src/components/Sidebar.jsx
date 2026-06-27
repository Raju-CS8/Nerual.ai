import { useState, useEffect } from 'react'

export default function Sidebar({ activePage, setActivePage, user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)

  const GOLD     = '#C5A059'
  const GOLD_DIM = '#8B6914'
  const BG_BASE  = '#0B1510'

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
      display: 'flex', flexDirection: 'column', height: '100%', width: '220px',
      background: `linear-gradient(180deg, #0a1410 0%, ${BG_BASE} 100%)`,
      borderRight: `1px solid ${GOLD}33`,
      padding: '20px 12px',
      boxShadow: `4px 0 24px rgba(0,0,0,0.5)`,
    }}>

      {/* ── Logo — "N" box + NEURALIQ. ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
            background: `linear-gradient(135deg, #3a2800, #6a4800)`,
            border: `1px solid ${GOLD}77`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '16px', color: GOLD,
            boxShadow: `0 0 12px ${GOLD}44`,
            fontFamily: "'Playfair Display', serif",
          }}>
            N
          </div>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            color: GOLD, fontWeight: 700, fontSize: '15px', letterSpacing: '0.02em',
            textShadow: `0 0 12px ${GOLD}55`,
          }}>
            NEURALIQ.
          </span>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden"
          style={{
            width: '28px', height: '28px', borderRadius: '7px', cursor: 'pointer',
            background: 'rgba(197,160,89,0.08)', border: `1px solid ${GOLD}33`,
            color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── User block ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginBottom: '20px', padding: '14px 10px',
        background: 'rgba(197,160,89,0.06)',
        border: `1px solid ${GOLD}22`,
        borderRadius: '12px', gap: '8px',
      }}>
        {user?.avatar ? (
          <img src={user.avatar} alt="avatar" style={{
            width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover',
            border: `2px solid ${GOLD}66`,
            boxShadow: `0 0 14px ${GOLD}44`,
          }} />
        ) : (
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: `linear-gradient(135deg, #3a2800, #6a4800)`,
            border: `2px solid ${GOLD}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '20px', color: GOLD, flexShrink: 0,
            boxShadow: `0 0 14px ${GOLD}33`,
          }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div style={{ textAlign: 'center', minWidth: 0, width: '100%' }}>
          <p style={{
            color: GOLD, fontWeight: 600, fontSize: '13px', margin: '0 0 2px',
            fontFamily: "'Playfair Display', serif",
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {user?.name || 'User'}
          </p>
          <p style={{
            color: `${GOLD}55`, fontSize: '10px', margin: '0 0 3px',
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {user?.email}
          </p>
          <span style={{
            fontSize: '10px', color: `${GOLD}44`,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {user?.plan === 'pro' ? '✦ Pro Plan' : 'Free Plan'}
          </span>
        </div>
      </div>

      {/* ── Divider with gold line ── */}
      <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${GOLD}33, transparent)`, marginBottom: '10px' }}/>

      {/* ── Nav items ── */}
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
                padding: '10px 12px', borderRadius: '9px', textAlign: 'left',
                cursor: 'pointer', border: active ? `1px solid ${GOLD}44` : '1px solid transparent',
                outline: 'none', width: '100%',
                fontFamily: "'JetBrains Mono', monospace",
                background: active ? 'rgba(197,160,89,0.12)' : 'transparent',
                color: active ? GOLD : `${GOLD}55`,
                fontWeight: active ? 600 : 400, fontSize: '13px',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: active ? `inset 0 1px 0 rgba(197,160,89,0.1), 0 2px 8px rgba(0,0,0,0.3)` : 'none',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(197,160,89,0.07)'
                  e.currentTarget.style.color = `${GOLD}99`
                  e.currentTarget.style.borderColor = `${GOLD}22`
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = `${GOLD}55`
                  e.currentTarget.style.borderColor = 'transparent'
                }
              }}
            >
              {/* Active gold bar */}
              {active && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: '3px', height: '55%', borderRadius: '0 2px 2px 0',
                  background: `linear-gradient(180deg, ${GOLD}, #8B6914)`,
                  boxShadow: `0 0 8px ${GOLD}88`,
                }}/>
              )}
              <span style={{ opacity: active ? 1 : 0.55, display: 'flex', alignItems: 'center', transition: 'opacity 0.3s' }}>
                {item.icon}
              </span>
              <span>{item.name}</span>
              {active && (
                <div style={{
                  marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%',
                  background: GOLD, boxShadow: `0 0 8px ${GOLD}`,
                }}/>
              )}
            </button>
          )
        })}
      </nav>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${GOLD}22, transparent)`, margin: '12px 4px' }}/>

      {/* ── Logout ── */}
      <button
        onClick={onLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '11px 12px', borderRadius: '9px', width: '100%',
          background: 'rgba(120,30,30,0.4)', border: '1px solid rgba(239,68,68,0.25)',
          color: '#f87171', cursor: 'pointer',
          fontSize: '13px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
          textAlign: 'left', outline: 'none',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(160,40,40,0.55)'
          e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.06)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(120,30,30,0.4)'
          e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
          e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.04)'
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>Logout</span>
      </button>
    </div>
  )

  return (
    <>
      {/* ── Hamburger (mobile only) ── */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden"
        style={{
          position: 'fixed', top: '16px', left: '16px', zIndex: 50,
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'rgba(197,160,89,0.15)', border: `1px solid ${GOLD}55`,
          color: GOLD, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 2px 12px rgba(197,160,89,0.2)`,
        }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* ── Desktop sidebar (always visible) ── */}
      <div className="hidden md:flex flex-col h-screen flex-shrink-0">
        {sidebarContent}
      </div>

      {/* ── Mobile drawer ── */}
      {isOpen && (
        <>
          <div
            className="md:hidden"
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
            }}
          />
          <div
            className="md:hidden slide-in-left"
            style={{
              position: 'fixed', left: 0, top: 0, height: '100%', zIndex: 50,
              boxShadow: `6px 0 40px rgba(197,160,89,0.15)`,
            }}>
            {sidebarContent}
          </div>
        </>
      )}
    </>
  )
}