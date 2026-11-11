import apiClient from '@/services/api'

export const authService = {
  // Devolve { access, refresh }
  async entrar(username, password) {
    const res = await apiClient.post('/token/', { username, password })
    return res.data
  },

  // Invalida o refresh token no servidor (blacklist)
  async sair(refresh) {
    await apiClient.post('/logout/', { refresh })
  },
}

export default authService
