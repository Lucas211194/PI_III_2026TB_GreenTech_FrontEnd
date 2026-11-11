import apiClient from '@/services/api'
import { extrairLista } from '@/services/apiHelpers'

export const loteService = {
  async listar() {
    const res = await apiClient.get('/lotes/')
    return extrairLista(res.data)
  },

  async criar(dados) {
    const res = await apiClient.post('/lotes/', dados)
    return res.data
  },

  // dados: { quantidade, motivo }
  async registrarPerda(id, dados) {
    const res = await apiClient.post(`/lotes/${id}/registrar_perda/`, dados)
    return res.data
  },

  async excluir(id) {
    const res = await apiClient.delete(`/lotes/${id}/`)
    return res.data
  },
}

export default loteService