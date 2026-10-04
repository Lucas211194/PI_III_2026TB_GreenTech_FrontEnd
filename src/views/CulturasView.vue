<template>
  <PageLayout>
    <div class="culturas-container">
      <div class="header-actions">
        <div>
          <h2>Culturas Cadastradas</h2>
          <p class="subtitle">Gerencie as espécies e parâmetros de cultivo da estufa</p>
        </div>
        <button class="btn-primary" @click="abrirModalNovaCultura">
          <span class="material-symbols-outlined">add</span>
          Nova Cultura
        </button>
      </div>

      <!-- ESTADO DE CARREGAMENTO -->
      <div v-if="carregando" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando culturas...</p>
      </div>

      <!-- ESTADO DE ERRO -->
      <ErroCarregamento
        v-else-if="erroCarregamento"
        :mensagem="erroCarregamento"
        @tentar-novamente="carregarCulturas"
      />

      <!-- LISTAGEM DE CULTURAS -->
      <div v-else-if="culturas.length > 0" class="culturas-grid">
        <div
          v-for="cultura in culturas"
          :key="cultura.id"
          class="cultura-card"
          @click="selecionarCultura(cultura)"
        >
          <div class="card-header">
            <h3>{{ cultura.nome_cultura }}</h3>
            <div class="card-actions" @click.stop>
              <button class="btn-icon" title="Editar" @click="editarCultura(cultura)">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button
                v-if="podeExcluir"
                class="btn-icon btn-danger"
                title="Excluir"
                @click="prepararExclusao(cultura)"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>

          <p class="descricao-curta">{{ cultura.descricao || 'Sem descrição informada.' }}</p>

          <div class="metricas-resumo">
            <div class="metrica">
              <span class="label">Ciclo Médio:</span>
              <span class="valor">{{ cultura.tempo_medio_colheita }} dias</span>
            </div>
            <div class="metrica">
              <span class="label">Faixa Temp.:</span>
              <span class="valor">{{ cultura.temperatura_minima }}°C a {{ cultura.temperatura_maxima }}°C</span>
            </div>
            <div class="metrica">
              <span class="label">Umidade Ideal:</span>
              <span class="valor">{{ cultura.umidade_ideal }}%</span>
            </div>
          </div>

          <!-- DADOS CALCULADOS PELO SERVIDOR (A11) -->
          <div class="metricas-producao">
            <div class="prod-item">
              <span class="label">Total Colhido:</span>
              <span class="valor">{{ parseNumero(cultura.total_colhido).toFixed(2) }}</span>
            </div>
            <div class="prod-item">
              <span class="label">Total Perda:</span>
              <span class="valor perda">{{ parseNumero(cultura.total_perda).toFixed(2) }}</span>
            </div>
            <div class="prod-item">
              <span class="label">Taxa Produção:</span>
              <span class="valor taxa">{{ parseNumero(cultura.taxa_producao).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ESTADO VAZIO -->
      <div v-else class="empty-state">
        <span class="material-symbols-outlined empty-icon">potted_plant</span>
        <h3>Nenhuma cultura cadastrada</h3>
        <p>Cadastre os parâmetros da primeira cultura para iniciar o plantio.</p>
        <button class="btn-primary" @click="abrirModalNovaCultura">Cadastrar Cultura</button>
      </div>

      <!-- MODAL FORMULÁRIO (CADASTRO / EDIÇÃO) -->
      <div v-if="exibirModal" class="modal-overlay" @click.self="fecharModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ modoEdicao ? 'Editar Cultura' : 'Nova Cultura' }}</h3>
            <button class="btn-close" @click="fecharModal">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form @submit.prevent="salvarCultura">
            <div class="form-group">
              <label for="nome-cultura">Nome da Cultura *</label>
              <input
                id="nome-cultura"
                v-model="formulario.nome_cultura"
                type="text"
                required
                placeholder="Ex.: Tomate Cereja"
              />
            </div>

            <div class="form-group">
              <label for="descricao-cultura">Descrição</label>
              <textarea
                id="descricao-cultura"
                v-model="formulario.descricao"
                rows="2"
                placeholder="Informações gerais da espécie..."
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="tempo-colheita">Ciclo Colheita (dias) *</label>
                <input
                  id="tempo-colheita"
                  v-model.number="formulario.tempo_medio_colheita"
                  type="number"
                  min="1"
                  required
                />
              </div>
              <div class="form-group">
                <label for="umidade-ideal">Umidade Ideal (%) *</label>
                <input
                  id="umidade-ideal"
                  v-model.number="formulario.umidade_ideal"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="temp-minima">Temp. Mínima (°C) *</label>
                <input
                  id="temp-minima"
                  v-model.number="formulario.temperatura_minima"
                  type="number"
                  step="0.1"
                  required
                />
              </div>
              <div class="form-group">
                <label for="temp-maxima">Temp. Máxima (°C) *</label>
                <input
                  id="temp-maxima"
                  v-model.number="formulario.temperatura_maxima"
                  type="number"
                  step="0.1"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label for="observacoes-cultura">Observações Técnicas</label>
              <textarea
                id="observacoes-cultura"
                v-model="formulario.observacoes"
                rows="2"
                placeholder="Cuidados específicos, adubação recomendada..."
              ></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" :disabled="salvando" @click="fecharModal">
                Cancelar
              </button>
              <button type="submit" class="btn-primary" :disabled="salvando">
                <span v-if="salvando" class="spinner-sm"></span>
                {{ salvando ? 'Salvando...' : 'Salvar Cultura' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL CONFIRMAÇÃO DE EXCLUSÃO -->
      <ModalConfirmacao
        v-if="modalExclusaoAberto"
        titulo="Excluir Cultura"
        :mensagem="mensagemConfirmacaoExclusao"
        texto-confirmar="Sim, Excluir Tudo"
        texto-cancelar="Cancelar"
        :carregando="excluindo"
        @confirmar="confirmarExclusao"
        @cancelar="modalExclusaoAberto = false"
      />
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import ErroCarregamento from '@/components/ErroCarregamento.vue'
import ModalConfirmacao from '@/components/ModalConfirmacao.vue'
import apiClient from '@/services/api'
import { extrairLista, mensagemDeErro, parseNumero } from '@/services/apiHelpers'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const authStore = useAuthStore()
const toastStore = useToastStore()

const culturas = ref([])
const carregando = ref(false)
const salvando = ref(false)
const excluindo = ref(false)
const erroCarregamento = ref('')

const exibirModal = ref(false)
const modoEdicao = ref(false)
const culturaSelecionada = ref(null)

const modalExclusaoAberto = ref(false)
const culturaParaExcluir = ref(null)

const podeExcluir = computed(() => {
  return Boolean(authStore.isGerente || authStore.isAdmin)
})

const mensagemConfirmacaoExclusao = computed(() => {
  if (!culturaParaExcluir.value) return ''
  return `Atenção: A exclusão da cultura "${culturaParaExcluir.value.nome_cultura}" é irreversível e apagará em cascata todos os lotes, colheitas e movimentações vinculadas a ela no sistema.`
})

const formularioPadrao = () => ({
  id: null,
  nome_cultura: '',
  descricao: '',
  tempo_medio_colheita: 60,
  temperatura_minima: 18,
  temperatura_maxima: 28,
  umidade_ideal: 70,
  observacoes: ''
})

const formulario = ref(formularioPadrao())

async function carregarCulturas() {
  carregando.value = true
  erroCarregamento.value = ''
  try {
    const res = await apiClient.get('/cultura/')
    culturas.value = extrairLista(res.data)
  } catch (err) {
    erroCarregamento.value = mensagemDeErro(err, 'Erro ao carregar lista de culturas.')
    toastStore.error(erroCarregamento.value)
  } finally {
    carregando.value = false
  }
}

function abrirModalNovaCultura() {
  modoEdicao.value = false
  formulario.value = formularioPadrao()
  exibirModal.value = true
}

function editarCultura(cultura) {
  modoEdicao.value = true
  formulario.value = {
    id: cultura.id,
    nome_cultura: cultura.nome_cultura,
    descricao: cultura.descricao || '',
    tempo_medio_colheita: cultura.tempo_medio_colheita,
    temperatura_minima: parseNumero(cultura.temperatura_minima),
    temperatura_maxima: parseNumero(cultura.temperatura_maxima),
    umidade_ideal: parseNumero(cultura.umidade_ideal),
    observacoes: cultura.observacoes || ''
  }
  exibirModal.value = true
}

function selecionarCultura(cultura) {
  culturaSelecionada.value = cultura
}

function fecharModal() {
  if (salvando.value) return
  exibirModal.value = false
}

async function salvarCultura() {
  if (Number(formulario.value.temperatura_minima) >= Number(formulario.value.temperatura_maxima)) {
    toastStore.warning('A temperatura mínima deve ser menor que a temperatura máxima.')
    return
  }

  salvando.value = true
  try {
    const payload = {
      nome_cultura: formulario.value.nome_cultura.trim(),
      descricao: formulario.value.descricao,
      tempo_medio_colheita: formulario.value.tempo_medio_colheita,
      temperatura_minima: formulario.value.temperatura_minima,
      temperatura_maxima: formulario.value.temperatura_maxima,
      umidade_ideal: formulario.value.umidade_ideal,
      observacoes: formulario.value.observacoes
    }

    if (modoEdicao.value && formulario.value.id) {
      await apiClient.put(`/cultura/${formulario.value.id}/`, payload)
      toastStore.success('Cultura atualizada com sucesso!')
    } else {
      await apiClient.post('/cultura/', payload)
      toastStore.success('Cultura cadastrada com sucesso!')
    }

    exibirModal.value = false
    await carregarCulturas()
  } catch (err) {
    // D03: Mantém o modal aberto para permitir correção dos dados
    toastStore.error(mensagemDeErro(err, 'Erro ao salvar a cultura.'))
  } finally {
    salvando.value = false
  }
}

function prepararExclusao(cultura) {
  culturaParaExcluir.value = cultura
  modalExclusaoAberto.value = true
}

async function confirmarExclusao() {
  if (!culturaParaExcluir.value) return

  excluindo.value = true
  try {
    await apiClient.delete(`/cultura/${culturaParaExcluir.value.id}/`)
    toastStore.success('Cultura e registros associados excluídos com sucesso!')
    modalExclusaoAberto.value = false
    culturaParaExcluir.value = null
    await carregarCulturas()
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Erro ao excluir cultura.'))
  } finally {
    excluindo.value = false
  }
}

onMounted(() => {
  carregarCulturas()
})
</script>

<style scoped>
.culturas-container {
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

.culturas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.cultura-card {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cultura-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-header h3 {
  font-size: 1.15rem;
  color: var(--color-text, #1e293b);
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 0.25rem;
}

.descricao-curta {
  font-size: 0.875rem;
  color: var(--color-text-muted, #64748b);
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.metricas-resumo {
  background: var(--color-background, #f8fafc);
  padding: 0.75rem;
  border-radius: var(--radius-md, 8px);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
}

.metrica {
  display: flex;
  justify-content: space-between;
}

.metrica .label {
  color: var(--color-text-muted, #64748b);
}

.metrica .valor {
  font-weight: 500;
  color: var(--color-text, #1e293b);
}

.metricas-producao {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--color-border, #e2e8f0);
  font-size: 0.75rem;
}

.prod-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.prod-item .label {
  color: var(--color-text-muted, #64748b);
  margin-bottom: 0.15rem;
}

.prod-item .valor {
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.prod-item .valor.perda {
  color: var(--color-danger, #ef4444);
}

.prod-item .valor.taxa {
  color: var(--color-primary, #16a34a);
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

.btn-icon {
  background: none;
  border: none;
  color: var(--color-text-muted, #64748b);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  border-radius: 4px;
}

.btn-icon:hover {
  color: var(--color-text, #1e293b);
  background-color: var(--color-background, #f8fafc);
}

.btn-icon.btn-danger:hover {
  color: var(--color-danger, #ef4444);
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

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
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
  max-width: 540px;
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
.form-group textarea {
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>