import apiClient from '@/services/api'
import { extrairLista } from '@/services/apiHelpers'

export const estoqueService = {
  // --- MOVIMENTAÇÕES DE LOTE (/estoque/) ---
  async listarMovimentacoesLote() {
    const res = await apiClient.get('/estoque/')
    return extrairLista(res.data)
  },

  async registrarMovimentacaoLote(dados) {
    const res = await apiClient.post('/estoque/', dados)
    return res.data
  },

  async excluirMovimentacaoLote(id) {
    const res = await apiClient.delete(`/estoque/${id}/`)
    return res.data
  },

  // --- INSUMOS (/insumos/) ---
  async listarInsumos() {
    const res = await apiClient.get('/insumos/')
    return extrairLista(res.data)
  },

  async obterInsumoPorId(id) {
    const res = await apiClient.get(`/insumos/${id}/`)
    return res.data
  },

  /**
   * Cadastra insumo garantindo integridade de histórico:
   * Cria o insumo com quantidade_atual: 0. Se houver quantidadeInicial > 0,
   * dispara imediatamente uma movimentação de Entrada em /movimentacoes-insumo/.
   */
  async criarInsumoComSaldo(dadosInsumo, quantidadeInicial = 0) {
    const payloadInsumo = {
      nome: dadosInsumo.nome,
      tipo: dadosInsumo.tipo,
      unidade: dadosInsumo.unidade,
      quantidade_atual: 0,
      estoque_minimo: dadosInsumo.estoque_minimo,
      validade: dadosInsumo.validade || null,
      fornecedor: dadosInsumo.fornecedor || null,
    }

    const insumoCriado = await apiClient.post('/insumos/', payloadInsumo)

    if (quantidadeInicial > 0) {
      try {
        await apiClient.post('/movimentacoes-insumo/', {
          insumo_id: insumoCriado.data.id,
          tipo_movimentacao: 'Entrada',
          quantidade: quantidadeInicial,
          motivo: 'Cadastro inicial de insumo',
          observacoes: 'Lançamento automático de saldo inicial',
        })
      } catch (errMov) {
        // Retorna o insumo criado com aviso para que a view informe o usuário
        return {
          ...insumoCriado.data,
          avisoMovimentacao: 'Insumo criado, mas a movimentação de saldo inicial falhou.',
          erroMovimentacao: errMov,
        }
      }
    }

    return insumoCriado.data
  },

  async atualizarInsumo(id, dados) {
    const res = await apiClient.put(`/insumos/${id}/`, dados)
    return res.data
  },

  async excluirInsumo(id) {
    const res = await apiClient.delete(`/insumos/${id}/`)
    return res.data
  },

  // --- MOVIMENTAÇÕES DE INSUMO (/movimentacoes-insumo/) ---
  async listarMovimentacoesInsumo() {
    const res = await apiClient.get('/movimentacoes-insumo/')
    return extrairLista(res.data)
  },

  async registrarMovimentacaoInsumo(dados) {
    const res = await apiClient.post('/movimentacoes-insumo/', dados)
    return res.data
  },

  async excluirMovimentacaoInsumo(id) {
    const res = await apiClient.delete(`/movimentacoes-insumo/${id}/`)
    return res.data
  },

  // --- NOTA FISCAL OCR ---
  async enviarOcrNota(formData) {
    const res = await apiClient.post('/estoque/ocr-nota-fiscal/', formData)
    return res.data
  },

  async confirmarLoteNota(payload) {
    const res = await apiClient.post('/estoque/confirmar-lote-nf/', payload)
    return res.data
  },
}

export default estoqueService