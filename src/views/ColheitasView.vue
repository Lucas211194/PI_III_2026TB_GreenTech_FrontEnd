<template>
  <PageLayout title="Registro de Colheitas" subtitle="Histórico de colheitas e controle de perdas da produção">
    <template #header-actions>
      <button class="btn-primary" @click="abrirModalNovaColheita()">
        <span class="material-symbols-outlined">add</span>
        Registrar Colheita
      </button>
    </template>

    <div class="colheitas-container">

      <!-- CARREGANDO -->
      <EstadoCarregamento v-if="carregando" mensagem="Carregando registros de colheita..." />

      <!-- ERRO -->
      <ErroCarregamento
        v-else-if="erroCarregamento"
        :mensagem="erroCarregamento"
        @tentar-novamente="carregarDados"
      />

      <!-- TABELA DE COLHEITAS -->
      <div v-else-if="colheitas.length > 0" class="tabela-card">
        <div class="tabela-responsive">
          <table class="tabela-colheitas">
            <thead>
              <tr>
                <th>ID</th>
                <th>Lote</th>
                <th>Cultura</th>
                <th>Data da Colheita</th>
                <th>Qtd. Colhida</th>
                <th>Qtd. Perda</th>
                <th>Aproveitamento</th>
                <th>Responsável</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in colheitas" :key="c.id">
                <td class="font-mono">#{{ c.id }}</td>
                <td class="font-mono">#{{ c.lote_id }}</td>
                <td class="font-destaque">{{ obterNomeCulturaPorLote(c.lote_id) }}</td>
                <td>{{ formatarData(c.data_colheita) }}</td>
                <td>{{ formatarQuantidade(c.quantidade_colhida) }} {{ obterUnidadeLote(c.lote_id) }}</td>
                <td :class="{ 'texto-perda': parseNumero(c.quantidade_perda) > 0 }">
                  {{ formatarQuantidade(c.quantidade_perda) }} {{ obterUnidadeLote(c.lote_id) }}
                </td>
                <td>
                  <span :class="['badge-taxa', classeTaxa(calcularTaxaAproveitamento(c))]">
                    {{ calcularTaxaAproveitamento(c).toFixed(1) }}%
                  </span>
                </td>
                <td>{{ obterNomeFuncionario(c.funcionario_id) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- VAZIO -->
      <EstadoVazio v-else icone="agriculture" titulo="Nenhuma colheita registrada" texto="Quando os lotes ativos atingirem o ciclo de maturação, registre a colheita aqui.">
        <button class="btn-primary" @click="abrirModalNovaColheita()">Registrar Primeira Colheita</button>
      </EstadoVazio>

      <!-- MODAL FORMULÁRIO DE COLHEITA -->
      <ModalFormulario v-if="exibirModal" titulo="Registrar Nova Colheita" @fechar="fecharModal">

        <form @submit.prevent="solicitarConfirmacaoColheita">
          <div class="form-group">
            <label for="lote-colheita">Lote a ser Colhido *</label>
            <select id="lote-colheita" v-model="formulario.lote_id" required>
              <option value="" disabled>Selecione um lote em cultivo</option>
              <option v-for="l in lotesDisponiveis" :key="l.id" :value="l.id">
                {{ obterIdentificacaoMesa(l.mesa_id) }} · {{ obterNomeCulturaPorLote(l.id) }} ·
                {{ percentualCiclo(l) }}% do ciclo · {{ formatarQuantidade(l.quantidade) }} plantas
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="qtd-colhida">Quantidade Colhida *</label>
              <input
                id="qtd-colhida"
                v-model.number="formulario.quantidade_colhida"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
            </div>

            <div class="form-group">
              <label for="qtd-perda">Quantidade de Perda</label>
              <input
                id="qtd-perda"
                v-model.number="formulario.quantidade_perda"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div class="aviso-irreversivel">
            <span class="material-symbols-outlined">info</span>
            <p>
              A colheita encerra o lote e libera a mesa.
              <template v-if="saldoRestante > 0 && formulario.quantidade_colhida > 0">
                As {{ formatarQuantidade(saldoRestante) }} {{ obterUnidadeLote(loteSelecionado.id) }} não informadas
                serão baixadas como perda.
              </template>
            </p>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" :disabled="salvando" @click="fecharModal">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="salvando">
              Avançar
            </button>
          </div>
        </form>
      </ModalFormulario>

      <!-- MODAL DE CONFIRMAÇÃO IRREVERSÍVEL (C08) -->
      <ModalConfirmacao
        :ativo="modalConfirmacaoAberto"
        titulo="Confirmar Colheita Irreversível"
        :mensagem="mensagemConfirmacao"
        texto-confirmar="Sim, Confirmar Colheita"
        texto-cancelar="Voltar e Revisar"
        :processando="salvando"
        @confirmar="executarRegistroColheita"
        @cancelar="modalConfirmacaoAberto = false"
      />
    </div>
  </PageLayout>
</template>

<script setup>
import ModalFormulario from '@/components/ModalFormulario.vue'
import EstadoVazio from '@/components/EstadoVazio.vue'
import EstadoCarregamento from '@/components/EstadoCarregamento.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageLayout from '@/components/PageLayout.vue'
import ErroCarregamento from '@/components/ErroCarregamento.vue'
import ModalConfirmacao from '@/components/ModalConfirmacao.vue'
import colheitaService from '@/services/colheitaService'
import loteService from '@/services/loteService'
import culturaService from '@/services/culturaService'
import funcionarioService from '@/services/funcionarioService'
import estruturaService from '@/services/estruturaService'
import { formatarData, formatarQuantidade, mensagemDeErro, parseNumero, rotuloPorId } from '@/services/apiHelpers'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()
const route = useRoute()

const colheitas = ref([])
const lotes = ref([])
const culturas = ref([])
const mesas = ref([])
// A16: Guarda apenas { id, nome } em memória para proteção de dados pessoais
const funcionariosMinimos = ref([])

const carregando = ref(false)
const salvando = ref(false)
const erroCarregamento = ref('')
const exibirModal = ref(false)
const modalConfirmacaoAberto = ref(false)

const formulario = ref({
  lote_id: '',
  quantidade_colhida: 0,
  quantidade_perda: 0
})

// Ao escolher o lote, parte do saldo inteiro colhido: o operador só ajusta o que foi descartado
watch(() => formulario.value.lote_id, (loteId) => {
  const lote = lotes.value.find((l) => l.id === loteId)
  if (lote) {
    formulario.value.quantidade_colhida = parseNumero(lote.quantidade)
    formulario.value.quantidade_perda = 0
  }
})

const lotesDisponiveis = computed(() => {
  // Só plantios em cultivo (mudas em estoque não são colhidas), os mais maduros primeiro
  return lotes.value
    .filter((l) => l.status === 'AT')
    .sort((a, b) => percentualCiclo(b) - percentualCiclo(a))
})

const loteSelecionado = computed(() => {
  if (!formulario.value.lote_id) return null
  return lotes.value.find((l) => l.id === formulario.value.lote_id) || null
})

const saldoRestante = computed(() => {
  if (!loteSelecionado.value) return 0
  const resto = parseNumero(loteSelecionado.value.quantidade)
    - (Number(formulario.value.quantidade_colhida) || 0) - (Number(formulario.value.quantidade_perda) || 0)
  return Math.max(0, Math.round(resto * 100) / 100)
})

const mensagemConfirmacao = computed(() => {
  if (!loteSelecionado.value) return ''
  return `Esta ação é irreversível. O lote #${loteSelecionado.value.id} terá seu saldo zerado e status alterado permanentemente para 'Colhido'. Confirma o registro de ${formulario.value.quantidade_colhida} colhidos e ${formulario.value.quantidade_perda || 0} de perda?${saldoRestante.value > 0 ? ` As ${saldoRestante.value} restantes serão registradas como perda.` : ''}`
})

async function carregarDados() {
  carregando.value = true
  erroCarregamento.value = ''

  try {
    const [resColheitas, resLotes, resCulturas, resFuncs, resMesas] = await Promise.all([
      colheitaService.listar(),
      loteService.listar(),
      culturaService.listar(),
      funcionarioService.listar(),
      estruturaService.listarMesas()
    ])

    mesas.value = resMesas
    colheitas.value = resColheitas
    lotes.value = resLotes
    culturas.value = resCulturas

    // A16: Mapeia apenas id e nome do funcionário, sem reter CPF ou telefone
    funcionariosMinimos.value = resFuncs.map((f) => ({
      id: f.id,
      nome: f.nome_completo || f.usuario || f.username || `Funcionário #${f.id}`
    }))
  } catch (err) {
    erroCarregamento.value = mensagemDeErro(err, 'Erro ao carregar dados de colheita.')
    toastStore.error(erroCarregamento.value)
  } finally {
    carregando.value = false
  }
}

function obterNomeCulturaPorLote(loteId) {
  const lote = lotes.value.find((l) => l.id === loteId)
  if (!lote) return '-'
  const cultura = culturas.value.find((c) => c.id === lote.cultura_id)
  return cultura ? cultura.nome_cultura : `Cultura #${lote.cultura_id}`
}

function obterUnidadeLote(loteId) {
  const lote = lotes.value.find((l) => l.id === loteId)
  return !lote || lote.unidade === 'UN' ? 'plantas' : lote.unidade
}

const obterIdentificacaoMesa = (mesaId) => rotuloPorId(mesas.value, mesaId, 'identificacao', 'Mesa')

// Quanto do ciclo da cultura já passou desde o plantio
function percentualCiclo(lote) {
  const cultura = culturas.value.find((c) => c.id === lote.cultura_id)
  if (!cultura || !(cultura.tempo_medio_colheita > 0)) return 0
  const dias = (new Date() - new Date(`${lote.data_plantio}T00:00:00`)) / 86400000
  return Math.max(0, Math.round((dias / cultura.tempo_medio_colheita) * 100))
}

function obterNomeFuncionario(funcionarioId) {
  if (!funcionarioId) return '-'
  const f = funcionariosMinimos.value.find((item) => item.id === funcionarioId)
  return f ? f.nome : `Funcionário #${funcionarioId}`
}

function calcularTaxaAproveitamento(c) {
  const colhido = parseNumero(c.quantidade_colhida)
  const perda = parseNumero(c.quantidade_perda)
  const total = colhido + perda
  if (total <= 0) return 100
  return (colhido / total) * 100
}

function classeTaxa(taxa) {
  if (taxa >= 90) return 'taxa-excelente'
  if (taxa >= 75) return 'taxa-boa'
  return 'taxa-baixa'
}


function abrirModalNovaColheita(loteId = '') {
  formulario.value = {
    lote_id: loteId,
    quantidade_colhida: 0,
    quantidade_perda: 0
  }
  exibirModal.value = true
}

function fecharModal() {
  if (salvando.value) return
  exibirModal.value = false
}

function solicitarConfirmacaoColheita() {
  const colhido = Number(formulario.value.quantidade_colhida)
  const perda = Number(formulario.value.quantidade_perda) || 0

  if (colhido <= 0) {
    toastStore.warning('A quantidade colhida deve ser maior que zero.')
    return
  }

  if (loteSelecionado.value && colhido + perda > parseNumero(loteSelecionado.value.quantidade)) {
    toastStore.warning('A soma de colheita e perda excede o saldo atual do lote.')
    return
  }

  modalConfirmacaoAberto.value = true
}

async function executarRegistroColheita() {
  salvando.value = true
  try {
    // D02: Envia apenas lote_id, quantidade_colhida e quantidade_perda (sem data_colheita ou funcionario_id)
    await colheitaService.registrarColheita({
      lote_id: formulario.value.lote_id,
      quantidade_colhida: formulario.value.quantidade_colhida,
      quantidade_perda: formulario.value.quantidade_perda || 0
    })

    toastStore.success('Colheita registrada com sucesso! Lote finalizado.')
    modalConfirmacaoAberto.value = false
    exibirModal.value = false
    await carregarDados()
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Erro ao registrar colheita no servidor.'))
  } finally {
    salvando.value = false
  }
}

onMounted(async () => {
  await carregarDados()
  // Vindo do dashboard ("Colher"), abre o formulário com o lote já escolhido
  const loteId = Number(route.query.lote)
  if (loteId && lotesDisponiveis.value.some((l) => l.id === loteId)) {
    abrirModalNovaColheita(loteId)
  }
})
</script>

<style scoped>
.tabela-card {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
}

.tabela-responsive {
  overflow-x: auto;
}

.tabela-colheitas {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.tabela-colheitas th {
  padding: 1rem;
  background-color: var(--color-background, #f8fafc);
  color: var(--color-text-muted, #64748b);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.tabela-colheitas td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-text, #1e293b);
}

.texto-perda {
  color: var(--color-danger, #ef4444);
  font-weight: 500;
}

.badge-taxa {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.taxa-excelente {
  background-color: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
}

.taxa-boa {
  background-color: rgba(245, 158, 11, 0.12);
  color: #b45309;
}

.taxa-baixa {
  background-color: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-primary, #16a34a);
  color: #fff;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md, 8px);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark, #15803d);
}

.btn-secondary {
  background-color: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
}

.aviso-irreversivel {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: var(--radius-md, 8px);
  padding: 0.75rem;
  margin-top: 0.5rem;
}

.aviso-irreversivel .material-symbols-outlined {
  color: var(--color-danger, #ef4444);
  font-size: 20px;
}

.aviso-irreversivel p {
  margin: 0;
  font-size: 0.8rem;
  color: #991b1b;
  line-height: 1.4;
}
</style>