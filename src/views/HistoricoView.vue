<template>
  <PageLayout title="Histórico de Auditoria" subtitle="Registro de operações e alterações administrativas realizadas no sistema">
  <div class="historico-view">
    <div class="historico-container">
      <!-- BARRA DE FILTROS E BUSCA -->
      <div class="toolbar-filtros">
        <div class="filtros-grupo">
          <div class="busca-wrapper">
            <span class="material-symbols-outlined icone-busca">search</span>
            <input
              v-model="termoBusca"
              type="text"
              placeholder="Buscar por usuário, detalhes ou registro..."
              class="input-busca"
            />
          </div>

          <select v-model="filtroModulo" class="select-filtro">
            <option value="">Todos os módulos</option>
            <option v-for="mod in modulosDisponiveis" :key="mod" :value="mod">
              {{ mod }}
            </option>
          </select>

          <select v-model="filtroAcao" class="select-filtro">
            <option value="">Todas as ações</option>
            <option value="ADICIONOU">Adicionou</option>
            <option value="MODIFICOU">Modificou</option>
            <option value="DELETOU">Deletou</option>
          </select>
        </div>

        <button class="btn-atualizar" :disabled="carregando" @click="carregarHistorico">
          <span class="material-symbols-outlined" :class="{ 'anim-spin': carregando }">refresh</span>
          Atualizar
        </button>
      </div>

      <!-- CARREGANDO -->
      <div v-if="carregando" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando registros de auditoria...</p>
      </div>

      <!-- PERMISSÃO NEGADA (403) -->
      <div v-else-if="semPermissao" class="alerta-permissao" role="alert">
        <span class="material-symbols-outlined icone-alerta">lock</span>
        <h3>Acesso Restrito ao Histórico</h3>
        <p>Seu perfil de usuário ainda não possui permissão de auditoria configurada no servidor.</p>
        <span class="detalhe-permissao">
          Atualmente o back-end restringe a rota /funcionarios/auditoria/ a administradores (superuser).
        </span>
      </div>

      <!-- ERRO GENÉRICO -->
      <ErroCarregamento
        v-else-if="erroCarregamento"
        :mensagem="erroCarregamento"
        @tentar-novamente="carregarHistorico"
      />

      <!-- LISTAGEM EM TABELA -->
      <div v-else-if="itensPaginados.length > 0" class="tabela-card">
        <div class="tabela-responsive">
          <table class="tabela-auditoria">
            <thead>
              <tr>
                <th width="160">Data / Hora</th>
                <th width="140">Usuário</th>
                <th width="120">Ação</th>
                <th width="150">Módulo (Tabela)</th>
                <th width="100">Registro</th>
                <th>Detalhes da Operação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in itensPaginados" :key="log.id_log || log.id">
                <td class="font-mono">{{ formatarDataHora(log.data_hora) }}</td>
                <td class="font-destaque">{{ log.usuario || '-' }}</td>
                <td>
                  <span :class="['badge-acao', `acao-${String(log.acao || '').toLowerCase()}`]">
                    {{ log.acao || 'AÇÃO' }}
                  </span>
                </td>
                <td>{{ log.tabela_afetada || '-' }}</td>
                <td class="font-mono">#{{ log.registro_afetado || '-' }}</td>
                <td class="col-detalhes">{{ log.detalhes || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINAÇÃO -->
        <div v-if="totalPaginas > 1" class="paginacao-footer">
          <span class="info-paginacao">
            Página {{ paginaAtual }} de {{ totalPaginas }} ({{ logsFiltrados.length }} registros)
          </span>
          <div class="botoes-paginacao">
            <button
              class="btn-pag"
              :disabled="paginaAtual === 1"
              @click="paginaAtual--"
            >
              Anterior
            </button>
            <button
              class="btn-pag"
              :disabled="paginaAtual === totalPaginas"
              @click="paginaAtual++"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      <!-- ESTADO VAZIO -->
      <div v-else class="empty-state">
        <span class="material-symbols-outlined empty-icon">history_edu</span>
        <h3>Nenhum registro de auditoria encontrado</h3>
        <p>
          O histórico registra ações administrativas realizadas através do painel de controle do servidor.
        </p>
      </div>
    </div>
  </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import ErroCarregamento from '@/components/ErroCarregamento.vue'
import apiClient from '@/services/api'
import { extrairLista, mensagemDeErro } from '@/services/apiHelpers'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const logs = ref([])
const carregando = ref(false)
const semPermissao = ref(false)
const erroCarregamento = ref('')

const termoBusca = ref('')
const filtroModulo = ref('')
const filtroAcao = ref('')

const paginaAtual = ref(1)
const itensPorPagina = 20

async function carregarHistorico() {
  carregando.value = true
  semPermissao.value = false
  erroCarregamento.value = ''

  try {
    const res = await apiClient.get('/funcionarios/auditoria/')
    logs.value = extrairLista(res.data)
  } catch (err) {
    if (err.response?.status === 403) {
      semPermissao.value = true
    } else {
      erroCarregamento.value = mensagemDeErro(err, 'Erro ao obter logs de auditoria.')
      toastStore.error(erroCarregamento.value)
    }
    logs.value = []
  } finally {
    carregando.value = false
    paginaAtual.value = 1
  }
}

const modulosDisponiveis = computed(() => {
  const setModulos = new Set()
  for (const log of logs.value) {
    if (log.tabela_afetada) {
      setModulos.add(log.tabela_afetada)
    }
  }
  return Array.from(setModulos).sort()
})

const logsFiltrados = computed(() => {
  return logs.value.filter((log) => {
    const busca = termoBusca.value.trim().toLowerCase()
    const usuario = String(log.usuario || '').toLowerCase()
    const detalhes = String(log.detalhes || '').toLowerCase()
    const registro = String(log.registro_afetado || '').toLowerCase()

    const atendeBusca =
      !busca ||
      usuario.includes(busca) ||
      detalhes.includes(busca) ||
      registro.includes(busca)

    const atendeModulo = !filtroModulo.value || log.tabela_afetada === filtroModulo.value
    const atendeAcao = !filtroAcao.value || log.acao === filtroAcao.value

    return atendeBusca && atendeModulo && atendeAcao
  })
})

const totalPaginas = computed(() => {
  return Math.ceil(logsFiltrados.value.length / itensPorPagina) || 1
})

const itensPaginados = computed(() => {
  const inicio = (paginaAtual.value - 1) * itensPorPagina
  return logsFiltrados.value.slice(inicio, inicio + itensPorPagina)
})

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
    second: '2-digit',
  })
}

onMounted(() => {
  carregarHistorico()
})
</script>

<style scoped>
.historico-view {
  padding: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
}

.historico-container {
  margin-top: 1.5rem;
}

.toolbar-filtros {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filtros-grupo {
  display: flex;
  gap: 0.75rem;
  flex: 1;
  max-width: 800px;
  flex-wrap: wrap;
}

.busca-wrapper {
  position: relative;
  flex: 1;
  min-width: 240px;
  display: flex;
  align-items: center;
}

.icone-busca {
  position: absolute;
  left: 0.75rem;
  color: var(--color-text-muted, #64748b);
  font-size: 20px;
}

.input-busca {
  width: 100%;
  padding: 0.55rem 0.75rem 0.55rem 2.4rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  background: var(--color-surface, #ffffff);
  font-size: 0.875rem;
}

.select-filtro {
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  background: var(--color-surface, #ffffff);
  font-size: 0.875rem;
}

.btn-atualizar {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  padding: 0.55rem 1rem;
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
  overflow: hidden;
}

.tabela-responsive {
  overflow-x: auto;
}

.tabela-auditoria {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.tabela-auditoria th {
  padding: 0.85rem 1rem;
  background-color: var(--color-background, #f8fafc);
  color: var(--color-text-muted, #64748b);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.tabela-auditoria td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-text, #1e293b);
}

.font-mono {
  font-family: monospace;
}

.font-destaque {
  font-weight: 600;
}

.col-detalhes {
  max-width: 320px;
  line-height: 1.4;
  word-break: break-word;
}

.badge-acao {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.acao-adicionou {
  background-color: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
}

.acao-modificou {
  background-color: rgba(2, 136, 209, 0.12);
  color: #0288d1;
}

.acao-deletou {
  background-color: rgba(211, 47, 47, 0.12);
  color: #d32f2f;
}

.paginacao-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border, #e2e8f0);
  background-color: var(--color-background, #f8fafc);
}

.info-paginacao {
  font-size: 0.8rem;
  color: var(--color-text-muted, #64748b);
}

.botoes-paginacao {
  display: flex;
  gap: 0.5rem;
}

.btn-pag {
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-border, #e2e8f0);
  background: var(--color-surface, #ffffff);
  border-radius: var(--radius-sm, 6px);
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-pag:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.alerta-permissao {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  background-color: var(--color-surface, #ffffff);
  border: 1px solid var(--color-warning-light, #fef3c7);
  border-radius: var(--radius-lg, 12px);
  text-align: center;
  margin: 1rem 0;
}

.icone-alerta {
  font-size: 48px;
  color: #d97706;
  margin-bottom: 0.75rem;
}

.detalhe-permissao {
  font-size: 0.75rem;
  color: var(--color-text-muted, #94a3b8);
  margin-top: 0.5rem;
}

.loading-state,
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
  color: var(--color-text-muted, #64748b);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 0.75rem;
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