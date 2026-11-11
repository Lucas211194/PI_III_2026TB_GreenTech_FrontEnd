import apiClient from '@/services/api'
import { extrairLista } from '@/services/apiHelpers'

export const climaService = {
  // Leituras dos sensores das mesas, da mais recente para a mais antiga
  async listarLeituras() {
    const res = await apiClient.get('/clima/')
    return extrairLista(res.data).sort((a, b) => new Date(b.data_registro) - new Date(a.data_registro))
  },
}

export default climaService
