import apiClient from '@/services/api'

export const configuracaoService = {
  // { configurada, pode_editar, localizacao: { cidade, estado, pais, latitude, longitude, fuso_horario, ... } | null }
  async obterLocalizacao() {
    const res = await apiClient.get('/configuracao/localizacao/')
    return res.data
  },

  async salvarLocalizacao(dados) {
    const res = await apiClient.put('/configuracao/localizacao/', dados)
    return res.data
  },

  // Busca feita pelo backend na Geocoding API da Open-Meteo (sem chave); mínimo de 3 letras
  async buscarCidades(termo) {
    const res = await apiClient.get('/configuracao/cidades/', { params: { q: termo } })
    return res.data
  },
}

export default configuracaoService
