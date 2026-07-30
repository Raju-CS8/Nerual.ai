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

export default function Pricing({ activePage, setActivePage, user, onLogout }) {
  const [loading,      setLoading]      = useState(false)
  const [success,      setSuccess]      = useState(false)
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

      // 2) Open Razorpay's own hosted Checkout modal. Card/UPI details
      //    are typed directly into Razorpay's UI — they never pass
      //    through our frontend or backend code.
      const options = {
        key: order.keyId, // public key — safe to expose
        amount: order.amount,
        currency: order.currency,
        name: 'NeuralIQ',
        description: `${proPlan?.name || 'Pro'} Plan — One-Time Payment, Lifetime Access`,
        order_id: order.orderId,
        prefill: {
          name: order.user?.name,
          email: order.user?.email,
        },
        theme: { color: '#7c3aed' },
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

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 60% at 20% -5%, rgba(124,58,237,0.1) 0%, #08080f 65%)',
    }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }} className="page-enter">

        {/* ── Header ──────────────────────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '27px', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Pricing
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.32)', marginTop: '7px', fontSize: '14px' }}>
            Choose the plan that works for you
          </p>
        </div>

        {/* ✅ Usage bar for free users */}
        {!isPro && (
          <div style={{
            padding: '18px 22px', borderRadius: '14px', marginBottom: '28px',
            background: usagePercent >= 80 ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${usagePercent >= 80 ? 'rgba(239,68,68,0.22)' : 'rgba(255,255,255,0.08)'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <p style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>Current Usage</p>
              <p style={{ fontSize: '12px', fontWeight: 700, color: usagePercent >= 80 ? '#fca5a5' : '#c4b5fd' }}>
                {monthlyTokens.toLocaleString()} / {tokenLimit == null ? '∞' : tokenLimit.toLocaleString()} tokens
              </p>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '999px', width: `${usagePercent}%`,
                background: usagePercent >= 80
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
            {usagePercent >= 80 && (
              <p style={{ color: '#fca5a5', fontSize: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚠️</span>
                You've used {usagePercent.toFixed(0)}% of your free tokens
              </p>
            )}
          </div>
        )}

        {/* ✅ Success notification — payment done + plan activated */}
        {success && (
          <div style={{
            padding: '16px 20px', borderRadius: '12px', marginBottom: '24px',
            background: 'rgba(16,185,129,0.09)', border: '1px solid rgba(16,185,129,0.22)',
          }} className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{ color: '#6ee7b7', fontSize: '13px', fontWeight: 600 }}>
                🎉 Payment successful — your Pro plan is now active!
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {paidTxnId && (
                <button
                  onClick={() => downloadReceiptAPI(paidTxnId)}
                  style={{
                    padding: '8px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 700,
                    background: 'rgba(110,231,183,0.12)', color: '#6ee7b7',
                    border: '1px solid rgba(110,231,183,0.3)', cursor: 'pointer',
                  }}
                >
                  ⬇ Download Receipt (PDF)
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 700,
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ⚠️ Error notification */}
        {errorMsg && (
          <div style={{
            padding: '14px 18px', borderRadius: '12px', marginBottom: '24px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5', fontSize: '13px', fontWeight: 600,
          }} className="fade-in">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ── Plan cards ───────────────────────────────────── */}
        {plansLoading && (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginBottom: '20px' }}>
            Loading plans…
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '760px', marginBottom: '24px' }}>
          {displayPlans.map((plan) => {
            const isCurrentPlan = user?.plan === plan.id
            const isSelected    = selected === plan.id
            const isPlanPro     = plan.id === 'pro'

            return (
              <div
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                style={{
                  position: 'relative', cursor: 'pointer', transition: 'all 0.2s ease',
                  borderRadius: '18px', padding: '28px',
                  background: isSelected
                    ? isPlanPro
                      ? 'linear-gradient(160deg, #1a1035 0%, #0f0f1a 100%)'
                      : 'linear-gradient(160deg, #16162a 0%, #0f0f1a 100%)'
                    : 'linear-gradient(160deg, #111120 0%, #0a0a14 100%)',
                  border: isSelected
                    ? `2px solid ${isPlanPro ? '#7c3aed' : 'rgba(255,255,255,0.3)'}`
                    : '2px solid rgba(255,255,255,0.07)',
                  boxShadow: isSelected && isPlanPro
                    ? '0 0 40px rgba(124,58,237,0.2), 0 4px 24px rgba(0,0,0,0.4)'
                    : '0 4px 24px rgba(0,0,0,0.3)',
                  transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                }}
              >
                {/* Popular badge */}
                {isPlanPro && (
                  <div style={{
                    position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
                    padding: '4px 16px', borderRadius: '0 0 10px 10px', fontSize: '10px', fontWeight: 800,
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: 'white',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    Most Popular
                  </div>
                )}

                {/* Radio + current badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', marginTop: isPlanPro ? '8px' : '0' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${isSelected ? '#7c3aed' : 'rgba(255,255,255,0.2)'}`,
                    background: isSelected ? '#7c3aed' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {isSelected && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'white' }} />}
                  </div>

                  {isCurrentPlan && (
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px',
                      background: 'rgba(16,185,129,0.14)', color: '#6ee7b7',
                      border: '1px solid rgba(16,185,129,0.25)',
                    }}>
                      Current Plan
                    </span>
                  )}
                </div>

                {/* Plan name + price */}
                <div style={{ marginBottom: '22px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                    {plan.name}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginBottom: '14px' }}>
                    {plan.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '42px', fontWeight: 800, color: 'white', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {plan.price}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.32)', fontSize: '13px' }}>/{plan.period}</span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '18px' }} />

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                        background: isPlanPro ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.07)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isPlanPro ? '#c4b5fd' : 'rgba(255,255,255,0.5)'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: '13px', lineHeight: '1.5' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── CTA button ───────────────────────────────────── */}
        <div style={{ maxWidth: '760px' }}>
          {selected !== user?.plan ? (
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{
                width: '100%', padding: '15px', borderRadius: '13px', fontSize: '15px', fontWeight: 800,
                color: 'white', border: 'none', fontFamily: 'Inter, sans-serif',
                background: loading
                  ? 'rgba(124,58,237,0.35)'
                  : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(124,58,237,0.4)',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {loading ? (
                <>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', animation: 'spin 0.7s linear infinite' }} />
                  {selected === 'pro' ? 'Opening secure checkout…' : 'Processing…'}
                </>
              ) : selected === 'pro' ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  {proPlan ? `Pay ₹${(proPlan.priceInPaise / 100).toFixed(proPlan.priceInPaise % 100 === 0 ? 0 : 2)} & Upgrade to Pro` : 'Upgrade to Pro'}
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                  </svg>
                  Confirm Downgrade to Free
                </>
              )}
            </button>
          ) : (
            <div style={{
              width: '100%', padding: '15px', borderRadius: '13px', textAlign: 'center',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.35)', fontSize: '14px', fontWeight: 500,
            }}>
              ✓ You are already on the {user?.plan === 'pro' ? 'Pro' : 'Free'} plan
            </div>
          )}

          {/* Fine print */}
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center', marginTop: '12px', lineHeight: '1.6' }}>
            {selected === 'pro'
              ? 'Secure payment via Razorpay · One-time payment · Lifetime access, no renewals'
              : 'Downgrading removes Pro access immediately'}
          </p>
        </div>

        {/* ── Billing history ──────────────────────────────── */}
        {transactions.length > 0 && (
          <div style={{ maxWidth: '760px', marginTop: '36px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '14px' }}>
              Billing History
            </h3>
            <div style={{
              borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)', overflow: 'hidden',
            }}>
              {transactions.map((txn, i) => (
                <div key={txn._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderBottom: i !== transactions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                  <div>
                    <p style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>
                      NeuralIQ Pro — ₹{(txn.amount / 100).toFixed(2)}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '2px' }}>
                      {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{txn.receiptNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadReceiptAPI(txn._id)}
                    style={{
                      padding: '7px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                      background: 'rgba(124,58,237,0.1)', color: '#c4b5fd',
                      border: '1px solid rgba(124,58,237,0.25)', cursor: 'pointer',
                    }}
                  >
                    ⬇ Receipt
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}