import apiClient from '@/services/api'
import { extrairLista } from '@/services/apiHelpers'

// Válvulas, registros de fluxo e decisões da IA de irrigação (RF10)
export const irrigacaoService = {
  async listarRegistros() {
    const res = await apiClient.get('/irrigacao/')
    return extrairLista(res.data)
  },

  async obterStatus() {
    const res = await apiClient.get('/irrigacao/status/')
    return res.data
  },

  // params: { limite, so_mudancas }
  async listarDecisoes(params) {
    const res = await apiClient.get('/irrigacao/decisoes-ia/', { params })
    return extrairLista(res.data)
  },

  async alterarModo(modo) {
    const res = await apiClient.post('/irrigacao/modo/', { modo })
    return res.data
  },

  async avaliar() {
    const res = await apiClient.post('/irrigacao/avaliar/')
    return extrairLista(res.data)
  },
}

export default irrigacaoService
