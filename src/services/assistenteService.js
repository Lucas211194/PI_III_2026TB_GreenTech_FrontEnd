import apiClient from '@/services/api'

export const assistenteService = {
  async perguntar(mensagem) {
    const res = await apiClient.post('/ia/chat-assistant/', { mensagem })
    return res.data
  },
}

export default assistenteService
