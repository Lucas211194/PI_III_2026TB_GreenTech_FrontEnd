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
        <EstadoCarregamento v-if="carregando && registrosReais.length === 0" mensagem="Carregando registros de irrigação..." />

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
        <EstadoVazio v-else icone="water_drop" texto="Nenhum registro de irrigação encontrado no servidor." />
      </section>

      <!-- MÓDULO 2: CONTROLE OPERACIONAL E DECISÕES IA (STAND-BY VIA FEATURES.irrigacaoIA) -->
      <section class="secao-ia">
        <h3>Automação e Decisões de Irrigação (IA)</h3>

        <!-- A IA consulta a previsão de chuva da cidade da propriedade antes de abrir as válvulas -->
        <AvisoLocalizacao
          class="aviso-ia"
          motivo="a previsão de chuva que a irrigação inteligente usa para economizar água"
        />

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
              <span class="material-symbols-outlined icone-modo" :class="{ automatico: modoAutomatico }">
                {{ modoAutomatico ? 'smart_toy' : 'back_hand' }}
              </span>
              <div>
                <span>Modo operacional</span>
                <strong>{{ statusIA.modo_nome || (modoAutomatico ? 'Automático (IA)' : 'Manual') }}</strong>
                <p class="subtexto">
                  {{ modoAutomatico
                    ? 'A IA abre e fecha as válvulas sozinha.'
                    : 'A IA só sugere; as válvulas ficam como a equipe deixar.' }}
                </p>
              </div>
            </div>

            <div class="previsao-chuva" :class="{ indisponivel: !previsao?.disponivel }">
              <span class="material-symbols-outlined">{{ previsao?.disponivel ? 'rainy' : 'cloud_off' }}</span>
              <div>
                <span>Chuva prevista ({{ previsao?.horas || 6 }} h)</span>
                <strong v-if="previsao?.disponivel">
                  {{ formatarMm(previsao.chuva_mm) }}
                  <small v-if="previsao.probabilidade_max !== null">· {{ previsao.probabilidade_max }}% de chance</small>
                </strong>
                <strong v-else>Indisponível</strong>
                <p class="subtexto">{{ previsao?.disponivel ? previsao.cidade : 'Considerada 0 mm nas decisões' }}</p>
              </div>
            </div>

            <div class="acoes-ia">
              <button
                class="btn-modo"
                :disabled="comutandoModo || !statusIA.pode_alterar_modo"
                :title="statusIA.pode_alterar_modo ? '' : 'Só gerentes e administradores alteram o modo'"
                @click="alternarModoOperacao"
              >
                {{ modoAutomatico ? 'Voltar ao manual' : 'Ligar automático (IA)' }}
              </button>
              <button
                class="btn-atualizar"
                :disabled="avaliando || !statusIA.pode_alterar_modo"
                :title="statusIA.pode_alterar_modo ? 'Roda a árvore de decisão agora para todas as mesas' : 'Só gerentes e administradores'"
                @click="avaliarAgora"
              >
                <span class="material-symbols-outlined" :class="{ 'anim-spin': avaliando }">psychology</span>
                Avaliar agora
              </button>
            </div>
          </div>

          <div class="tabela-card">
            <div class="tabela-titulo">
              <h4>Decisões da IA</h4>
              <label class="filtro-mudancas">
                <input v-model="soMudancas" type="checkbox" @change="carregarDecisoes" />
                Só aberturas e fechamentos
              </label>
            </div>
            <table v-if="decisoesIA.length > 0" class="tabela-dados">
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>Válvula</th>
                  <th>Decisão</th>
                  <th>Confiança</th>
                  <th>Justificativa</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in decisoesIA" :key="d.id">
                  <td class="font-mono sem-quebra">{{ formatarDataHora(d.horario) }}</td>
                  <td class="sem-quebra">
                    <span class="font-destaque">{{ d.valvula }}</span>
                    <small class="mesa-decisao">{{ d.mesa }}</small>
                  </td>
                  <td class="sem-quebra">
                    <span :class="['badge-status', classeAcao(d.acao)]">{{ d.acao_nome || d.acao }}</span>
                    <small class="execucao">{{ d.executada ? 'Executada' : (d.acao === 'abrir' || d.acao === 'fechar') ? 'Sugestão' : '' }}</small>
                  </td>
                  <td>
                    <div class="confianca" :title="`${(d.confianca * 100).toFixed(0)}% das amostras da folha da árvore concordam`">
                      <div class="confianca-barra"><span :style="{ width: `${d.confianca * 100}%` }" :class="classeConfianca(d.confianca)" /></div>
                      {{ (d.confianca * 100).toFixed(0) }}%
                    </div>
                  </td>
                  <td class="col-justificativa">{{ d.justificativa }}</td>
                </tr>
              </tbody>
            </table>
            <EstadoVazio
              v-else
              icone="psychology"
              :texto="soMudancas ? 'Nenhuma abertura ou fechamento decidido pela IA ainda.' : 'A IA ainda não tomou decisões.'"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
  </PageLayout>
</template>

<script setup>
import EstadoVazio from '@/components/EstadoVazio.vue'
import EstadoCarregamento from '@/components/EstadoCarregamento.vue'
import { ref, computed, onMounted } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import ErroCarregamento from '@/components/ErroCarregamento.vue'
import RecursoIndisponivel from '@/components/RecursoIndisponivel.vue'
import AvisoLocalizacao from '@/components/AvisoLocalizacao.vue'
import irrigacaoService from '@/services/irrigacaoService'
import estruturaService from '@/services/estruturaService'
import { formatarDataHora, mensagemDeErro, parseNumero, rotuloPorId } from '@/services/apiHelpers'
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
const soMudancas = ref(true)
const avaliando = ref(false)

const modoAutomatico = computed(() => statusIA.value.modo === 'AUTOMATICO_IA')
const previsao = computed(() => statusIA.value.previsao_chuva)

// Cada leitura gera uma decisão; por padrão a lista mostra só as que mexem na válvula
const paramsDecisoes = () => ({ limite: 50, ...(soMudancas.value ? { so_mudancas: 1 } : {}) })

async function carregarDecisoes() {
  try {
    decisoesIA.value = await irrigacaoService.listarDecisoes(paramsDecisoes())
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Não foi possível carregar as decisões da IA.'))
  }
}

async function carregarDados() {
  carregando.value = true
  erroCarregamento.value = ''
  try {
    // Só chama as rotas de automação se a flag estiver ligada
    const [registros, listaMesas, status, decisoes] = await Promise.all([
      irrigacaoService.listarRegistros(),
      estruturaService.listarMesas(),
      ...(FEATURES.irrigacaoIA ? [irrigacaoService.obterStatus(), irrigacaoService.listarDecisoes(paramsDecisoes())] : []),
    ])

    registrosReais.value = registros
    mesas.value = listaMesas

    if (FEATURES.irrigacaoIA) {
      statusIA.value = status || { modo: 'MANUAL', valvulas: [] }
      decisoesIA.value = decisoes
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

const obterIdentificacaoMesa = (mesaId) => rotuloPorId(mesas.value, mesaId, 'identificacao', 'Mesa')


async function alternarModoOperacao() {
  if (!FEATURES.irrigacaoIA) return

  comutandoModo.value = true
  const novoModo = statusIA.value.modo === 'MANUAL' ? 'AUTOMATICO_IA' : 'MANUAL'

  try {
    const resposta = await irrigacaoService.alterarModo(novoModo)
    // Atualização estrita somente após confirmação 2xx do servidor
    statusIA.value.modo = resposta?.modo || novoModo
    statusIA.value.modo_nome = resposta?.modo_nome
    toastStore.success(`Modo de irrigação: ${statusIA.value.modo_nome || statusIA.value.modo}`)
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Não foi possível alterar o modo de irrigação.'))
  } finally {
    comutandoModo.value = false
  }
}

async function avaliarAgora() {
  avaliando.value = true
  try {
    const decisoes = await irrigacaoService.avaliar()
    const mudancas = decisoes.filter((d) => d.acao === 'abrir' || d.acao === 'fechar')
    if (decisoes.length === 0) {
      toastStore.warning('Nenhuma mesa tem leitura de umidade do solo para avaliar.')
    } else if (mudancas.length === 0) {
      toastStore.info(`IA avaliou ${decisoes.length} mesa(s): nenhuma válvula precisa mudar.`)
    } else {
      const verbo = modoAutomatico.value ? 'acionou' : 'sugeriu'
      toastStore.success(`IA avaliou ${decisoes.length} mesa(s) e ${verbo}: `
        + mudancas.map((d) => `${d.acao_nome} ${d.valvula}`).join(', '))
    }
    await carregarDados()
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Não foi possível avaliar a irrigação agora.'))
  } finally {
    avaliando.value = false
  }
}

function formatarMm(valor) {
  return `${parseNumero(valor).toFixed(1).replace('.', ',')} mm`
}

function classeAcao(acao) {
  return {
    abrir: 'acao-abrir',
    fechar: 'acao-fechar',
    manter_aberta: 'status-ativa',
    manter_fechada: 'status-inativa',
  }[acao] || 'status-inativa'
}

function classeConfianca(confianca) {
  if (confianca >= 0.9) return 'alta'
  if (confianca >= 0.6) return 'media'
  return 'baixa'
}

onMounted(() => {
  carregarDados()
})
</script>

<style scoped>
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

.aviso-ia {
  margin-bottom: 1rem;
}

.card-status-ia .subtexto { margin: 2px 0 0; }
.modo-operacao, .previsao-chuva { display: flex; align-items: center; gap: 12px; }
.modo-operacao span:not(.material-symbols-outlined), .previsao-chuva span:not(.material-symbols-outlined) {
  display: block; font-size: 0.8rem; color: #64748b;
}
.modo-operacao strong, .previsao-chuva strong { display: block; font-size: 1.05rem; color: #1e293b; }
.previsao-chuva small { font-weight: 500; color: #64748b; font-size: 0.8rem; }
.icone-modo, .previsao-chuva > .material-symbols-outlined { font-size: 2rem; color: #64748b; }
.icone-modo.automatico { color: #2e7d32; }
.previsao-chuva > .material-symbols-outlined { color: #0288d1; }
.previsao-chuva.indisponivel > .material-symbols-outlined { color: #94a3b8; }
.acoes-ia { display: flex; gap: 10px; flex-wrap: wrap; }
.btn-modo:disabled, .btn-atualizar:disabled { opacity: 0.55; cursor: not-allowed; }
.tabela-titulo { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px 6px; flex-wrap: wrap; }
.tabela-titulo h4 { margin: 0; }
.filtro-mudancas { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #475569; cursor: pointer; }
.mesa-decisao, .execucao { display: block; font-size: 0.75rem; color: #64748b; margin-top: 2px; }
.acao-abrir { background: #e3f2fd; color: #0d47a1; }
.acao-fechar { background: #fff3e0; color: #e65100; }
.confianca { display: flex; align-items: center; gap: 8px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.confianca-barra { width: 56px; height: 6px; border-radius: 3px; background: #e2e8f0; overflow: hidden; }
.confianca-barra span { display: block; height: 100%; }
.confianca-barra .alta { background: #2e7d32; }
.confianca-barra .media { background: #f9a825; }
.confianca-barra .baixa { background: #c62828; }
.sem-quebra { white-space: nowrap; }
.col-justificativa { min-width: 280px; font-size: 0.85rem; line-height: 1.4; color: #334155; }

.secao-ia h3 {
  font-size: 1.15rem;
  margin-bottom: 1rem;
}

.card-status-ia {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.25rem;
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
</style>