import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'
import { getAdminOverviewAPI, getAdminRevenueChartAPI, getAdminTransactionsAPI, getAdminAuditLogsAPI } from '../api'

// ── Steampunk design tokens — copied from Dashboard.jsx for visual
// consistency across the app, not redefined differently.
const GOLD        = '#C5A059'
const BG_BASE      = '#0B1510'
const BG_CARD      = 'rgba(20,35,25,0.82)'
const BORDER_GOLD  = `1px solid ${GOLD}`

const rupees = (paise) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function Admin({ activePage, setActivePage, user, onLogout }) {
  const [overview, setOverview]         = useState(null)
  const [chart, setChart]               = useState([])
  const [transactions, setTransactions] = useState([])
  const [statusFilter, setStatusFilter] = useState('paid')
  // The real security boundary is the backend's requireAdmin middleware
  // (every /api/admin/* call 403s for a non-admin token regardless of
  // what's rendered here) — this is purely a UX guard so a non-admin
  // doesn't see an empty/broken page.
  const isAdmin = user?.isAdmin === true
  // Initial value derived directly from isAdmin (no fetch needed at all
  // for a non-admin) instead of always starting true and synchronously
  // flipping it to false inside an effect — avoids an unnecessary
  // extra render and the react-hooks/set-state-in-effect warning.
  const [loading, setLoading]           = useState(isAdmin)
  const [txnLoading, setTxnLoading]     = useState(isAdmin)
  const [errorMsg, setErrorMsg]         = useState('')
  const [auditLogs, setAuditLogs]       = useState([])
  const [auditLoading, setAuditLoading] = useState(isAdmin)

  useEffect(() => {
    if (!isAdmin) return
    Promise.all([getAdminOverviewAPI(), getAdminRevenueChartAPI(6)])
      .then(([overviewRes, chartRes]) => {
        if (overviewRes?.success) setOverview(overviewRes.overview)
        else setErrorMsg(overviewRes?.error || 'Could not load billing overview')
        if (chartRes?.success) {
          setChart(chartRes.chart.map(m => ({ ...m, revenue: m.revenuePaise / 100 })))
        }
      })
      .catch(() => setErrorMsg('Could not load admin data'))
      .finally(() => setLoading(false))
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    getAdminTransactionsAPI({ status: statusFilter, limit: 20 })
      .then(data => { if (data?.success) setTransactions(data.transactions) })
      .catch(() => {})
      .finally(() => setTxnLoading(false))
  }, [isAdmin, statusFilter])

  useEffect(() => {
    if (!isAdmin) return
    getAdminAuditLogsAPI({ limit: 15 })
      .then(data => { if (data?.success) setAuditLogs(data.logs) })
      .catch(() => {})
      .finally(() => setAuditLoading(false))
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: BG_BASE }}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: `${GOLD}88`, fontFamily: "'JetBrains Mono', monospace" }}>
            <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>🔒 Admin access required</p>
            <p style={{ fontSize: '12px' }}>This dashboard is restricted to NeuralIQ admins.</p>
          </div>
        </div>
      </div>
    )
  }

  const statCards = overview ? [
    { label: 'Total Revenue', value: rupees(overview.totalRevenuePaise), accent: '#6ee7b7' },
    { label: 'Active Pro Users', value: overview.activeProUsers.toLocaleString(), accent: '#c4b5fd' },
    { label: 'Total Users', value: overview.totalUsers.toLocaleString(), accent: GOLD },
    { label: 'Conversion Rate', value: `${overview.conversionRatePercent}%`, accent: '#67e8f9' },
    { label: 'Failed Payments', value: overview.failedPaymentsCount.toLocaleString(), accent: overview.failedPaymentsCount > 0 ? '#fca5a5' : GOLD },
    { label: 'Failed Payment Rate', value: `${overview.failedPaymentRatePercent}%`, accent: overview.failedPaymentRatePercent > 10 ? '#fca5a5' : GOLD },
    { label: 'ARPU (paying users)', value: rupees(overview.arpuPaise), accent: GOLD },
  ] : []

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: `radial-gradient(ellipse 120% 80% at 30% 20%, #0f2016 0%, ${BG_BASE} 60%)`,
      fontFamily: "'Inter', sans-serif",
    }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '27px', fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>
            Admin Billing Dashboard
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.32)', marginTop: '7px', fontSize: '14px' }}>
            Revenue, subscriptions, and payment activity across NeuralIQ
          </p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '14px 18px', borderRadius: '12px', marginBottom: '24px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5', fontSize: '13px', fontWeight: 600,
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ── Stat cards ────────────────────────────────────── */}
        {loading ? (
          <p style={{ color: `${GOLD}88`, fontSize: '13px' }}>Loading billing overview…</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '30px' }}>
            {statCards.map((c) => (
              <div key={c.label} style={{
                background: BG_CARD, border: BORDER_GOLD.replace(GOLD, `${GOLD}33`), borderRadius: '14px',
                padding: '18px 20px', backdropFilter: 'blur(12px)',
              }}>
                <p style={{ fontSize: '11px', color: `${GOLD}77`, fontFamily: "'JetBrains Mono', monospace", marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {c.label}
                </p>
                <p style={{ fontSize: '24px', fontWeight: 800, color: c.accent, fontFamily: "'JetBrains Mono', monospace" }}>
                  {c.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Monthly revenue chart ────────────────────────── */}
        <div style={{
          background: BG_CARD, border: `1px solid ${GOLD}22`, borderRadius: '16px',
          padding: '22px', marginBottom: '30px', backdropFilter: 'blur(12px)',
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: GOLD, marginBottom: '16px', fontFamily: "'JetBrains Mono', monospace" }}>
            Monthly Revenue (last 6 months)
          </h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={`${GOLD}18`} />
                <XAxis dataKey="label" tick={{ fill: `${GOLD}88`, fontSize: 11 }} axisLine={{ stroke: `${GOLD}33` }} tickLine={false} />
                <YAxis tick={{ fill: `${GOLD}88`, fontSize: 11 }} axisLine={{ stroke: `${GOLD}33` }} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ background: '#0f1a12', border: `1px solid ${GOLD}55`, borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: GOLD }}
                />
                <Bar dataKey="revenue" fill={GOLD} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Transactions table ───────────────────────────── */}
        <div style={{
          background: BG_CARD, border: `1px solid ${GOLD}22`, borderRadius: '16px',
          padding: '22px', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: GOLD, fontFamily: "'JetBrains Mono', monospace" }}>
              Recent Transactions
            </h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['paid', 'failed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                    textTransform: 'capitalize', cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                    background: statusFilter === s ? `${GOLD}22` : 'transparent',
                    color: statusFilter === s ? GOLD : `${GOLD}55`,
                    border: `1px solid ${statusFilter === s ? GOLD + '66' : GOLD + '22'}`,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {txnLoading ? (
            <p style={{ color: `${GOLD}66`, fontSize: '13px' }}>Loading transactions…</p>
          ) : transactions.length === 0 ? (
            <p style={{ color: `${GOLD}66`, fontSize: '13px' }}>No {statusFilter} transactions yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${GOLD}22` }}>
                    {['User', 'Plan', 'Amount', 'Status', 'Date', 'Receipt'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: `${GOLD}77`, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn._id} style={{ borderBottom: `1px solid ${GOLD}11` }}>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.85)' }}>
                        {txn.userId?.name || 'Unknown'}
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{txn.userId?.email}</div>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>{txn.plan}</td>
                      <td style={{ padding: '10px 12px', color: GOLD, fontFamily: "'JetBrains Mono', monospace" }}>{rupees(txn.amount)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 9px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 700,
                          background: txn.status === 'paid' ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
                          color: txn.status === 'paid' ? '#6ee7b7' : '#fca5a5',
                        }}>
                          {txn.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                        {txn.receiptNumber || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Audit log ─────────────────────────────────────── */}
        <div style={{
          background: BG_CARD, border: `1px solid ${GOLD}22`, borderRadius: '16px',
          padding: '22px', marginTop: '30px', backdropFilter: 'blur(12px)',
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: GOLD, marginBottom: '16px', fontFamily: "'JetBrains Mono', monospace" }}>
            Recent Audit Log
          </h2>

          {auditLoading ? (
            <p style={{ color: `${GOLD}66`, fontSize: '13px' }}>Loading audit log…</p>
          ) : auditLogs.length === 0 ? (
            <p style={{ color: `${GOLD}66`, fontSize: '13px' }}>No events recorded yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${GOLD}22` }}>
                    {['Event', 'User', 'IP Address', 'When'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: `${GOLD}77`, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id} style={{ borderBottom: `1px solid ${GOLD}11` }}>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{
                          padding: '2px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                          background: log.eventType.includes('failed') || log.eventType.includes('invalid') || log.eventType.includes('denied')
                            ? 'rgba(239,68,68,0.14)' : 'rgba(197,160,89,0.14)',
                          color: log.eventType.includes('failed') || log.eventType.includes('invalid') || log.eventType.includes('denied')
                            ? '#fca5a5' : GOLD,
                        }}>
                          {log.eventType}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.75)' }}>
                        {log.userId?.name || '—'}
                        {log.userId?.email && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10.5px' }}>{log.userId.email}</div>}
                      </td>
                      <td style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.5)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                        {log.ipAddress || '—'}
                      </td>
                      <td style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(log.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}