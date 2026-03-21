import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { uploadAvatarAPI, updateNameAPI } from '../api'

export default function Settings({ activePage, setActivePage, user, setUser, onLogout }) {
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState(user?.avatar || null)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(user?.name || '')
  const [savingName, setSavingName] = useState(false)

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)
    setUploading(true)
    try {
      const data = await uploadAvatarAPI(file)
      if (data.success) {
        localStorage.setItem('neuraliq_user', JSON.stringify(data.user))
        if (setUser) setUser(data.user)
        setSuccess('Profile picture updated!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch {
      alert('Upload failed')
    }
    setUploading(false)
  }

  const handleNameSave = async () => {
    if (!newName.trim() || newName.trim() === user?.name) {
      setEditingName(false)
      return
    }
    setSavingName(true)
    try {
      const data = await updateNameAPI(newName.trim())
      if (data.success) {
        localStorage.setItem('neuraliq_user', JSON.stringify(data.user))
        if (setUser) setUser(data.user)
        setSuccess('Name updated!')
        setTimeout(() => setSuccess(''), 3000)
        setEditingName(false)
      } else {
        alert(data.error || 'Could not update name')
      }
    } catch {
      alert('Could not update name')
    }
    setSavingName(false)
  }

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1a0533 0%, #050816 60%)' }}>

      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} />

      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          <span className="font-bold">NEURALIQ.</span>
          <span className="font-light"> Settings.</span>
        </h1>
        <p className="text-gray-400 mb-8">Manage your account settings</p>

        {success && (
          <div className="mb-6 px-5 py-4 rounded-xl text-green-400 font-medium"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            ✅ {success}
          </div>
        )}

        {/* Profile Card */}
        <div className="rounded-2xl p-6 mb-6 max-w-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-white font-semibold mb-6">Profile Settings</h2>

          {/* Avatar Upload */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              {preview ? (
                <img src={preview} alt="avatar"
                  className="w-20 h-20 rounded-full object-cover"
                  style={{ border: '3px solid rgba(124,58,237,0.5)' }} />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: '3px solid rgba(124,58,237,0.5)' }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all hover:opacity-80"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                <span className="text-white text-xs">✏️</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div>
              <p className="text-white font-medium">{user?.name}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <p className="text-purple-400 text-xs mt-1">{user?.plan === 'pro' ? '⭐ Pro Plan' : '🆓 Free Plan'}</p>
              {uploading && <p className="text-cyan-400 text-xs mt-1">Uploading...</p>}
            </div>
          </div>

          {/* Upload Button */}
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white cursor-pointer transition-all hover:opacity-80"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
            📷 Change Profile Picture
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
          <p className="text-gray-600 text-xs mt-2">Max 5MB — JPG, PNG, WEBP supported</p>
        </div>

        {/* Account Info */}
        <div className="rounded-2xl p-6 max-w-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-white font-semibold mb-4">Account Info</h2>

          <div className="flex flex-col gap-3">

            {/* ✅ Editable Name */}
            <div className="flex items-center justify-between py-3 px-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-gray-400 text-sm">Full Name</span>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                    className="bg-transparent text-white text-sm border-b border-purple-400 outline-none px-1"
                    autoFocus />
                  <button onClick={handleNameSave} disabled={savingName}
                    className="text-xs px-2 py-1 rounded-lg text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                    {savingName ? '...' : 'Save'}
                  </button>
                  <button onClick={() => { setEditingName(false); setNewName(user?.name) }}
                    className="text-xs px-2 py-1 rounded-lg text-gray-400"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">{user?.name}</span>
                  <button onClick={() => setEditingName(true)}
                    className="text-xs px-2 py-1 rounded-lg text-purple-400 hover:opacity-80"
                    style={{ background: 'rgba(124,58,237,0.1)' }}>
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-gray-400 text-sm">Email</span>
              <span className="text-white text-sm font-medium">{user?.email}</span>
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-gray-400 text-sm">Plan</span>
              <span className="text-sm font-medium"
                style={{ color: user?.plan === 'pro' ? '#a78bfa' : '#6b7280' }}>
                {user?.plan === 'pro' ? '⭐ Pro' : '🆓 Free'}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-gray-400 text-sm">Tokens Used</span>
              <span className="text-white text-sm font-medium">
                {(user?.tokensUsed || 0).toLocaleString()}
                {user?.plan !== 'pro' && ' / 1,00,000'}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-gray-400 text-sm">Documents Processed</span>
              <span className="text-white text-sm font-medium">{user?.documentsProcessed || 0}</span>
            </div>
          </div>

          <button onClick={onLogout}
            className="w-full mt-6 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.8)' }}>
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  )
}