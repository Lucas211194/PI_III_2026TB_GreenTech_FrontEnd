import apiClient from '@/services/api'
import { extrairLista } from '@/services/apiHelpers'

export const culturaService = {
  async listar() {
    const res = await apiClient.get('/cultura/')
    return extrairLista(res.data)
  },

  async obterPorId(id) {
    const res = await apiClient.get(`/cultura/${id}/`)
    return res.data
  },

  async criar(dados) {
    const res = await apiClient.post('/cultura/', dados)
    return res.data
  },

  async atualizar(id, dados) {
    const res = await apiClient.put(`/cultura/${id}/`, dados)
    return res.data
  },

  async excluir(id) {
    const res = await apiClient.delete(`/cultura/${id}/`)
    return res.data
  },
}

export default culturaService