<template>
  <PageLayout title="Alertas e Notificações" subtitle="Monitoramento de anomalias climáticas e limites operacionais da estufa">
  <div class="alertas-view">
    <div class="alertas-container">
      <!-- BARRA SUPERIOR: FILTROS E ATUALIZAÇÃO -->
      <div class="toolbar-alertas">
        <div class="filtros-wrapper">
          <select v-model="filtroGravidade" class="select-filtro">
            <option value="">Todas as gravidades</option>
            <option value="critico">Crítico (Vermelho)</option>
            <option value="atencao">Atenção (Amarelo)</option>
          </select>

          <select v-model="filtroParametro" class="select-filtro">
            <option value="">Todos os parâmetros</option>
            <option value="temperatura">Temperatura</option>
            <option value="umidade">Umidade</option>
          </select>
        </div>

        <div class="acoes-wrapper">
          <span class="info-timer">Atualização automática a cada 60s</span>
          <button class="btn-atualizar" :disabled="carregando" @click="carregarDados">
            <span class="material-symbols-outlined" :class="{ 'anim-spin': carregando }">refresh</span>
            Atualizar
          </button>
        </div>
      </div>

      <!-- CARREGANDO -->
      <div v-if="carregando && alertasGerados.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Verificando leituras e gerando alertas...</p>
      </div>

      <!-- ERRO -->
      <ErroCarregamento
        v-else-if="erroCarregamento && alertasGerados.length === 0"
        :mensagem="erroCarregamento"
        @tentar-novamente="carregarDados"
      />

      <!-- LISTA DE ALERTAS -->
      <div v-else-if="alertasFiltrados.length > 0" class="lista-alertas">
        <div
          v-for="alerta in alertasFiltrados"
          :key="alerta.id"
          :class="['card-alerta', `gravidade-${alerta.gravidade}`]"
        >
          <div class="alerta-icone-wrapper">
            <span class="material-symbols-outlined icone-alerta">
              {{ alerta.gravidade === 'critico' ? 'error' : 'warning' }}
            </span>
          </div>

          <div class="alerta-conteudo">
            <div class="alerta-cabecalho">
              <!-- B10: Título corrigido com espaçamento estruturado -->
              <h4 class="alerta-titulo">
                {{ alerta.mesaIdentificacao }} &middot; {{ alerta.parametroNome }}
              </h4>
              <span class="alerta-hora font-mono">{{ formatarDataHora(alerta.dataHora) }}</span>
            </div>

            <p class="alerta-mensagem">{{ alerta.mensagem }}</p>

            <div class="alerta-detalhes">
              <span class="dado-leitura">
                Valor Lido: <strong>{{ alerta.valorLido }}</strong>
              </span>
              <span class="dado-faixa">
                Faixa Ideal: {{ alerta.faixaEsperada }}
              </span>
              <span v-if="alerta.isPadrao" class="badge-padrao" title="Sem cultura específica vinculada à mesa">
                limite padrão
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- VAZIO: NENHUM ALERTA -->
      <div v-else class="empty-state">
        <span class="material-symbols-outlined empty-icon">check_circle</span>
        <h3>Tudo sob controle!</h3>
        <p>Nenhuma anomalia climática detectada nas mesas monitoradas no momento.</p>
      </div>
    </div>
  </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import ErroCarregamento from '@/components/ErroCarregamento.vue'
import climaService from '@/services/climaService'
import estruturaService from '@/services/estruturaService'
import loteService from '@/services/loteService'
import culturaService from '@/services/culturaService'
import { mensagemDeErro, parseNumero } from '@/services/apiHelpers'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const carregando = ref(false)
const erroCarregamento = ref('')
const intervaloTimer = ref(null)

const leiturasClima = ref([])
const mesas = ref([])
const lotes = ref([])
const culturas = ref([])

const filtroGravidade = ref('')
const filtroParametro = ref('')

async function carregarDados() {
  carregando.value = true
  erroCarregamento.value = ''

  try {
    const [resClima, resMesas, resLotes, resCulturas] = await Promise.all([
      climaService.listarLeiturasClima(),
      estruturaService.listarMesas(),
      loteService.listar(),
      culturaService.listar(),
    ])

    leiturasClima.value = resClima
    mesas.value = resMesas
    lotes.value = resLotes
    culturas.value = resCulturas
  } catch (err) {
    erroCarregamento.value = mensagemDeErro(err, 'Erro ao verificar condições climáticas.')
    toastStore.error(erroCarregamento.value)
  } finally {
    carregando.value = false
  }
}

// A15: Processa alertas baseados na cultura ativa na mesa ou no limite padrão
const alertasGerados = computed(() => {
  const lista = []

  // B11: Ordenação estrita por data decrescente
  const leiturasOrdenadas = [...leiturasClima.value].sort(
    (a, b) => new Date(b.data_registro) - new Date(a.data_registro),
  )

  for (const item of leiturasOrdenadas) {
    const mesa = mesas.value.find((m) => m.id === item.mesa_id)
    const mesaNome = mesa ? mesa.identificacao : `Mesa #${item.mesa_id}`

    // Identifica se há lote ativo nesta mesa
    const loteAtivo = lotes.value.find(
      (l) => l.mesa_id === item.mesa_id && (l.status === 'AT' || l.status === 'DI'),
    )

    let minTemp = 16
    let maxTemp = 30
    let umidIdeal = 50
    let isPadrao = true

    if (loteAtivo) {
      const cultura = culturas.value.find((c) => c.id === loteAtivo.cultura_id)
      if (cultura) {
        minTemp = parseNumero(cultura.temperatura_minima, 16)
        maxTemp = parseNumero(cultura.temperatura_maxima, 30)
        umidIdeal = parseNumero(cultura.umidade_ideal, 50)
        isPadrao = false
      }
    }

    const temp = parseNumero(item.temperatura)
    const umid = parseNumero(item.umidade)

    // Checagem de temperatura
    if (temp < minTemp || temp > maxTemp) {
      const diferenca = temp < minTemp ? minTemp - temp : temp - maxTemp
      const gravidade = diferenca > 4 ? 'critico' : 'atencao'
      const direcao = temp < minTemp ? 'abaixo do mínimo' : 'acima do máximo'

      lista.push({
        id: `temp-${item.id}`,
        mesaIdentificacao: mesaNome,
        parametro: 'temperatura',
        parametroNome: 'Temperatura',
        dataHora: item.data_registro,
        valorLido: `${temp.toFixed(1)} °C`,
        faixaEsperada: `${minTemp}°C a ${maxTemp}°C`,
        gravidade,
        mensagem: `Temperatura registrada está ${direcao} configurado para o cultivo.`,
        isPadrao,
      })
    }

    // Checagem de umidade
    const desvioUmid = Math.abs(umid - umidIdeal)
    if (desvioUmid > 15) {
      const gravidade = desvioUmid > 25 ? 'critico' : 'atencao'
      const direcao = umid < umidIdeal ? 'abaixo da ideal' : 'acima da ideal'

      lista.push({
        id: `umid-${item.id}`,
        mesaIdentificacao: mesaNome,
        parametro: 'umidade',
        parametroNome: 'Umidade',
        dataHora: item.data_registro,
        valorLido: `${umid.toFixed(1)} %`,
        faixaEsperada: `${umidIdeal}% (±15%)`,
        gravidade,
        mensagem: `Umidade relativa está ${direcao} recomendada para este lote.`,
        isPadrao,
      })
    }
  }

  return lista
})

const alertasFiltrados = computed(() => {
  return alertasGerados.value.filter((alerta) => {
    const atendeGravidade = !filtroGravidade.value || alerta.gravidade === filtroGravidade.value
    const atendeParametro = !filtroParametro.value || alerta.parametro === filtroParametro.value
    return atendeGravidade && atendeParametro
  })
})

function formatarDataHora(dataHoraStr) {
  if (!dataHoraStr) return '-'
  const d = new Date(dataHoraStr)
  if (Number.isNaN(d.getTime())) return dataHoraStr
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  carregarDados()
  // B11: Atualização automática a cada 60s
  intervaloTimer.value = setInterval(() => {
    carregarDados()
  }, 60000)
})

onUnmounted(() => {
  // Limpeza de intervalo para evitar vazamento de memória
  if (intervaloTimer.value) {
    clearInterval(intervaloTimer.value)
    intervaloTimer.value = null
  }
})
</script>

<style scoped>
.alertas-view {
  padding: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
}

.alertas-container {
  margin-top: 1.5rem;
}

.toolbar-alertas {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filtros-wrapper {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.select-filtro {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  background-color: var(--color-surface, #ffffff);
  font-size: 0.875rem;
}

.acoes-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-timer {
  font-size: 0.75rem;
  color: var(--color-text-muted, #94a3b8);
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

.lista-alertas {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-alerta {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.card-alerta.gravidade-critico {
  border-left: 4px solid var(--color-danger, #ef4444);
}

.card-alerta.gravidade-atencao {
  border-left: 4px solid #f59e0b;
}

.alerta-icone-wrapper {
  padding: 0.5rem;
  border-radius: var(--radius-md, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.gravidade-critico .alerta-icone-wrapper {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.gravidade-atencao .alerta-icone-wrapper {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.alerta-conteudo {
  flex: 1;
}

.alerta-cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}

.alerta-titulo {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.alerta-hora {
  font-size: 0.75rem;
  color: var(--color-text-muted, #94a3b8);
}

.alerta-mensagem {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: var(--color-text-muted, #64748b);
  line-height: 1.4;
}

.alerta-detalhes {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  font-size: 0.8rem;
  color: var(--color-text-muted, #64748b);
}

.alerta-detalhes strong {
  color: var(--color-text, #1e293b);
}

.badge-padrao {
  font-size: 0.65rem;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  background: var(--color-background, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-text-muted, #94a3b8);
  font-style: italic;
}

.font-mono {
  font-family: monospace;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  text-align: center;
  background-color: var(--color-surface, #ffffff);
  border-radius: var(--radius-lg, 12px);
  border: 1px dashed var(--color-border, #e2e8f0);
}

.empty-icon {
  font-size: 48px;
  color: var(--color-primary, #16a34a);
  margin-bottom: 0.75rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
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