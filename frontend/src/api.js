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
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
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

export const getUsageStatsAPI = async () => {
  const res = await fetch(`${BASE_URL}/chat/stats`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return res.json()
}

export const renameChatAPI = async (chatId, title) => {
  const res = await fetch(`${BASE_URL}/chat/${chatId}/rename`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ title })
  })
  return res.json()
}

export const deleteChatAPI = async (chatId) => {
  const res = await fetch(`${BASE_URL}/chat/${chatId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return res.json()
}

// ─── SUBSCRIPTION ─────────────────────────────────────────────
export const upgradeToProAPI = async () => {
  const res = await fetch(`${BASE_URL}/subscription/upgrade`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return res.json()
}

// ─── AVATAR ───────────────────────────────────────────────────
export const uploadAvatarAPI = async (file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  const res = await fetch(`${BASE_URL}/auth/avatar`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: formData
  })
  return res.json()
}

// ─── WORKSPACE ────────────────────────────────────────────────
export const getWorkspacesAPI = async () => {
  const res = await fetch(`${BASE_URL}/workspace`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return res.json()
}

export const createWorkspaceAPI = async (name) => {
  const res = await fetch(`${BASE_URL}/workspace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ name })
  })
  return res.json()
}

export const joinWorkspaceAPI = async (shareCode) => {
  const res = await fetch(`${BASE_URL}/workspace/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ shareCode })
  })
  return res.json()
}

export const addDocumentToWorkspaceAPI = async (workspaceId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: formData
  })
  return res.json()
}

export const chatWithWorkspaceAPI = async (workspaceId, message, history = []) => {
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ message, history })
  })
  return res.json()
}

export const renameWorkspaceAPI = async (workspaceId, name) => {
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}/rename`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ name })
  })
  return res.json()
}

export const deleteDocumentAPI = async (workspaceId, docIndex) => {
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}/documents/${docIndex}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return res.json()
}

export const deleteWorkspaceAPI = async (workspaceId) => {
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return res.json()
}

export const removeCollaboratorAPI = async (workspaceId, collabIndex) => {
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}/collaborator/${collabIndex}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return res.json()
}