import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Auth ────────────────────────────────────────────────
export const login = (username, password) =>
  api.post('/auth/token/', { username, password })

// ─── Status ──────────────────────────────────────────────
export const getStatus = () => api.get('/ingest/status/')

// ─── Analytics ───────────────────────────────────────────
export const getSalesTrend = (granularity = 'daily', days = 90) =>
  api.get(`/analytics/sales-trend/?granularity=${granularity}&days=${days}`)

export const getCategorySummary = (days = 90) =>
  api.get(`/analytics/category-summary/?days=${days}`)

export const getTopProducts = (days = 30, limit = 10) =>
  api.get(`/analytics/top-products/?days=${days}&limit=${limit}`)

export const getStorePerformance = (days = 90) =>
  api.get(`/analytics/store-performance/?days=${days}`)

export const getSeasonality = () =>
  api.get('/analytics/seasonality/')

// ─── Products ────────────────────────────────────────────
export const getProducts = () => api.get('/products/items/')
export const getStores   = () => api.get('/products/stores/')

// ─── Forecasting ─────────────────────────────────────────
export const runForecast = (product_id, store_id, horizon = 30) =>
  api.post('/forecast/run/', { product_id, store_id, horizon })

export const getForecast = (product_id, store_id, model_type = 'ensemble') =>
  api.get(`/forecast/results/?product_id=${product_id}&store_id=${store_id}&model_type=${model_type}`)
export const getAnomalies = (days = 90, severity = 'all', limit = 50) =>
  api.get(`/analytics/anomalies/?days=${days}&severity=${severity}&limit=${limit}`)