export default function Sidebar({ activePage, setActivePage, user, onLogout }) {
  const navItems = [
    { name: 'Dashboard', icon: '⊞' },
    { name: 'Chat',      icon: '💬' },
    { name: 'Files',     icon: '📄' },
    { name: 'Workspace', icon: '🗂️' },
    { name: 'Team',      icon: '👥' },
    { name: 'Pricing',   icon: '💎' },
    { name: 'Settings',  icon: '⚙️' },
  ]

  return (
    <div className="flex flex-col h-full w-64 py-6 px-4 flex-shrink-0"
      style={{ background: 'rgba(0,0,0,0.4)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <span className="text-white font-bold text-lg">NEURALIQ.</span>
      </div>

      {/* ✅ User Avatar — shows real photo if uploaded */}
      <div className="flex flex-col items-center mb-8 px-2">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt="avatar"
            className="w-14 h-14 rounded-full object-cover mb-2"
            style={{ border: '2px solid rgba(124,58,237,0.4)' }}
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-2"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              border: '2px solid rgba(124,58,237,0.4)'
            }}>
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
          <button
            key={item.name}
            onClick={() => setActivePage(item.name)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
            style={{
              background: activePage === item.name ? 'rgba(124,58,237,0.3)' : 'transparent',
              color: activePage === item.name ? '#a78bfa' : 'rgba(255,255,255,0.5)',
              border: activePage === item.name
                ? '1px solid rgba(124,58,237,0.3)'
                : '1px solid transparent',
            }}>
            <span>{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:opacity-80 mt-4"
        style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: 'rgba(239,68,68,0.8)'
        }}>
        <span>🚪</span>
        <span className="font-medium text-sm">Logout</span>
      </button>
    </div>
  )
}