import apiClient from '@/services/api'
import { extrairLista } from '@/services/apiHelpers'

export const climaService = {
  // --- CLIMA / SENSORES AMBIENTAIS (/clima/) ---
  async listarLeiturasClima() {
    const res = await apiClient.get('/clima/')
    const lista = extrairLista(res.data)
    // O back-end não possui ordenação nativa; ordenamos decrescente por data
    return lista.sort((a, b) => new Date(b.data_registro) - new Date(a.data_registro))
  },

  async registrarLeituraClima(dados) {
    const res = await apiClient.post('/clima/', dados)
    return res.data
  },

  async excluirLeituraClima(id) {
    const res = await apiClient.delete(`/clima/${id}/`)
    return res.data
  },

  // --- TELEMETRIA DE IRRIGAÇÃO (/irrigacao/) ---
  async listarLeiturasIrrigacao() {
    const res = await apiClient.get('/irrigacao/')
    const lista = extrairLista(res.data)
    return lista.sort((a, b) => new Date(b.data_registro) - new Date(a.data_registro))
  },

  async registrarLeituraIrrigacao(dados) {
    const res = await apiClient.post('/irrigacao/', dados)
    return res.data
  },

  async excluirLeituraIrrigacao(id) {
    const res = await apiClient.delete(`/irrigacao/${id}/`)
    return res.data
  },
}

export default climaService