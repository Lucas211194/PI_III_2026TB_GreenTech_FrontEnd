<template>
  <PageLayout title="Sistema de Irrigação" subtitle="Monitoramento das válvulas solenoides e histórico de fluxo de água">
  <div class="irrigacao-view">
    <div class="irrigacao-container">
      <!-- MÓDULO 1: REGISTROS REAIS DE IRRIGAÇÃO (GET /irrigacao/) -->
      <section class="secao-registros">
        <div class="secao-header">
          <div>
            <h3>Leituras Reais de Irrigação</h3>
            <p class="subtexto">Dados operacionais consolidados das válvulas por mesa de cultivo</p>
          </div>
          <button class="btn-atualizar" :disabled="carregando" @click="carregarDados">
            <span class="material-symbols-outlined" :class="{ 'anim-spin': carregando }">refresh</span>
            Atualizar
          </button>
        </div>

        <!-- CARREGANDO -->
        <div v-if="carregando && registrosReais.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Carregando registros de irrigação...</p>
        </div>

        <!-- ERRO -->
        <ErroCarregamento
          v-else-if="erroCarregamento && registrosReais.length === 0"
          :mensagem="erroCarregamento"
          @tentar-novamente="carregarDados"
        />

        <!-- TABELA DE VÁLVULAS REAIS -->
        <div v-else-if="ultimosPorValvula.length > 0" class="tabela-card">
          <table class="tabela-dados">
            <thead>
              <tr>
                <th>Válvula</th>
                <th>Mesa Associada</th>
                <th>Status Operacional</th>
                <th>Vazão Atual</th>
                <th>Consumo no Ciclo</th>
                <th>Último Registro</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in ultimosPorValvula" :key="v.valvula_id">
                <td class="font-destaque">{{ v.valvula_id }}</td>
                <td>{{ obterIdentificacaoMesa(v.mesa_id) }}</td>
                <td>
                  <span
                    :class="[
                      'badge-status',
                      v.status_atual === 'ativa' ? 'status-ativa' : 'status-inativa',
                    ]"
                  >
                    {{ v.status_atual === 'ativa' ? 'Ativa (Aberta)' : 'Inativa (Fechada)' }}
                  </span>
                </td>
                <td>{{ parseNumero(v.fluxo_l_min).toFixed(1) }} L/min</td>
                <td>{{ parseNumero(v.consumo_ciclo_l).toFixed(1) }} L</td>
                <td class="font-mono">{{ formatarDataHora(v.data_registro) }}</td>
                <td class="col-obs">{{ v.observacoes || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- VAZIO -->
        <div v-else class="empty-state">
          <span class="material-symbols-outlined empty-icon">water_drop</span>
          <p>Nenhum registro de irrigação encontrado no servidor.</p>
        </div>
      </section>

      <!-- MÓDULO 2: CONTROLE OPERACIONAL E DECISÕES IA (STAND-BY VIA FEATURES.irrigacaoIA) -->
      <section class="secao-ia">
        <h3>Automação e Decisões de Irrigação (IA)</h3>

        <!-- FLAG DESLIGADA: MOSTRA AVISO CLARO E DESABILITA CONTROLES -->
        <RecursoIndisponivel
          v-if="!FEATURES.irrigacaoIA"
          icone="smart_toy"
          titulo="Módulo de Automação por IA em Stand-by"
          mensagem="O controle automatizado de válvulas e predições por IA será liberado quando o servidor disponibilizar os endpoints /irrigacao/modo/ e /irrigacao/decisoes-ia/."
        />

        <!-- FLAG LIGADA: CONTROLE ATIVO COM REQUISIÇÕES REAIS -->
        <div v-else class="painel-ia-ativo">
          <div class="card-status-ia">
            <div class="modo-operacao">
              <span>Modo Operacional:</span>
              <strong>{{ statusIA.modo || 'MANUAL' }}</strong>
            </div>
            <button
              class="btn-modo"
              :disabled="comutandoModo"
              @click="alternarModoOperacao"
            >
              Alternar Modo
            </button>
          </div>

          <div v-if="decisoesIA.length > 0" class="tabela-card">
            <h4>Decisões Recentes Tomadas pela IA</h4>
            <table class="tabela-dados">
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>Válvula</th>
                  <th>Ação Sugerida/Tomada</th>
                  <th>Confiança</th>
                  <th>Justificativa</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in decisoesIA" :key="d.id">
                  <td>{{ d.horario }}</td>
                  <td>{{ d.valvula }}</td>
                  <td>{{ d.acao }}</td>
                  <td>{{ (d.confianca * 100).toFixed(0) }}%</td>
                  <td>{{ d.justificativa }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import ErroCarregamento from '@/components/ErroCarregamento.vue'
import RecursoIndisponivel from '@/components/RecursoIndisponivel.vue'
import apiClient from '@/services/api'
import { extrairLista, mensagemDeErro, parseNumero } from '@/services/apiHelpers'
import { FEATURES } from '@/config/features'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const carregando = ref(false)
const erroCarregamento = ref('')
const comutandoModo = ref(false)

const registrosReais = ref([])
const mesas = ref([])

const statusIA = ref({
  modo: 'MANUAL',
  valvulas: [],
})
const decisoesIA = ref([])

async function carregarDados() {
  carregando.value = true
  erroCarregamento.value = ''
  try {
    const chamadas = [
      apiClient.get('/irrigacao/'),
      apiClient.get('/mesa/'),
    ]

    // Só chama as rotas de automação se a flag estiver ligada
    if (FEATURES.irrigacaoIA) {
      chamadas.push(apiClient.get('/irrigacao/status/'))
      chamadas.push(apiClient.get('/irrigacao/decisoes-ia/'))
    }

    const respostas = await Promise.all(chamadas)

    registrosReais.value = extrairLista(respostas[0].data)
    mesas.value = extrairLista(respostas[1].data)

    if (FEATURES.irrigacaoIA && respostas[2]) {
      statusIA.value = respostas[2].data || { modo: 'MANUAL', valvulas: [] }
      decisoesIA.value = extrairLista(respostas[3]?.data)
    }
  } catch (err) {
    erroCarregamento.value = mensagemDeErro(err, 'Erro ao carregar dados de irrigação do servidor.')
    toastStore.error(erroCarregamento.value)
  } finally {
    carregando.value = false
  }
}

// Agrupa as leituras mantendo a mais recente de cada valvula_id
const ultimosPorValvula = computed(() => {
  const mapa = new Map()

  // Ordena por data antes de agrupar
  const ordenados = [...registrosReais.value].sort(
    (a, b) => new Date(b.data_registro) - new Date(a.data_registro),
  )

  for (const item of ordenados) {
    const key = item.valvula_id || `Mesa-${item.mesa_id}`
    if (!mapa.has(key)) {
      mapa.set(key, item)
    }
  }

  return Array.from(mapa.values())
})

function obterIdentificacaoMesa(mesaId) {
  const m = mesas.value.find((item) => item.id === mesaId)
  return m ? m.identificacao : `Mesa #${mesaId}`
}

function formatarDataHora(dataHoraStr) {
  if (!dataHoraStr) return '-'
  const d = new Date(dataHoraStr)
  if (Number.isNaN(d.getTime())) return dataHoraStr
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function alternarModoOperacao() {
  if (!FEATURES.irrigacaoIA) return

  comutandoModo.value = true
  const novoModo = statusIA.value.modo === 'MANUAL' ? 'AUTOMATICO_IA' : 'MANUAL'

  try {
    const res = await apiClient.post('/irrigacao/modo/', { modo: novoModo })
    // Atualização estrita somente após confirmação 2xx do servidor
    statusIA.value.modo = res.data?.modo || novoModo
    toastStore.success(`Modo de irrigação alterado para ${statusIA.value.modo}`)
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Não foi possível alterar o modo de irrigação.'))
  } finally {
    comutandoModo.value = false
  }
}

onMounted(() => {
  carregarDados()
})
</script>

<style scoped>
.irrigacao-view {
  padding: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
}

.irrigacao-container {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.secao-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

.secao-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.subtexto {
  color: var(--color-text-muted, #64748b);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.btn-atualizar {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md, 8px);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-atualizar:hover {
  background-color: var(--color-background, #f8fafc);
}

.anim-spin {
  animation: spin 1s linear infinite;
}

.tabela-card {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  overflow-x: auto;
}

.tabela-dados {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.tabela-dados th {
  padding: 0.85rem 1rem;
  background-color: var(--color-background, #f8fafc);
  color: var(--color-text-muted, #64748b);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.tabela-dados td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-text, #1e293b);
}

.font-destaque {
  font-weight: 600;
}

.font-mono {
  font-family: monospace;
}

.col-obs {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-status {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-ativa {
  background-color: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
}

.status-inativa {
  background-color: rgba(100, 116, 139, 0.12);
  color: #64748b;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  background-color: var(--color-surface, #ffffff);
  border-radius: var(--radius-lg, 12px);
  border: 1px dashed var(--color-border, #e2e8f0);
  color: var(--color-text-muted, #64748b);
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 0.5rem;
}

.secao-ia h3 {
  font-size: 1.15rem;
  margin-bottom: 1rem;
}

.card-status-ia {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  margin-bottom: 1rem;
}

.btn-modo {
  padding: 0.5rem 1rem;
  background-color: var(--color-primary, #16a34a);
  color: #fff;
  border: none;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
}

.spinner {
  width: 36px;
  height: 36px;
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