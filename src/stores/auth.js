import { defineStore } from 'pinia'
import apiClient from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    usuario: JSON.parse(localStorage.getItem('usuario') || 'null'),
    perfil: null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isAdmin: (state) => Boolean(state.perfil?.is_admin || state.usuario?.is_admin),
    isGerente: (state) => Boolean(state.perfil?.is_gerente || state.usuario?.is_gerente),
    dadosUsuario: (state) => state.perfil || state.usuario || {},
  },

  actions: {
    setLoginData(dados) {
      this.token = dados.access
      this.refreshToken = dados.refresh

      localStorage.setItem('access_token', dados.access)
      localStorage.setItem('refresh_token', dados.refresh)

      if (dados.usuario) {
        this.usuario = dados.usuario
        localStorage.setItem('usuario', JSON.stringify(dados.usuario))
      }
    },

    async carregarPerfil() {
      if (!this.token) return null

      try {
        const res = await apiClient.get('/funcionarios/me/')
        this.perfil = res.data
        this.usuario = {
          ...this.usuario,
          ...res.data,
        }
        localStorage.setItem('usuario', JSON.stringify(this.usuario))
        return res.data
      } catch (err) {
        console.error('Erro ao carregar dados do perfil:', err)
        return null
      }
    },

    async logout() {
      const refresh = this.refreshToken || localStorage.getItem('refresh_token')

      if (refresh) {
        try {
          await apiClient.post('/logout/', { refresh })
        } catch (err) {
          // Falhas de rede na chamada de blacklist não bloqueiam a saída local
          console.warn('Não foi possível invalidar o token no servidor:', err)
        }
      }

      this.token = null
      this.refreshToken = null
      this.usuario = null
      this.perfil = null

      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('usuario')

      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    },
  },
})

export default useAuthStore