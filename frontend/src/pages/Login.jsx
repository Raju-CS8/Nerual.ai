import { useState } from 'react'
import { loginAPI, signupAPI } from '../api'

const BRAND_A = 'Neural'
const BRAND_B = 'IQ'
const BRAND_NAME = BRAND_A + BRAND_B

const Icon = ({ size = 16, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const inputCls =
  'h-11 w-full rounded-lg border border-line-strong bg-surface px-3.5 text-sm text-ink ' +
  'placeholder:text-ink-3 transition-colors focus:border-accent focus:outline-none ' +
  'focus:ring-2 focus:ring-accent/20'

// Logo mark: four connected nodes forming an "N"
function LogoMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 18V6l12 12V6" />
      <circle cx="6" cy="18" r="1.8" fill="currentColor" />
      <circle cx="6" cy="6" r="1.8" fill="currentColor" />
      <circle cx="18" cy="18" r="1.8" fill="currentColor" />
      <circle cx="18" cy="6" r="1.8" fill="currentColor" />
    </svg>
  )
}

function Brand({ onDark = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
        onDark ? 'bg-[#5EEAD4] text-[#0B1F1D]' : 'bg-accent text-accent-on'
      }`}>
        <LogoMark size={18} />
      </span>
      <span className={`font-display text-2xl leading-none tracking-tight ${onDark ? 'text-white' : 'text-ink'}`}>
        {BRAND_A}<span className={onDark ? 'text-[#5EEAD4]' : 'text-accent'}>{BRAND_B}</span>
      </span>
    </div>
  )
}

// Static product preview (illustrative content, no data/logic)
function ProductMock() {
  const online = ['A', 'M', 'S']
  const sources = ['launch-plan.pdf · p.4', 'roadmap.docx · p.2']

  return (
    <div className="w-full max-w-[470px] overflow-hidden rounded-xl border border-white/10 bg-[#0F2926] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-white/50">
            <Icon size={14}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></Icon>
          </span>
          <span className="text-xs font-medium text-white/90">Launch Plan</span>
          <span className="text-[11px] text-white/40">· 2 documents</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex">
            {online.map((l, i) => (
              <span
                key={l}
                className={`flex h-5 w-5 items-center justify-center rounded-full border border-[#0F2926] bg-white/15 text-[9px] font-medium text-white/80 ${i > 0 ? '-ml-1.5' : ''}`}
              >
                {l}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-1 text-[11px] text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />3 online
          </span>
        </div>
      </div>

      {/* Chat */}
      <div className="space-y-3.5 p-4">
        <div className="page-enter flex gap-2.5" style={{ animationDelay: '150ms' }}>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-medium text-white/80">A</span>
          <p className="rounded-lg bg-white/[0.07] px-3 py-2 text-xs leading-relaxed text-white/90">
            What are the main risks in the launch plan?
          </p>
        </div>

        <div className="page-enter flex gap-2.5" style={{ animationDelay: '450ms' }}>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5EEAD4] text-[#0B1F1D]">
            <LogoMark size={12} />
          </span>
          <div className="min-w-0">
            <p className="text-xs leading-relaxed text-white/75">
              Three risks stand out: a tight vendor timeline, unclear QA ownership, and no rollback plan.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sources.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-white/60">
                  <Icon size={10}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Icon>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live notes */}
      <div className="page-enter border-t border-white/10 px-4 py-3.5" style={{ animationDelay: '750ms' }}>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/40">Notes</p>
        <p className="text-xs leading-[1.9] text-white/80">
          QA owner confirmed by Friday
          <span className="relative mx-px inline-block align-middle">
            <span className="absolute -top-4 left-0 whitespace-nowrap rounded-sm rounded-bl-none bg-amber-300 px-1 text-[9px] font-medium text-black">Maya</span>
            <span className="block h-3.5 w-0.5 animate-pulse bg-amber-300" />
          </span>
        </p>
        <p className="text-xs leading-[1.9] text-white/80">
          Add rollback checklist to the release doc
          <span className="relative mx-px inline-block align-middle">
            <span className="absolute -top-4 left-0 whitespace-nowrap rounded-sm rounded-bl-none bg-[#5EEAD4] px-1 text-[9px] font-medium text-[#0B1F1D]">Dev</span>
            <span className="block h-3.5 w-0.5 animate-pulse bg-[#5EEAD4]" style={{ animationDelay: '400ms' }} />
          </span>
        </p>
      </div>
    </div>
  )
}

export default function Login({ onLogin }) {
  // ✅ All state preserved exactly (showPassword is display-only)
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // ✅ Logic preserved exactly
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = isSignup
        ? await signupAPI(name, email, password)
        : await loginAPI(email, password)
      if (data.error) {
        setError(data.error)
      } else {
        onLogin(data.user, data.token)
      }
    } catch {
      setError('Cannot connect to server. Is backend running?')
    }
    setLoading(false)
  }

  const handleGoogleLogin = () => {
    window.location.href = 'https://nerual-ai.onrender.com/auth/google'
  }

  const modes = [
    { signup: false, label: 'Sign in' },
    { signup: true,  label: 'Create account' },
  ]

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[1.15fr_1fr]">

      {/* ── Product panel (desktop) ── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#0B1F1D] p-12 lg:flex">
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage: 'radial-gradient(ellipse at 40% 50%, black 30%, transparent 78%)',
            maskImage: 'radial-gradient(ellipse at 40% 50%, black 30%, transparent 78%)',
          }}
        />

        <div className="relative"><Brand onDark /></div>

        <div className="relative">
          <h2 className="max-w-lg font-display text-[3.4rem] leading-[1.04] tracking-tight text-white">
            Where teams and documents think <em className="text-[#5EEAD4]">together.</em>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/60">
            Chat, co-edit notes and ask AI about your files, all in one shared workspace.
          </p>
          <div className="mt-10">
            <ProductMock />
          </div>
        </div>

        <p className="relative text-xs text-white/35">AI-powered collaborative workspace</p>
      </aside>

      {/* ── Form ── */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 lg:hidden"><Brand /></div>

          {/* Mode switch */}
          <div className="mb-8 flex rounded-lg border border-line bg-sunken p-1" role="group" aria-label="Authentication mode">
            {modes.map((m) => (
              <button
                key={m.label}
                type="button"
                aria-pressed={isSignup === m.signup}
                onClick={() => { setIsSignup(m.signup); setError('') }}
                className={`flex-1 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                  isSignup === m.signup
                    ? 'bg-surface text-ink shadow-card'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <h1 className="font-display text-4xl tracking-tight text-ink">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-ink-2">
            {isSignup
              ? `Start collaborating on ${BRAND_NAME} in minutes.`
              : `Sign in to continue to ${BRAND_NAME}.`}
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mt-7 flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-sunken"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Sign in with Google
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-ink-3">or continue with email</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          {error && (
            <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3 text-[13px] text-danger">
              <span className="mt-px shrink-0">
                <Icon size={15}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Icon>
              </span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label htmlFor="auth-name" className="mb-1.5 block text-[13px] font-medium text-ink">Full Name</label>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Full Name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-[13px] font-medium text-ink">Email Address</label>
              <input
                id="auth-email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="auth-password" className="block text-[13px] font-medium text-ink">Password</label>
                {!isSignup && (
                  <span className="cursor-pointer text-xs text-ink-2 transition-colors hover:text-accent">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
                >
                  {showPassword ? (
                    <Icon size={16}>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </Icon>
                  ) : (
                    <Icon size={16}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Icon>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-on/30 border-t-accent-on" />
              )}
              {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}