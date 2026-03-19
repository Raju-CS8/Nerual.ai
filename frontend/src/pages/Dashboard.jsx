import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { getUsageStatsAPI } from '../api'

export default function Dashboard({ activePage, setActivePage, user, onLogout }) {
  const [stats, setStats] = useState([])

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
    ? `M${graphPoints.map(p => `${p.x},${p.y}`).join(' L')} L${graphPoints[graphPoints.length-1].x},130 L30,130 Z`
    : 'M30,120 L410,120 L410,130 L30,130 Z'

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1a0533 0%, #050816 60%)' }}>

      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div className="flex-1 overflow-y-auto p-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">
            <span className="font-bold">NEURALIQ.</span>
            <span className="font-light"> Dashboard.</span>
          </h1>
          <p className="text-gray-400 mt-1">Welcome back, {user?.name || 'User'}.</p>

          {/* ✅ Token Warning Banner */}
          {!isPro && usagePercent >= 80 && (
            <div className="mt-4 px-5 py-4 rounded-xl flex items-center justify-between"
              style={{
                background: usagePercent >= 100 ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.1)',
                border: `1px solid ${usagePercent >= 100 ? 'rgba(239,68,68,0.4)' : 'rgba(251,191,36,0.3)'}`
              }}>
              <p className="font-medium text-sm"
                style={{ color: usagePercent >= 100 ? '#f87171' : '#fbbf24' }}>
                {usagePercent >= 100
                  ? '🚫 Token limit reached! Upgrade to Pro to continue chatting.'
                  : `⚠️ ${usagePercent.toFixed(0)}% of free tokens used. Running low!`}
              </p>
              <button
                onClick={() => setActivePage('Pricing')}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white ml-4 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                Upgrade ⭐
              </button>
            </div>
          )}

          {/* Pro Badge */}
          {isPro && (
            <div className="mt-4 px-5 py-3 rounded-xl inline-flex items-center gap-2"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
              <span className="text-purple-400 font-medium text-sm">⭐ Pro Plan — Unlimited tokens active</span>
            </div>
          )}
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">

          {/* Tokens Used */}
          <div className="rounded-2xl p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)'
          }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-300 font-medium">Tokens Used</span>
              <span className="text-xs px-3 py-1 rounded-full"
                style={{
                  background: usagePercent >= 80 && !isPro ? 'rgba(239,68,68,0.2)' : 'rgba(124,58,237,0.2)',
                  color: usagePercent >= 80 && !isPro ? '#f87171' : '#a78bfa',
                  border: `1px solid ${usagePercent >= 80 && !isPro ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.3)'}`
                }}>
                {isPro ? '∞ Unlimited' : `${usagePercent.toFixed(0)}% used`}
              </span>
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-4xl font-bold text-white">
                {tokensUsed.toLocaleString()}
              </span>
              <span className="text-gray-500 mb-1">
                {isPro ? '/ ∞' : '/ 1,00,000'}
              </span>
            </div>

            {/* Real progress bar */}
            {!isPro ? (
              <>
                <div className="w-full h-3 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-3 rounded-full transition-all duration-700"
                    style={{
                      width: `${usagePercent}%`,
                      background: usagePercent >= 80
                        ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                        : 'linear-gradient(90deg, #7c3aed, #06b6d4)'
                    }} />
                </div>
                <p className="text-xs" style={{ color: usagePercent >= 80 ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
                  {(FREE_LIMIT - tokensUsed).toLocaleString()} tokens remaining
                </p>
              </>
            ) : (
              <div className="w-full h-3 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-3 rounded-full" style={{ width: '100%', background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }} />
              </div>
            )}

            <p className="text-xs text-gray-500 mt-1">
              {isPro ? '⭐ Pro Plan — Unlimited' : 'Free Plan — 1,00,000 limit'}
            </p>

            <div className="flex items-end gap-1 mt-4 h-12">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    background: i === bars.length - 1
                      ? 'linear-gradient(180deg, #7c3aed, #06b6d4)'
                      : 'rgba(124,58,237,0.3)'
                  }} />
              ))}
            </div>
          </div>

          {/* Documents Processed */}
          <div className="rounded-2xl p-6 flex flex-col justify-between" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)'
          }}>
            <span className="text-gray-300 font-medium">Documents Processed</span>
            <div className="flex items-center justify-center flex-1 py-4">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="40" fill="none"
                    stroke="url(#grad)" strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (Math.min((user?.documentsProcessed || 0) / 100, 1) * 251.2)}
                    strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7c3aed"/>
                      <stop offset="100%" stopColor="#06b6d4"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {user?.documentsProcessed || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Cards */}
        <div className="grid grid-cols-2 gap-4">

          {/* Real Usage Graph */}
          <div className="rounded-2xl p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)'
          }}>
            <h3 className="text-white font-medium mb-1">Usage Overview (Last 7 Days)</h3>
            <p className="text-gray-600 text-xs mb-3">Real token usage per day</p>

            {stats.every(s => s.tokensUsed === 0) ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-gray-600 text-sm">Start chatting to see your usage!</p>
              </div>
            ) : (
              <svg viewBox="0 0 420 170" className="w-full">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {[20, 55, 90, 125].map(y => (
                  <line key={y} x1="10" y1={y} x2="410" y2={y}
                    stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                ))}
                <path d={areaPath} fill="url(#areaGrad)"/>
                <path d={linePath} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                {graphPoints.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="5" fill="#7c3aed" stroke="white" strokeWidth="2"/>
                    {p.tokens > 0 && (
                      <text x={p.x} y={p.y - 10} textAnchor="middle"
                        fill="rgba(167,139,250,0.8)" fontSize="8">
                        {p.tokens > 1000 ? `${(p.tokens/1000).toFixed(1)}k` : p.tokens}
                      </text>
                    )}
                    <text x={p.x} y="148" textAnchor="middle"
                      fill="rgba(255,255,255,0.4)" fontSize="9">
                      {p.label}
                    </text>
                  </g>
                ))}
                <circle cx="20" cy="160" r="4" fill="#7c3aed"/>
                <text x="28" y="164" fill="rgba(255,255,255,0.4)" fontSize="9">Tokens used</text>
              </svg>
            )}
          </div>

          {/* Account Info */}
          <div className="rounded-2xl p-6" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)'
          }}>
            <h3 className="text-white font-medium mb-4">Account Info</h3>
            <div className="flex flex-col gap-3">

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{user?.name}</p>
                  <p className="text-gray-500 text-xs">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <span className="text-gray-400 text-sm">Plan</span>
                <span className="text-purple-400 text-sm font-medium">
                  {isPro ? '⭐ Pro' : '🆓 Free'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-gray-400 text-sm">Tokens Remaining</span>
                <span className="text-white text-sm font-medium">
                  {isPro ? '∞ Unlimited' : Math.max(FREE_LIMIT - tokensUsed, 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-gray-400 text-sm">Documents Processed</span>
                <span className="text-white text-sm font-medium">{user?.documentsProcessed || 0}</span>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-gray-400 text-sm">Active Days</span>
                <span className="text-white text-sm font-medium">
                  {stats.filter(s => s.tokensUsed > 0).length} / 7
                </span>
              </div>

              {!isPro && (
                <button
                  onClick={() => setActivePage('Pricing')}
                  className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                  ⭐ Upgrade to Pro — ₹499/mo
                </button>
              )}

              <button onClick={onLogout}
                className="w-full py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.8)' }}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}