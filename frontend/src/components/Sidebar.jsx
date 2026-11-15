import { useState, useEffect } from 'react'

const BRAND_NAME = 'Mural'

const Icon = ({ size = 16, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const navItems = [
  {
    name: 'Dashboard',
    icon: (
      <Icon>
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </Icon>
    )
  },
  {
    name: 'Chat',
    icon: (
      <Icon><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Icon>
    )
  },
  {
    name: 'Files',
    icon: (
      <Icon>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </Icon>
    )
  },
  {
    name: 'Workspace',
    icon: (
      <Icon>
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </Icon>
    )
  },
  {
    name: 'Team',
    icon: (
      <Icon>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </Icon>
    )
  },
  {
    name: 'Admin',
    icon: (
      <Icon>
        <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/>
        <path d="M9 12l2 2 4-4"/>
      </Icon>
    )
  },
  {
    name: 'Pricing',
    icon: (
      <Icon><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>
    )
  },
  {
    name: 'Settings',
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </Icon>
    )
  },
]

export default function Sidebar({ activePage, setActivePage, user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  )

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

  // NEW (design only): light/dark switch. Does not touch any app logic.
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('mural_theme', next) } catch { /* storage unavailable */ }
  }

  const rowBase =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors duration-150'

  const sidebarContent = (
    <div className="flex h-full w-[232px] flex-col border-r border-line bg-surface px-3 py-4">

      {/* ── Brand ── */}
      <div className="mb-5 flex items-center justify-between px-1.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
            <span className="font-display text-lg leading-none text-accent-on">
              {BRAND_NAME.charAt(0)}
            </span>
          </div>
          <span className="font-display text-xl leading-none tracking-tight text-ink">
            {BRAND_NAME}
          </span>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-sunken hover:text-ink md:hidden"
          aria-label="Close menu"
        >
          <Icon size={14}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Icon>
        </button>
      </div>

      {/* ── User block (avatar, name, email, plan) ── */}
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-line bg-bg px-3 py-2.5">
        {user?.avatar ? (
          <img src={user.avatar} alt="avatar" className="h-10 w-10 shrink-0 rounded-full border border-line object-cover" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[15px] font-medium text-accent">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-tight text-ink">
            {user?.name || 'User'}
          </p>
          <p className="truncate text-[11px] leading-tight text-ink-2">
            {user?.email}
          </p>
          <span className={`mt-1 inline-block rounded px-1.5 py-px text-[10px] font-medium ${
            user?.plan === 'pro' ? 'bg-accent-soft text-accent' : 'bg-sunken text-ink-2'
          }`}>
            {user?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
          </span>
        </div>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex flex-1 flex-col gap-0.5" aria-label="Main">
        {navItems
          .filter(item => item.name !== 'Admin' || user?.isAdmin === true)
          .map((item) => {
            const active = activePage === item.name
            return (
              <button
                key={item.name}
                onClick={() => handleNav(item.name)}
                aria-current={active ? 'page' : undefined}
                className={`${rowBase} ${
                  active
                    ? 'bg-accent-soft font-medium text-accent'
                    : 'text-ink-2 hover:bg-sunken hover:text-ink'
                }`}
              >
                <span className="flex items-center">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            )
          })}
      </nav>

      {/* ── Footer actions ── */}
      <div className="mt-3 flex flex-col gap-0.5 border-t border-line pt-3">
        <button
          onClick={toggleTheme}
          className={`${rowBase} text-ink-2 hover:bg-sunken hover:text-ink`}
        >
          {theme === 'dark' ? (
            <Icon>
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </Icon>
          ) : (
            <Icon><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Icon>
          )}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        <button
          onClick={onLogout}
          className={`${rowBase} text-ink-2 hover:bg-danger-soft hover:text-danger`}
        >
          <Icon>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </Icon>
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Hamburger (mobile only) ── */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface text-ink shadow-card md:hidden"
        aria-label="Open menu"
      >
        <Icon size={18}>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </Icon>
      </button>

      {/* ── Desktop sidebar (always visible) ── */}
      <div className="hidden h-screen flex-shrink-0 flex-col md:flex">
        {sidebarContent}
      </div>

      {/* ── Mobile drawer ── */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="slide-in-left fixed left-0 top-0 z-50 h-full shadow-pop md:hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  )
}