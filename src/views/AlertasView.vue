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
            <option value="umidade_solo">Umidade do solo</option>
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
      <EstadoCarregamento v-if="carregando && alertas.length === 0" mensagem="Carregando alertas..." />

      <!-- ERRO -->
      <ErroCarregamento
        v-else-if="erroCarregamento && alertas.length === 0"
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
              <span class="alerta-hora font-mono">{{ formatarDataHora(alerta.dataHora, { ano: false }) }}</span>
            </div>

            <p class="alerta-mensagem">{{ alerta.mensagem }}</p>

            <p v-if="alerta.acaoSugerida" class="alerta-acao">
              <span class="material-symbols-outlined">lightbulb</span>
              <span><strong>Ação sugerida:</strong> {{ alerta.acaoSugerida }}</span>
            </p>

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
              <span v-if="alerta.simulado" class="badge-padrao" title="Gerado a partir de leitura do simulador de sensores">
                simulado
              </span>
            </div>
          </div>

          <button
            class="btn-resolver"
            :disabled="resolvendoId === alerta.id"
            @click="resolverAlerta(alerta)"
          >
            <span class="material-symbols-outlined">check</span>
            {{ resolvendoId === alerta.id ? 'Resolvendo...' : 'Marcar como resolvido' }}
          </button>
        </div>
      </div>

      <!-- VAZIO: NENHUM ALERTA -->
      <EstadoVazio v-else icone="check_circle" titulo="Tudo sob controle!" texto="Nenhuma anomalia climática detectada nas mesas monitoradas no momento." />
    </div>
  </div>
  </PageLayout>
</template>

<script setup>
import EstadoVazio from '@/components/EstadoVazio.vue'
import EstadoCarregamento from '@/components/EstadoCarregamento.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import ErroCarregamento from '@/components/ErroCarregamento.vue'
import apiClient from '@/services/api'
import { extrairLista, formatarDataHora, mensagemDeErro } from '@/services/apiHelpers'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const carregando = ref(false)
const erroCarregamento = ref('')
const intervaloTimer = ref(null)

// Alertas gerados e salvos pelo back-end a partir das leituras dos sensores
const alertas = ref([])
const resolvendoId = ref(null)

const filtroGravidade = ref('')
const filtroParametro = ref('')

async function carregarDados() {
  carregando.value = true
  erroCarregamento.value = ''

  try {
    // Só os alertas que ainda não foram resolvidos, do mais recente para o mais antigo
    const res = await apiClient.get('/alertas/', { params: { status: 'ativo' } })
    alertas.value = extrairLista(res.data)
  } catch (err) {
    erroCarregamento.value = mensagemDeErro(err, 'Erro ao carregar os alertas.')
    toastStore.error(erroCarregamento.value)
  } finally {
    carregando.value = false
  }
}

async function resolverAlerta(alerta) {
  resolvendoId.value = alerta.id
  try {
    await apiClient.patch(`/alertas/${alerta.id}/resolver/`)
    // Remove da lista somente após confirmação 2xx do servidor
    alertas.value = alertas.value.filter((a) => a.id !== alerta.id)
    toastStore.success('Alerta marcado como resolvido.')
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Não foi possível resolver o alerta.'))
  } finally {
    resolvendoId.value = null
  }
}

const alertasFiltrados = computed(() => {
  return alertas.value.filter((alerta) => {
    const atendeGravidade = !filtroGravidade.value || alerta.gravidade === filtroGravidade.value
    const atendeParametro = !filtroParametro.value || alerta.parametro === filtroParametro.value
    return atendeGravidade && atendeParametro
  })
})


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

.alerta-acao {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0 0 0.75rem 0;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md, 8px);
  background: var(--color-background, #f8fafc);
  font-size: 0.85rem;
  color: var(--color-text, #1e293b);
  line-height: 1.4;
}

.alerta-acao .material-symbols-outlined {
  font-size: 18px;
  color: var(--color-primary, #16a34a);
}

.alerta-detalhes {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
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

.btn-resolver {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  align-self: center;
  white-space: nowrap;
  background-color: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-md, 8px);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text, #1e293b);
  cursor: pointer;
}

.btn-resolver:hover:not(:disabled) {
  border-color: var(--color-primary, #16a34a);
  color: var(--color-primary, #16a34a);
}

.btn-resolver:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-resolver .material-symbols-outlined {
  font-size: 18px;
}

@media (max-width: 640px) {
  .card-alerta {
    flex-wrap: wrap;
  }

  .btn-resolver {
    width: 100%;
    justify-content: center;
  }
}
</style>