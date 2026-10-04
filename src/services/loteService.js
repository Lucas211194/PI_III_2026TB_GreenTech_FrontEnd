import apiClient from '@/services/api'
import { extrairLista } from '@/services/apiHelpers'

export const loteService = {
  async listar() {
    const res = await apiClient.get('/lotes/')
    return extrairLista(res.data)
  },

  async obterPorId(id) {
    const res = await apiClient.get(`/lotes/${id}/`)
    return res.data
  },

  async criar(dados) {
    const res = await apiClient.post('/lotes/', dados)
    return res.data
  },

  async atualizar(id, dados) {
    const res = await apiClient.put(`/lotes/${id}/`, dados)
    return res.data
  },

  async atualizarParcial(id, dados) {
    const res = await apiClient.patch(`/lotes/${id}/`, dados)
    return res.data
  },

  async excluir(id) {
    const res = await apiClient.delete(`/lotes/${id}/`)
    return res.data
  },
}

export default loteService