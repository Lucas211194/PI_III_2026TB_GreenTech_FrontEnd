<template>
  <div class="previsao-estoque-widget">
    <div class="widget-header">
      <div class="titulo-grupo">
        <span class="material-symbols-outlined icone-widget">trending_down</span>
        <div>
          <h3>Previsão de Esgotamento de Estoque</h3>
          <p class="subtitulo">Projeção do consumo de cada insumo com o modelo Prophet</p>
        </div>
      </div>
      <button
        v-if="FEATURES.previsaoEstoque"
        class="btn-recarregar"
        :disabled="carregando"
        title="Atualizar previsões"
        @click="carregarPrevisoes(true)"
      >
        <span class="material-symbols-outlined" :class="{ 'anim-spin': carregando }">refresh</span>
      </button>
    </div>

    <!-- FLAG DESLIGADA: MÓDULO EM STAND-BY -->
    <RecursoIndisponivel
      v-if="!FEATURES.previsaoEstoque"
      icone="query_stats"
      titulo="Previsão de Estoque em Stand-by"
      mensagem="As estimativas preditivas de consumo serão liberadas assim que o back-end disponibilizar a rota /estoque/previsao-prophet/."
    />

    <!-- FLAG LIGADA: OPERAÇÃO REAL -->
    <div v-else class="widget-conteudo">
      <!-- CARREGANDO -->
      <EstadoCarregamento v-if="carregando" mensagem="Calculando projeções de consumo..." />

      <!-- ERRO -->
      <ErroCarregamento
        v-else-if="erroCarregamento"
        :mensagem="erroCarregamento"
        @tentar-novamente="carregarPrevisoes()"
      />

      <!-- LISTA DE ITENS PREDITOS -->
      <div v-else-if="previsoes.length > 0" class="lista-previsoes">
        <div v-for="item in previsoes" :key="item.id" class="card-item-previsao">
          <div class="item-cabecalho">
            <div>
              <h4 class="item-nome">{{ item.nome }}</h4>
              <span class="item-categoria">{{ item.categoria || 'Geral' }}</span>
            </div>
            <span :class="['badge-dias', classeCriticidade(item.diasRestantes)]">
              {{ formatarDiasRestantes(item) }}
            </span>
          </div>

          <div class="item-barra-wrapper">
            <div class="barra-fundo">
              <div
                class="barra-preenchimento"
                :class="classeBarra(item.percentualRestante)"
                :style="{ width: `${Math.min(Math.max(item.percentualRestante || 0, 0), 100)}%` }"
              ></div>
            </div>
          </div>

          <div class="item-rodape">
            <span class="saldo-atual">
              Saldo: <strong>{{ formatarNumero(item.quantidadeAtual) }} {{ item.unidade }}</strong>
            </span>
            <span v-if="item.dataEstimada" class="data-estimada">
              Zero estimado em: {{ formatarData(item.dataEstimada) }}
            </span>
          </div>

          <div v-if="item.estoqueMinimoEm" :class="['item-compra', { urgente: item.diasAteMinimo <= 0 }]">
            <span class="material-symbols-outlined">shopping_cart</span>
            <span v-if="item.diasAteMinimo <= 0">
              Abaixo do mínimo ({{ formatarNumero(item.estoqueMinimo) }} {{ item.unidade }}): comprar agora
            </span>
            <span v-else>Comprar até {{ formatarData(item.estoqueMinimoEm) }}, antes de chegar ao mínimo</span>
          </div>

          <div class="item-modelo" :title="item.observacao || ''">
            <span :class="['badge-modelo', `modelo-${item.modelo}`]">{{ item.modeloNome || item.modelo }}</span>
            <span v-if="parseNumero(item.consumoMedioDiario) > 0">
              ~{{ formatarNumero(item.consumoMedioDiario) }} {{ item.unidade }}/dia previsto
            </span>
            <span v-else-if="item.observacao">{{ item.observacao }}</span>
          </div>
        </div>
      </div>

      <router-link
        v-if="compacto && previsoes.length > 0"
        :to="{ name: 'estoque', query: { aba: 'insumos' } }"
        class="link-ver-todos"
      >
        Ver previsão de todos os insumos &rarr;
      </router-link>

      <!-- VAZIO -->
      <EstadoVazio v-else compacto icone="inventory_2" texto="Nenhum insumo cadastrado para projetar o consumo." />
    </div>
  </div>
</template>

<script setup>
import EstadoVazio from '@/components/EstadoVazio.vue'
import EstadoCarregamento from '@/components/EstadoCarregamento.vue'
import { ref, onMounted } from 'vue'
import RecursoIndisponivel from '@/components/RecursoIndisponivel.vue'
import ErroCarregamento from '@/components/ErroCarregamento.vue'
import estoqueService from '@/services/estoqueService'
import { formatarData, mensagemDeErro, parseNumero } from '@/services/apiHelpers'
import { FEATURES } from '@/config/features'

const props = defineProps({
  // Quantos insumos mostrar (os mais críticos primeiro); vazio mostra todos
  limite: { type: Number, default: null },
  // Versão resumida para o dashboard, com link para a lista completa no Estoque
  compacto: { type: Boolean, default: false },
})

const previsoes = ref([])
const carregando = ref(false)
const erroCarregamento = ref('')

async function carregarPrevisoes(recalcular = false) {
  if (!FEATURES.previsaoEstoque) return

  carregando.value = true
  erroCarregamento.value = ''

  const params = {}
  if (props.limite) params.limite = props.limite
  if (recalcular) params.recalcular = 1

  try {
    previsoes.value = await estoqueService.listarPrevisoes(params)
  } catch (err) {
    erroCarregamento.value = mensagemDeErro(
      err,
      'Não foi possível obter os dados de previsão de estoque.',
    )
  } finally {
    carregando.value = false
  }
}

function formatarDiasRestantes(item) {
  if (item.diasRestantes === null || item.diasRestantes === undefined) {
    return item.modelo === 'sem_consumo' ? 'Sem consumo' : 'Mais de 1 ano'
  }
  const d = Number(item.diasRestantes)
  if (Number.isNaN(d)) return 'Indefinido'
  if (d <= 0) return 'Esgotado'
  if (d === 1) return '1 dia restante'
  return `${d} dias restantes`
}

function classeCriticidade(dias) {
  if (dias === null || dias === undefined) return 'criticidade-baixa'
  const d = Number(dias)
  if (Number.isNaN(d) || d > 15) return 'criticidade-baixa'
  if (d > 7) return 'criticidade-media'
  return 'criticidade-alta'
}

function classeBarra(percentual) {
  const p = Number(percentual)
  if (Number.isNaN(p) || p > 50) return 'barra-verde'
  if (p > 25) return 'barra-amarela'
  return 'barra-vermelha'
}

function formatarNumero(valor) {
  return parseNumero(valor).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}


onMounted(() => {
  carregarPrevisoes()
})
</script>

<style scoped>
.previsao-estoque-widget {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

.titulo-grupo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icone-widget {
  font-size: 28px;
  color: var(--color-primary, #16a34a);
}

.widget-header h3 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--color-text, #1e293b);
}

.subtitulo {
  margin: 0.2rem 0 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted, #64748b);
}

.btn-recarregar {
  background: none;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-sm, 6px);
  padding: 0.35rem;
  cursor: pointer;
  color: var(--color-text-muted, #64748b);
  display: flex;
  align-items: center;
}

.btn-recarregar:hover {
  background-color: var(--color-background, #f8fafc);
  color: var(--color-text, #1e293b);
}

.lista-previsoes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.card-item-previsao {
  background: var(--color-background, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.item-nome {
  margin: 0;
  font-size: 0.95rem;
  color: var(--color-text, #1e293b);
}

.item-categoria {
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
}

.badge-dias {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.criticidade-baixa {
  background-color: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
}

.criticidade-media {
  background-color: rgba(237, 108, 2, 0.12);
  color: #ed6c02;
}

.criticidade-alta {
  background-color: rgba(211, 47, 47, 0.12);
  color: #d32f2f;
}

.item-barra-wrapper {
  width: 100%;
}

.barra-fundo {
  width: 100%;
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.barra-preenchimento {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.barra-verde {
  background-color: #16a34a;
}

.barra-amarela {
  background-color: #f59e0b;
}

.barra-vermelha {
  background-color: #ef4444;
}

.item-rodape {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
}

.item-rodape strong {
  color: var(--color-text, #1e293b);
}

.item-compra {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
}

.item-compra .material-symbols-outlined {
  font-size: 16px;
}

.item-compra.urgente {
  color: #c62828;
  font-weight: 600;
}

.item-modelo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  color: var(--color-text-muted, #64748b);
}

.badge-modelo {
  font-weight: 600;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
  background-color: rgba(2, 136, 209, 0.1);
  color: #0277bd;
  white-space: nowrap;
}

.badge-modelo.modelo-media_movel {
  background-color: rgba(237, 108, 2, 0.12);
  color: #b45309;
}

.badge-modelo.modelo-sem_consumo {
  background-color: #e2e8f0;
  color: #475569;
}

.link-ver-todos {
  display: inline-block;
  margin-top: 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary, #16a34a);
  text-decoration: none;
}

.link-ver-todos:hover {
  text-decoration: underline;
}
</style>