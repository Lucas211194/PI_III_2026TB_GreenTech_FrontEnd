import apiClient from '@/services/api'
import { extrairLista } from '@/services/apiHelpers'

export const colheitaService = {
  async listar() {
    const res = await apiClient.get('/colheita/')
    return extrairLista(res.data)
  },

  async obterPorId(id) {
    const res = await apiClient.get(`/colheita/${id}/`)
    return res.data
  },

  /**
   * Registra uma nova colheita.
   * O back-end define automaticamente o funcionário autenticado e a data_colheita,
   * marca o lote como 'CO' e zera a sua quantidade.
   *
   * @param {Object} dados { lote_id, quantidade_colhida, quantidade_perda }
   */
  async registrarColheita(dados) {
    const payload = {
      lote_id: dados.lote_id,
      quantidade_colhida: dados.quantidade_colhida,
      quantidade_perda: dados.quantidade_perda || 0,
    }
    const res = await apiClient.post('/colheita/', payload)
    return res.data
  },
}

export default colheitaService