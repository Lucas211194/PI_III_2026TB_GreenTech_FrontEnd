import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token JWT nas requisições
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Deixar o Axios gerenciar o Content-Type para FormData (com boundary correto)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Interceptor para renovar token quando expirar (401)
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const ehLogin = originalRequest?.url?.includes('/token/')

    if (error.response?.status === 401 && !originalRequest._retry && !ehLogin) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshTokenValue = localStorage.getItem('refresh_token')

      if (!refreshTokenValue) {
        isRefreshing = false
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('usuario')
        // B03: A rota raiz / é a tela de login
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshTokenValue,
        })

        const { access } = response.data
        localStorage.setItem('access_token', access)

        apiClient.defaults.headers.common.Authorization = `Bearer ${access}`
        originalRequest.headers.Authorization = `Bearer ${access}`

        processQueue(null, access)
        return apiClient(originalRequest)
      } catch (refreshError) {
        // B04: Rejeita todas as requisições que aguardavam na fila
        processQueue(refreshError, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('usuario')
        // B03: Redireciona para / (rota de login real)
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh_token')
  if (!refresh) throw new Error('No refresh token')

  const response = await axios.post(`${API_BASE_URL}/token/refresh/`, { refresh })
  const { access } = response.data
  localStorage.setItem('access_token', access)
  return access
}

export default apiClient