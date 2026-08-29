const API_BASE = 'http://127.0.0.1:8000'

function authHeaders() {
  const token = localStorage.getItem('access_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export async function checkHealth() {
  const response = await fetch(`${API_BASE}/api/health/`)
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`)
  }
  return response.json()
}

export function trackInteraction(targetType, targetId, interactionType) {
  fetch(`${API_BASE}/api/recs/interactions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      target_type: targetType,
      target_id: targetId,
      interaction_type: interactionType,
    }),
  }).catch(() => {})
}

// Commissions API
export async function createCommission(data) {
  const response = await fetch(`${API_BASE}/api/commissions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw await response.json()
  return response.json()
}

export async function fetchMyCommissions() {
  const response = await fetch(`${API_BASE}/api/commissions/mine/`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

export async function fetchCommissionInbox() {
  const response = await fetch(`${API_BASE}/api/commissions/inbox/`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

export async function fetchCommissionDetail(id) {
  const response = await fetch(`${API_BASE}/api/commissions/${id}/`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

export async function acceptCommission(id) {
  const response = await fetch(`${API_BASE}/api/commissions/${id}/accept/`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) throw await response.json()
  return response.json()
}

export async function declineCommission(id, reason) {
  const response = await fetch(`${API_BASE}/api/commissions/${id}/decline/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ rejection_reason: reason }),
  })
  if (!response.ok) throw await response.json()
  return response.json()
}

export async function approveCommission(id) {
  const response = await fetch(`${API_BASE}/api/commissions/${id}/approve/`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) throw await response.json()
  return response.json()
}

export async function requestRevision(id) {
  const response = await fetch(`${API_BASE}/api/commissions/${id}/revision/`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) throw await response.json()
  return response.json()
}

export async function cancelCommission(id) {
  const response = await fetch(`${API_BASE}/api/commissions/${id}/cancel/`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) throw await response.json()
  return response.json()
}
