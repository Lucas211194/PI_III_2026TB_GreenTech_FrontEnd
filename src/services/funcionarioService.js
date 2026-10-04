import apiClient from '@/services/api'
import { extrairLista } from '@/services/apiHelpers'

export const funcionarioService = {
  // --- PERFIL DO UTILIZADOR AUTENTICADO ---
  async obterPerfil() {
    const res = await apiClient.get('/funcionarios/me/')
    return res.data
  },

  async atualizarPerfil(dados) {
    // Campos editáveis no back-end: nome_completo, cpf, telefone
    const res = await apiClient.patch('/funcionarios/me/', dados)
    return res.data
  },

  async alterarSenha(dados) {
    // Body esperado: { senha_atual, nova_senha, confirmar_senha }
    const res = await apiClient.post('/funcionarios/me/alterar-senha/', dados)
    return res.data
  },

  // --- LISTAGEM DE FUNCIONÁRIOS ---
  async listar() {
    const res = await apiClient.get('/funcionarios/')
    return extrairLista(res.data)
  },

  // --- AUDITORIA ---
  async listarAuditoria() {
    const res = await apiClient.get('/funcionarios/auditoria/')
    return extrairLista(res.data)
  },
}

export default funcionarioService