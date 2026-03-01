import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('giftsync_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// При 401 — очищаем токен и редиректим
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isAuthRoute = window.location.pathname.startsWith('/login') ||
                          window.location.pathname.startsWith('/register')
      if (!isAuthRoute) {
        localStorage.removeItem('giftsync_token')
        localStorage.removeItem('giftsync_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}

// ── Wishlists ───────────────────────────────────────────────
export const wishlistApi = {
  list: () => api.get('/wishlists'),
  get: (slug: string) => api.get(`/wishlists/${slug}`),
  create: (data: { title: string; description?: string; event_date?: string; is_public?: boolean }) =>
    api.post('/wishlists', data),
  update: (id: string, data: object) => api.put(`/wishlists/${id}`, data),
  delete: (id: string) => api.delete(`/wishlists/${id}`),
}

// ── Items ───────────────────────────────────────────────────
export const itemApi = {
  add: (slug: string, data: object) => api.post(`/wishlists/${slug}/items`, data),
  update: (id: string, data: object) => api.put(`/items/${id}`, data),
  delete: (id: string) => api.delete(`/items/${id}`),
  updatePosition: (id: string, position: number) =>
    api.patch(`/items/${id}/position`, { position }),
}

// ── Contributions ───────────────────────────────────────────
export const contributionApi = {
  contribute: (itemId: string, data: object) =>
    api.post(`/items/${itemId}/contribute`, data),
  heroBuy: (itemId: string, data: object) =>
    api.post(`/items/${itemId}/hero`, data),
  cancel: (contributionId: string, guestSessionId: string) =>
    api.delete(`/contributions/${contributionId}?guest_session_id=${guestSessionId}`),
}

// ── Parse ───────────────────────────────────────────────────
export const parseApi = {
  parse: (url: string) => api.post('/parse', { url }),
}