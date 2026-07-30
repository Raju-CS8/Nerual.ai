const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const getToken = () => localStorage.getItem('neuraliq_token')

// ─── Token expiry handler ─────────────────────────────────────
// If any API returns 401, clear storage and reload to login
const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('neuraliq_token')
    localStorage.removeItem('neuraliq_user')
    localStorage.removeItem('neuraliq_page')
    window.location.reload()
    return {}
  }
  return res.json()
}

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
  return handleResponse(res)
}

export const updateNameAPI = async (name) => {
  const res = await fetch(`${BASE_URL}/auth/name`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ name })
  })
  return handleResponse(res)
}

// ─── CHAT ─────────────────────────────────────────────────────
export const sendMessageAPI = async (message, chatId = null, history = []) => {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ message, chatId, history })
  })
  return handleResponse(res)
}

export const getChatsAPI = async () => {
  const res = await fetch(`${BASE_URL}/chat/history`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

export const getChatAPI = async (chatId) => {
  const res = await fetch(`${BASE_URL}/chat/${chatId}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

export const getUsageStatsAPI = async () => {
  const res = await fetch(`${BASE_URL}/chat/stats`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

// Current-month usage vs. the user's plan limit — DB-driven (limit
// comes from the Plan collection on the backend, never hardcoded here)
export const getUsageSummaryAPI = async () => {
  const res = await fetch(`${BASE_URL}/chat/usage-summary`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

export const renameChatAPI = async (chatId, title) => {
  const res = await fetch(`${BASE_URL}/chat/${chatId}/rename`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ title })
  })
  return handleResponse(res)
}

export const deleteChatAPI = async (chatId) => {
  const res = await fetch(`${BASE_URL}/chat/${chatId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

// ─── ADMIN BILLING DASHBOARD ─────────────────────────────────────
// All of these require isAdmin === true on the backend (requireAdmin
// middleware) — a non-admin token gets a 403, regardless of what the
// frontend shows or hides.
export const getAdminOverviewAPI = async () => {
  const res = await fetch(`${BASE_URL}/admin/overview`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

export const getAdminRevenueChartAPI = async (months = 6) => {
  const res = await fetch(`${BASE_URL}/admin/revenue-chart?months=${months}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

export const getAdminDailyRevenueChartAPI = async (days = 30) => {
  const res = await fetch(`${BASE_URL}/admin/daily-revenue-chart?days=${days}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

export const getAdminTransactionsAPI = async ({ status = 'paid', page = 1, limit = 20 } = {}) => {
  const res = await fetch(`${BASE_URL}/admin/transactions?status=${status}&page=${page}&limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

export const getAdminAuditLogsAPI = async ({ eventType = 'all', page = 1, limit = 30 } = {}) => {
  const res = await fetch(`${BASE_URL}/admin/audit-logs?eventType=${eventType}&page=${page}&limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

// ─── SUBSCRIPTION / PAYMENTS ────────────────────────────────────
// Pricing is DB-driven — fetch it instead of hardcoding a ₹ figure.
// No auth required (this is a public pricing endpoint).
export const getPlansAPI = async () => {
  const res = await fetch(`${BASE_URL}/subscription/plans`)
  return res.json()
}

// Step 1: ask backend to create a Razorpay order (amount is decided
// server-side, never trust a client-supplied amount). planId defaults
// to 'pro' on the backend if omitted, so existing calls with no args
// keep working exactly as before.
export const createOrderAPI = async (planId) => {
  const res = await fetch(`${BASE_URL}/subscription/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(planId ? { planId } : {})
  })
  return handleResponse(res)
}

// Step 2: after Razorpay Checkout succeeds, send the payment proof
// back so the backend can verify the signature and activate Pro
export const verifyPaymentAPI = async (payload) => {
  const res = await fetch(`${BASE_URL}/subscription/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(payload)
  })
  return handleResponse(res)
}

export const downgradeToFreeAPI = async () => {
  const res = await fetch(`${BASE_URL}/subscription/downgrade`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

export const getTransactionsAPI = async () => {
  const res = await fetch(`${BASE_URL}/subscription/transactions`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

// Receipts are a PDF file stream, not JSON — trigger a browser download
export const downloadReceiptAPI = async (transactionId) => {
  const res = await fetch(`${BASE_URL}/subscription/receipt/${transactionId}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  if (!res.ok) throw new Error('Could not download receipt')
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `NeuralIQ_Receipt.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
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
  return handleResponse(res)
}

// ─── WORKSPACE ────────────────────────────────────────────────
export const getWorkspacesAPI = async () => {
  const res = await fetch(`${BASE_URL}/workspace`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

export const createWorkspaceAPI = async (name) => {
  const res = await fetch(`${BASE_URL}/workspace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ name })
  })
  return handleResponse(res)
}

export const joinWorkspaceAPI = async (shareCode) => {
  const res = await fetch(`${BASE_URL}/workspace/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ shareCode })
  })
  return handleResponse(res)
}

export const addDocumentToWorkspaceAPI = async (workspaceId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: formData
  })
  return handleResponse(res)
}

export const chatWithWorkspaceAPI = async (workspaceId, message, history = []) => {
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ message, history })
  })
  return handleResponse(res)
}

export const renameWorkspaceAPI = async (workspaceId, name) => {
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}/rename`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ name })
  })
  return handleResponse(res)
}

export const deleteDocumentAPI = async (workspaceId, docIndex) => {
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}/documents/${docIndex}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

export const deleteWorkspaceAPI = async (workspaceId) => {
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

export const removeCollaboratorAPI = async (workspaceId, collabIndex) => {
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}/collaborator/${collabIndex}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

export const leaveWorkspaceAPI = async (workspaceId) => {
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}/leave`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

export const clearChatHistoryAPI = async (workspaceId) => {
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}/messages`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return handleResponse(res)
}

export const updateCollaboratorRoleAPI = async (workspaceId, collabId, role, status) => {
  const res = await fetch(`${BASE_URL}/workspace/${workspaceId}/collaborator/${collabId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ role, status })
  })
  return handleResponse(res)
}