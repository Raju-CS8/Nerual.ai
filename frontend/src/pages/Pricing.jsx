import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import {
  getPlansAPI,
  createOrderAPI,
  verifyPaymentAPI,
  downgradeToFreeAPI,
  getTransactionsAPI,
  downloadReceiptAPI,
  getUsageSummaryAPI,
} from '../api'

const BRAND_NAME = 'Mural'

const Icon = ({ size = 14, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-accent px-3.5 py-2 text-[13px] font-medium ' +
  'text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60'

export default function Pricing({ activePage, setActivePage, user, onLogout }) {
  const [loading,      setLoading]      = useState(false)
  const [success,      setSuccess]      = useState(false)
  const [successMsg,   setSuccessMsg]   = useState('🎉 Payment successful — your Pro plan is now active!')
  const [selected,     setSelected]     = useState(user?.plan || 'free')
  const [errorMsg,     setErrorMsg]     = useState('')
  const [transactions, setTransactions] = useState([])
  const [paidTxnId,    setPaidTxnId]    = useState(null)
  const [plans,        setPlans]        = useState([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [usageSummary, setUsageSummary] = useState(null)

  const isPro = user?.plan === 'pro'
  const proPlan = plans.find(p => p.planId === 'pro')

  // Pricing is DB-driven (see backend models/Plan.js) — fetched here
  // instead of hardcoded, so a price change never needs a redeploy.
  useEffect(() => {
    getPlansAPI()
      .then(data => { if (data?.success) setPlans(data.plans) })
      .catch(() => {})
      .finally(() => setPlansLoading(false))
  }, [])

  // Current-month usage vs. this user's plan limit — DB-driven, replaces
  // the old hardcoded FREE_LIMIT/lifetime-tokensUsed usage bar below.
  useEffect(() => {
    getUsageSummaryAPI()
      .then(data => { if (data?.success) setUsageSummary(data) })
      .catch(() => {})
  }, [])

  // Billing history — shown once the user has at least one successful payment
  useEffect(() => {
    getTransactionsAPI()
      .then(data => { if (data?.success) setTransactions(data.transactions) })
      .catch(() => {})
  }, [])

  // ── Real Razorpay Checkout flow ─────────────────────────────────
  const handleUpgrade = async () => {
    setErrorMsg('')
    setLoading(true)
    try {
      // 1) Ask our backend to create an order. Amount is decided
      //    server-side (from the Plan collection) — the frontend never sends a price.
      const order = await createOrderAPI('pro')
      if (!order?.success) {
        setErrorMsg(order?.error || 'Could not start payment. Try again.')
        setLoading(false)
        return
      }

      // Lifetime plans only need to be paid for once. If this user
      // already purchased Pro before (and, say, downgraded and is now
      // re-upgrading), the backend reactivates them directly and never
      // creates a Razorpay order — so there's nothing to check out.
      if (order.alreadyPurchased) {
        localStorage.setItem('neuraliq_user', JSON.stringify(order.user))
        setSuccessMsg(order.message)
        setSuccess(true)
        setSelected('pro')
        setLoading(false)
        return
      }

      // 2) Open Razorpay's own hosted Checkout modal. Card/UPI details
      //    are typed directly into Razorpay's UI — they never pass
      //    through our frontend or backend code.
      const options = {
        key: order.keyId, // public key — safe to expose
        amount: order.amount,
        currency: order.currency,
        name: BRAND_NAME,
        description: `${proPlan?.name || 'Pro'} Plan — One-Time Payment, Lifetime Access`,
        order_id: order.orderId,
        prefill: {
          name: order.user?.name,
          email: order.user?.email,
        },
        theme: { color: '#0F766E' },
        handler: async (response) => {
          // 3) Send Razorpay's proof back to our backend, which
          //    recomputes the signature server-side before trusting it.
          try {
            const verifyRes = await verifyPaymentAPI({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })

            if (verifyRes?.success) {
              localStorage.setItem('neuraliq_user', JSON.stringify(verifyRes.user))
              setPaidTxnId(verifyRes.transactionId)
              setSuccess(true)
              setSelected('pro')
            } else {
              setErrorMsg(verifyRes?.error || 'Payment could not be verified. Contact support if money was deducted.')
            }
          } catch {
            setErrorMsg('Payment verification failed. Contact support if money was deducted.')
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => setLoading(false), // user closed the modal without paying
        },
      }

      // Most common real-world failure: the Razorpay Checkout script
      // (loaded via <script> tag in index.html) hasn't loaded yet or was
      // blocked (ad blockers, some Incognito extension configs, or a
      // slow/flaky connection to checkout.razorpay.com). Give a specific,
      // actionable message instead of a generic one.
      if (!window.Razorpay) {
        setErrorMsg('Payment gateway failed to load. Check your internet connection, disable any ad blocker for this site, and try again.')
        setLoading(false)
        return
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => {
        setErrorMsg('Payment failed. No charge was made — please try again.')
        setLoading(false)
      })
      rzp.open()
    } catch (err) {
      console.error('Razorpay checkout failed to open:', err)
      setErrorMsg('Something went wrong starting the payment. Try again.')
      setLoading(false)
    }
  }

  const handleDowngrade = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const data = await downgradeToFreeAPI()
      if (data?.success) {
        localStorage.setItem('neuraliq_user', JSON.stringify(data.user))
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setErrorMsg('Downgrade failed. Try again.')
      }
    } catch {
      setErrorMsg('Downgrade failed. Try again.')
    }
    setLoading(false)
  }

  const handleConfirm = () => {
    if (selected === user?.plan) return
    if (selected === 'pro') handleUpgrade()
    else handleDowngrade()
  }

  const tokenLimit    = usageSummary?.tokenLimit ?? (isPro ? null : 100000)
  const monthlyTokens = usageSummary?.monthlyTokensUsed ?? (user?.tokensUsed || 0)
  const usagePercent  = tokenLimit == null ? 0 : Math.min((monthlyTokens / tokenLimit) * 100, 100)

  // Rupees formatting + period label derived from each plan's billingCycle
  // ('free' → forever, 'lifetime' → one-time, 'monthly' → per month —
  // this last one is unused today but means adding a recurring plan later
  // needs zero changes here).
  const periodLabelFor = (billingCycle) => {
    if (billingCycle === 'free') return 'forever'
    if (billingCycle === 'lifetime') return 'one-time'
    if (billingCycle === 'monthly') return 'per month'
    return ''
  }

  const displayPlans = plans.map(p => ({
    id: p.planId,
    name: p.name,
    price: `₹${(p.priceInPaise / 100).toFixed(p.priceInPaise % 100 === 0 ? 0 : 2)}`,
    period: periodLabelFor(p.billingCycle),
    description: p.description,
    highlighted: p.planId === 'pro',
    features: p.features,
  }))

  const usageHigh = usagePercent >= 80

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div className="page-enter flex-1 overflow-y-auto px-5 pb-12 pt-16 md:px-10 md:pt-9">
        <div className="mx-auto max-w-3xl">

          {/* ── Header ── */}
          <div className="mb-8">
            <h1 className="font-display text-4xl tracking-tight text-ink">Pricing</h1>
            <p className="mt-1.5 text-sm text-ink-2">Choose the plan that works for you</p>
          </div>

          {/* ✅ Usage bar for free users */}
          {!isPro && (
            <div className={`mb-7 rounded-lg border px-5 py-4 ${
              usageHigh ? 'border-danger/25 bg-danger-soft' : 'border-line bg-surface'
            }`}>
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-ink">Current Usage</p>
                <p className={`text-xs font-medium tabular-nums ${usageHigh ? 'text-danger' : 'text-ink-2'}`}>
                  {monthlyTokens.toLocaleString()} / {tokenLimit == null ? '∞' : tokenLimit.toLocaleString()} tokens
                </p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ease-out ${usageHigh ? 'bg-danger' : 'bg-accent'}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {usageHigh && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
                  <Icon size={13}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </Icon>
                  You've used {usagePercent.toFixed(0)}% of your free tokens
                </p>
              )}
            </div>
          )}

          {/* ✅ Success notification — payment done + plan activated */}
          {success && (
            <div className="fade-in mb-6 rounded-lg border border-success/25 bg-success-soft px-5 py-4">
              <div className="mb-3 flex items-center gap-2.5 text-success">
                <Icon size={16}><polyline points="20 6 9 17 4 12"/></Icon>
                <span className="text-[13px] font-medium">{successMsg}</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {paidTxnId && (
                  <button
                    onClick={() => downloadReceiptAPI(paidTxnId)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-surface px-3.5 py-2 text-xs font-medium text-success transition-colors hover:bg-bg"
                  >
                    <Icon size={13}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Icon>
                    Download Receipt (PDF)
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-md border border-line-strong bg-surface px-3.5 py-2 text-xs font-medium text-ink transition-colors hover:bg-sunken"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ⚠️ Error notification */}
          {errorMsg && (
            <div role="alert" className="fade-in mb-6 flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger-soft px-4 py-3.5 text-[13px] font-medium text-danger">
              <span className="mt-px shrink-0">
                <Icon size={15}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </Icon>
              </span>
              {errorMsg}
            </div>
          )}

          {/* ── Plan cards ── */}
          {plansLoading && (
            <p className="mb-5 text-[13px] text-ink-2">Loading plans…</p>
          )}

          <div className="mb-6 grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Plans">
            {displayPlans.map((plan) => {
              const isCurrentPlan = user?.plan === plan.id
              const isSelected    = selected === plan.id
              const isPlanPro     = plan.id === 'pro'

              return (
                <div
                  key={plan.id}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => setSelected(plan.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(plan.id) } }}
                  className={`relative cursor-pointer rounded-xl border-2 bg-surface p-7 transition-colors ${
                    isSelected ? 'border-accent' : 'border-line hover:border-line-strong'
                  }`}
                >
                  {/* Popular badge */}
                  {isPlanPro && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-md bg-accent px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-on">
                      Most Popular
                    </div>
                  )}

                  {/* Radio + current badge */}
                  <div className={`mb-5 flex items-center justify-between ${isPlanPro ? 'mt-2' : ''}`}>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected ? 'border-accent bg-accent' : 'border-line-strong bg-surface'
                    }`}>
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-accent-on" />}
                    </div>

                    {isCurrentPlan && (
                      <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-[10px] font-medium text-success">
                        Current Plan
                      </span>
                    )}
                  </div>

                  {/* Plan name + price */}
                  <div className="mb-5">
                    <h2 className="font-display text-3xl leading-none tracking-tight text-ink">{plan.name}</h2>
                    <p className="mb-4 mt-2 text-xs text-ink-2">{plan.description}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-5xl leading-none tracking-tight text-ink">{plan.price}</span>
                      <span className="text-[13px] text-ink-2">/{plan.period}</span>
                    </div>
                  </div>

                  <div className="mb-4 h-px bg-line" />

                  {/* Features */}
                  <div className="flex flex-col gap-2.5">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className={`mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
                          isPlanPro ? 'bg-accent-soft text-accent' : 'bg-sunken text-ink-2'
                        }`}>
                          <Icon size={10}><polyline points="20 6 9 17 4 12"/></Icon>
                        </span>
                        <span className="text-[13px] leading-normal text-ink">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── CTA button ── */}
          <div>
            {selected !== user?.plan ? (
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`${btnPrimary} w-full py-3.5 text-[15px]`}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-on/30 border-t-accent-on" />
                    {selected === 'pro' ? 'Opening secure checkout…' : 'Processing…'}
                  </>
                ) : selected === 'pro' ? (
                  <>
                    <Icon size={16}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>
                    {proPlan ? `Pay ₹${(proPlan.priceInPaise / 100).toFixed(proPlan.priceInPaise % 100 === 0 ? 0 : 2)} & Upgrade to Pro` : 'Upgrade to Pro'}
                  </>
                ) : (
                  <>
                    <Icon size={16}>
                      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    </Icon>
                    Confirm Downgrade to Free
                  </>
                )}
              </button>
            ) : (
              <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-3.5 text-sm text-ink-2">
                <span className="text-success"><Icon size={15}><polyline points="20 6 9 17 4 12"/></Icon></span>
                {user?.plan === 'pro'
                  ? 'You already have lifetime Pro access — no payment needed'
                  : 'You are already on the Free plan'}
              </div>
            )}

            {/* Fine print */}
            <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-2">
              {selected === 'pro'
                ? 'Secure payment via Razorpay • One-time payment • Lifetime access, no renewals'
                : 'Downgrading removes Pro access immediately'}
            </p>
          </div>

          {/* ── Billing history ── */}
          {transactions.length > 0 && (
            <div className="mt-9">
              <h3 className="mb-3.5 text-[15px] font-medium text-ink">Billing History</h3>
              <div className="overflow-hidden rounded-lg border border-line bg-surface">
                {transactions.map((txn, i) => (
                  <div
                    key={txn._id}
                    className={`flex items-center justify-between gap-3 px-4 py-3.5 ${
                      i !== transactions.length - 1 ? 'border-b border-line' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">
                        {BRAND_NAME} Pro — ₹{(txn.amount / 100).toFixed(2)}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-ink-2">
                        {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' • '}{txn.receiptNumber}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadReceiptAPI(txn._id)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 text-[11px] font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
                    >
                      <Icon size={12}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Icon>
                      Receipt
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}