import { useState, useEffect } from 'react'

export default function Sidebar({ activePage, setActivePage, user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { name: 'Dashboard', icon: '⊞' },
    { name: 'Chat',      icon: '💬' },
    { name: 'Files',     icon: '📄' },
    { name: 'Workspace', icon: '🗂️' },
    { name: 'Team',      icon: '👥' },
    { name: 'Pricing',   icon: '💎' },
    { name: 'Settings',  icon: '⚙️' },
  ]

  // ✅ Escape key — no setState in body, handler is outside
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setIsOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ✅ Navigate and close drawer in one handler — no useEffect needed
  const handleNav = (name) => {
    setActivePage(name)
    setIsOpen(false)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full w-64 py-6 px-4"
      style={{ background: 'rgba(0,0,0,0.4)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Logo + close button on mobile */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-white font-bold text-lg">NEURALIQ.</span>
        </div>
        <button onClick={() => setIsOpen(false)}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          ✕
        </button>
      </div>

      {/* User Avatar */}
      <div className="flex flex-col items-center mb-8 px-2">
        {user?.avatar ? (
          <img src={user.avatar} alt="avatar"
            className="w-14 h-14 rounded-full object-cover mb-2"
            style={{ border: '2px solid rgba(124,58,237,0.4)' }} />
        ) : (
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-2"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: '2px solid rgba(124,58,237,0.4)' }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <p className="text-white text-sm font-medium">{user?.name || 'User'}</p>
        <p className="text-gray-500 text-xs">
          {user?.plan === 'pro' ? '⭐ Pro' : 'Free Plan'}
        </p>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <button key={item.name}
            onClick={() => handleNav(item.name)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
            style={{
              background: activePage === item.name ? 'rgba(124,58,237,0.3)' : 'transparent',
              color: activePage === item.name ? '#a78bfa' : 'rgba(255,255,255,0.5)',
              border: activePage === item.name ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
            }}>
            <span>{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <button onClick={onLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:opacity-80 mt-4"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.8)' }}>
        <span>🚪</span>
        <span className="font-medium text-sm">Logout</span>
      </button>
    </div>
  )

  return (
    <>
      {/* Hamburger — mobile only */}
      <button onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
        style={{ background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa' }}>
        <span className="text-lg">☰</span>
      </button>

      {/* Desktop sidebar — always visible */}
      <div className="hidden md:flex flex-col h-screen flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setIsOpen(false)} />
          <div className="md:hidden fixed left-0 top-0 h-full z-50 flex flex-col"
            style={{
              width: '256px',
              background: 'rgba(5,8,22,0.98)',
              borderRight: '1px solid rgba(124,58,237,0.3)',
              boxShadow: '4px 0 32px rgba(124,58,237,0.2)',
              animation: 'slideInLeft 0.2s ease-out'
            }}>
            {sidebarContent}
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}