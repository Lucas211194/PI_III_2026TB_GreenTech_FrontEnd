import apiClient from '@/services/api'
import { extrairLista } from '@/services/apiHelpers'

export const estruturaService = {
  // ESTUFAS
  async listarEstufas() {
    const res = await apiClient.get('/estufa/')
    return extrairLista(res.data)
  },

  async obterEstufaPorId(id) {
    const res = await apiClient.get(`/estufa/${id}/`)
    return res.data
  },

  async criarEstufa(dados) {
    const res = await apiClient.post('/estufa/', dados)
    return res.data
  },

  async atualizarEstufa(id, dados) {
    const res = await apiClient.put(`/estufa/${id}/`, dados)
    return res.data
  },

  async excluirEstufa(id) {
    const res = await apiClient.delete(`/estufa/${id}/`)
    return res.data
  },

  // MESAS
  async listarMesas() {
    const res = await apiClient.get('/mesa/')
    return extrairLista(res.data)
  },

  async obterMesaPorId(id) {
    const res = await apiClient.get(`/mesa/${id}/`)
    return res.data
  },

  async criarMesa(dados) {
    const res = await apiClient.post('/mesa/', dados)
    return res.data
  },

  async atualizarMesa(id, dados) {
    const res = await apiClient.put(`/mesa/${id}/`, dados)
    return res.data
  },

  async excluirMesa(id) {
    const res = await apiClient.delete(`/mesa/${id}/`)
    return res.data
  },
}

export default estruturaService