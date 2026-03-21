/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Files from './pages/Files'
import Pricing from './pages/Pricing'
import Settings from './pages/Settings'
import Workspace from './pages/Workspace'
import Team from './pages/Team'

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)

  const handleLogout = useCallback(() => {
    localStorage.removeItem('neuraliq_token')
    localStorage.removeItem('neuraliq_user')
    setUser(null)
    setActivePage('Dashboard')
  }, [])

  const fetchUser = useCallback((token) => {
    fetch('https://nerual-ai.onrender.com/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted.current) return
        if (data.success) {
          setUser(data.user)
          localStorage.setItem('neuraliq_user', JSON.stringify(data.user))
        } else {
          handleLogout()
        }
        setLoading(false)
      })
      .catch(() => {
        if (!isMounted.current) return
        const savedUser = localStorage.getItem('neuraliq_user')
        if (savedUser) setUser(JSON.parse(savedUser))
        setLoading(false)
      })
  }, [handleLogout])

  useEffect(() => {
    isMounted.current = true

    const urlParams = new URLSearchParams(window.location.search)
    const googleToken = urlParams.get('token')
    if (googleToken) {
      localStorage.setItem('neuraliq_token', googleToken)
      window.history.replaceState({}, document.title, '/')
    }

    const token = googleToken || localStorage.getItem('neuraliq_token')
    if (token) {
      fetchUser(token)
    } else {
      setLoading(false)
    }

    return () => { isMounted.current = false }
  }, [fetchUser])

  const handleLogin = (userData, token) => {
    localStorage.setItem('neuraliq_token', token)
    localStorage.setItem('neuraliq_user', JSON.stringify(userData))
    setUser(userData)
  }

  const handleSetActivePage = useCallback((page) => {
    setActivePage(page)
    if (page === 'Dashboard') {
      const token = localStorage.getItem('neuraliq_token')
      if (token) fetchUser(token)
    }
  }, [fetchUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#050816' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', animation: 'pulse-glow 2s infinite' }}>
            <span className="text-white font-bold text-2xl">N</span>
          </div>
          <p className="text-purple-400 text-lg">Loading NEURALIQ...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Login onLogin={handleLogin} />

  const props = {
    activePage,
    setActivePage: handleSetActivePage,
    user,
    onLogout: handleLogout
  }

  const pages = {
    Chat:      <Chat {...props} />,
    Files:     <Files {...props} />,
    Pricing:   <Pricing {...props} />,
    Settings:  <Settings {...props} />,
    Workspace: <Workspace {...props} />,
    Team:      <Team {...props} />,
    Dashboard: <Dashboard {...props} />
  }

  return (
    <div key={activePage} className="page-transition">
      {pages[activePage] || <Dashboard {...props} />}
    </div>
  )
}

export default App