import apiClient from '@/services/api'
import { extrairLista } from '@/services/apiHelpers'

export const alertaService = {
  // Só os que ainda não foram resolvidos, do mais recente para o mais antigo
  async listarAtivos() {
    const res = await apiClient.get('/alertas/', { params: { status: 'ativo' } })
    return extrairLista(res.data)
  },

  async resolver(id) {
    const res = await apiClient.patch(`/alertas/${id}/resolver/`)
    return res.data
  },
}

export default alertaService
