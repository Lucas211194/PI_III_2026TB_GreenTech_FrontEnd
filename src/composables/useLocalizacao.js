import { computed, ref } from 'vue'
import { configuracaoService } from '@/services/configuracaoService'

/**
 * Cidade da propriedade, compartilhada entre as telas: carrega uma vez e, quando alguém salva em
 * Configurações, o clima do painel e os avisos das outras telas atualizam na hora.
 */
const estado = ref({ configurada: false, pode_editar: false, localizacao: null })
const carregado = ref(false)
const carregando = ref(false)
let pendente = null

async function carregar(forcar = false) {
  if (carregado.value && !forcar) return estado.value
  if (pendente) return pendente

  carregando.value = true
  pendente = configuracaoService.obterLocalizacao()
    .then((dados) => {
      estado.value = dados
      carregado.value = true
      return dados
    })
    .catch((err) => {
      // Sem resposta do servidor não dá para afirmar que falta configurar: não mostra o aviso
      console.error('Erro ao carregar a localização da propriedade:', err)
      return estado.value
    })
    .finally(() => {
      carregando.value = false
      pendente = null
    })
  return pendente
}

async function salvar(dados) {
  estado.value = await configuracaoService.salvarLocalizacao(dados)
  carregado.value = true
  return estado.value
}

export function rotuloCidade(localizacao) {
  if (!localizacao) return ''
  return localizacao.estado ? `${localizacao.cidade} - ${localizacao.estado}` : localizacao.cidade
}

export function useLocalizacao() {
  return {
    localizacao: computed(() => estado.value.localizacao),
    configurada: computed(() => estado.value.configurada),
    podeEditar: computed(() => estado.value.pode_editar),
    // Só verdadeiro depois de o servidor confirmar que não há cidade
    faltaConfigurar: computed(() => carregado.value && !estado.value.configurada),
    carregado,
    carregando,
    carregar,
    salvar,
    buscarCidades: configuracaoService.buscarCidades,
  }
}

export default useLocalizacao
