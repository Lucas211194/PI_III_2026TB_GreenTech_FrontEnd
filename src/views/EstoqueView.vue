<template>
  <Sidebar />
  <main class="main-content">
    <div class="header-container">
      <DashHeader
        title="Estoque Consolidado"
        subtitle="Visão geral de inventário por cultura e histórico detalhado de transações."
      />
      <WeatherWidget />
    </div>

    <section class="registration-container-estoque">
      <div class="tabs-bar">
        <button
          class="tab-btn"
          :class="{ active: abaAtiva === 'lotes' }"
          @click="trocarAba('lotes')"
        >
          <span class="material-symbols-outlined">eco</span> Lotes de Plantio
        </button>
        <button
          class="tab-btn"
          :class="{ active: abaAtiva === 'insumos' }"
          @click="trocarAba('insumos')"
        >
          <span class="material-symbols-outlined">science</span> Insumos
        </button>
      </div>

      <div class="action-bar-estoque">
        <div class="search-box-estoque">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            class="search-input"
            v-model="busca"
            :placeholder="
              abaAtiva === 'lotes' ? 'Buscar cultura no estoque...' : 'Buscar insumo...'
            "
          />
        </div>
        <button class="btn-generate" @click="abrirFormulario">
          <span class="material-symbols-outlined">swap_horiz</span> Lançar Movimentação
        </button>
      </div>

      <div class="inventory-split-view">
        <!-- Lado Esquerdo: Lista de Culturas -->
        <div class="seed-list-container">
          <!-- Skeleton Loader -->
          <template v-if="carregando">
            <div v-for="i in 4" :key="i" class="mini-card skeleton-card">
              <div class="skeleton-line title"></div>
              <div class="skeleton-line short"></div>
              <div class="skeleton-line medium"></div>
            </div>
          </template>

          <!-- Aba: Lotes de Plantio -->
          <template v-else-if="abaAtiva === 'lotes'">
            <div v-if="estoqueConsolidado.length === 0" class="empty-state">
              <span class="material-symbols-outlined empty-icon">inventory_2</span>
              <h3>Estoque Zerado</h3>
              <p>Nenhuma cultura encontrada no estoque no momento.</p>
            </div>

            <div
              v-else
              v-for="item in estoqueConsolidado"
              :key="item.cultura_id"
              class="mini-card"
              :class="{ active: culturaSelecionada?.cultura_id === item.cultura_id }"
              @click="selecionarCultura(item)"
              role="button"
              tabindex="0"
              @keydown.enter="selecionarCultura(item)"
            >
              <div class="mini-card-header">
                <h4>{{ item.nome_cultura }}</h4>
                <span class="badge badge-good">Inventário</span>
              </div>

              <div class="mini-card-cultura" style="margin-top: 5px">
                Lotes em Desenvolvimento: <strong>{{ item.quantidade_lotes }}</strong>
              </div>

              <div
                class="mini-card-qty"
                style="color: #673ab7; font-size: 1rem; margin-top: 8px; font-weight: 600"
              >
                <span class="material-symbols-outlined" style="font-size: 1.1rem">monitoring</span>
                Taxa de Produção:
                {{ item.taxa_producao ? parseFloat(item.taxa_producao).toFixed(1) : '0.0' }}%
              </div>

              <div
                class="mini-card-qty"
                style="color: #673ab7; font-size: 1rem; margin-top: 8px; font-weight: 600"
              >
                <span class="material-symbols-outlined" style="font-size: 1.1rem"
                  >shopping_basket</span
                >
                Total Colhido: {{ parseFloat(item.total_colhido) }} {{ item.unidade }}
              </div>
            </div>
          </template>

          <!-- Aba: Insumos -->
          <template v-else>
            <div v-if="insumosFiltrados.length === 0" class="empty-state">
              <span class="material-symbols-outlined empty-icon">science</span>
              <h3>Nenhum insumo cadastrado</h3>
              <p>Importe uma nota fiscal ou lance uma entrada manual.</p>
            </div>

            <div
              v-else
              v-for="item in insumosFiltrados"
              :key="item.id"
              class="mini-card"
              :class="{ active: insumoSelecionado?.id === item.id }"
              @click="selecionarInsumo(item)"
              role="button"
              tabindex="0"
              @keydown.enter="selecionarInsumo(item)"
            >
              <div class="mini-card-header">
                <h4>{{ item.nome }}</h4>
                <span class="badge badge-good">{{ traduzirTipoInsumo(item.tipo) }}</span>
              </div>

              <div class="mini-card-cultura" style="margin-top: 5px">
                Saldo Atual: <strong>{{ item.quantidade_atual }} {{ item.unidade }}</strong>
              </div>

              <div
                v-if="item.validade"
                class="mini-card-qty"
                style="color: #673ab7; font-size: 1rem; margin-top: 8px; font-weight: 600"
              >
                <span class="material-symbols-outlined" style="font-size: 1.1rem">event</span>
                Validade: {{ new Date(item.validade).toLocaleDateString('pt-BR') }}
              </div>

              <div
                v-if="item.fornecedor"
                class="mini-card-qty"
                style="color: #673ab7; font-size: 1rem; margin-top: 8px; font-weight: 600"
              >
                <span class="material-symbols-outlined" style="font-size: 1.1rem"
                  >local_shipping</span
                >
                {{ item.fornecedor }}
              </div>
            </div>
          </template>
        </div>

        <!-- Lado Direito: Detalhes e Formulários -->
        <div class="seed-detail-panel">
          <!-- Formulário de Movimentação (Lotes) -->
          <form
            v-if="modoCadastro && abaAtiva === 'lotes'"
            @submit.prevent="salvarMovimentacao"
            class="form-grid-layout slide-in"
          >
            <div class="detail-header" style="grid-column: 1 / -1">
              <h2>
                <span class="material-symbols-outlined">add_to_photos</span> Nova Movimentação
              </h2>
              <p class="subtitle">Esta ação alterará o saldo do lote correspondente.</p>
            </div>

            <div class="form-group full-width">
              <label>Lote Alvo</label>
              <select v-model="form.lote_id" required :disabled="salvando">
                <option value="" disabled>Selecione o lote...</option>
                <option v-for="l in lotes" :key="l.id" :value="l.id">
                  Lote #{{ l.id }} (Mesa {{ l.mesa_id }} - Saldo: {{ l.quantidade }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Tipo de Movimentação</label>
              <select v-model="form.tipo_movimentacao" required :disabled="salvando">
                <option value="Entrada">Entrada (Abastecimento)</option>
                <option value="Saída">Saída (Consumo/Uso)</option>
                <option value="Perda">Perda / Scrap</option>
                <option value="Ajuste">Ajuste de Inventário</option>
              </select>
            </div>

            <div class="form-group">
              <label>Quantidade</label>
              <input
                type="number"
                step="0.01"
                v-model="form.quantidade"
                min="0.01"
                required
                :disabled="salvando"
              />
            </div>

            <div class="form-group full-width">
              <label>Motivo da Movimentação</label>
              <input
                type="text"
                v-model="form.motivo"
                placeholder="Ex: Quebra de mudas, correção manual..."
                required
                :disabled="salvando"
              />
            </div>

            <div class="form-actions-right" style="grid-column: 1 / -1">
              <button
                type="button"
                class="btn-outline"
                @click="modoCadastro = false"
                :disabled="salvando"
              >
                Cancelar
              </button>
              <button type="submit" class="btn-save" :disabled="salvando">
                <span v-if="salvando" class="material-symbols-outlined spinning">autorenew</span>
                {{ salvando ? 'Registrando...' : 'Registrar Lançamento' }}
              </button>
            </div>
          </form>

          <!-- Formulário de Movimentação (Insumos) -->
          <form
            v-else-if="modoCadastro && abaAtiva === 'insumos'"
            @submit.prevent="salvarMovimentacaoInsumo"
            class="form-grid-layout slide-in"
          >
            <div class="detail-header" style="grid-column: 1 / -1">
              <h2>
                <span class="material-symbols-outlined">add_to_photos</span> Nova Movimentação
              </h2>
              <p class="subtitle">Esta ação alterará o saldo do insumo correspondente.</p>
            </div>

            <div class="form-group full-width">
              <label>Insumo Alvo</label>
              <select v-model="formInsumo.insumo_id" required :disabled="salvando">
                <option value="" disabled>Selecione o insumo...</option>
                <option v-for="i in insumos" :key="i.id" :value="i.id">
                  {{ i.nome }} (Saldo: {{ i.quantidade_atual }} {{ i.unidade }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Tipo de Movimentação</label>
              <select v-model="formInsumo.tipo_movimentacao" required :disabled="salvando">
                <option value="Entrada">Entrada (Abastecimento)</option>
                <option value="Saída">Saída (Consumo/Uso)</option>
                <option value="Perda">Perda / Scrap</option>
                <option value="Ajuste">Ajuste de Inventário</option>
              </select>
            </div>

            <div class="form-group">
              <label>Quantidade</label>
              <input
                type="number"
                step="0.01"
                v-model="formInsumo.quantidade"
                min="0.01"
                required
                :disabled="salvando"
              />
            </div>

            <div class="form-group full-width">
              <label>Motivo da Movimentação</label>
              <input
                type="text"
                v-model="formInsumo.motivo"
                placeholder="Ex: Aplicação na estufa 3, correção manual..."
                required
                :disabled="salvando"
              />
            </div>

            <div class="form-actions-right" style="grid-column: 1 / -1">
              <button
                type="button"
                class="btn-outline"
                @click="modoCadastro = false"
                :disabled="salvando"
              >
                Cancelar
              </button>
              <button type="submit" class="btn-save" :disabled="salvando">
                <span v-if="salvando" class="material-symbols-outlined spinning">autorenew</span>
                {{ salvando ? 'Registrando...' : 'Registrar Lançamento' }}
              </button>
            </div>
          </form>

          <!-- Histórico da Cultura -->
          <div v-else-if="culturaSelecionada && abaAtiva === 'lotes'" class="fade-in">
            <div class="detail-header" style="margin-bottom: 20px">
              <h2>Histórico de Transações: {{ culturaSelecionada.nome_cultura }}</h2>
              <p class="subtitle">
                Todas as movimentações de lotes ativos e encerrados desta espécie.
              </p>
            </div>

            <div class="stats-grid">
              <div class="stat-box stat-saldo">
                <span class="stat-label">SALDO ATUAL EM ESTUFA</span>
                <span class="stat-value"
                  >{{ parseFloat(culturaSelecionada.saldo_total) }}
                  {{ culturaSelecionada.unidade }}</span
                >
              </div>
              <div class="stat-box stat-taxa">
                <span class="stat-label">TAXA DE PRODUÇÃO</span>
                <span class="stat-value"
                  >{{
                    culturaSelecionada.taxa_producao
                      ? parseFloat(culturaSelecionada.taxa_producao).toFixed(1)
                      : '0.0'
                  }}%</span
                >
              </div>
            </div>

            <h3 class="extrato-title">
              <span class="material-symbols-outlined">history</span> Extrato de Movimentações
            </h3>

            <div class="extrato-filtros">
              <div class="filtro-item">
                <label>Tipo</label>
                <select v-model="filtros.tipo">
                  <option value="">Todos</option>
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAÍDA">Saída</option>
                  <option value="PERDA">Perda</option>
                  <option value="AJUSTE">Ajuste</option>
                </select>
              </div>

              <div class="filtro-item">
                <label>Lote</label>
                <select v-model="filtros.lote">
                  <option value="">Todos os Lotes</option>
                  <option v-for="loteId in lotesComMovimentacao" :key="loteId" :value="loteId">
                    Lote #{{ loteId }}
                  </option>
                </select>
              </div>

              <div class="filtro-item">
                <label>Data Inicial</label>
                <input type="date" v-model="filtros.dataInicio" />
              </div>

              <div class="filtro-item">
                <label>Data Final</label>
                <input type="date" v-model="filtros.dataFim" />
              </div>

              <button class="btn-clear-filters" @click="limparFiltros" title="Limpar Filtros">
                <span class="material-symbols-outlined">filter_alt_off</span>
              </button>
            </div>

            <div v-if="movimentacoesFiltradas.length === 0" class="empty-extrato">
              <span class="material-symbols-outlined">search_off</span>
              <p>Nenhum registro de movimentação encontrado para estes filtros.</p>
            </div>

            <div v-else class="extrato-list">
              <div v-for="m in movimentacoesFiltradas" :key="m.id" class="extrato-card">
                <div class="extrato-info">
                  <div class="extrato-header-row">
                    <span
                      class="badge"
                      :class="
                        m.tipo_movimentacao.toUpperCase() === 'ENTRADA' ? 'badge-good' : 'badge-out'
                      "
                    >
                      {{ m.tipo_movimentacao.toUpperCase() }}
                    </span>
                    <span class="lote-id">Lote #{{ m.lote_id }}</span>
                  </div>
                  <p class="motivo-texto">{{ m.motivo }}</p>
                  <div class="data-texto">
                    {{ new Date(m.data_movimentacao).toLocaleString('pt-BR') }}
                  </div>
                </div>

                <div class="extrato-acoes">
                  <div
                    class="quantidade-texto"
                    :class="
                      m.tipo_movimentacao.toUpperCase() === 'ENTRADA' ? 'text-green' : 'text-red'
                    "
                  >
                    {{ m.tipo_movimentacao.toUpperCase() === 'ENTRADA' ? '+' : '-'
                    }}{{ parseFloat(m.quantidade) }}
                  </div>

                  <button
                    v-if="isGerente || isAdmin"
                    @click.stop="excluirMovimentacao(m.id)"
                    class="btn-icon-delete"
                    title="Excluir este registro"
                    :disabled="excluindo === m.id"
                  >
                    <span v-if="excluindo === m.id" class="material-symbols-outlined spinning"
                      >autorenew</span
                    >
                    <span v-else class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Histórico do Insumo -->
          <div v-else-if="insumoSelecionado && abaAtiva === 'insumos'" class="fade-in">
            <div class="detail-header" style="margin-bottom: 20px">
              <div>
                <h2>Histórico de Transações: {{ insumoSelecionado.nome }}</h2>
                <p class="subtitle">Todas as movimentações registradas para este insumo.</p>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-box stat-saldo">
                <span class="stat-label">SALDO ATUAL</span>
                <span class="stat-value"
                  >{{ parseFloat(insumoSelecionado.quantidade_atual) }}
                  {{ insumoSelecionado.unidade }}</span
                >
              </div>
              <div class="stat-box stat-taxa">
                <span class="stat-label">TIPO</span>
                <span class="stat-value">{{ traduzirTipoInsumo(insumoSelecionado.tipo) }}</span>
              </div>
            </div>

            <h3 class="extrato-title">
              <span class="material-symbols-outlined">history</span> Extrato de Movimentações
            </h3>

            <div v-if="movimentacoesDoInsumoSelecionado.length === 0" class="empty-extrato">
              <span class="material-symbols-outlined">search_off</span>
              <p>Nenhuma movimentação registrada para este insumo.</p>
            </div>

            <div v-else class="extrato-list">
              <div v-for="m in movimentacoesDoInsumoSelecionado" :key="m.id" class="extrato-card">
                <div class="extrato-info">
                  <div class="extrato-header-row">
                    <span
                      class="badge"
                      :class="
                        m.tipo_movimentacao.toUpperCase() === 'ENTRADA' ? 'badge-good' : 'badge-out'
                      "
                    >
                      {{ m.tipo_movimentacao.toUpperCase() }}
                    </span>
                  </div>
                  <p class="motivo-texto">{{ m.motivo }}</p>
                  <div class="data-texto">
                    {{ new Date(m.data_movimentacao).toLocaleString('pt-BR') }}
                  </div>
                </div>

                <div class="extrato-acoes">
                  <div
                    class="quantidade-texto"
                    :class="
                      m.tipo_movimentacao.toUpperCase() === 'ENTRADA' ? 'text-green' : 'text-red'
                    "
                  >
                    {{ m.tipo_movimentacao.toUpperCase() === 'ENTRADA' ? '+' : '-'
                    }}{{ parseFloat(m.quantidade) }}
                  </div>

                  <button
                    v-if="isGerente || isAdmin"
                    @click.stop="excluirMovimentacaoInsumo(m.id)"
                    class="btn-icon-delete"
                    title="Excluir este registro"
                    :disabled="excluindo === m.id"
                  >
                    <span v-if="excluindo === m.id" class="material-symbols-outlined spinning"
                      >autorenew</span
                    >
                    <span v-else class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Exclusão definitiva do Insumo: só admin/gerente e só com saldo zerado -->
            <div
              v-if="isGerente || isAdmin"
              style="margin-top: 35px; padding-top: 20px; border-top: 1px dashed #ffcdd2"
            >
              <div
                style="
                  display: flex;
                  justify-content: flex-end;
                  align-items: center;
                  gap: 12px;
                  flex-wrap: wrap;
                "
              >
                <p
                  v-if="parseFloat(insumoSelecionado.quantidade_atual) !== 0"
                  style="
                    margin: 0;
                    font-size: 0.85rem;
                    color: #a15c00;
                    flex: 1;
                    min-width: 220px;
                    text-align: right;
                  "
                >
                  <span
                    class="material-symbols-outlined"
                    style="font-size: 1rem; vertical-align: -2px"
                    >info</span
                  >
                  Zere o saldo deste insumo (exclua ou desfaça as movimentações até restar 0
                  {{ insumoSelecionado.unidade }}) para poder excluí-lo definitivamente.
                </p>
                <button
                  @click="excluirInsumo(insumoSelecionado)"
                  :disabled="
                    parseFloat(insumoSelecionado.quantidade_atual) !== 0 || excluindoInsumo
                  "
                  :title="
                    parseFloat(insumoSelecionado.quantidade_atual) !== 0
                      ? 'Só é possível excluir um insumo com saldo zerado'
                      : 'Excluir este insumo definitivamente'
                  "
                  style="
                    background: #c62828;
                    color: white;
                    padding: 10px 18px;
                    border-radius: 8px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: background 0.2s;
                    white-space: nowrap;
                  "
                  :style="
                    parseFloat(insumoSelecionado.quantidade_atual) !== 0
                      ? { background: '#e0e0e0', color: '#9e9e9e', cursor: 'not-allowed' }
                      : {}
                  "
                >
                  <span v-if="excluindoInsumo" class="material-symbols-outlined spinning"
                    >autorenew</span
                  >
                  <span v-else class="material-symbols-outlined" style="font-size: 1.2rem"
                    >delete_forever</span
                  >
                  {{ excluindoInsumo ? 'Excluindo...' : 'Excluir Insumo Definitivamente' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State Inicial (Nada selecionado) -->
          <div v-else class="detalhe-placeholder">
            <div class="placeholder-content">
              <span class="material-symbols-outlined placeholder-icon">inventory</span>
              <h3>
                {{
                  abaAtiva === 'lotes' ? 'Nenhuma cultura selecionada' : 'Nenhum insumo selecionado'
                }}
              </h3>
              <p>
                {{
                  abaAtiva === 'lotes'
                    ? 'Selecione uma cultura ao lado para auditar seu extrato completo de transações.'
                    : 'Selecione um insumo ao lado para ver seu extrato completo de transações.'
                }}
              </p>
              <button class="btn-outline" @click="abrirFormulario" style="margin-top: 1rem">
                <span class="material-symbols-outlined">add</span> Lançar Movimentação Manual
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
    <Footer />
  </main>
</template>

<script setup>
import { verificarPermissao } from '@/assets/JS/verificarPermissao.js'
import DashHeader from '@/components/DashHeader.vue'
import Footer from '@/components/Footer.vue'
import Sidebar from '@/components/Sidebar.vue'
import WeatherWidget from '@/components/WeatherWidget.vue'
import { useToastStore } from '@/stores/toast'
import { computed, onMounted, ref } from 'vue'

const toastStore = useToastStore()
const isGerente = ref(false)
const isAdmin = ref(false)

const carregando = ref(true)
const salvando = ref(false)
const excluindo = ref(null)
const excluindoInsumo = ref(false)

const lotes = ref([])
const culturas = ref([])
const colheitas = ref([])
const movimentacoesGerais = ref([])

const insumos = ref([])
const movimentacoesInsumo = ref([])
const insumoSelecionado = ref(null)

const abaAtiva = ref('lotes')

const culturaSelecionada = ref(null)
const modoCadastro = ref(false)
const busca = ref('')

const form = ref({ lote_id: '', tipo_movimentacao: 'Entrada', quantidade: 0.0, motivo: '' })
const formInsumo = ref({ insumo_id: '', tipo_movimentacao: 'Entrada', quantidade: 0.0, motivo: '' })

const filtros = ref({
  tipo: '',
  lote: '',
  dataInicio: '',
  dataFim: '',
})

const estoqueConsolidado = computed(() => {
  const consolidados = {}

  culturas.value.forEach((c) => {
    consolidados[c.id] = {
      nome_cultura: c.nome_cultura,
      cultura_id: c.id,
      saldo_total: 0,
      quantidade_lotes: 0,
      taxa_producao: c.taxa_producao || 0,
      total_colhido: c.total_colhido || 0,
      unidade: 'Unidades',
    }
  })

  lotes.value.forEach((lote) => {
    if (lote.status !== 'CO' && lote.status !== 'PE' && consolidados[lote.cultura_id]) {
      consolidados[lote.cultura_id].saldo_total += parseFloat(lote.quantidade)
      consolidados[lote.cultura_id].quantidade_lotes += 1
      consolidados[lote.cultura_id].unidade = lote.unidade
    }
  })

  return Object.values(consolidados).filter(
    (item) =>
      item.nome_cultura.toLowerCase().includes(busca.value.toLowerCase()) &&
      (item.saldo_total > 0 || item.total_colhido > 0 || item.taxa_producao > 0),
  )
})

const movimentacoesDaCultura = computed(() => {
  if (!culturaSelecionada.value) return []
  return movimentacoesGerais.value
    .filter((m) => {
      const lote = lotes.value.find((l) => l.id === m.lote_id)
      return lote && lote.cultura_id === culturaSelecionada.value.cultura_id
    })
    .reverse()
})

const lotesComMovimentacao = computed(() => {
  const ids = new Set(movimentacoesDaCultura.value.map((m) => m.lote_id))
  return Array.from(ids).sort((a, b) => a - b)
})

const insumosFiltrados = computed(() => {
  if (!busca.value) return insumos.value
  return insumos.value.filter((i) => i.nome.toLowerCase().includes(busca.value.toLowerCase()))
})

const movimentacoesDoInsumoSelecionado = computed(() => {
  if (!insumoSelecionado.value) return []
  return movimentacoesInsumo.value
    .filter((m) => m.insumo_id === insumoSelecionado.value.id)
    .reverse()
})

function traduzirTipoInsumo(tipo) {
  const mapa = { FE: 'Fertilizante', DF: 'Defensivo agrícola', SB: 'Substrato', OU: 'Outro' }
  return mapa[tipo] || tipo
}

const movimentacoesFiltradas = computed(() => {
  let resultado = movimentacoesDaCultura.value

  if (filtros.value.tipo) {
    resultado = resultado.filter(
      (m) =>
        m.tipo_movimentacao.toUpperCase().replace('Í', 'I') ===
        filtros.value.tipo.replace('Í', 'I'),
    )
  }

  if (filtros.value.lote) {
    resultado = resultado.filter((m) => String(m.lote_id) === String(filtros.value.lote))
  }

  if (filtros.value.dataInicio) {
    const dataInicio = new Date(filtros.value.dataInicio).getTime()
    resultado = resultado.filter((m) => new Date(m.data_movimentacao).getTime() >= dataInicio)
  }

  if (filtros.value.dataFim) {
    const dataFim = new Date(filtros.value.dataFim)
    dataFim.setHours(23, 59, 59, 999)
    resultado = resultado.filter(
      (m) => new Date(m.data_movimentacao).getTime() <= dataFim.getTime(),
    )
  }

  return resultado
})

const limparFiltros = () => {
  filtros.value = { tipo: '', lote: '', dataInicio: '', dataFim: '' }
}

const verificarAcessos = async () => {
  const permissoes = await verificarPermissao()
  isGerente.value = permissoes.isGerente
  isAdmin.value = permissoes.isAdmin
}

const carregarDadosBase = async () => {
  carregando.value = true
  const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
  try {
    const [resLotes, resCulturas, resColheitas, resEstoque, resInsumos, resMovInsumo] =
      await Promise.all([
        fetch('/api/lotes/', { headers }),
        fetch('/api/cultura/', { headers }),
        fetch('/api/colheita/', { headers }),
        fetch('/api/estoque/', { headers }),
        fetch('/api/insumos/', { headers }),
        fetch('/api/movimentacoes-insumo/', { headers }),
      ])

    if (resLotes.ok) lotes.value = await resLotes.json()
    if (resCulturas.ok) culturas.value = await resCulturas.json()
    if (resColheitas.ok) colheitas.value = await resColheitas.json()
    if (resEstoque.ok) movimentacoesGerais.value = await resEstoque.json()
    if (resInsumos.ok) insumos.value = await resInsumos.json()
    if (resMovInsumo.ok) movimentacoesInsumo.value = await resMovInsumo.json()

    if (culturaSelecionada.value) {
      const atualizada = estoqueConsolidado.value.find(
        (item) => item.cultura_id === culturaSelecionada.value.cultura_id,
      )
      if (atualizada) culturaSelecionada.value = atualizada
    }
    if (insumoSelecionado.value) {
      const atualizado = insumos.value.find((i) => i.id === insumoSelecionado.value.id)
      if (atualizado) insumoSelecionado.value = atualizado
    }
  } catch (err) {
    toastStore.error('Erro ao sincronizar dados com o servidor.')
    console.error(err)
  } finally {
    carregando.value = false
  }
}

const trocarAba = (aba) => {
  abaAtiva.value = aba
  modoCadastro.value = false
  culturaSelecionada.value = null
  insumoSelecionado.value = null
  busca.value = ''
}

const selecionarCultura = (item) => {
  culturaSelecionada.value = item
  modoCadastro.value = false
  limparFiltros()
}

const selecionarInsumo = (item) => {
  insumoSelecionado.value = item
  modoCadastro.value = false
}

const abrirFormulario = () => {
  modoCadastro.value = true
  culturaSelecionada.value = null
  insumoSelecionado.value = null
}

const salvarMovimentacao = async () => {
  if (salvando.value) return
  salvando.value = true

  const token = localStorage.getItem('access_token')
  const loteAlvo = lotes.value.find((l) => l.id === form.value.lote_id)
  const payload = { ...form.value, unidade: loteAlvo ? loteAlvo.unidade : 'Unidades' }

  try {
    const res = await fetch('/api/estoque/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      toastStore.success('Movimentação registrada com sucesso!')
      form.value = { lote_id: '', tipo_movimentacao: 'Entrada', quantidade: 0.0, motivo: '' }
      modoCadastro.value = false
      await carregarDadosBase()
    } else {
      toastStore.error('Erro ao registrar movimentação. Verifique o saldo do lote.')
    }
  } catch (err) {
    toastStore.error('Falha de conexão ao salvar movimentação.')
    console.error(err)
  } finally {
    salvando.value = false
  }
}

const salvarMovimentacaoInsumo = async () => {
  if (salvando.value) return
  salvando.value = true

  const token = localStorage.getItem('access_token')

  try {
    const res = await fetch('/api/movimentacoes-insumo/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(formInsumo.value),
    })

    if (res.ok) {
      toastStore.success('Movimentação registrada com sucesso!')
      formInsumo.value = {
        insumo_id: '',
        tipo_movimentacao: 'Entrada',
        quantidade: 0.0,
        motivo: '',
      }
      modoCadastro.value = false
      await carregarDadosBase()
    } else {
      toastStore.error('Erro ao registrar movimentação. Verifique o saldo do insumo.')
    }
  } catch (err) {
    toastStore.error('Falha de conexão ao salvar movimentação.')
    console.error(err)
  } finally {
    salvando.value = false
  }
}

const excluirMovimentacao = async (id) => {
  if (!confirm(`TEM CERTEZA? Deseja excluir permanentemente este registro do histórico?`)) return
  excluindo.value = id
  const token = localStorage.getItem('access_token')
  try {
    const res = await fetch(`/api/estoque/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      toastStore.success('Registro excluído com sucesso!')
      await carregarDadosBase()
    } else {
      const erro = await res.json()
      toastStore.error(erro.error || 'Acesso negado ou erro ao excluir.')
    }
  } catch (err) {
    toastStore.error('Falha de conexão ao excluir movimentação.')
    console.error(err)
  } finally {
    excluindo.value = null
  }
}

const excluirMovimentacaoInsumo = async (id) => {
  if (!confirm(`TEM CERTEZA? Deseja excluir permanentemente este registro do histórico?`)) return
  excluindo.value = id
  const token = localStorage.getItem('access_token')
  try {
    const res = await fetch(`/api/movimentacoes-insumo/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      toastStore.success('Registro excluído com sucesso!')
      await carregarDadosBase()
    } else {
      const erro = await res.json()
      toastStore.error(erro.error || 'Acesso negado ou erro ao excluir.')
    }
  } catch (err) {
    toastStore.error('Falha de conexão ao excluir movimentação.')
    console.error(err)
  } finally {
    excluindo.value = null
  }
}

const excluirInsumo = async (insumo) => {
  if (!insumo) return

  if (parseFloat(insumo.quantidade_atual) !== 0) {
    toastStore.error('Só é possível excluir um insumo com saldo zerado.')
    return
  }

  if (
    !confirm(
      `TEM CERTEZA? Deseja excluir permanentemente o insumo "${insumo.nome}"?\n\nEsta ação não poderá ser desfeita.`,
    )
  ) {
    return
  }

  excluindoInsumo.value = true
  const token = localStorage.getItem('access_token')
  try {
    const res = await fetch(`/api/insumos/${insumo.id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      toastStore.success('Insumo excluído com sucesso!')
      insumoSelecionado.value = null
      await carregarDadosBase()
    } else {
      const erro = await res.json().catch(() => ({}))
      toastStore.error(erro.error || 'Acesso negado ou erro ao excluir insumo.')
    }
  } catch (err) {
    toastStore.error('Falha de conexão ao excluir insumo.')
    console.error(err)
  } finally {
    excluindoInsumo.value = false
  }
}

onMounted(() => {
  carregarDadosBase()
  verificarAcessos()
})
</script>

<style scoped>
.tabs-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid #eee;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: #78909c;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
}
.tab-btn:hover {
  color: #37474f;
}
.tab-btn.active {
  color: var(--cor-verde-primaria, #2e7d32);
  border-bottom-color: var(--cor-verde-primaria, #2e7d32);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-right: 40px;
  padding-top: 10px;
}

.seed-detail-panel {
  overflow-y: auto;
  max-height: 70vh;
  position: relative;
}

/* Animações e Transições */
.fade-in {
  animation: fadeIn 0.3s ease;
}
.slide-in {
  animation: slideIn 0.3s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Skeletons */
.skeleton-card {
  background-color: #f4f6f8;
  border-color: #e0e0e0;
  pointer-events: none;
}
.skeleton-line {
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite linear;
  border-radius: 4px;
  height: 12px;
  margin-bottom: 8px;
}
.skeleton-line.title {
  height: 16px;
  width: 60%;
  margin-bottom: 16px;
}
.skeleton-line.short {
  width: 40%;
}
.skeleton-line.medium {
  width: 70%;
}
@keyframes loading {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

/* Empty States */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: #90a4ae;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #cfd8dc;
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}
.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #546e7a;
  font-size: 1.1rem;
}
.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}

.detalhe-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}
.placeholder-content {
  text-align: center;
  color: #90a4ae;
}
.placeholder-icon {
  font-size: 4rem;
  opacity: 0.3;
  margin-bottom: 1rem;
}
.placeholder-content h3 {
  color: #546e7a;
  margin-bottom: 0.5rem;
}

.empty-extrato {
  text-align: center;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 8px;
  color: #888;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/* Mini Card Interativo */
.mini-card {
  transition: all 0.2s ease;
  border: 1px solid #e0e0e0;
}
.mini-card:hover,
.mini-card:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--primary-green, #4caf50);
  outline: none;
}

/* Detalhes e Stats */
.subtitle {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 25px;
}
.stat-box {
  padding: 15px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.stat-saldo {
  background: rgba(58, 90, 64, 0.05);
  border: 1px solid rgba(58, 90, 64, 0.1);
}
.stat-taxa {
  background: rgba(103, 58, 183, 0.05);
  border: 1px solid rgba(103, 58, 183, 0.1);
}
.stat-label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 600;
}
.stat-value {
  font-size: 1.4rem;
  font-weight: bold;
}
.stat-saldo .stat-value {
  color: var(--primary-dark, #1b5e20);
}
.stat-taxa .stat-value {
  color: #673ab7;
}

.extrato-title {
  color: var(--primary-green, #2e7d32);
  margin-bottom: 15px;
  font-size: 1.1rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Filtros */
.extrato-filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 15px;
  background: #f9f9f9;
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  margin-bottom: 20px;
}
.filtro-item {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 120px;
}
.filtro-item label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 600;
  margin-bottom: 4px;
}
.filtro-item select,
.filtro-item input {
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}
.filtro-item select:focus,
.filtro-item input:focus {
  border-color: var(--primary-green, #4caf50);
}
.btn-clear-filters {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  transition: all 0.2s;
}
.btn-clear-filters:hover {
  background: #ffcdd2;
}

/* Extrato Cards */
.extrato-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.extrato-card {
  background: #ffffff;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: box-shadow 0.2s;
}
.extrato-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.extrato-header-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.lote-id {
  font-weight: 700;
  color: #444;
}
.motivo-texto {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}
.data-texto {
  font-size: 0.75rem;
  color: #999;
  margin-top: 4px;
}
.extrato-acoes {
  display: flex;
  align-items: center;
  gap: 15px;
}
.quantidade-texto {
  font-weight: bold;
  font-size: 1.1rem;
}
.text-green {
  color: #2e7d32;
}
.text-red {
  color: #c62828;
}

.btn-icon-delete {
  background: none;
  border: none;
  color: #c62828;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-icon-delete:hover:not(:disabled) {
  background: #ffcdd2;
}
.btn-icon-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Botões e Utilidades */
.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

/* Responsividade Mobile Extrato */
@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    gap: 10px;
    padding-right: 0;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .extrato-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .extrato-acoes {
    width: 100%;
    justify-content: space-between;
    border-top: 1px solid #eee;
    padding-top: 10px;
  }
}
</style>
