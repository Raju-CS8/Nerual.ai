const BASE_URL = 'http://localhost:5000/api'
const getToken = () => localStorage.getItem('neuraliq_token')

// ─── AUTH ─────────────────────────────────────────────────────
export const signupAPI = async (name, email, password) => {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })
  return res.json()
}

export const loginAPI = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  return res.json()
}

export const getMeAPI = async () => {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return res.json()
}

// ─── CHAT ─────────────────────────────────────────────────────
export const sendMessageAPI = async (message, chatId = null, history = []) => {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ message, chatId, history })
  })
  return res.json()
}

export const getChatsAPI = async () => {
  const res = await fetch(`${BASE_URL}/chat/history`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return res.json()
}

export const getChatAPI = async (chatId) => {
  const res = await fetch(`${BASE_URL}/chat/${chatId}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return res.json()
}

// ─── USAGE STATS ──────────────────────────────────────────────
export const getUsageStatsAPI = async () => {
  const res = await fetch(`${BASE_URL}/chat/stats`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return res.json()
}
// SUBSCRIPTION
export const upgradeToProAPI = async () => {
  const res = await fetch(`${BASE_URL}/subscription/upgrade`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return res.json()
}