import { useAuthStore } from '@/stores/auth'

/**
 * Utilitário para verificar permissões do usuário logado.
 * Lê diretamente do useAuthStore (evitando requisições desnecessárias)
 * e mantém a assinatura de retorno esperada pelas views legadas.
 *
 * @returns {Promise<{ isAdmin: boolean, isGerente: boolean, usuario: Object }>}
 */
export async function verificarPermissao() {
  const authStore = useAuthStore()

  // Se o perfil ainda não foi carregado na memória, tenta carregar
  if (!authStore.perfil && authStore.token) {
    await authStore.carregarPerfil()
  }

  const usuario = authStore.dadosUsuario

  return {
    isAdmin: Boolean(authStore.isAdmin),
    isGerente: Boolean(authStore.isGerente),
    usuario: usuario || {},
  }
}

export default verificarPermissao