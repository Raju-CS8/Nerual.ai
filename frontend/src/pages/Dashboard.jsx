import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { getUsageStatsAPI, getUsageSummaryAPI } from '../api'

// ── Steampunk design tokens ──────────────────────────────
// Module-level (not per-render) since Gear/PipeH below need them and
// must themselves be module-level components — see comment there.
const GOLD       = '#C5A059'
const GOLD_DIM   = '#8B6914'
const COPPER     = '#B8860B'
const BG_BASE    = '#0B1510'
const BG_CARD    = 'rgba(20,35,25,0.82)'
const BG_SURFACE = 'rgba(15,28,20,0.9)'
const BORDER_GOLD = `1px solid ${GOLD}`

// Gear SVG component — moved to module scope (was previously defined
// inside the Dashboard function body, recreated on every render, which
// resets its internal state and cost extra work each render; it only
// ever depended on the module-level GOLD constant, never on any
// Dashboard prop/state, so hoisting it out changes nothing about what
// it renders).
const Gear = ({ size = 40, opacity = 0.18, rotate = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40"
    style={{ opacity, transform: `rotate(${rotate}deg)` }}>
    <circle cx="20" cy="20" r="7" fill="none" stroke={GOLD} strokeWidth="2"/>
    <circle cx="20" cy="20" r="3" fill={GOLD} opacity="0.4"/>
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i) => {
      const rad = a * Math.PI / 180
      const x1 = 20 + 9  * Math.cos(rad)
      const y1 = 20 + 9  * Math.sin(rad)
      const x2 = 20 + 13 * Math.cos(rad)
      const y2 = 20 + 13 * Math.sin(rad)
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GOLD} strokeWidth="2.5" strokeLinecap="round"/>
    })}
  </svg>
)

// Pipe connector SVG — same reasoning as Gear above.
const PipeH = ({ width = 60, color = GOLD }) => (
  <svg width={width} height="14" viewBox={`0 0 ${width} 14`}>
    <rect x="0" y="4" width={width} height="6" rx="3" fill={`${color}22`} stroke={`${color}55`} strokeWidth="1"/>
    <rect x="0" y="5.5" width={width} height="3" rx="1.5" fill={`${color}40`}/>
  </svg>
)

export default function Dashboard({ activePage, setActivePage, user, onLogout }) {
  const [stats, setStats] = useState([])
  const [usageSummary, setUsageSummary] = useState(null)

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

  // Monthly usage vs. plan limit — separate effect, separate endpoint,
  // doesn't disturb the 7-day stats fetch above.
  useEffect(() => {
    getUsageSummaryAPI()
      .then(data => { if (data?.success) setUsageSummary(data) })
      .catch(() => console.log('Could not load usage summary'))
  }, [])

  // ✅ All calculations preserved exactly
  const bars = [30, 45, 35, 60, 40, 55, 70, 50, 65, 75, 45, 80]
  const isPro = user?.plan === 'pro'
  // Falls back to the old lifetime tokensUsed/100000 only until
  // usageSummary has loaded, so the gauge doesn't flash "0" on first render.
  const tokenLimit = usageSummary?.tokenLimit ?? (isPro ? null : 100000)
  const tokensUsed = usageSummary?.monthlyTokensUsed ?? (user?.tokensUsed || 0)
  const usagePercent = tokenLimit == null ? 0 : Math.min((tokensUsed / tokenLimit) * 100, 100)

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

  // ── Steampunk design tokens (GOLD, GOLD_DIM, etc.) and the Gear/PipeH
  // components now live at module scope above — see comment there.

  const card = {
    background: BG_CARD,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${GOLD}55`,
    borderRadius: '14px',
    padding: '22px',
    boxShadow: `0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(197,160,89,0.12)`,
    position: 'relative',
    overflow: 'hidden',
  }

  const goldLabel = {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: GOLD_DIM,
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: '14px',
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: `radial-gradient(ellipse 120% 80% at 30% 20%, #0f2016 0%, ${BG_BASE} 60%)`,
      fontFamily: "'Inter', sans-serif",
    }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }} className="page-enter">

        {/* ── Steampunk ambient overlay ── */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse 60% 50% at 70% 80%, rgba(197,160,89,0.04) 0%, transparent 70%)',
        }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* ── Header ─────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{
                fontSize: '28px', fontWeight: 700, margin: 0, letterSpacing: '-0.01em',
                fontFamily: "'Playfair Display', 'Georgia', serif",
                background: `linear-gradient(135deg, ${GOLD}, #e8c87a, ${COPPER})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                NEURALIQ. <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Dashboard.</span>
              </h1>
              <p style={{ color: 'rgba(197,160,89,0.45)', marginTop: '6px', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", margin: '6px 0 0' }}>
                Welcome back, <span style={{ color: `${GOLD}cc` }}>{user?.name || 'User'}</span>.
              </p>
            </div>

            {/* Plan Status — steampunk badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 20px', borderRadius: '12px',
              background: BG_SURFACE, border: `1px solid ${GOLD}44`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(197,160,89,0.1)`,
            }}>
              <div style={{ position: 'relative' }}>
                <span style={{
                  display: 'inline-block', padding: '7px 18px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em',
                  background: isPro
                    ? `linear-gradient(135deg, #4a3500, #7a5a00)`
                    : `linear-gradient(135deg, #1a3a20, #2a5a30)`,
                  color: GOLD, border: `1px solid ${GOLD}66`,
                  fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: `0 2px 8px rgba(197,160,89,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
                }}>
                  {isPro ? '✦ Pro Plan' : 'Free Plan'}
                </span>
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: GOLD, margin: '0 0 2px', fontFamily: "'Playfair Display', serif" }}>
                  Plan Status
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(197,160,89,0.45)', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                  Plan expires 12/31/2026. Keep exploring!
                </p>
              </div>
            </div>
          </div>

          {/* ✅ Token warning — logic preserved exactly */}
          {isWarning && (
            <div style={{
              marginBottom: '20px', padding: '14px 20px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
              background: isLimit ? 'rgba(80,20,20,0.6)' : 'rgba(80,50,10,0.6)',
              border: `1px solid ${isLimit ? '#ef444466' : '#f59e0b66'}`,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>{isLimit ? '⛔' : '⚠️'}</span>
                <p style={{ fontSize: '13px', fontWeight: 500, color: isLimit ? '#fca5a5' : '#fcd34d', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                  {isLimit
                    ? 'Token limit reached — upgrade to Pro to keep chatting.'
                    : `${usagePercent.toFixed(0)}% of your free tokens used. Running low.`}
                </p>
              </div>
              <button
                onClick={() => setActivePage('Pricing')}
                style={{
                  padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                  background: `linear-gradient(135deg, #4a3500, #7a5a00)`,
                  color: GOLD, border: `1px solid ${GOLD}66`,
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: `0 2px 10px rgba(197,160,89,0.25)`,
                }}>
                Upgrade →
              </button>
            </div>
          )}

          {/* ── Top row: 4 cards ──────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '16px' }}>

            {/* Card 1: Tokens Used — Brain focal point */}
            <div style={card}>
              {/* Corner gear decorations */}
              <div style={{ position: 'absolute', top: -8, right: -8, pointerEvents: 'none' }}>
                <Gear size={36} opacity={0.22} rotate={15}/>
              </div>
              <p style={goldLabel}>Tokens Used</p>

              {/* Brain cylinder focal point */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0 12px' }}>
                {/* Outer ring */}
                <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                  <svg viewBox="0 0 140 140" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                    <defs>
                      <linearGradient id="goldArc" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={GOLD}/>
                        <stop offset="100%" stopColor={COPPER}/>
                      </linearGradient>
                      <filter id="goldGlow">
                        <feGaussianBlur stdDeviation="3" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                    </defs>
                    {/* Outer decorative ring */}
                    <circle cx="70" cy="70" r="64" fill="none" stroke={`${GOLD}22`} strokeWidth="1"/>
                    <circle cx="70" cy="70" r="60" fill="none" stroke={`${GOLD}15`} strokeWidth="6"/>
                    {/* Track arc */}
                    <path d="M 15 70 A 55 55 0 1 1 125 70"
                      fill="none" stroke={`${GOLD}18`} strokeWidth="7" strokeLinecap="round"/>
                    {/* Progress arc */}
                    <path d="M 15 70 A 55 55 0 1 1 125 70"
                      fill="none" stroke="url(#goldArc)" strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${(usagePercent / 100) * 274} 274`}
                      filter="url(#goldGlow)"
                      style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}/>
                    {/* Tick marks */}
                    {[0,60,120,180,240,300].map((a, i) => {
                      const rad = ((a - 90) * Math.PI) / 180
                      const x1 = 70 + 56 * Math.cos(rad), y1 = 70 + 56 * Math.sin(rad)
                      const x2 = 70 + 61 * Math.cos(rad), y2 = 70 + 61 * Math.sin(rad)
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${GOLD}55`} strokeWidth="1.5"/>
                    })}
                    {/* Inner glass cylinder */}
                    <circle cx="70" cy="70" r="44" fill="rgba(10,25,15,0.85)" stroke={`${GOLD}33`} strokeWidth="1.5"/>
                    {/* Brain symbol */}
                    <text x="70" y="62" textAnchor="middle" fontSize="22" fill={`${GOLD}88`}>🧠</text>
                  </svg>
                  {/* Number overlay */}
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', paddingTop: '28px',
                  }}>
                    <span style={{
                      fontSize: '26px', fontWeight: 700, color: GOLD, lineHeight: 1,
                      fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em',
                      textShadow: `0 0 20px ${GOLD}66`,
                    }}>
                      {tokensUsed.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '11px', color: `${GOLD}55`, marginTop: '3px', fontFamily: "'JetBrains Mono', monospace" }}>
                      {isPro || tokenLimit == null ? '/ ∞' : `/ ${tokenLimit.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                {/* Pipe below */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4px', gap: '4px' }}>
                  <PipeH width={80}/>
                  <p style={{ fontSize: '12px', color: `${GOLD}88`, fontFamily: "'JetBrains Mono', monospace", margin: 0, textAlign: 'center' }}>
                    {isPro || tokenLimit == null ? 'Unlimited' : `${Math.max(tokenLimit - tokensUsed, 0).toLocaleString()} remaining`}
                  </p>
                  <p style={{ fontSize: '10px', color: `${GOLD}44`, fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                    {isPro || tokenLimit == null
                      ? 'Pro Plan — no monthly cap'
                      : `Free Plan Limit: ${tokenLimit.toLocaleString()} · resets ${usageSummary?.resetsOn ? new Date(usageSummary.resetsOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'monthly'}`}
                  </p>
                </div>
              </div>

              {/* Sparkline bars styled as pipeline */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '32px', marginTop: '8px' }}>
                {bars.map((h, i) => (
                  <div key={i} style={{
                    flex: 1, borderRadius: '2px 2px 0 0',
                    height: `${h}%`,
                    background: i === bars.length - 1
                      ? `linear-gradient(180deg, ${GOLD}, ${COPPER})`
                      : `${GOLD}28`,
                    border: i === bars.length - 1 ? `1px solid ${GOLD}88` : 'none',
                    transition: 'height 0.3s ease',
                  }}/>
                ))}
              </div>
              <p style={{ fontSize: '10px', color: `${GOLD}44`, margin: '6px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
                Tokens used
              </p>
            </div>

            {/* Card 2: Documents Processed — Gear mechanism */}
            <div style={card}>
              <div style={{ position: 'absolute', top: -6, left: -6, pointerEvents: 'none' }}>
                <Gear size={32} opacity={0.2} rotate={-20}/>
              </div>
              <p style={goldLabel}>Documents Processed</p>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 0' }}>
                {/* Gear cluster */}
                <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '14px' }}>
                  <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
                    <defs>
                      <filter id="gearGlow">
                        <feGaussianBlur stdDeviation="2" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                      <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={GOLD}/>
                        <stop offset="100%" stopColor={COPPER}/>
                      </linearGradient>
                    </defs>
                    {/* Outer gear teeth */}
                    {[0,22,44,66,88,110,132,154,176,198,220,242,264,286,308,330].map((a, i) => {
                      const rad = (a * Math.PI) / 180
                      const x1 = 60 + 46 * Math.cos(rad), y1 = 60 + 46 * Math.sin(rad)
                      const x2 = 60 + 55 * Math.cos(rad), y2 = 60 + 55 * Math.sin(rad)
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${GOLD}88`} strokeWidth="5" strokeLinecap="round"/>
                    })}
                    {/* Main gear ring */}
                    <circle cx="60" cy="60" r="46" fill="none" stroke="url(#gearGrad)" strokeWidth="2.5" filter="url(#gearGlow)"/>
                    <circle cx="60" cy="60" r="36" fill="rgba(10,25,15,0.9)" stroke={`${GOLD}44`} strokeWidth="1.5"/>
                    {/* Inner details */}
                    {[0,60,120,180,240,300].map((a, i) => {
                      const rad = (a * Math.PI) / 180
                      const x1 = 60 + 22 * Math.cos(rad), y1 = 60 + 22 * Math.sin(rad)
                      const x2 = 60 + 32 * Math.cos(rad), y2 = 60 + 32 * Math.sin(rad)
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${GOLD}44`} strokeWidth="2" strokeLinecap="round"/>
                    })}
                    <circle cx="60" cy="60" r="18" fill={`${GOLD}18`} stroke={`${GOLD}66`} strokeWidth="1.5"/>
                    {/* Center number */}
                    <text x="60" y="66" textAnchor="middle" fill={GOLD}
                      fontSize="22" fontWeight="800" fontFamily="'JetBrains Mono', monospace"
                      filter="url(#gearGlow)">
                      {user?.documentsProcessed || 0}
                    </text>
                  </svg>

                  {/* Small satellite gear */}
                  <div style={{ position: 'absolute', top: 0, right: -6 }}>
                    <Gear size={28} opacity={0.45} rotate={40}/>
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: -6 }}>
                    <Gear size={22} opacity={0.3} rotate={-30}/>
                  </div>
                </div>

                {/* Pipe connector */}
                <PipeH width={60}/>
                <p style={{ fontSize: '12px', color: `${GOLD}77`, fontFamily: "'JetBrains Mono', monospace", margin: '8px 0 0', textAlign: 'center' }}>
                  Total Documents Processed: {user?.documentsProcessed || 0}
                </p>
              </div>
            </div>

            {/* Card 3: Usage Overview mini chart */}
            <div style={card}>
              <div style={{ position: 'absolute', bottom: 8, right: 8, pointerEvents: 'none' }}>
                <Gear size={30} opacity={0.15} rotate={60}/>
              </div>
              <p style={goldLabel}>Usage Overview (Last 7 Days)</p>
              <p style={{ fontSize: '10px', color: `${GOLD}44`, marginBottom: '10px', fontFamily: "'JetBrains Mono', monospace" }}>
                Real token usage per day
              </p>

              {stats.every(s => s.tokensUsed === 0) ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '110px', gap: '10px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={`${GOLD}44`} strokeWidth="1.5" strokeLinecap="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  <p style={{ fontSize: '11px', color: `${GOLD}44`, textAlign: 'center', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                    Start chatting to see usage
                  </p>
                </div>
              ) : (
                <svg viewBox="0 0 240 90" style={{ width: '100%' }}>
                  <defs>
                    <linearGradient id="miniAreaSteam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity="0.25"/>
                      <stop offset="100%" stopColor={GOLD} stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="miniLineSteam" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={GOLD}/>
                      <stop offset="100%" stopColor={COPPER}/>
                    </linearGradient>
                    <filter id="lineGlow2">
                      <feGaussianBlur stdDeviation="1.5" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                  {/* Grid */}
                  {[20, 45, 70].map(y => (
                    <line key={y} x1="10" y1={y} x2="230" y2={y} stroke={`${GOLD}12`} strokeWidth="1" strokeDasharray="4,4"/>
                  ))}
                  {/* Pipe-style area */}
                  <path d={`M${stats.map((s,i)=>`${10+(i*34)},${60-((s.tokensUsed/maxTokens)*48)}`).join(' L')} L${10+(stats.length-1)*34},80 L10,80 Z`}
                    fill="url(#miniAreaSteam)"/>
                  <path d={`M${stats.map((s,i)=>`${10+(i*34)},${60-((s.tokensUsed/maxTokens)*48)}`).join(' L')}`}
                    fill="none" stroke="url(#miniLineSteam)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#lineGlow2)"/>
                  {stats.map((s, i) => {
                    const x = 10 + i * 34
                    const y = 60 - ((s.tokensUsed / maxTokens) * 48)
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="3.5" fill={GOLD} stroke="#0B1510" strokeWidth="1.5"/>
                        {s.tokensUsed > 0 && (
                          <text x={x} y={y - 8} textAnchor="middle" fill={`${GOLD}cc`} fontSize="7" fontFamily="'JetBrains Mono', monospace">
                            {s.tokensUsed > 1000 ? `${(s.tokensUsed/1000).toFixed(1)}k` : s.tokensUsed}
                          </text>
                        )}
                        <text x={x} y="87" textAnchor="middle" fill={`${GOLD}55`} fontSize="7" fontFamily="'JetBrains Mono', monospace">
                          {s.label}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: GOLD, boxShadow: `0 0 6px ${GOLD}` }}/>
                <span style={{ fontSize: '10px', color: `${GOLD}55`, fontFamily: "'JetBrains Mono', monospace" }}>Real token usage per day</span>
              </div>
            </div>

            {/* Card 4: AI Insights */}
            <div style={card}>
              <div style={{ position: 'absolute', top: 8, right: 8, pointerEvents: 'none' }}>
                <Gear size={28} opacity={0.18} rotate={-45}/>
              </div>
              <p style={goldLabel}>AI Insights &amp; Actions</p>

              {/* Book icon */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: `radial-gradient(circle, ${GOLD}22, transparent)`,
                  border: `1px solid ${GOLD}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 20px ${GOLD}33`,
                  fontSize: '22px',
                }}>
                  📖
                </div>
              </div>

              {/* Insight bubble */}
              <div style={{
                padding: '11px 13px', borderRadius: '10px', marginBottom: '12px',
                background: `rgba(197,160,89,0.07)`, border: `1px solid ${GOLD}33`,
              }}>
                <p style={{ fontSize: '12px', color: `${GOLD}cc`, lineHeight: 1.55, margin: '0 0 10px', fontFamily: "'Inter', sans-serif" }}>
                  <span style={{ color: GOLD, fontWeight: 600 }}>Insight:</span>{' '}
                  {user?.documentsProcessed > 0
                    ? `Document #${user.documentsProcessed} analysis suggests optimization for a more precise summary.`
                    : 'Upload documents to get AI-powered insights.'}
                </p>
                <button
                  onClick={() => setActivePage('Files')}
                  style={{
                    width: '100%', padding: '8px', borderRadius: '8px',
                    fontSize: '12px', fontWeight: 700,
                    background: `linear-gradient(135deg, #3a2a00, #6a4a00)`,
                    color: GOLD, border: `1px solid ${GOLD}55`,
                    cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                    boxShadow: `0 2px 10px rgba(197,160,89,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 20px rgba(197,160,89,0.4), inset 0 1px 0 rgba(255,255,255,0.1)` }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 10px rgba(197,160,89,0.2), inset 0 1px 0 rgba(255,255,255,0.05)` }}
                >
                  {user?.documentsProcessed > 0 ? 'Optimize summary' : 'Upload files'}
                </button>
              </div>

              {/* Top Topics */}
              <p style={{ fontSize: '10px', fontWeight: 700, color: `${GOLD}66`, marginBottom: '7px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
                Top Topics
              </p>
              {user?.documentsProcessed > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[
                    `Topic of: Document #${user.documentsProcessed}`,
                    'Textroipanting in the files',
                  ].map((topic, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span style={{ color: GOLD, fontSize: '12px', lineHeight: 1 }}>✦</span>
                      <span style={{ fontSize: '11px', color: `${GOLD}77`, fontFamily: "'JetBrains Mono', monospace" }}>{topic}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '11px', color: `${GOLD}33`, fontStyle: 'italic', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                  No files analyzed yet
                </p>
              )}
            </div>
          </div>

          {/* ── Bottom row ──────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Large usage chart — pipeline style */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <p style={{ ...goldLabel, marginBottom: '2px' }}>Total Tokens Used (7 Days)</p>
                  <p style={{ fontSize: '11px', color: `${GOLD}44`, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                    {stats.length > 0 ? `${stats[0]?.label} – ${stats[stats.length-1]?.label}` : '06/11 – 06/17'}
                  </p>
                </div>
                {/* Peak value */}
                {graphPoints.length > 0 && (() => {
                  const peak = graphPoints.reduce((a, b) => b.tokens > a.tokens ? b : a, graphPoints[0])
                  return peak.tokens > 0 ? (
                    <span style={{
                      fontSize: '20px', fontWeight: 700, color: GOLD,
                      fontFamily: "'JetBrains Mono', monospace",
                      textShadow: `0 0 16px ${GOLD}88`,
                    }}>
                      {peak.tokens > 1000 ? `${(peak.tokens/1000).toFixed(1)}k` : peak.tokens}
                    </span>
                  ) : null
                })()}
              </div>

              {stats.every(s => s.tokensUsed === 0) ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '155px', gap: '12px' }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={`${GOLD}33`} strokeWidth="1.5" strokeLinecap="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  <p style={{ fontSize: '13px', color: `${GOLD}44`, textAlign: 'center', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                    Start chatting to see your usage
                  </p>
                </div>
              ) : (
                <svg viewBox="0 0 420 160" style={{ width: '100%' }}>
                  <defs>
                    <linearGradient id="steamArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity="0.28"/>
                      <stop offset="100%" stopColor={GOLD} stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="steamLine" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={GOLD}/>
                      <stop offset="100%" stopColor={COPPER}/>
                    </linearGradient>
                    <filter id="steamGlow">
                      <feGaussianBlur stdDeviation="2.5" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>

                  {/* Dashed grid */}
                  {[20, 55, 90, 120].map(y => (
                    <line key={y} x1="10" y1={y} x2="410" y2={y}
                      stroke={`${GOLD}10`} strokeWidth="1" strokeDasharray="6,4"/>
                  ))}

                  {/* Pipe nodes — horizontal connectors between points */}
                  {graphPoints.length > 1 && graphPoints.slice(0, -1).map((p, i) => {
                    const next = graphPoints[i + 1]
                    return (
                      <line key={i} x1={p.x} y1={p.y} x2={next.x} y2={next.y}
                        stroke={`${GOLD}22`} strokeWidth="6" strokeLinecap="round"/>
                    )
                  })}

                  {/* Area fill */}
                  <path d={areaPath} fill="url(#steamArea)"/>

                  {/* Main pipeline line */}
                  <path d={linePath} fill="none" stroke="url(#steamLine)" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" filter="url(#steamGlow)"/>

                  {/* Flow nodes */}
                  {graphPoints.map((p, i) => (
                    <g key={i}>
                      {/* Node ring */}
                      <circle cx={p.x} cy={p.y} r="7" fill="rgba(10,25,15,0.9)" stroke={GOLD} strokeWidth="1.5"/>
                      <circle cx={p.x} cy={p.y} r="3.5" fill={GOLD}/>
                      {p.tokens > 0 && (
                        <text x={p.x} y={p.y - 13} textAnchor="middle"
                          fill={`${GOLD}cc`} fontSize="8" fontFamily="'JetBrains Mono', monospace">
                          {p.tokens > 1000 ? `${(p.tokens / 1000).toFixed(1)}k` : p.tokens}
                        </text>
                      )}
                      <text x={p.x} y="152" textAnchor="middle"
                        fill={`${GOLD}55`} fontSize="9" fontFamily="'JetBrains Mono', monospace">
                        {p.label}
                      </text>
                    </g>
                  ))}
                </svg>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: GOLD, boxShadow: `0 0 8px ${GOLD}` }}/>
                <span style={{ fontSize: '10px', color: `${GOLD}55`, fontFamily: "'JetBrains Mono', monospace" }}>Tokens used</span>
              </div>
            </div>

            {/* Account info — steampunk panel */}
            <div style={card}>
              {/* User identity */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '13px 15px', borderRadius: '11px', marginBottom: '13px',
                background: `rgba(197,160,89,0.07)`, border: `1px solid ${GOLD}33`,
              }}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" style={{
                    width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
                    border: `2px solid ${GOLD}66`,
                    boxShadow: `0 0 12px ${GOLD}44`,
                  }} />
                ) : (
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, #3a2800, #6a4800)`,
                    border: `2px solid ${GOLD}66`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '16px', color: GOLD,
                    boxShadow: `0 0 12px ${GOLD}33`,
                  }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: GOLD, fontWeight: 600, fontSize: '13px', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                    {user?.name}
                  </p>
                  <p style={{ color: `${GOLD}55`, fontSize: '11px', margin: '1px 0 0', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Info rows — steampunk data panels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '12px' }}>
                {[
                  { label: 'Plan', value: isPro ? '✦ Pro' : 'Free' },
                  { label: 'Tokens Remaining', value: (isPro || tokenLimit == null) ? '∞ Unlimited' : Math.max(tokenLimit - tokensUsed, 0).toLocaleString() },
                  { label: 'Documents Processed', value: user?.documentsProcessed || 0 },
                  { label: 'Active Days', value: `${stats.filter(s => s.tokensUsed > 0).length} / 7` },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 13px', borderRadius: '8px',
                    background: 'rgba(197,160,89,0.04)', border: `1px solid ${GOLD}22`,
                  }}>
                    <span style={{ fontSize: '12px', color: `${GOLD}66`, fontFamily: "'JetBrains Mono', monospace" }}>{row.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: GOLD, fontFamily: "'JetBrains Mono', monospace" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Upgrade row — label left + beveled button right */}
              {!isPro && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    flex: '0 0 auto', padding: '11px 14px', borderRadius: '9px',
                    background: 'rgba(197,160,89,0.05)', border: `1px solid ${GOLD}22`,
                  }}>
                    <span style={{ fontSize: '12px', color: `${GOLD}55`, whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
                      Upgrade to Pro
                    </span>
                  </div>
                  <button
                    onClick={() => setActivePage('Pricing')}
                    style={{
                      flex: 1, padding: '11px 14px', borderRadius: '9px',
                      background: `linear-gradient(135deg, #3a2800, #6a4800)`,
                      color: GOLD, border: `1px solid ${GOLD}66`,
                      cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      boxShadow: `0 2px 12px rgba(197,160,89,0.25), inset 0 1px 0 rgba(255,255,255,0.06)`,
                      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = `0 4px 24px rgba(197,160,89,0.45), inset 0 1px 0 rgba(255,255,255,0.1)`
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = `0 2px 12px rgba(197,160,89,0.25), inset 0 1px 0 rgba(255,255,255,0.06)`
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    ⭐ Get Pro – ₹499/mo
                  </button>
                </div>
              )}

              {/* Logout — steampunk red */}
              <button
                onClick={onLogout}
                style={{
                  width: '100%', padding: '11px', borderRadius: '9px',
                  background: 'rgba(80,20,20,0.5)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(120,30,30,0.6)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(80,20,20,0.5)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* ── Date range footer ── */}
          <div style={{ marginTop: '14px', textAlign: 'center' }}>
            <span style={{
              fontSize: '11px', color: `${GOLD}44`, fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.1em',
            }}>
              {stats.length > 0 ? `${stats[0]?.label} – ${stats[stats.length-1]?.label}` : '06/11 – 06/17'}
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}