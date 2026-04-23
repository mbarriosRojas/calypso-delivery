'use client'

export function saveSession(token: string, user: { role: string }) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export function getSession() {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem('user')
  const token = localStorage.getItem('token')
  if (!token || !user) return null
  return { token, user: JSON.parse(user) as { id: string; email: string; role: string; driverCode: string | null } }
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export function isCoordinator() {
  return getSession()?.user.role === 'COORDINATOR'
}
