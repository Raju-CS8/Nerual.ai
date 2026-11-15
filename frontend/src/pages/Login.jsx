import { useState } from 'react'
import { loginAPI, signupAPI } from '../api'

const BRAND_NAME = 'Mural'

const inputCls =
  'w-full rounded-md border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink ' +
  'placeholder:text-ink-3 transition-colors focus:border-accent focus:outline-none ' +
  'focus:ring-2 focus:ring-accent/20'

const points = [
  'Shared rooms with live chat, presence and co-editing',
  'Ask questions across your uploaded documents',
  'Roles and permissions you control',
]

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
        <span className="font-display text-xl leading-none text-accent-on">{BRAND_NAME.charAt(0)}</span>
      </div>
      <span className="font-display text-2xl leading-none tracking-tight text-ink">{BRAND_NAME}</span>
    </div>
  )
}

export default function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[1.05fr_1fr]">

      {/* ── Brand panel (desktop only, NEW — copy is editable) ── */}
      <aside className="hidden flex-col justify-between border-r border-line bg-sunken p-12 lg:flex">
        <Brand />
        <div className="max-w-md">
          <h2 className="font-display text-5xl leading-[1.05] tracking-tight text-ink">
            Where your team thinks, together.
          </h2>
          <ul className="mt-8 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px] text-ink-2">
                <svg className="mt-1 shrink-0 text-accent" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-ink-3">AI-powered collaborative workspace</p>
      </aside>

      {/* ── Form ── */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden"><Brand /></div>

          <h1 className="font-display text-4xl tracking-tight text-ink">
            {isSignup ? 'Sign Up' : 'Login'}
          </h1>
          <p className="mt-2 text-sm text-ink-2">
            {isSignup ? `Create your ${BRAND_NAME} account.` : `Welcome back. Sign in to ${BRAND_NAME}.`}
          </p>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-md border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-sunken"
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
            <span className="text-xs text-ink-3">or</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
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
                placeholder="Email Address"
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
              <input
                id="auth-password"
                type="password"
                placeholder="Password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-2">
            {isSignup ? 'Already have an account? ' : `New to ${BRAND_NAME}? `}
            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError('') }}
              className="font-medium text-accent transition-colors hover:text-accent-hover"
            >
              {isSignup ? 'Sign in.' : 'Sign up.'}
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}