import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { getUsageStatsAPI, getUsageSummaryAPI } from '../api'

const fmt = (n) => (n > 1000 ? `${(n / 1000).toFixed(1)}k` : n)

const cardCls = 'rounded-lg border border-line bg-surface p-5'
const labelCls = 'mb-4 text-xs font-medium uppercase tracking-wider text-ink-2'

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

  // ── Display-only helpers ──
  const noUsage     = stats.every(s => s.tokensUsed === 0)
  const unlimited   = isPro || tokenLimit == null
  const rangeLabel  = stats.length > 0 ? `${stats[0]?.label} – ${stats[stats.length - 1]?.label}` : '06/11 – 06/17'
  const resetLabel  = usageSummary?.resetsOn
    ? new Date(usageSummary.resetsOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : 'monthly'
  const gaugeTone   = isLimit ? 'stroke-danger' : isWarning ? 'stroke-warning' : 'stroke-accent'

  const primaryBtn =
    'rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-accent-on transition-colors hover:bg-accent-hover'

  const accountRows = [
    { label: 'Plan', value: isPro ? 'Pro' : 'Free' },
    { label: 'Tokens Remaining', value: (isPro || tokenLimit == null) ? 'Unlimited' : Math.max(tokenLimit - tokensUsed, 0).toLocaleString() },
    { label: 'Documents Processed', value: user?.documentsProcessed || 0 },
    { label: 'Active Days', value: `${stats.filter(s => s.tokensUsed > 0).length} / 7` },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div className="page-enter flex-1 overflow-y-auto px-5 pb-10 pt-16 md:px-10 md:pt-9">
        <div className="mx-auto max-w-[1400px]">

          {/* ── Header ── */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl tracking-tight text-ink">Dashboard</h1>
              <p className="mt-1.5 text-sm text-ink-2">
                Welcome back, <span className="font-medium text-ink">{user?.name || 'User'}</span>.
              </p>
            </div>

            {/* Plan Status */}
            <div className="flex items-center gap-4 rounded-lg border border-line bg-surface px-4 py-3">
              <span className={`rounded-md px-3 py-1.5 text-[13px] font-medium ${
                isPro ? 'bg-accent-soft text-accent' : 'bg-sunken text-ink'
              }`}>
                {isPro ? 'Pro Plan' : 'Free Plan'}
              </span>
              <div>
                <p className="text-[13px] font-medium text-ink">Plan Status</p>
                <p className="text-xs text-ink-2">Plan expires 12/31/2026. Keep exploring!</p>
              </div>
            </div>
          </div>

          {/* ✅ Token warning — logic preserved exactly */}
          {isWarning && (
            <div className={`mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-3 ${
              isLimit ? 'border-danger/25 bg-danger-soft' : 'border-warning/25 bg-warning-soft'
            }`}>
              <div className={`flex items-center gap-3 ${isLimit ? 'text-danger' : 'text-warning'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {isLimit ? (
                    <>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </>
                  ) : (
                    <>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </>
                  )}
                </svg>
                <p className="text-sm font-medium">
                  {isLimit
                    ? 'Token limit reached — upgrade to Pro to keep chatting.'
                    : `${usagePercent.toFixed(0)}% of your free tokens used. Running low.`}
                </p>
              </div>
              <button
                onClick={() => setActivePage('Pricing')}
                className="shrink-0 rounded-md bg-accent px-4 py-1.5 text-[13px] font-medium text-accent-on transition-colors hover:bg-accent-hover"
              >
                Upgrade →
              </button>
            </div>
          )}

          {/* ── Top row: 4 cards ── */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* Card 1: Tokens Used (gauge) */}
            <div className={cardCls}>
              <p className={labelCls}>Tokens Used</p>

              <div className="flex flex-col items-center">
                <div className="relative h-[118px] w-[190px]">
                  <svg viewBox="0 0 140 80" className="absolute inset-0 h-full w-full" role="img"
                    aria-label={`${usagePercent.toFixed(0)} percent of token limit used`}>
                    {/* Track */}
                    <path d="M 15 70 A 55 55 0 1 1 125 70" pathLength="100"
                      fill="none" className="stroke-sunken" strokeWidth="9" strokeLinecap="round"/>
                    {/* Progress */}
                    <path d="M 15 70 A 55 55 0 1 1 125 70" pathLength="100"
                      fill="none" className={gaugeTone} strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={`${usagePercent} 100`}
                      style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}/>
                  </svg>
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
                    <span className="font-display text-3xl leading-none tracking-tight text-ink tabular-nums">
                      {tokensUsed.toLocaleString()}
                    </span>
                    <span className="mt-1 text-xs text-ink-2">
                      {unlimited ? '/ ∞' : `/ ${tokenLimit.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-center text-[13px] text-ink">
                  {unlimited ? 'Unlimited' : `${Math.max(tokenLimit - tokensUsed, 0).toLocaleString()} remaining`}
                </p>
                <p className="mt-0.5 text-center text-xs text-ink-2">
                  {unlimited
                    ? 'Pro Plan — no monthly cap'
                    : `Free Plan Limit: ${tokenLimit.toLocaleString()} • resets ${resetLabel}`}
                </p>
              </div>

              {/* Sparkline bars */}
              <div className="mt-5 flex h-8 items-end gap-0.5" aria-hidden="true">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm ${i === bars.length - 1 ? 'bg-accent' : 'bg-line-strong'}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-ink-3">Tokens used</p>
            </div>

            {/* Card 2: Documents Processed */}
            <div className={cardCls}>
              <p className={labelCls}>Documents Processed</p>

              <div className="flex flex-col items-center py-2">
                <div className="flex h-[118px] w-[118px] items-center justify-center rounded-full border border-line-strong bg-bg">
                  <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full border border-line bg-surface">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round" className="mb-0.5 text-accent" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span className="font-display text-3xl leading-none tracking-tight text-ink tabular-nums">
                      {user?.documentsProcessed || 0}
                    </span>
                  </div>
                </div>
                <p className="mt-5 text-center text-[13px] text-ink-2">
                  Total Documents Processed: {user?.documentsProcessed || 0}
                </p>
              </div>
            </div>

            {/* Card 3: Usage Overview mini chart */}
            <div className={cardCls}>
              <p className="text-xs font-medium uppercase tracking-wider text-ink-2">Usage Overview (Last 7 Days)</p>
              <p className="mb-3 mt-1 text-xs text-ink-3">Real token usage per day</p>

              {noUsage ? (
                <div className="flex h-[120px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line-strong">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" className="text-ink-3" aria-hidden="true">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  <p className="text-center text-xs text-ink-2">Start chatting to see usage</p>
                </div>
              ) : (
                <svg viewBox="0 0 240 90" className="w-full" role="img" aria-label="Token usage per day">
                  <defs>
                    <linearGradient id="miniArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" style={{ stopColor: 'rgb(var(--c-accent))', stopOpacity: 0.18 }}/>
                      <stop offset="100%" style={{ stopColor: 'rgb(var(--c-accent))', stopOpacity: 0 }}/>
                    </linearGradient>
                  </defs>
                  {[20, 45, 70].map(y => (
                    <line key={y} x1="10" y1={y} x2="230" y2={y} className="stroke-line" strokeWidth="1" strokeDasharray="4,4"/>
                  ))}
                  <path d={`M${stats.map((s,i)=>`${10+(i*34)},${60-((s.tokensUsed/maxTokens)*48)}`).join(' L')} L${10+(stats.length-1)*34},80 L10,80 Z`}
                    fill="url(#miniArea)"/>
                  <path d={`M${stats.map((s,i)=>`${10+(i*34)},${60-((s.tokensUsed/maxTokens)*48)}`).join(' L')}`}
                    fill="none" className="stroke-accent" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  {stats.map((s, i) => {
                    const x = 10 + i * 34
                    const y = 60 - ((s.tokensUsed / maxTokens) * 48)
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="3" className="fill-surface stroke-accent" strokeWidth="1.5"/>
                        {s.tokensUsed > 0 && (
                          <text x={x} y={y - 7} textAnchor="middle" fontSize="7" className="fill-ink-2">
                            {fmt(s.tokensUsed)}
                          </text>
                        )}
                        <text x={x} y="87" textAnchor="middle" fontSize="7" className="fill-ink-3">
                          {s.label}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              )}

              <div className="mt-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-xs text-ink-2">Real token usage per day</span>
              </div>
            </div>

            {/* Card 4: AI Insights & Actions */}
            <div className={cardCls}>
              <p className={labelCls}>AI Insights &amp; Actions</p>

              <div className="mb-3 rounded-md border border-line bg-bg p-3">
                <p className="mb-3 text-[13px] leading-relaxed text-ink-2">
                  <span className="font-medium text-ink">Insight:</span>{' '}
                  {user?.documentsProcessed > 0
                    ? `Document #${user.documentsProcessed} analysis suggests optimization for a more precise summary.`
                    : 'Upload documents to get AI-powered insights.'}
                </p>
                <button
                  onClick={() => setActivePage('Files')}
                  className={`${primaryBtn} w-full`}
                >
                  {user?.documentsProcessed > 0 ? 'Optimize summary' : 'Upload files'}
                </button>
              </div>

              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-2">Top Topics</p>
              {user?.documentsProcessed > 0 ? (
                <ul className="space-y-1.5">
                  {[
                    `Topic of: Document #${user.documentsProcessed}`,
                    'Textroipanting in the files',
                  ].map((topic, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span className="text-xs text-ink-2">{topic}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-ink-3">No files analyzed yet</p>
              )}
            </div>
          </div>

          {/* ── Bottom row ── */}
          <div className="grid gap-4 lg:grid-cols-2">

            {/* Large usage chart */}
            <div className={cardCls}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-ink-2">Total Tokens Used (7 Days)</p>
                  <p className="mt-1 text-xs text-ink-3">{rangeLabel}</p>
                </div>
                {graphPoints.length > 0 && (() => {
                  const peak = graphPoints.reduce((a, b) => b.tokens > a.tokens ? b : a, graphPoints[0])
                  return peak.tokens > 0 ? (
                    <span className="font-display text-2xl leading-none text-ink tabular-nums">
                      {fmt(peak.tokens)}
                    </span>
                  ) : null
                })()}
              </div>

              {noUsage ? (
                <div className="flex h-[170px] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-line-strong">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" className="text-ink-3" aria-hidden="true">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  <p className="text-center text-sm text-ink-2">Start chatting to see your usage</p>
                </div>
              ) : (
                <svg viewBox="0 0 420 160" className="w-full" role="img" aria-label="Total tokens used over 7 days">
                  <defs>
                    <linearGradient id="bigArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" style={{ stopColor: 'rgb(var(--c-accent))', stopOpacity: 0.18 }}/>
                      <stop offset="100%" style={{ stopColor: 'rgb(var(--c-accent))', stopOpacity: 0 }}/>
                    </linearGradient>
                  </defs>

                  {[20, 55, 90, 120].map(y => (
                    <line key={y} x1="10" y1={y} x2="410" y2={y} className="stroke-line" strokeWidth="1" strokeDasharray="6,4"/>
                  ))}

                  <path d={areaPath} fill="url(#bigArea)"/>
                  <path d={linePath} fill="none" className="stroke-accent" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"/>

                  {graphPoints.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="4.5" className="fill-surface stroke-accent" strokeWidth="2"/>
                      {p.tokens > 0 && (
                        <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="8.5" className="fill-ink-2">
                          {fmt(p.tokens)}
                        </text>
                      )}
                      <text x={p.x} y="152" textAnchor="middle" fontSize="9" className="fill-ink-3">
                        {p.label}
                      </text>
                    </g>
                  ))}
                </svg>
              )}

              <div className="mt-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-xs text-ink-2">Tokens used</span>
              </div>
            </div>

            {/* Account info panel */}
            <div className={cardCls}>
              {/* User identity */}
              <div className="mb-3 flex items-center gap-3 rounded-md border border-line bg-bg px-3.5 py-3">
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" className="h-10 w-10 shrink-0 rounded-full border border-line object-cover" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[15px] font-medium text-accent">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink">{user?.name}</p>
                  <p className="truncate text-xs text-ink-2">{user?.email}</p>
                </div>
              </div>

              {/* Info rows */}
              <div className="mb-3 space-y-1.5">
                {accountRows.map((row, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-line px-3.5 py-2.5">
                    <span className="text-[13px] text-ink-2">{row.label}</span>
                    <span className="text-[13px] font-medium text-ink tabular-nums">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Upgrade row */}
              {!isPro && (
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="shrink-0 rounded-md border border-line bg-bg px-3.5 py-2.5">
                    <span className="whitespace-nowrap text-[13px] text-ink-2">Upgrade to Pro</span>
                  </div>
                  <button
                    onClick={() => setActivePage('Pricing')}
                    className={`${primaryBtn} flex-1 py-2.5`}
                  >
                    Get Pro – ₹499/mo
                  </button>
                </div>
              )}

              {/* Logout */}
              <button
                onClick={onLogout}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-danger/25 bg-danger-soft px-4 py-2.5 text-[13px] font-medium text-danger transition-colors hover:border-danger/50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* ── Date range footer ── */}
          <p className="mt-5 text-center text-xs tracking-wide text-ink-3">{rangeLabel}</p>

        </div>
      </div>
    </div>
  )
}