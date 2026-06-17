import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { getUsageStatsAPI } from '../api'

export default function Dashboard({ activePage, setActivePage, user, onLogout }) {
  const [stats, setStats] = useState([])

  // ✅ Logic preserved exactly
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getUsageStatsAPI()
        if (data.success) setStats(data.stats)
      } catch {
        console.log('Could not load stats')
      }
    }
    fetchStats()
  }, [])

  // ✅ All calculations preserved exactly
  const bars = [30, 45, 35, 60, 40, 55, 70, 50, 65, 75, 45, 80]
  const FREE_LIMIT = 100000
  const tokensUsed = user?.tokensUsed || 0
  const usagePercent = Math.min((tokensUsed / FREE_LIMIT) * 100, 100)
  const isPro = user?.plan === 'pro'

  const maxTokens = Math.max(...stats.map(s => s.tokensUsed), 1)
  const graphPoints = stats.map((s, i) => {
    const x = 30 + (i * 62)
    const y = 120 - ((s.tokensUsed / maxTokens) * 100)
    return { x, y, label: s.label, tokens: s.tokensUsed }
  })

  const linePath = graphPoints.length > 1
    ? `M${graphPoints.map(p => `${p.x},${p.y}`).join(' L')}`
    : 'M30,120 L410,120'

  const areaPath = graphPoints.length > 1
    ? `M${graphPoints.map(p => `${p.x},${p.y}`).join(' L')} L${graphPoints[graphPoints.length - 1].x},130 L30,130 Z`
    : 'M30,120 L410,120 L410,130 L30,130 Z'

  const isWarning = !isPro && usagePercent >= 80
  const isLimit   = !isPro && usagePercent >= 100

  // ── Shared card style ────────────────────────────────────
  const card = {
    background: 'linear-gradient(160deg, #16162a 0%, #0f0f1a 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 60% at 20% -5%, rgba(124,58,237,0.11) 0%, #08080f 65%)',
    }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '36px' }} className="page-enter">

        {/* ── Header ──────────────────────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '27px', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                Dashboard
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.32)', marginTop: '7px', fontSize: '14px' }}>
                Welcome back,&nbsp;
                <span style={{ color: 'rgba(196,181,253,0.85)', fontWeight: 500 }}>
                  {user?.name || 'User'}
                </span>
              </p>
            </div>

            {/* Plan badge */}
            {isPro ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                background: 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(6,182,212,0.18))',
                border: '1px solid rgba(124,58,237,0.32)', color: '#c4b5fd',
              }}>
                ✦ Pro Plan Active
              </span>
            ) : (
              <span style={{
                padding: '7px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(255,255,255,0.38)',
              }}>
                Free Plan
              </span>
            )}
          </div>

          {/* ✅ Token warning — logic preserved exactly */}
          {isWarning && (
            <div style={{
              marginTop: '18px', padding: '14px 20px', borderRadius: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
              background: isLimit ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.07)',
              border: `1px solid ${isLimit ? 'rgba(239,68,68,0.24)' : 'rgba(245,158,11,0.2)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>{isLimit ? '⛔' : '⚠️'}</span>
                <p style={{ fontSize: '13.5px', fontWeight: 500, color: isLimit ? '#fca5a5' : '#fcd34d' }}>
                  {isLimit
                    ? 'Token limit reached — upgrade to Pro to keep chatting.'
                    : `${usagePercent.toFixed(0)}% of your free tokens used. Running low.`}
                </p>
              </div>
              <button
                onClick={() => setActivePage('Pricing')}
                style={{
                  padding: '8px 18px', borderRadius: '9px', fontSize: '12px', fontWeight: 700,
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white',
                  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  boxShadow: '0 2px 12px rgba(124,58,237,0.35)',
                }}>
                Upgrade →
              </button>
            </div>
          )}
        </div>

        {/* ── Top row ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* Tokens card */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.26)', marginBottom: '10px' }}>
                  Tokens Used
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '38px', fontWeight: 800, color: 'white', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {tokensUsed.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.22)', fontWeight: 500 }}>
                    {isPro ? '/ ∞' : '/ 100,000'}
                  </span>
                </div>
              </div>

              {/* Usage badge */}
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '4px 11px', borderRadius: '999px',
                background: isWarning ? 'rgba(239,68,68,0.14)' : 'rgba(124,58,237,0.16)',
                color: isWarning ? '#fca5a5' : '#c4b5fd',
                border: `1px solid ${isWarning ? 'rgba(239,68,68,0.24)' : 'rgba(124,58,237,0.24)'}`,
              }}>
                {isPro ? '∞ Unlimited' : `${usagePercent.toFixed(0)}% used`}
              </span>
            </div>

            {/* Progress bar */}
            {!isPro ? (
              <>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{
                    height: '100%', borderRadius: '999px',
                    width: `${usagePercent}%`,
                    background: isWarning
                      ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                      : 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
                <p style={{ fontSize: '11px', color: isWarning ? '#fca5a5' : 'rgba(255,255,255,0.26)' }}>
                  {(FREE_LIMIT - tokensUsed).toLocaleString()} tokens remaining
                </p>
              </>
            ) : (
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', width: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }} />
              </div>
            )}

            {/* Mini bar sparkline */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '42px', marginTop: '22px' }}>
              {bars.map((h, i) => (
                <div key={i} style={{
                  flex: 1, borderRadius: '3px 3px 2px 2px',
                  height: `${h}%`,
                  background: i === bars.length - 1
                    ? 'linear-gradient(180deg, #7c3aed, #06b6d4)'
                    : 'rgba(124,58,237,0.2)',
                  transition: 'height 0.3s ease',
                }} />
              ))}
            </div>
          </div>

          {/* Documents card */}
          <div style={card}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.26)', marginBottom: '20px' }}>
              Documents Processed
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0 0' }}>
              {/* Donut chart */}
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7"/>
                  <circle cx="50" cy="50" r="40" fill="none"
                    stroke="url(#docGrad)" strokeWidth="7"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (Math.min((user?.documentsProcessed || 0) / 100, 1) * 251.2)}
                    strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7c3aed"/>
                      <stop offset="100%" stopColor="#06b6d4"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '34px', fontWeight: 800, color: 'white', lineHeight: 1, letterSpacing: '-0.04em' }}>
                    {user?.documentsProcessed || 0}
                  </span>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '3px', fontWeight: 500 }}>files</span>
                </div>
              </div>
              <p style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.28)', textAlign: 'center' }}>
                Total documents analyzed by AI
              </p>
            </div>
          </div>
        </div>

        {/* ── Bottom row ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Usage chart */}
          <div style={card}>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.26)', marginBottom: '4px' }}>
                Token Usage
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>Last 7 days</p>
            </div>

            {stats.every(s => s.tokensUsed === 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '155px', gap: '12px' }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}>
                  Start chatting to see your usage
                </p>
              </div>
            ) : (
              <svg viewBox="0 0 420 160" style={{ width: '100%' }}>
                <defs>
                  <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.38"/>
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed"/>
                    <stop offset="100%" stopColor="#06b6d4"/>
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[20, 55, 90, 120].map(y => (
                  <line key={y} x1="10" y1={y} x2="410" y2={y}
                    stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                ))}

                {/* Area fill */}
                <path d={areaPath} fill="url(#areaGrad2)"/>

                {/* Line */}
                <path d={linePath} fill="none" stroke="url(#lineGrad2)" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>

                {/* Data points */}
                {graphPoints.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4.5" fill="#7c3aed" stroke="#08080f" strokeWidth="2.5"/>
                    {p.tokens > 0 && (
                      <text x={p.x} y={p.y - 11} textAnchor="middle"
                        fill="rgba(196,181,253,0.7)" fontSize="8" fontFamily="Inter, sans-serif">
                        {p.tokens > 1000 ? `${(p.tokens / 1000).toFixed(1)}k` : p.tokens}
                      </text>
                    )}
                    <text x={p.x} y="152" textAnchor="middle"
                      fill="rgba(255,255,255,0.28)" fontSize="9" fontFamily="Inter, sans-serif">
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>

          {/* Account info */}
          <div style={card}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.26)', marginBottom: '16px' }}>
              Account Info
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {/* User identity row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '11px',
                background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.14)',
                marginBottom: '4px',
              }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '16px', color: 'white',
                }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: 'white', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.name}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Info rows */}
              {[
                { label: 'Plan', value: isPro ? '✦ Pro' : 'Free', color: isPro ? '#c4b5fd' : 'rgba(255,255,255,0.4)' },
                { label: 'Tokens Remaining', value: isPro ? '∞ Unlimited' : Math.max(FREE_LIMIT - tokensUsed, 0).toLocaleString() },
                { label: 'Documents Processed', value: user?.documentsProcessed || 0 },
                { label: 'Active Days', value: `${stats.filter(s => s.tokensUsed > 0).length} / 7` },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 13px', borderRadius: '9px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.055)',
                }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)' }}>{row.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: row.color || 'white' }}>{row.value}</span>
                </div>
              ))}

              {/* Upgrade CTA */}
              {!isPro && (
                <button
                  onClick={() => setActivePage('Pricing')}
                  style={{
                    width: '100%', padding: '11px', marginTop: '4px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white',
                    border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                    boxShadow: '0 2px 16px rgba(124,58,237,0.32)', transition: 'all 0.15s ease',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  Upgrade to Pro — ₹499/mo →
                </button>
              )}

              {/* Logout */}
              <button
                onClick={onLogout}
                style={{
                  width: '100%', padding: '10px', borderRadius: '10px',
                  background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)',
                  color: 'rgba(248,113,113,0.72)', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                  transition: 'all 0.15s ease', fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.13)'; e.currentTarget.style.color = '#f87171' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.color = 'rgba(248,113,113,0.72)' }}
              >
                Sign Out
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}