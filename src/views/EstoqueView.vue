<template>
  <PageLayout title="Gestão de Estoque" subtitle="Controle de lotes, produtos em estoque, insumos e movimentações">
  <div class="estoque-view">
    <div class="estoque-container">
      <!-- NAVEGAÇÃO ENTRE ABAS -->
      <div class="tabs-nav">
        <button
          type="button"
          :class="['tab-btn', { active: abaAtiva === 'culturas' }]"
          @click="abaAtiva = 'culturas'"
        >
          <span class="material-symbols-outlined">psychiatry</span>
          Lotes em Cultivo
        </button>
        <button
          type="button"
          :class="['tab-btn', { active: abaAtiva === 'insumos' }]"
          @click="abaAtiva = 'insumos'"
        >
          <span class="material-symbols-outlined">inventory_2</span>
          Insumos e Matérias-Primas
        </button>
        <button
          type="button"
          :class="['tab-btn', { active: abaAtiva === 'mov-lotes' }]"
          @click="abaAtiva = 'mov-lotes'"
        >
          <span class="material-symbols-outlined">swap_horiz</span>
          Movimentações de Lotes
        </button>
        <button
          type="button"
          :class="['tab-btn', { active: abaAtiva === 'mov-insumos' }]"
          @click="abaAtiva = 'mov-insumos'"
        >
          <span class="material-symbols-outlined">sync_alt</span>
          Movimentações de Insumos
        </button>
      </div>

      <!-- CARREGANDO -->
      <div v-if="carregando && !dadosCarregados" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando dados do estoque...</p>
      </div>

      <!-- ERRO -->
      <ErroCarregamento
        v-else-if="erroCarregamento && !dadosCarregados"
        :mensagem="erroCarregamento"
        @tentar-novamente="carregarTudo"
      />

      <!-- CONTEÚDO DAS ABAS -->
      <div v-else class="tab-content">
        <!-- ========================================== -->
        <!-- ABA 1: LOTES EM CULTIVO                   -->
        <!-- ========================================== -->
        <section v-if="abaAtiva === 'culturas'" class="secao-aba">
          <div class="toolbar-aba">
            <div class="busca-wrapper">
              <span class="material-symbols-outlined">search</span>
              <input
                v-model="filtroBuscaLote"
                type="text"
                placeholder="Filtrar por ID, cultura ou status..."
                class="input-busca"
              />
            </div>
            <button class="btn-primario" @click="abrirModalMovLote()">
              <span class="material-symbols-outlined">add</span>
              Lançar Movimentação de Lote
            </button>
          </div>

          <div v-if="lotesFiltrados.length > 0" class="tabela-card">
            <table class="tabela-padrao">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Cultura</th>
                  <th>Data Plantio</th>
                  <th>Quantidade Atual</th>
                  <th>Status</th>
                  <th>Validade</th>
                  <th width="100">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="l in lotesFiltrados" :key="l.id">
                  <td class="font-mono">#{{ l.id }}</td>
                  <td class="font-destaque">{{ obterNomeCultura(l.cultura_id) }}</td>
                  <td>{{ formatarData(l.data_plantio) }}</td>
                  <td>{{ parseNumero(l.quantidade).toFixed(2) }} {{ l.unidade }}</td>
                  <td>
                    <span :class="['badge-status', `status-${l.status}`]">
                      {{ l.status }}
                    </span>
                  </td>
                  <td>{{ l.validade ? formatarData(l.validade) : '-' }}</td>
                  <td>
                    <button
                      class="btn-acao-tabela"
                      title="Lançar movimentação"
                      @click="abrirModalMovLote(l.id)"
                    >
                      <span class="material-symbols-outlined">tune</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <p>Nenhum lote corresponde aos filtros informados.</p>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- ABA 2: INSUMOS                             -->
        <!-- ========================================== -->
        <section v-if="abaAtiva === 'insumos'" class="secao-aba">
          <div class="toolbar-aba">
            <div class="busca-wrapper">
              <span class="material-symbols-outlined">search</span>
              <input
                v-model="filtroBuscaInsumo"
                type="text"
                placeholder="Filtrar por nome, tipo ou fornecedor..."
                class="input-busca"
              />
            </div>
            <div class="acoes-grupo">
              <button
                v-if="podeGerenciarInsumos"
                class="btn-primario"
                @click="abrirModalNovoInsumo"
              >
                <span class="material-symbols-outlined">add</span>
                Novo Insumo
              </button>
              <button class="btn-secundario" @click="abrirModalMovInsumo()">
                <span class="material-symbols-outlined">swap_horiz</span>
                Lançar Movimentação
              </button>
            </div>
          </div>

          <div v-if="insumosFiltrados.length > 0" class="tabela-card">
            <table class="tabela-padrao">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome do Insumo</th>
                  <th>Tipo</th>
                  <th>Estoque Atual</th>
                  <th>Estoque Mínimo</th>
                  <th>Validade</th>
                  <th>Fornecedor</th>
                  <th v-if="podeGerenciarInsumos" width="100">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="ins in insumosFiltrados"
                  :key="ins.id"
                  :class="{ 'linha-alerta': estaAbaixoEstoqueMinimo(ins) }"
                >
                  <td class="font-mono">#{{ ins.id }}</td>
                  <td class="font-destaque">
                    {{ ins.nome }}
                    <span
                      v-if="estaAbaixoEstoqueMinimo(ins)"
                      class="badge-alerta"
                      title="Estoque no limite ou abaixo do mínimo!"
                    >
                      Estoque Baixo
                    </span>
                  </td>
                  <td>{{ rotuloTipoInsumo(ins.tipo) }}</td>
                  <td>{{ parseNumero(ins.quantidade_atual).toFixed(2) }} {{ ins.unidade }}</td>
                  <td>{{ parseNumero(ins.estoque_minimo).toFixed(2) }} {{ ins.unidade }}</td>
                  <td>{{ ins.validade ? formatarData(ins.validade) : '-' }}</td>
                  <td>{{ ins.fornecedor || '-' }}</td>
                  <td v-if="podeGerenciarInsumos">
                    <div class="acoes-linha">
                      <button class="btn-icon" title="Editar Insumo" @click="editarInsumo(ins)">
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        class="btn-icon btn-danger"
                        title="Excluir Insumo (Requer saldo zerado)"
                        @click="excluirInsumo(ins)"
                      >
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <p>Nenhum insumo encontrado no cadastro.</p>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- ABA 3: MOVIMENTAÇÕES DE LOTES              -->
        <!-- ========================================== -->
        <section v-if="abaAtiva === 'mov-lotes'" class="secao-aba">
          <div class="toolbar-aba">
            <h3>Histórico de Entradas, Saídas e Perdas de Lotes</h3>
            <button class="btn-primario" @click="abrirModalMovLote()">
              <span class="material-symbols-outlined">add</span>
              Nova Movimentação
            </button>
          </div>

          <div v-if="movimentacoesLote.length > 0" class="tabela-card">
            <table class="tabela-padrao">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Lote</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Motivo</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in movimentacoesLoteOrdenadas" :key="m.id">
                  <td>{{ formatarData(m.data_movimentacao) }}</td>
                  <td class="font-mono">#{{ m.lote_id }}</td>
                  <td>
                    <span :class="['badge-tipo', `tipo-${String(m.tipo_movimentacao || '').toLowerCase()}`]">
                      {{ m.tipo_movimentacao }}
                    </span>
                  </td>
                  <td>{{ parseNumero(m.quantidade).toFixed(2) }} {{ m.unidade }}</td>
                  <td>{{ m.motivo || '-' }}</td>
                  <td class="col-obs">{{ m.observacoes || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <p>Nenhuma movimentação de lote registrada até o momento.</p>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- ABA 4: MOVIMENTAÇÕES DE INSUMOS            -->
        <!-- ========================================== -->
        <section v-if="abaAtiva === 'mov-insumos'" class="secao-aba">
          <div class="toolbar-aba">
            <h3>Histórico de Movimentações de Insumos</h3>
            <button class="btn-primario" @click="abrirModalMovInsumo()">
              <span class="material-symbols-outlined">add</span>
              Nova Movimentação
            </button>
          </div>

          <div v-if="movimentacoesInsumo.length > 0" class="tabela-card">
            <table class="tabela-padrao">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Insumo</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Motivo</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mi in movimentacoesInsumoOrdenadas" :key="mi.id">
                  <td>{{ formatarData(mi.data_movimentacao) }}</td>
                  <td class="font-destaque">{{ obterNomeInsumo(mi.insumo_id) }}</td>
                  <td>
                    <span :class="['badge-tipo', `tipo-${String(mi.tipo_movimentacao || '').toLowerCase()}`]">
                      {{ mi.tipo_movimentacao }}
                    </span>
                  </td>
                  <td>{{ parseNumero(mi.quantidade).toFixed(2) }}</td>
                  <td>{{ mi.motivo || '-' }}</td>
                  <td class="col-obs">{{ mi.observacoes || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <p>Nenhuma movimentação de insumo registrada até o momento.</p>
          </div>
        </section>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL: CADASTRO / EDIÇÃO DE INSUMO         -->
    <!-- ========================================== -->
    <div v-if="modalInsumoAberto" class="modal-overlay" @click.self="modalInsumoAberto = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ modoEdicaoInsumo ? 'Editar Insumo' : 'Novo Insumo' }}</h3>
          <button class="btn-close" @click="modalInsumoAberto = false">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form @submit.prevent="salvarInsumo">
          <div class="form-group">
            <label for="ins-nome">Nome do Insumo *</label>
            <input id="ins-nome" v-model="formInsumo.nome" type="text" required placeholder="Ex.: Fertilizante NPK 10-10-10" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="ins-tipo">Tipo de Insumo *</label>
              <select id="ins-tipo" v-model="formInsumo.tipo" required>
                <option value="FE">Fertilizante (FE)</option>
                <option value="DF">Defensivo (DF)</option>
                <option value="SB">Substrato (SB)</option>
                <option value="OU">Outro (OU)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="ins-unidade">Unidade *</label>
              <input id="ins-unidade" v-model="formInsumo.unidade" type="text" required placeholder="KG, L, UN..." />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="ins-minimo">Estoque Mínimo *</label>
              <input
                id="ins-minimo"
                v-model.number="formInsumo.estoque_minimo"
                type="number"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div v-if="!modoEdicaoInsumo" class="form-group">
              <label for="ins-inicial">Quantidade Inicial (Opcional)</label>
              <input
                id="ins-inicial"
                v-model.number="formInsumo.quantidade_inicial"
                type="number"
                step="0.01"
                min="0"
                placeholder="Gera entrada automática"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="ins-validade">Data de Validade</label>
              <input id="ins-validade" v-model="formInsumo.validade" type="date" />
            </div>

            <div class="form-group">
              <label for="ins-fornecedor">Fornecedor</label>
              <input id="ins-fornecedor" v-model="formInsumo.fornecedor" type="text" placeholder="Nome do fornecedor" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secundario" :disabled="salvando" @click="modalInsumoAberto = false">
              Cancelar
            </button>
            <button type="submit" class="btn-primario" :disabled="salvando">
              <span v-if="salvando" class="spinner-sm"></span>
              {{ salvando ? 'Salvando...' : 'Salvar Insumo' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL: MOVIMENTAÇÃO DE LOTE                -->
    <!-- ========================================== -->
    <div v-if="modalMovLoteAberto" class="modal-overlay" @click.self="modalMovLoteAberto = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Lançar Movimentação de Lote</h3>
          <button class="btn-close" @click="modalMovLoteAberto = false">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form @submit.prevent="salvarMovLote">
          <div class="form-group">
            <label for="mov-lote-id">Lote *</label>
            <select id="mov-lote-id" v-model="formMovLote.lote_id" required>
              <option value="" disabled>Selecione o lote</option>
              <option v-for="l in lotes" :key="l.id" :value="l.id">
                Lote #{{ l.id }} - {{ obterNomeCultura(l.cultura_id) }} (Saldo: {{ l.quantidade }} {{ l.unidade }})
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="mov-lote-tipo">Tipo de Movimentação *</label>
              <select id="mov-lote-tipo" v-model="formMovLote.tipo_movimentacao" required>
                <option value="Entrada">Entrada (Adiciona ao saldo)</option>
                <option value="Saída">Saída (Subtrai do saldo)</option>
                <option value="Perda">Perda (Subtrai do saldo)</option>
                <option value="Ajuste">Ajuste (Adiciona ao saldo)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="mov-lote-qtd">Quantidade *</label>
              <input
                id="mov-lote-qtd"
                v-model.number="formMovLote.quantidade"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="mov-lote-motivo">Motivo *</label>
            <input id="mov-lote-motivo" v-model="formMovLote.motivo" type="text" required placeholder="Justificativa do lançamento" />
          </div>

          <div class="form-group">
            <label for="mov-lote-obs">Observações</label>
            <textarea id="mov-lote-obs" v-model="formMovLote.observacoes" rows="2"></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secundario" :disabled="salvando" @click="modalMovLoteAberto = false">
              Cancelar
            </button>
            <button type="submit" class="btn-primario" :disabled="salvando">
              <span v-if="salvando" class="spinner-sm"></span>
              {{ salvando ? 'Lançando...' : 'Confirmar Lançamento' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL: MOVIMENTAÇÃO DE INSUMO              -->
    <!-- ========================================== -->
    <div v-if="modalMovInsumoAberto" class="modal-overlay" @click.self="modalMovInsumoAberto = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Lançar Movimentação de Insumo</h3>
          <button class="btn-close" @click="modalMovInsumoAberto = false">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form @submit.prevent="salvarMovInsumo">
          <div class="form-group">
            <label for="mov-ins-id">Insumo *</label>
            <select id="mov-ins-id" v-model="formMovInsumo.insumo_id" required>
              <option value="" disabled>Selecione o insumo</option>
              <option v-for="ins in insumos" :key="ins.id" :value="ins.id">
                {{ ins.nome }} (Saldo: {{ ins.quantidade_atual }} {{ ins.unidade }})
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="mov-ins-tipo">Tipo de Movimentação *</label>
              <select id="mov-ins-tipo" v-model="formMovInsumo.tipo_movimentacao" required>
                <!-- Entrada e Ajuste apenas para gerente/admin -->
                <option value="Entrada" :disabled="!podeGerenciarInsumos">
                  Entrada {{ !podeGerenciarInsumos ? '(Requer perfil de Gerente/Admin)' : '' }}
                </option>
                <option value="Saída">Saída</option>
                <option value="Perda">Perda</option>
                <option value="Ajuste" :disabled="!podeGerenciarInsumos">
                  Ajuste {{ !podeGerenciarInsumos ? '(Requer perfil de Gerente/Admin)' : '' }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="mov-ins-qtd">Quantidade *</label>
              <input
                id="mov-ins-qtd"
                v-model.number="formMovInsumo.quantidade"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="mov-ins-motivo">Motivo *</label>
            <input id="mov-ins-motivo" v-model="formMovInsumo.motivo" type="text" required placeholder="Motivo do consumo ou entrada" />
          </div>

          <div class="form-group">
            <label for="mov-ins-obs">Observações</label>
            <textarea id="mov-ins-obs" v-model="formMovInsumo.observacoes" rows="2"></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secundario" :disabled="salvando" @click="modalMovInsumoAberto = false">
              Cancelar
            </button>
            <button type="submit" class="btn-primario" :disabled="salvando">
              <span v-if="salvando" class="spinner-sm"></span>
              {{ salvando ? 'Lançando...' : 'Confirmar Lançamento' }}
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
import estoqueService from '@/services/estoqueService'
import loteService from '@/services/loteService'
import culturaService from '@/services/culturaService'
import { mensagemDeErro, parseNumero } from '@/services/apiHelpers'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const authStore = useAuthStore()
const toastStore = useToastStore()

const abaAtiva = ref('culturas')
const carregando = ref(false)
const salvando = ref(false)
const dadosCarregados = ref(false)
const erroCarregamento = ref('')

// Dados
const lotes = ref([])
const culturas = ref([])
const insumos = ref([])
const movimentacoesLote = ref([])
const movimentacoesInsumo = ref([])

// Filtros
const filtroBuscaLote = ref('')
const filtroBuscaInsumo = ref('')

// Modais
const modalInsumoAberto = ref(false)
const modoEdicaoInsumo = ref(false)
const formInsumo = ref({
  id: null,
  nome: '',
  tipo: 'FE',
  unidade: 'KG',
  estoque_minimo: 10,
  quantidade_inicial: 0,
  validade: null,
  fornecedor: '',
})

const modalMovLoteAberto = ref(false)
const formMovLote = ref({
  lote_id: '',
  tipo_movimentacao: 'Saída',
  quantidade: 1,
  motivo: '',
  observacoes: '',
})

const modalMovInsumoAberto = ref(false)
const formMovInsumo = ref({
  insumo_id: '',
  tipo_movimentacao: 'Saída',
  quantidade: 1,
  motivo: '',
  observacoes: '',
})

const podeGerenciarInsumos = computed(() => {
  return Boolean(authStore.isGerente || authStore.isAdmin)
})

async function carregarTudo() {
  carregando.value = true
  erroCarregamento.value = ''

  try {
    const [resLotes, resCulturas, resInsumos, resMovLote, resMovInsumo] = await Promise.all([
      loteService.listar(),
      culturaService.listar(),
      estoqueService.listarInsumos(),
      estoqueService.listarMovimentacoesLote(),
      estoqueService.listarMovimentacoesInsumo(),
    ])

    lotes.value = resLotes
    culturas.value = resCulturas
    insumos.value = resInsumos
    movimentacoesLote.value = resMovLote
    movimentacoesInsumo.value = resMovInsumo
    dadosCarregados.value = true
  } catch (err) {
    erroCarregamento.value = mensagemDeErro(err, 'Erro ao carregar dados de estoque.')
    toastStore.error(erroCarregamento.value)
  } finally {
    carregando.value = false
  }
}

// Filtros computados
const lotesFiltrados = computed(() => {
  const busca = filtroBuscaLote.value.trim().toLowerCase()
  if (!busca) return lotes.value

  return lotes.value.filter((l) => {
    const cNome = obterNomeCultura(l.cultura_id).toLowerCase()
    return String(l.id).includes(busca) || cNome.includes(busca) || String(l.status).toLowerCase().includes(busca)
  })
})

const insumosFiltrados = computed(() => {
  const busca = filtroBuscaInsumo.value.trim().toLowerCase()
  if (!busca) return insumos.value

  return insumos.value.filter((ins) => {
    return (
      ins.nome.toLowerCase().includes(busca) ||
      rotuloTipoInsumo(ins.tipo).toLowerCase().includes(busca) ||
      (ins.fornecedor || '').toLowerCase().includes(busca)
    )
  })
})

const movimentacoesLoteOrdenadas = computed(() => {
  return [...movimentacoesLote.value].sort(
    (a, b) => new Date(b.data_movimentacao) - new Date(a.data_movimentacao),
  )
})

const movimentacoesInsumoOrdenadas = computed(() => {
  return [...movimentacoesInsumo.value].sort(
    (a, b) => new Date(b.data_movimentacao) - new Date(a.data_movimentacao),
  )
})

function estaAbaixoEstoqueMinimo(ins) {
  return parseNumero(ins.quantidade_atual) <= parseNumero(ins.estoque_minimo)
}

function obterNomeCultura(culturaId) {
  const c = culturas.value.find((item) => item.id === culturaId)
  return c ? c.nome_cultura : `Cultura #${culturaId}`
}

function obterNomeInsumo(insumoId) {
  const ins = insumos.value.find((item) => item.id === insumoId)
  return ins ? ins.nome : `Insumo #${insumoId}`
}

function rotuloTipoInsumo(tipo) {
  const mapa = {
    FE: 'Fertilizante',
    DF: 'Defensivo',
    SB: 'Substrato',
    OU: 'Outro',
  }
  return mapa[tipo] || tipo
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  const d = new Date(dataStr)
  if (Number.isNaN(d.getTime())) return dataStr
  return d.toLocaleDateString('pt-BR')
}

// INSUMOS
function abrirModalNovoInsumo() {
  modoEdicaoInsumo.value = false
  formInsumo.value = {
    id: null,
    nome: '',
    tipo: 'FE',
    unidade: 'KG',
    estoque_minimo: 10,
    quantidade_inicial: 0,
    validade: null,
    fornecedor: '',
  }
  modalInsumoAberto.value = true
}

function editarInsumo(ins) {
  modoEdicaoInsumo.value = true
  formInsumo.value = {
    id: ins.id,
    nome: ins.nome,
    tipo: ins.tipo,
    unidade: ins.unidade,
    estoque_minimo: parseNumero(ins.estoque_minimo),
    quantidade_inicial: 0,
    validade: ins.validade,
    fornecedor: ins.fornecedor || '',
  }
  modalInsumoAberto.value = true
}

async function salvarInsumo() {
  salvando.value = true
  try {
    if (modoEdicaoInsumo.value && formInsumo.value.id) {
      const insAtual = insumos.value.find((i) => i.id === formInsumo.value.id)
      await estoqueService.atualizarInsumo(formInsumo.value.id, {
        nome: formInsumo.value.nome,
        tipo: formInsumo.value.tipo,
        unidade: formInsumo.value.unidade,
        quantidade_atual: insAtual ? insAtual.quantidade_atual : 0,
        estoque_minimo: formInsumo.value.estoque_minimo,
        validade: formInsumo.value.validade || null,
        fornecedor: formInsumo.value.fornecedor || null,
      })
      toastStore.success('Insumo atualizado com sucesso!')
    } else {
      const qtdInicial = Number(formInsumo.value.quantidade_inicial) || 0
      const res = await estoqueService.criarInsumoComSaldo(formInsumo.value, qtdInicial)

      if (res.avisoMovimentacao) {
        toastStore.warning(res.avisoMovimentacao)
      } else {
        toastStore.success('Insumo cadastrado com sucesso!')
      }
    }

    modalInsumoAberto.value = false
    await carregarTudo()
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Falha ao salvar insumo.'))
  } finally {
    salvando.value = false
  }
}

async function excluirInsumo(ins) {
  if (parseNumero(ins.quantidade_atual) > 0) {
    toastStore.warning('O back-end permite exclusão apenas de insumos com saldo zerado.')
    return
  }

  if (!window.confirm(`Deseja realmente excluir o insumo "${ins.nome}"?`)) return

  try {
    await estoqueService.excluirInsumo(ins.id)
    toastStore.success('Insumo excluído com sucesso!')
    await carregarTudo()
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Erro ao excluir insumo.'))
  }
}

// MOVIMENTAÇÕES DE LOTE
function abrirModalMovLote(loteId = '') {
  formMovLote.value = {
    lote_id: loteId,
    tipo_movimentacao: 'Saída',
    quantidade: 1,
    motivo: '',
    observacoes: '',
  }
  modalMovLoteAberto.value = true
}

async function salvarMovLote() {
  const lote = lotes.value.find((l) => l.id === formMovLote.value.lote_id)
  if (!lote) {
    toastStore.warning('Selecione um lote válido.')
    return
  }

  salvando.value = true
  try {
    await estoqueService.registrarMovimentacaoLote({
      lote_id: formMovLote.value.lote_id,
      tipo_movimentacao: formMovLote.value.tipo_movimentacao,
      quantidade: formMovLote.value.quantidade,
      unidade: lote.unidade,
      motivo: formMovLote.value.motivo,
      observacoes: formMovLote.value.observacoes,
    })
    toastStore.success('Movimentação de lote registrada com sucesso!')
    modalMovLoteAberto.value = false
    await carregarTudo()
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Erro ao registrar movimentação do lote.'))
  } finally {
    salvando.value = false
  }
}

// MOVIMENTAÇÕES DE INSUMO
function abrirModalMovInsumo(insumoId = '') {
  formMovInsumo.value = {
    insumo_id: insumoId,
    tipo_movimentacao: 'Saída',
    quantidade: 1,
    motivo: '',
    observacoes: '',
  }
  modalMovInsumoAberto.value = true
}

async function salvarMovInsumo() {
  salvando.value = true
  try {
    await estoqueService.registrarMovimentacaoInsumo({
      insumo_id: formMovInsumo.value.insumo_id,
      tipo_movimentacao: formMovInsumo.value.tipo_movimentacao,
      quantidade: formMovInsumo.value.quantidade,
      motivo: formMovInsumo.value.motivo,
      observacoes: formMovInsumo.value.observacoes,
    })
    toastStore.success('Movimentação de insumo registrada com sucesso!')
    modalMovInsumoAberto.value = false
    await carregarTudo()
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Erro ao registrar movimentação do insumo.'))
  } finally {
    salvando.value = false
  }
}

onMounted(() => {
  carregarTudo()
})
</script>

<style scoped>
.estoque-view {
  padding: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
}

.estoque-container {
  margin-top: 1.5rem;
}

.tabs-nav {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  margin-bottom: 1.5rem;
  overflow-x: auto;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted, #64748b);
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--color-text, #1e293b);
}

.tab-btn.active {
  color: var(--color-primary, #16a34a);
  border-bottom-color: var(--color-primary, #16a34a);
  font-weight: 600;
}

.toolbar-aba {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.toolbar-aba h3 {
  margin: 0;
  font-size: 1.15rem;
}

.busca-wrapper {
  position: relative;
  flex: 1;
  max-width: 450px;
  display: flex;
  align-items: center;
}

.busca-wrapper .material-symbols-outlined {
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
  background-color: var(--color-surface, #ffffff);
  font-size: 0.875rem;
}

.acoes-grupo {
  display: flex;
  gap: 0.75rem;
}

.btn-primario {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-primary, #16a34a);
  color: #fff;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-md, 8px);
  font-weight: 500;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-primario:hover {
  background-color: var(--color-primary-dark, #15803d);
}

.btn-secundario {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  font-size: 0.875rem;
}

.tabela-card {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  overflow-x: auto;
}

.tabela-padrao {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.tabela-padrao th {
  padding: 0.85rem 1rem;
  background-color: var(--color-background, #f8fafc);
  color: var(--color-text-muted, #64748b);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.tabela-padrao td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-text, #1e293b);
}

.linha-alerta {
  background-color: rgba(239, 68, 68, 0.04);
}

.badge-alerta {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.font-mono {
  font-family: monospace;
}

.font-destaque {
  font-weight: 600;
}

.badge-status,
.badge-tipo {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-AT,
.tipo-entrada {
  background-color: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
}

.tipo-saída,
.tipo-saida {
  background-color: rgba(2, 136, 209, 0.12);
  color: #0288d1;
}

.tipo-perda,
.status-PE {
  background-color: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.tipo-ajuste {
  background-color: rgba(245, 158, 11, 0.12);
  color: #b45309;
}

.col-obs {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-acao-tabela {
  background: none;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-sm, 6px);
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.acoes-linha {
  display: flex;
  gap: 0.25rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  border-radius: 4px;
  color: var(--color-text-muted, #64748b);
}

.btn-icon.btn-danger:hover {
  color: var(--color-danger, #ef4444);
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background-color: var(--color-surface, #ffffff);
  border-radius: var(--radius-lg, 12px);
  border: 1px dashed var(--color-border, #e2e8f0);
  color: var(--color-text-muted, #64748b);
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
  padding: 1rem;
}

.modal-card {
  background-color: var(--color-surface, #ffffff);
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
.form-group select,
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