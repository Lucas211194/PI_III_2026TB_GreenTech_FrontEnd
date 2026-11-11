<template>
  <PageLayout title="Monitoramento de Sensores" subtitle="Leituras climáticas registradas nas mesas de cultivo">
  <div class="sensores-view">
    <div class="sensores-container">
      <!-- FILTROS E AÇÕES -->
      <div class="toolbar-sensores">
        <div class="filtros-wrapper">
          <div class="filtro-item">
            <label for="filtro-estufa">Filtrar por Estufa:</label>
            <select id="filtro-estufa" v-model="filtroEstufaId" class="select-filtro">
              <option value="">Todas as estufas</option>
              <option v-for="estufa in estufas" :key="estufa.id" :value="estufa.id">
                {{ estufa.nome_setor }}
              </option>
            </select>
          </div>
        </div>

        <button class="btn-atualizar" :disabled="carregando" @click="carregarDados">
          <span class="material-symbols-outlined" :class="{ 'anim-spin': carregando }">refresh</span>
          Atualizar Dados
        </button>
      </div>

      <!-- CARREGANDO -->
      <EstadoCarregamento v-if="carregando && leiturasClima.length === 0" mensagem="Carregando dados dos sensores climáticos..." />

      <!-- ERRO -->
      <ErroCarregamento
        v-else-if="erroCarregamento && leiturasClima.length === 0"
        :mensagem="erroCarregamento"
        @tentar-novamente="carregarDados"
      />

      <!-- CONTEÚDO PRINCIPAL -->
      <div v-else>
        <!-- CARDS DE MÉDIAS ATUAIS (CALCULADAS DAS LEITURAS REAIS) -->
        <div class="kpis-grid">
          <div class="kpi-card">
            <div class="kpi-icon temp">
              <span class="material-symbols-outlined">thermostat</span>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Temperatura Média</span>
              <strong class="kpi-valor">
                {{ mediasCalculadas.temperatura !== null ? `${mediasCalculadas.temperatura}°C` : '--' }}
              </strong>
              <span class="kpi-sub">Última leitura de {{ ultimasPorMesa.length }} mesa(s)</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon umid">
              <span class="material-symbols-outlined">humidity_percentage</span>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Umidade Média</span>
              <strong class="kpi-valor">
                {{ mediasCalculadas.umidade !== null ? `${mediasCalculadas.umidade}%` : '--' }}
              </strong>
              <span class="kpi-sub">Última leitura de {{ ultimasPorMesa.length }} mesa(s)</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon lum">
              <span class="material-symbols-outlined">light_mode</span>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Luminosidade Média</span>
              <strong class="kpi-valor">
                {{ mediasCalculadas.luminosidade !== null ? `${mediasCalculadas.luminosidade} Lux` : '--' }}
              </strong>
              <span class="kpi-sub">Última leitura de {{ ultimasPorMesa.length }} mesa(s)</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon vent">
              <span class="material-symbols-outlined">air</span>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Ventilação Média</span>
              <strong class="kpi-valor">
                {{ mediasCalculadas.ventilacao !== null ? `${mediasCalculadas.ventilacao}%` : '--' }}
              </strong>
              <span class="kpi-sub">Última leitura de {{ ultimasPorMesa.length }} mesa(s)</span>
            </div>
          </div>
        </div>

        <!-- TABELA DE REGISTROS -->
        <div class="tabela-card">
          <div class="tabela-header">
            <h3>Leituras Recentes de Clima</h3>
            <span class="badge-total">{{ leiturasFiltradas.length }} registros</span>
          </div>

          <div class="tabela-responsive">
            <table class="tabela-dados">
              <thead>
                <tr>
                  <th>Data / Hora</th>
                  <th>Mesa</th>
                  <th>Estufa</th>
                  <th>Temperatura</th>
                  <th>Umidade</th>
                  <th>Luminosidade</th>
                  <th>Ventilação</th>
                  <th>Solo</th>
                  <th>Status Climático</th>
                  <th>Obs.</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in leiturasFiltradas" :key="item.id">
                  <td class="font-mono">{{ formatarDataHora(item.data_registro) }}</td>
                  <td class="font-destaque">{{ obterIdentificacaoMesa(item.mesa_id) }}</td>
                  <td>{{ obterNomeEstufaPorMesa(item.mesa_id) }}</td>
                  <td>{{ parseNumero(item.temperatura).toFixed(1) }} °C</td>
                  <td>{{ parseNumero(item.umidade).toFixed(1) }} %</td>
                  <td>{{ parseNumero(item.luminosidade).toFixed(0) }} Lux</td>
                  <td>{{ parseNumero(item.ventilacao).toFixed(0) }} %</td>
                  <td class="sem-quebra">{{ item.umidade_solo !== null ? `${parseNumero(item.umidade_solo).toFixed(1)} %` : '-' }}</td>
                  <td>
                    <span
                      :class="['badge-status', `status-${classeStatus(item)}`]"
                      :title="parametrosForaDaFaixa(item)"
                    >
                      {{ rotuloStatus(item) }}
                    </span>
                    <span v-if="item.avaliacao?.limite_padrao" class="tag-padrao" title="Mesa sem cultura em cultivo">
                      limite padrão
                    </span>
                  </td>
                  <td class="col-obs">{{ item.observacoes || '-' }}</td>
                </tr>

                <tr v-if="leiturasFiltradas.length === 0">
                  <td colspan="10" class="empty-row">
                    Nenhum registro climático encontrado para os filtros selecionados.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
  </PageLayout>
</template>

<script setup>
import EstadoCarregamento from '@/components/EstadoCarregamento.vue'
import { ref, computed, onMounted } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import ErroCarregamento from '@/components/ErroCarregamento.vue'
import apiClient from '@/services/api'
import { extrairLista, formatarDataHora, mensagemDeErro, parseNumero } from '@/services/apiHelpers'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const leiturasClima = ref([])
const mesas = ref([])
const estufas = ref([])

const carregando = ref(false)
const erroCarregamento = ref('')
const filtroEstufaId = ref('')

async function carregarDados() {
  carregando.value = true
  erroCarregamento.value = ''
  try {
    const [resClima, resMesas, resEstufas] = await Promise.all([
      apiClient.get('/clima/'),
      apiClient.get('/mesa/'),
      apiClient.get('/estufa/'),
    ])

    const listaClima = extrairLista(resClima.data)
    // Ordenar no front-end por data_registro decrescente
    listaClima.sort((a, b) => new Date(b.data_registro) - new Date(a.data_registro))

    leiturasClima.value = listaClima
    mesas.value = extrairLista(resMesas.data)
    estufas.value = extrairLista(resEstufas.data)
  } catch (err) {
    erroCarregamento.value = mensagemDeErro(err, 'Erro ao carregar os dados climáticos dos sensores.')
    toastStore.error(erroCarregamento.value)
  } finally {
    carregando.value = false
  }
}

function obterIdentificacaoMesa(mesaId) {
  const m = mesas.value.find((item) => item.id === mesaId)
  return m ? m.identificacao : `Mesa #${mesaId}`
}

function obterNomeEstufaPorMesa(mesaId) {
  const m = mesas.value.find((item) => item.id === mesaId)
  if (!m) return '-'
  if (m.estufa_nome) return m.estufa_nome
  if (m.estufa) {
    const est = estufas.value.find((e) => e.id === m.estufa)
    return est ? est.nome_setor : `Estufa #${m.estufa}`
  }
  return 'Sem Estufa'
}

const leiturasFiltradas = computed(() => {
  if (!filtroEstufaId.value) return leiturasClima.value

  const idEstufaNum = Number(filtroEstufaId.value)
  return leiturasClima.value.filter((leitura) => {
    const m = mesas.value.find((item) => item.id === leitura.mesa_id)
    return m && Number(m.estufa) === idEstufaNum
  })
})

// Retrato atual: a leitura mais recente de cada mesa (a lista já vem da mais nova para a mais antiga)
const ultimasPorMesa = computed(() => {
  const vistas = new Set()
  return leiturasFiltradas.value.filter((leitura) => {
    if (vistas.has(leitura.mesa_id)) return false
    vistas.add(leitura.mesa_id)
    return true
  })
})

const mediasCalculadas = computed(() => {
  const lista = ultimasPorMesa.value
  if (lista.length === 0) {
    return { temperatura: null, umidade: null, luminosidade: null, ventilacao: null }
  }

  const totais = lista.reduce(
    (acc, item) => {
      acc.temp += parseNumero(item.temperatura)
      acc.umid += parseNumero(item.umidade)
      acc.lum += parseNumero(item.luminosidade)
      acc.vent += parseNumero(item.ventilacao)
      return acc
    },
    { temp: 0, umid: 0, lum: 0, vent: 0 },
  )

  const qtd = lista.length
  return {
    temperatura: (totais.temp / qtd).toFixed(1),
    umidade: (totais.umid / qtd).toFixed(1),
    luminosidade: Math.round(totais.lum / qtd),
    ventilacao: (totais.vent / qtd).toFixed(1),
  }
})

// Avaliação feita pelo back-end com as mesmas regras que geram os alertas
const ROTULOS_STATUS = { normal: 'Normal', atencao: 'Atenção', critico: 'Crítico' }
const NOMES_PARAMETRO = { temperatura: 'temperatura', umidade: 'umidade do ar', umidade_solo: 'umidade do solo' }

function rotuloStatus(leitura) {
  return ROTULOS_STATUS[leitura.avaliacao?.status] || '-'
}

function classeStatus(leitura) {
  const status = leitura.avaliacao?.status
  return status === 'normal' ? 'normal' : status === 'critico' ? 'critico' : 'alerta'
}

function parametrosForaDaFaixa(leitura) {
  const parametros = leitura.avaliacao?.parametros || []
  return parametros.length ? `Fora da faixa: ${parametros.map((p) => NOMES_PARAMETRO[p] || p).join(', ')}` : ''
}


onMounted(() => {
  carregarDados()
})
</script>

<style scoped>
.sensores-container {
  margin-top: 1.5rem;
}

.toolbar-sensores {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filtros-wrapper {
  display: flex;
  gap: 1rem;
}

.filtro-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted, #64748b);
}

.select-filtro {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  background-color: var(--color-surface, #ffffff);
  font-size: 0.875rem;
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
  transition: background-color 0.2s;
}

.btn-atualizar:hover {
  background-color: var(--color-background, #f8fafc);
}

.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.kpi-card {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon.temp {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.kpi-icon.umid {
  background: rgba(2, 136, 209, 0.1);
  color: #0288d1;
}

.kpi-icon.lum {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.kpi-icon.vent {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.kpi-info {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--color-text-muted, #64748b);
  font-weight: 600;
}

.kpi-valor {
  font-size: 1.35rem;
  color: var(--color-text, #1e293b);
  font-weight: 700;
  margin: 0.15rem 0;
}

.kpi-sub {
  font-size: 0.7rem;
  color: var(--color-text-muted, #94a3b8);
}

.tabela-card {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
}

.tabela-header {
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.tabela-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.badge-total {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-background, #f8fafc);
  border-radius: var(--radius-sm, 6px);
  color: var(--color-text-muted, #64748b);
}

.tabela-responsive {
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

.col-obs {
  max-width: 180px;
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

.badge-status.status-normal {
  background-color: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
}

.badge-status.status-alerta {
  background-color: rgba(217, 119, 6, 0.14);
  color: #b45309;
}

.badge-status.status-critico {
  background-color: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.sem-quebra {
  white-space: nowrap;
}

.tag-padrao {
  display: inline-block;
  font-size: 0.65rem;
  color: var(--color-text-muted, #94a3b8);
  margin-left: 0.35rem;
  font-style: italic;
}

.empty-row {
  text-align: center;
  padding: 2.5rem !important;
  color: var(--color-text-muted, #64748b);
}
</style>