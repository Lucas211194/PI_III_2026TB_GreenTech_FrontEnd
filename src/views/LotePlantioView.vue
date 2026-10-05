<template>
  <PageLayout title="Gestão de Lotes de Plantio" subtitle="Controle de semeadura, cultivo e monitoramento por mesa">
  <div class="lote-view">
    <div class="lote-container">
      <!-- AÇÕES DO TOPO E FILTROS -->
      <div class="top-actions">
        <div class="filtros-busca">
          <div class="busca-input-wrapper">
            <span class="material-symbols-outlined">search</span>
            <input
              v-model="termoBusca"
              type="text"
              placeholder="Buscar por lote, cultura, mesa ou fornecedor..."
              class="input-busca"
            />
          </div>
          <select v-model="filtroStatus" class="select-filtro">
            <option value="">Todos os status</option>
            <option value="AT">Ativo</option>
            <option value="ES">Em Estoque</option>
            <option value="BX">Estoque Baixo</option>
            <option value="DI">Disponível</option>
            <option value="CO">Colhido</option>
            <option value="PE">Perdido</option>
          </select>
        </div>

        <button class="btn-novo-lote" @click="abrirModalNovoLote">
          <span class="material-symbols-outlined">add</span>
          Novo Lote
        </button>
      </div>

      <!-- CARREGAMENTO -->
      <div v-if="carregando" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando lotes...</p>
      </div>

      <!-- ERRO DE CARREGAMENTO -->
      <ErroCarregamento
        v-else-if="erroCarregamento"
        :mensagem="erroCarregamento"
        @tentar-novamente="carregarDados"
      />

      <!-- LISTAGEM EM TABELA -->
      <div v-else-if="lotesFiltrados.length > 0" class="tabela-card">
        <table class="tabela-lotes">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cultura</th>
              <th>Mesa</th>
              <th>Plantio</th>
              <th>Quantidade</th>
              <th>Validade</th>
              <th>Status</th>
              <th>Fornecedor</th>
              <th width="80">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lote in lotesFiltrados" :key="lote.id">
              <td class="font-mono">#{{ lote.id }}</td>
              <td class="font-destaque">{{ obterNomeCultura(lote.cultura_id) }}</td>
              <td>{{ obterIdentificacaoMesa(lote.mesa_id) }}</td>
              <td>{{ formatarData(lote.data_plantio) }}</td>
              <td>{{ lote.quantidade }} {{ lote.unidade }}</td>
              <td>{{ lote.validade ? formatarData(lote.validade) : '-' }}</td>
              <td>
                <span :class="['badge-status', `status-${lote.status}`]">
                  {{ rotuloStatus(lote.status) }}
                </span>
              </td>
              <td>{{ lote.fornecedor || '-' }}</td>
              <td>
                <button
                  v-if="podeExcluir"
                  class="btn-icon btn-danger"
                  title="Excluir Lote"
                  @click="excluirLote(lote.id)"
                >
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ESTADO VAZIO -->
      <div v-else class="empty-state">
        <span class="material-symbols-outlined empty-icon">psychiatry</span>
        <h3>Nenhum lote encontrado</h3>
        <p>Cadastre um novo lote de plantio para vincular a uma mesa e cultura.</p>
        <button class="btn-novo-lote" @click="abrirModalNovoLote">Criar Primeiro Lote</button>
      </div>
    </div>

    <!-- MODAL DE CADASTRO DE LOTE -->
    <div v-if="exibirModal" class="modal-overlay" @click.self="fecharModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Novo Lote de Plantio</h3>
          <button class="btn-close" @click="fecharModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form @submit.prevent="salvarLote">
          <div class="form-row">
            <div class="form-group">
              <label for="cultura-select">Cultura *</label>
              <select id="cultura-select" v-model="novoLote.cultura_id" required>
                <option value="" disabled>Selecione uma cultura</option>
                <option v-for="c in culturas" :key="c.id" :value="c.id">
                  {{ c.nome_cultura }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="mesa-select">Mesa *</label>
              <select id="mesa-select" v-model="novoLote.mesa_id" required>
                <option value="" disabled>Selecione uma mesa</option>
                <option v-for="m in mesas" :key="m.id" :value="m.id">
                  {{ m.identificacao }} ({{ m.estufa_nome || 'Sem estufa' }})
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="data-plantio">Data de Plantio *</label>
              <input id="data-plantio" v-model="novoLote.data_plantio" type="date" required />
            </div>

            <div class="form-group">
              <label for="validade-lote">Data de Validade</label>
              <input id="validade-lote" v-model="novoLote.validade" type="date" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="quantidade-lote">Quantidade Inicial *</label>
              <input
                id="quantidade-lote"
                v-model.number="novoLote.quantidade"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
            </div>

            <div class="form-group">
              <label for="unidade-lote">Unidade *</label>
              <select id="unidade-lote" v-model="novoLote.unidade" required>
                <option value="UN">UN (Unidade)</option>
                <option value="KG">KG (Quilograma)</option>
                <option value="G">G (Grama)</option>
                <option value="CX">CX (Caixa)</option>
                <option value="BD">BD (Bandeja)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="status-lote">Status Inicial *</label>
              <select id="status-lote" v-model="novoLote.status" required>
                <option value="AT">Ativo</option>
                <option value="DI">Disponível</option>
                <option value="ES">Em Estoque</option>
                <option value="BX">Estoque Baixo</option>
              </select>
            </div>

            <div class="form-group">
              <label for="fornecedor-lote">Fornecedor</label>
              <input
                id="fornecedor-lote"
                v-model="novoLote.fornecedor"
                type="text"
                placeholder="Ex.: Sementes do Vale"
              />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancelar" :disabled="salvando" @click="fecharModal">
              Cancelar
            </button>
            <button type="submit" class="btn-salvar" :disabled="salvando">
              <span v-if="salvando" class="spinner-sm"></span>
              {{ salvando ? 'Cadastrando...' : 'Cadastrar Lote' }}
            </button>
          </div>
        </form>
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
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import verificarPermissao from '@/assets/JS/verificarPermissao'

const authStore = useAuthStore()
const toastStore = useToastStore()

const lotes = ref([])
const culturas = ref([])
const mesas = ref([])

const carregando = ref(false)
const salvando = ref(false)
const erroCarregamento = ref('')
const exibirModal = ref(false)

const termoBusca = ref('')
const filtroStatus = ref('')

const permissoesUsuario = ref({ isAdmin: false, isGerente: false })

const podeExcluir = computed(() => {
  return permissoesUsuario.value.isAdmin || permissoesUsuario.value.isGerente || authStore.isAdmin || authStore.isGerente
})

const formularioPadrao = () => ({
  cultura_id: '',
  mesa_id: '',
  data_plantio: new Date().toISOString().split('T')[0],
  validade: null,
  quantidade: 1,
  unidade: 'UN',
  status: 'AT',
  fornecedor: ''
})

const novoLote = ref(formularioPadrao())

async function carregarPermissoes() {
  try {
    const perm = await verificarPermissao()
    permissoesUsuario.value = perm
  } catch {
    permissoesUsuario.value = { isAdmin: false, isGerente: false }
  }
}

async function carregarDados() {
  carregando.value = true
  erroCarregamento.value = ''
  try {
    const [resLotes, resCulturas, resMesas] = await Promise.all([
      apiClient.get('/lotes/'),
      apiClient.get('/cultura/'),
      apiClient.get('/mesa/')
    ])

    lotes.value = extrairLista(resLotes.data)
    culturas.value = extrairLista(resCulturas.data)
    mesas.value = extrairLista(resMesas.data)
  } catch (err) {
    erroCarregamento.value = mensagemDeErro(err, 'Erro ao carregar dados dos lotes.')
    toastStore.error(erroCarregamento.value)
  } finally {
    carregando.value = false
  }
}

// B02: Busca segura evitando quebra caso lote.fornecedor seja null
const lotesFiltrados = computed(() => {
  return lotes.value.filter((lote) => {
    const culturaNome = obterNomeCultura(lote.cultura_id).toLowerCase()
    const mesaId = obterIdentificacaoMesa(lote.mesa_id).toLowerCase()
    const fornecedorNome = (lote.fornecedor || '').toLowerCase()
    const loteId = String(lote.id)

    const busca = termoBusca.value.trim().toLowerCase()
    const atendeBusca =
      !busca ||
      loteId.includes(busca) ||
      culturaNome.includes(busca) ||
      mesaId.includes(busca) ||
      fornecedorNome.includes(busca)

    const atendeStatus = !filtroStatus.value || lote.status === filtroStatus.value

    return atendeBusca && atendeStatus
  })
})

function obterNomeCultura(culturaId) {
  const cultura = culturas.value.find((c) => c.id === culturaId)
  return cultura ? cultura.nome_cultura : `Cultura #${culturaId}`
}

function obterIdentificacaoMesa(mesaId) {
  const mesa = mesas.value.find((m) => m.id === mesaId)
  return mesa ? mesa.identificacao : `Mesa #${mesaId}`
}

function rotuloStatus(status) {
  const mapa = {
    AT: 'Ativo',
    ES: 'Em Estoque',
    BX: 'Estoque Baixo',
    DI: 'Disponível',
    CO: 'Colhido',
    PE: 'Perdido'
  }
  return mapa[status] || status
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  const [ano, mes, dia] = dataStr.split('-')
  return `${dia}/${mes}/${ano}`
}

function abrirModalNovoLote() {
  novoLote.value = formularioPadrao()
  exibirModal.value = true
}

function fecharModal() {
  if (salvando.value) return
  exibirModal.value = false
}

async function salvarLote() {
  salvando.value = true
  try {
    const payload = {
      cultura_id: novoLote.value.cultura_id,
      mesa_id: novoLote.value.mesa_id,
      data_plantio: novoLote.value.data_plantio,
      validade: novoLote.value.validade || null,
      quantidade: novoLote.value.quantidade,
      unidade: novoLote.value.unidade,
      status: novoLote.value.status,
      fornecedor: novoLote.value.fornecedor?.trim() || null
    }

    await apiClient.post('/lotes/', payload)
    toastStore.success('Lote criado com sucesso e movimentação registrada!')
    exibirModal.value = false
    await carregarDados()
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Falha ao cadastrar o lote.'))
  } finally {
    salvando.value = false
  }
}

async function excluirLote(id) {
  if (!window.confirm(`Tem certeza que deseja excluir o lote #${id}?`)) {
    return
  }

  try {
    await apiClient.delete(`/lotes/${id}/`)
    toastStore.success(`Lote #${id} excluído com sucesso!`)
    await carregarDados()
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Erro ao excluir o lote.'))
  }
}

onMounted(async () => {
  await carregarPermissoes()
  await carregarDados()
})
</script>

<style scoped>
.lote-view {
  padding: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
}

.lote-container {
  margin-top: 1.5rem;
}

.top-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filtros-busca {
  display: flex;
  gap: 1rem;
  flex: 1;
  max-width: 600px;
}

.busca-input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.busca-input-wrapper .material-symbols-outlined {
  position: absolute;
  left: 0.75rem;
  color: var(--color-text-muted);
  font-size: 20px;
}

.input-busca {
  width: 100%;
  padding: 0.6rem 0.75rem 0.6rem 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  font-size: 0.9rem;
}

.select-filtro {
  padding: 0.6rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  font-size: 0.9rem;
}

.btn-novo-lote {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-primary);
  color: #fff;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-novo-lote:hover {
  background-color: var(--color-primary-dark);
}

.tabela-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow-x: auto;
}

.tabela-lotes {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.tabela-lotes th {
  padding: 1rem;
  background-color: var(--color-background);
  color: var(--color-text-muted);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
}

.tabela-lotes td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}

.tabela-lotes tbody tr:last-child td {
  border-bottom: none;
}

.font-mono {
  font-family: monospace;
  color: var(--color-text-muted);
}

.font-destaque {
  font-weight: 600;
}

.badge-status {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-AT {
  background-color: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
}

.status-DI {
  background-color: rgba(2, 136, 209, 0.12);
  color: #0288d1;
}

.status-ES {
  background-color: rgba(100, 116, 139, 0.12);
  color: #64748b;
}

.status-BX {
  background-color: rgba(237, 108, 2, 0.12);
  color: #ed6c02;
}

.status-CO {
  background-color: rgba(156, 39, 176, 0.12);
  color: #9c27b0;
}

.status-PE {
  background-color: rgba(211, 47, 47, 0.12);
  color: #d32f2f;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  border-radius: 4px;
}

.btn-icon.btn-danger {
  color: var(--color-danger, #d32f2f);
}

.btn-icon.btn-danger:hover {
  background-color: rgba(211, 47, 47, 0.08);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  text-align: center;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border);
}

.empty-icon {
  font-size: 48px;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.spinner-sm {
  display: inline-block;
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

.modal-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  width: 100%;
  max-width: 540px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
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
}

.form-group input,
.form-group select {
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
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

.btn-cancelar {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.btn-salvar {
  background-color: var(--color-primary);
  color: #fff;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
</style>