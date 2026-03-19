import { useState } from 'react'
import Sidebar from '../components/Sidebar'

export default function Settings({ activePage, setActivePage, user, onLogout }) {
  const [name, setName] = useState(user?.name || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1a0533 0%, #050816 60%)' }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-2">
          <span className="font-bold">NEURALIQ.</span>
          <span className="font-light"> Settings.</span>
        </h1>
        <p className="text-gray-400 mb-8">Manage your account settings.</p>

        <div className="max-w-xl flex flex-col gap-4">

          {/* Profile Card */}
          <div className="rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-white font-medium mb-4">Profile</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-3 px-4 rounded-xl outline-none text-white"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full py-3 px-4 rounded-xl text-gray-500 cursor-not-allowed"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                />
              </div>
              <button onClick={handleSave}
                className="py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                style={{ background: saved ? 'rgba(34,197,94,0.3)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                {saved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Account Info Card */}
          <div className="rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-white font-medium mb-4">Account</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Current Plan</span>
                <span className="text-purple-400 font-medium capitalize">{user?.plan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Tokens Used</span>
                <span className="text-white font-medium">{(user?.tokensUsed || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Documents Processed</span>
                <span className="text-white font-medium">{user?.documentsProcessed || 0}</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl p-6"
            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <h3 className="text-red-400 font-medium mb-4">Danger Zone</h3>
            <button onClick={onLogout}
              className="w-full py-3 rounded-xl font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.9)' }}>
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}