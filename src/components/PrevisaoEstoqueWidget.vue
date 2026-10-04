<template>
  <div class="previsao-estoque-widget">
    <div class="widget-header">
      <div class="titulo-grupo">
        <span class="material-symbols-outlined icone-widget">trending_down</span>
        <div>
          <h3>Previsão de Esgotamento de Estoque</h3>
          <p class="subtitulo">Análise preditiva de demanda baseada no modelo Prophet</p>
        </div>
      </div>
      <button
        v-if="FEATURES.previsaoEstoque"
        class="btn-recarregar"
        :disabled="carregando"
        title="Atualizar previsões"
        @click="carregarPrevisoes"
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
      <div v-if="carregando" class="loading-state">
        <div class="spinner"></div>
        <p>Calculando projeções de consumo...</p>
      </div>

      <!-- ERRO -->
      <ErroCarregamento
        v-else-if="erroCarregamento"
        :mensagem="erroCarregamento"
        @tentar-novamente="carregarPrevisoes"
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
              {{ formatarDiasRestantes(item.diasRestantes) }}
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
              Saldo: <strong>{{ parseNumero(item.quantidadeAtual).toFixed(2) }} {{ item.unidade }}</strong>
            </span>
            <span v-if="item.dataEstimada" class="data-estimada">
              Zero estimado em: {{ formatarData(item.dataEstimada) }}
            </span>
          </div>
        </div>
      </div>

      <!-- VAZIO -->
      <div v-else class="empty-state">
        <span class="material-symbols-outlined">inventory_2</span>
        <p>Nenhuma projeção de esgotamento emitida pelo servidor no momento.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import RecursoIndisponivel from '@/components/RecursoIndisponivel.vue'
import ErroCarregamento from '@/components/ErroCarregamento.vue'
import apiClient from '@/services/api'
import { extrairLista, mensagemDeErro, parseNumero } from '@/services/apiHelpers'
import { FEATURES } from '@/config/features'

const previsoes = ref([])
const carregando = ref(false)
const erroCarregamento = ref('')

async function carregarPrevisoes() {
  if (!FEATURES.previsaoEstoque) return

  carregando.value = true
  erroCarregamento.value = ''

  try {
    const res = await apiClient.get('/estoque/previsao-prophet/')
    previsoes.value = extrairLista(res.data)
  } catch (err) {
    erroCarregamento.value = mensagemDeErro(
      err,
      'Não foi possível obter os dados de previsão de estoque.',
    )
  } finally {
    carregando.value = false
  }
}

function formatarDiasRestantes(dias) {
  const d = Number(dias)
  if (Number.isNaN(d)) return 'Indefinido'
  if (d <= 0) return 'Esgotado'
  if (d === 1) return '1 dia restante'
  return `${d} dias restantes`
}

function classeCriticidade(dias) {
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

function formatarData(dataStr) {
  if (!dataStr) return '-'
  const d = new Date(dataStr)
  if (Number.isNaN(d.getTime())) return dataStr
  return d.toLocaleDateString('pt-BR')
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

.anim-spin {
  animation: spin 1s linear infinite;
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

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--color-text-muted, #64748b);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border, #e2e8f0);
  border-top-color: var(--color-primary, #16a34a);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.75rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>