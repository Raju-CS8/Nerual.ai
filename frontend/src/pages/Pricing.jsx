import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { upgradeToProAPI } from '../api'

export default function Pricing({ activePage, setActivePage, user, onLogout }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [selected, setSelected] = useState(user?.plan || 'free')

  const handleUpgrade = async () => {
    if (selected === user?.plan) return

    setLoading(true)
    try {
      if (selected === 'pro') {
        const data = await upgradeToProAPI()
        if (data.success) {
          localStorage.setItem('neuraliq_user', JSON.stringify(data.user))
          setSuccess(true)
          setTimeout(() => window.location.reload(), 2000)
        }
      } else {
        // Downgrade to free
        const token = localStorage.getItem('neuraliq_token')
        const res = await fetch('https://nerual-ai.onrender.com/api/subscription/downgrade', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.success) {
          localStorage.setItem('neuraliq_user', JSON.stringify(data.user))
          setSuccess(true)
          setTimeout(() => window.location.reload(), 2000)
        }
      }
    } catch {
      alert('Failed. Try again.')
    }
    setLoading(false)
  }

  const FREE_LIMIT = 100000
  const usagePercent = Math.min(((user?.tokensUsed || 0) / FREE_LIMIT) * 100, 100)

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: 'forever',
      features: [
        '1,00,000 tokens/month',
        '10 file uploads',
        'Basic AI chat (LLaMA)',
        'PDF summarization',
        'Chat history',
        'Community support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '₹499',
      period: 'per month',
      highlighted: true,
      features: [
        'Unlimited tokens',
        'Unlimited file uploads',
        'Advanced LLaMA AI (2x response length)',
        'Advanced PDF analysis',
        'Full chat history',
        'Priority support',
        'Early access to new features'
      ]
    }
  ]

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1a0533 0%, #050816 60%)' }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-2">
          <span className="font-bold">NEURALIQ.</span>
          <span className="font-light"> Pricing.</span>
        </h1>
        <p className="text-gray-400 mb-6">Choose the plan that works for you.</p>

        {/* Current Usage Bar */}
        {user?.plan === 'free' && (
          <div className="rounded-2xl p-5 mb-6"
            style={{
              background: usagePercent >= 80 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${usagePercent >= 80 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">Current Usage</span>
              <span className={`text-sm font-bold ${usagePercent >= 80 ? 'text-red-400' : 'text-purple-400'}`}>
                {(user?.tokensUsed || 0).toLocaleString()} / {FREE_LIMIT.toLocaleString()} tokens
              </span>
            </div>
            <div className="w-full h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${usagePercent}%`,
                  background: usagePercent >= 80
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                    : 'linear-gradient(90deg, #7c3aed, #06b6d4)'
                }} />
            </div>
            {usagePercent >= 80 && (
              <p className="text-red-400 text-sm mt-2">
                ⚠️ You've used {usagePercent.toFixed(0)}% of your free tokens!
              </p>
            )}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="rounded-xl p-4 mb-6 text-green-400 font-medium"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            🎉 Plan updated successfully! Reloading...
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-2 gap-6 max-w-3xl mb-6">
          {plans.map((plan) => {
            const isCurrentPlan = user?.plan === plan.id
            const isSelected = selected === plan.id

            return (
              <div
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className="rounded-2xl p-8 flex flex-col gap-4 cursor-pointer transition-all"
                style={{
                  background: isSelected
                    ? plan.id === 'pro' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.08)'
                    : 'rgba(255,255,255,0.03)',
                  border: isSelected
                    ? `2px solid ${plan.id === 'pro' ? '#7c3aed' : 'rgba(255,255,255,0.4)'}`
                    : '2px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: isSelected && plan.id === 'pro' ? '0 0 40px rgba(124,58,237,0.3)' : 'none',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}>

                {/* Selected indicator */}
                <div className="flex items-center justify-between">
                  {plan.highlighted && (
                    <span className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.4)' }}>
                      ⭐ Most Popular
                    </span>
                  )}
                  {!plan.highlighted && <span />}

                  {/* Radio indicator */}
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      border: `2px solid ${isSelected ? '#7c3aed' : 'rgba(255,255,255,0.2)'}`,
                      background: isSelected ? '#7c3aed' : 'transparent'
                    }}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                    {isCurrentPlan && (
                      <span className="text-xs px-2 py-1 rounded-full text-green-400"
                        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-500 mb-1">/{plan.period}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-green-400 text-sm">✓</span>
                      <span className="text-gray-300 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Confirm Button */}
        <div className="max-w-3xl">
          {selected !== user?.plan ? (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90"
              style={{
                background: loading
                  ? 'rgba(124,58,237,0.4)'
                  : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                boxShadow: '0 0 30px rgba(124,58,237,0.3)'
              }}>
              {loading ? 'Processing...' :
                selected === 'pro'
                  ? '⭐ Confirm Upgrade to Pro — ₹499/mo'
                  : '🔄 Confirm Downgrade to Free'}
            </button>
          ) : (
            <div className="w-full py-4 rounded-xl text-center text-gray-500"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              ✓ You are already on the {user?.plan === 'pro' ? 'Pro' : 'Free'} plan
            </div>
          )}
        </div>
      </div>
    </div>
  )
}