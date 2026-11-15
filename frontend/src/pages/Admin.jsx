import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'
import { getAdminOverviewAPI, getAdminRevenueChartAPI, getAdminTransactionsAPI, getAdminAuditLogsAPI } from '../api'

const BRAND_NAME = 'Mural'

const rupees = (paise) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const cardCls = 'rounded-lg border border-line bg-surface p-5'
const thCls = 'px-3 py-2.5 text-left text-xs font-medium text-ink-2'

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
      <div className="flex h-screen overflow-hidden bg-bg">
        <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-sunken text-ink-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p className="text-[15px] font-medium text-ink">Admin access required</p>
            <p className="mt-1 text-sm text-ink-2">This dashboard is restricted to {BRAND_NAME} admins.</p>
          </div>
        </div>
      </div>
    )
  }

  const statCards = overview ? [
    { label: 'Total Revenue',       value: rupees(overview.totalRevenuePaise),            danger: false },
    { label: 'Active Pro Users',    value: overview.activeProUsers.toLocaleString(),       danger: false },
    { label: 'Total Users',         value: overview.totalUsers.toLocaleString(),           danger: false },
    { label: 'Conversion Rate',     value: `${overview.conversionRatePercent}%`,           danger: false },
    { label: 'Failed Payments',     value: overview.failedPaymentsCount.toLocaleString(),  danger: overview.failedPaymentsCount > 0 },
    { label: 'Failed Payment Rate', value: `${overview.failedPaymentRatePercent}%`,        danger: overview.failedPaymentRatePercent > 10 },
    { label: 'ARPU (paying users)', value: rupees(overview.arpuPaise),                     danger: false },
  ] : []

  const tick = { fill: 'rgb(var(--c-ink-2))', fontSize: 11 }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div className="page-enter flex-1 overflow-y-auto px-5 pb-10 pt-16 md:px-10 md:pt-9">
        <div className="mx-auto max-w-6xl">

          <div className="mb-8">
            <h1 className="font-display text-4xl tracking-tight text-ink">Admin Billing Dashboard</h1>
            <p className="mt-2 text-sm text-ink-2">
              Revenue, subscriptions, and payment activity across {BRAND_NAME}
            </p>
          </div>

          {errorMsg && (
            <div role="alert" className="mb-6 flex items-center gap-2.5 rounded-lg border border-danger/25 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errorMsg}
            </div>
          )}

          {/* ── Stat cards ── */}
          {loading ? (
            <p className="text-sm text-ink-2">Loading billing overview…</p>
          ) : (
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((c) => (
                <div key={c.label} className={cardCls}>
                  <p className="text-xs font-medium uppercase tracking-wider text-ink-2">{c.label}</p>
                  <p className={`mt-2 font-display text-3xl leading-none tracking-tight tabular-nums ${
                    c.danger ? 'text-danger' : 'text-ink'
                  }`}>
                    {c.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── Monthly revenue chart ── */}
          <div className={`${cardCls} mb-6`}>
            <h2 className="mb-4 text-sm font-medium text-ink">Monthly Revenue (last 6 months)</h2>
            <div className="h-[260px] w-full">
              <ResponsiveContainer>
                <BarChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-line))" vertical={false} />
                  <XAxis dataKey="label" tick={tick} axisLine={{ stroke: 'rgb(var(--c-line-strong))' }} tickLine={false} />
                  <YAxis tick={tick} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    cursor={{ fill: 'rgb(var(--c-sunken))' }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{
                      background: 'rgb(var(--c-surface))',
                      border: '1px solid rgb(var(--c-line-strong))',
                      borderRadius: '8px', fontSize: '12px',
                      color: 'rgb(var(--c-ink))',
                    }}
                    labelStyle={{ color: 'rgb(var(--c-ink-2))' }}
                  />
                  <Bar dataKey="revenue" fill="rgb(var(--c-accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Transactions table ── */}
          <div className={`${cardCls} mb-6`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-ink">Recent Transactions</h2>
              <div className="inline-flex rounded-md border border-line bg-sunken p-0.5">
                {['paid', 'failed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                      statusFilter === s
                        ? 'bg-surface text-ink shadow-card'
                        : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {txnLoading ? (
              <p className="text-sm text-ink-2">Loading transactions…</p>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-ink-2">No {statusFilter} transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-line">
                      {['User', 'Plan', 'Amount', 'Status', 'Date', 'Receipt'].map(h => (
                        <th key={h} className={thCls}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {transactions.map((txn) => (
                      <tr key={txn._id}>
                        <td className="px-3 py-3 text-ink">
                          {txn.userId?.name || 'Unknown'}
                          <div className="text-xs text-ink-2">{txn.userId?.email}</div>
                        </td>
                        <td className="px-3 py-3 capitalize text-ink-2">{txn.plan}</td>
                        <td className="px-3 py-3 font-medium text-ink tabular-nums">{rupees(txn.amount)}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            txn.status === 'paid' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                          }`}>
                            {txn.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-ink-2">
                          {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-ink-2">
                          {txn.receiptNumber || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Audit log ── */}
          <div className={cardCls}>
            <h2 className="mb-4 text-sm font-medium text-ink">Recent Audit Log</h2>

            {auditLoading ? (
              <p className="text-sm text-ink-2">Loading audit log…</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-sm text-ink-2">No events recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-line">
                      {['Event', 'User', 'IP Address', 'When'].map(h => (
                        <th key={h} className={thCls}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {auditLogs.map((log) => {
                      const bad = log.eventType.includes('failed') || log.eventType.includes('invalid') || log.eventType.includes('denied')
                      return (
                        <tr key={log._id}>
                          <td className="px-3 py-2.5">
                            <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-medium ${
                              bad ? 'bg-danger-soft text-danger' : 'bg-sunken text-ink-2'
                            }`}>
                              {log.eventType}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-ink">
                            {log.userId?.name || '—'}
                            {log.userId?.email && <div className="text-xs text-ink-2">{log.userId.email}</div>}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs text-ink-2">{log.ipAddress || '—'}</td>
                          <td className="px-3 py-2.5 text-ink-2">
                            {new Date(log.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}