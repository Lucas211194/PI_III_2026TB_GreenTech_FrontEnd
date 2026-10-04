<template>
  <PageLayout>
    <div class="colheitas-container">
      <div class="header-actions">
        <div>
          <h2>Registro de Colheitas</h2>
          <p class="subtitle">Histórico de colheitas e controle de perdas da produção</p>
        </div>
        <button class="btn-primary" @click="abrirModalNovaColheita">
          <span class="material-symbols-outlined">add</span>
          Registrar Colheita
        </button>
      </div>

      <!-- CARREGANDO -->
      <div v-if="carregando" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando registros de colheita...</p>
      </div>

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
                <td>{{ parseNumero(c.quantidade_colhida).toFixed(2) }} {{ obterUnidadeLote(c.lote_id) }}</td>
                <td :class="{ 'texto-perda': parseNumero(c.quantidade_perda) > 0 }">
                  {{ parseNumero(c.quantidade_perda).toFixed(2) }} {{ obterUnidadeLote(c.lote_id) }}
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
      <div v-else class="empty-state">
        <span class="material-symbols-outlined empty-icon">agriculture</span>
        <h3>Nenhuma colheita registrada</h3>
        <p>Quando os lotes ativos atingirem o ciclo de maturação, registre a colheita aqui.</p>
        <button class="btn-primary" @click="abrirModalNovaColheita">Registrar Primeira Colheita</button>
      </div>

      <!-- MODAL FORMULÁRIO DE COLHEITA -->
      <div v-if="exibirModal" class="modal-overlay" @click.self="fecharModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Registrar Nova Colheita</h3>
            <button class="btn-close" @click="fecharModal">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form @submit.prevent="solicitarConfirmacaoColheita">
            <div class="form-group">
              <label for="lote-colheita">Lote a ser Colhido *</label>
              <select id="lote-colheita" v-model="formulario.lote_id" required>
                <option value="" disabled>Selecione um lote ativo</option>
                <option v-for="l in lotesDisponiveis" :key="l.id" :value="l.id">
                  Lote #{{ l.id }} - {{ obterNomeCulturaPorLote(l.id) }} (Saldo: {{ l.quantidade }} {{ l.unidade }})
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
                O registro de colheita zera o saldo do lote, altera o status para 'Colhido' e gera movimentações automáticas de estoque.
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
        </div>
      </div>

      <!-- MODAL DE CONFIRMAÇÃO IRREVERSÍVEL (C08) -->
      <ModalConfirmacao
        v-if="modalConfirmacaoAberto"
        titulo="Confirmar Colheita Irreversível"
        :mensagem="mensagemConfirmacao"
        texto-confirmar="Sim, Confirmar Colheita"
        texto-cancelar="Voltar e Revisar"
        :carregando="salvando"
        @confirmar="executarRegistroColheita"
        @cancelar="modalConfirmacaoAberto = false"
      />
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import ErroCarregamento from '@/components/ErroCarregamento.vue'
import ModalConfirmacao from '@/components/ModalConfirmacao.vue'
import colheitaService from '@/services/colheitaService'
import loteService from '@/services/loteService'
import culturaService from '@/services/culturaService'
import funcionarioService from '@/services/funcionarioService'
import { mensagemDeErro, parseNumero } from '@/services/apiHelpers'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const colheitas = ref([])
const lotes = ref([])
const culturas = ref([])
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

const lotesDisponiveis = computed(() => {
  return lotes.value.filter((l) => l.status === 'AT' || l.status === 'DI' || l.status === 'ES')
})

const loteSelecionado = computed(() => {
  if (!formulario.value.lote_id) return null
  return lotes.value.find((l) => l.id === formulario.value.lote_id) || null
})

const mensagemConfirmacao = computed(() => {
  if (!loteSelecionado.value) return ''
  return `Esta ação é irreversível. O lote #${loteSelecionado.value.id} terá seu saldo zerado e status alterado permanentemente para 'Colhido'. Confirma o registro de ${formulario.value.quantidade_colhida} colhidos e ${formulario.value.quantidade_perda || 0} de perda?`
})

async function carregarDados() {
  carregando.value = true
  erroCarregamento.value = ''

  try {
    const [resColheitas, resLotes, resCulturas, resFuncs] = await Promise.all([
      colheitaService.listar(),
      loteService.listar(),
      culturaService.listar(),
      funcionarioService.listar()
    ])

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
  return lote ? lote.unidade : 'UN'
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

function formatarData(dataStr) {
  if (!dataStr) return '-'
  const [ano, mes, dia] = dataStr.split('-')
  return `${dia}/${mes}/${ano}`
}

function abrirModalNovaColheita() {
  formulario.value = {
    lote_id: '',
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

onMounted(() => {
  carregarDados()
})
</script>

<style scoped>
.colheitas-container {
  padding: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.subtitle {
  color: var(--color-text-muted, #64748b);
  margin-top: 0.25rem;
  font-size: 0.95rem;
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

.font-mono {
  font-family: monospace;
}

.font-destaque {
  font-weight: 600;
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

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  text-align: center;
  background: var(--color-surface, #ffffff);
  border-radius: var(--radius-lg, 12px);
  border: 1px dashed var(--color-border, #e2e8f0);
}

.empty-icon {
  font-size: 48px;
  color: var(--color-text-muted, #64748b);
  margin-bottom: 1rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border, #e2e8f0);
  border-top-color: var(--color-primary, #16a34a);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-surface, #ffffff);
  border-radius: var(--radius-lg, 12px);
  padding: 1.5rem;
  width: 100%;
  max-width: 520px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.modal-header h3 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted, #64748b);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text, #1e293b);
}

.form-group input,
.form-group select {
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  font-size: 0.9rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>