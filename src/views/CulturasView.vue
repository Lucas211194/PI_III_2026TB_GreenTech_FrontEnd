<template>
  <PageLayout title="Culturas Cadastradas" subtitle="Gerencie as espécies e parâmetros de cultivo da estufa">
    <template #header-actions>
      <div class="acoes-cabecalho">
        <!-- Exportação em CSV: cada página terá a sua, implementada depois -->
        <button class="btn-outline btn-exportar" disabled title="Exportação em CSV em breve">
          <span class="material-symbols-outlined">download</span>
          Exportar CSV
        </button>
        <button class="btn-primary" @click="abrirModalNovaCultura">
          <span class="material-symbols-outlined">add</span>
          Nova Cultura
        </button>
      </div>
    </template>

    <div class="culturas-container">
      <div class="toolbar">
        <label class="search-box-estoque">
          <span class="material-symbols-outlined search-icon">search</span>
          <input v-model="busca" class="search-input" type="search" placeholder="Buscar cultura" aria-label="Buscar cultura" />
        </label>
        <select v-model="ordenacao" class="select-ordenar" aria-label="Ordenar culturas">
          <option v-for="(op, chave) in ORDENACOES" :key="chave" :value="chave">Ordenar: {{ op.nome }}</option>
        </select>
      </div>

      <EstadoCarregamento v-if="carregando" mensagem="Carregando culturas..." />

      <ErroCarregamento
        v-else-if="erroCarregamento"
        :mensagem="erroCarregamento"
        @tentar-novamente="carregarCulturas"
      />

      <template v-else-if="culturas.length > 0">
        <section class="kpis">
          <div v-for="kpi in kpis" :key="kpi.rotulo" class="resumo-card">
            <div class="resumo-card-label">
              <span class="material-symbols-outlined">{{ kpi.icone }}</span>{{ kpi.rotulo }}
            </div>
            <div class="resumo-card-value">{{ kpi.valor }}</div>
            <div class="kpi-detalhe">{{ kpi.detalhe }}</div>
          </div>
        </section>

        <section class="paineis">
          <article class="painel">
            <h3 class="painel-titulo">Colhido x Perdido por cultura</h3>
            <GraficoBarras
              v-if="graficoProducao.rotulos.length"
              :rotulos="graficoProducao.rotulos"
              :series="graficoProducao.series"
              :height="graficoProducao.altura"
              :rotulo-tooltip="rotuloTooltipProducao"
              horizontal
              empilhado
              titulo="Quantidade colhida e perdida por cultura"
            />
            <p v-else class="painel-vazio">Nenhuma colheita registrada ainda.</p>
          </article>

          <article class="painel">
            <h3 class="painel-titulo">Próximas colheitas</h3>
            <ul v-if="proximasColheitas.length" class="proximas">
              <li v-for="c in proximasColheitas" :key="c.id">
                <span class="icone-categoria" :style="{ background: categoriaDe(c.categoria).cor }">
                  <span class="material-symbols-outlined">{{ categoriaDe(c.categoria).icone }}</span>
                </span>
                <div class="proxima-info">
                  <strong>{{ c.nome_cultura }}</strong>
                  <small>Mesa {{ c.mesa_proxima_colheita }} · {{ formatarDataCurta(c.proxima_colheita) }}</small>
                </div>
                <span :class="['badge', prazoColheita(c).classe]">{{ prazoColheita(c).texto }}</span>
              </li>
            </ul>
            <p v-else class="painel-vazio">Nenhum lote em cultivo.</p>
          </article>
        </section>

        <nav class="filtros" aria-label="Filtrar por categoria">
          <button
            v-for="filtro in filtros"
            :key="filtro.valor"
            :class="['filtro-btn', { active: categoriaFiltro === filtro.valor }]"
            @click="categoriaFiltro = filtro.valor"
          >
            {{ filtro.nome }} ({{ filtro.total }})
          </button>
        </nav>

        <div v-if="culturasVisiveis.length" class="culturas-grid">
          <article
            v-for="cultura in culturasVisiveis"
            :key="cultura.id"
            class="cultura-card"
            :style="{ '--cor-categoria': categoriaDe(cultura.categoria).cor }"
          >
            <div class="card-faixa">
              <span class="icone-categoria">
                <span class="material-symbols-outlined">{{ categoriaDe(cultura.categoria).icone }}</span>
              </span>
            </div>

            <div class="card-corpo">
              <div class="card-titulo">
                <div>
                  <h3>{{ cultura.nome_cultura }}</h3>
                  <small class="categoria-nome">{{ categoriaDe(cultura.categoria).nome }}</small>
                </div>
                <span :class="['badge', statusCultura(cultura).classe]">{{ statusCultura(cultura).texto }}</span>
              </div>

              <p class="descricao-curta">{{ cultura.descricao || 'Sem descrição informada.' }}</p>

              <dl class="parametros">
                <div v-for="p in parametros(cultura)" :key="p.rotulo">
                  <dt><span class="material-symbols-outlined">{{ p.icone }}</span>{{ p.rotulo }}</dt>
                  <dd>{{ p.valor }}</dd>
                </div>
              </dl>

              <div v-if="cultura.proxima_colheita" class="bloco">
                <div class="bloco-linha">
                  <span>Mesa {{ cultura.mesa_proxima_colheita }} · dia {{ diaDoCiclo(cultura) }} de {{ cultura.tempo_medio_colheita }}</span>
                  <span>{{ prazoColheita(cultura).texto }}</span>
                </div>
                <div class="prog-track">
                  <div class="prog-fill" :style="{ width: `${progressoCiclo(cultura)}%` }"></div>
                </div>
              </div>

              <div class="bloco">
                <template v-if="temColheita(cultura)">
                  <div class="bloco-linha">
                    <span>Colhido {{ formatarQuantidade(cultura.total_colhido) }} · Perda {{ formatarQuantidade(cultura.total_perda) }}</span>
                  </div>
                  <div class="prog-track">
                    <div class="prog-fill" :style="{ width: `${parseNumero(cultura.taxa_producao)}%` }"></div>
                  </div>
                  <span class="taxa">Taxa de produção: {{ formatarPercentual(cultura.taxa_producao) }}</span>
                </template>
                <span v-else class="sem-dados">Sem colheitas ainda</span>
              </div>
            </div>

            <footer class="card-rodape">
              <span>{{ textoLotes(cultura) }}</span>
              <div class="card-actions">
                <button class="btn-icon" title="Editar" @click="editarCultura(cultura)">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button v-if="podeExcluir" class="btn-icon btn-danger" title="Excluir" @click="prepararExclusao(cultura)">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </footer>
          </article>
        </div>

        <p v-else class="painel-vazio">Nenhuma cultura encontrada para esse filtro.</p>
      </template>

      <EstadoVazio v-else icone="potted_plant" titulo="Nenhuma cultura cadastrada" texto="Cadastre os parâmetros da primeira cultura para iniciar o plantio.">
        <button class="btn-primary" @click="abrirModalNovaCultura">Cadastrar Cultura</button>
      </EstadoVazio>

      <!-- MODAL FORMULÁRIO (CADASTRO / EDIÇÃO) -->
      <ModalFormulario v-if="exibirModal" :titulo="modoEdicao ? 'Editar Cultura' : 'Nova Cultura'" @fechar="fecharModal">

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
            <label for="categoria-cultura">Categoria *</label>
            <select id="categoria-cultura" v-model="formulario.categoria" required>
              <option v-for="op in OPCOES_CATEGORIA" :key="op.valor" :value="op.valor">{{ op.nome }}</option>
            </select>
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
      </ModalFormulario>

      <!-- MODAL CONFIRMAÇÃO DE EXCLUSÃO -->
      <ModalConfirmacao
        :ativo="modalExclusaoAberto"
        titulo="Excluir Cultura"
        :mensagem="mensagemConfirmacaoExclusao"
        texto-confirmar="Excluir"
        texto-cancelar="Cancelar"
        :processando="excluindo"
        @confirmar="confirmarExclusao"
        @cancelar="modalExclusaoAberto = false"
      />
    </div>
  </PageLayout>
</template>

<script setup>
import ModalFormulario from '@/components/ModalFormulario.vue'
import EstadoVazio from '@/components/EstadoVazio.vue'
import EstadoCarregamento from '@/components/EstadoCarregamento.vue'
import { ref, computed, onMounted } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import ErroCarregamento from '@/components/ErroCarregamento.vue'
import ModalConfirmacao from '@/components/ModalConfirmacao.vue'
import GraficoBarras from '@/components/GraficoBarras.vue'
import culturaService from '@/services/culturaService'
import { diasAte, formatarDataCurta, formatarQuantidade, mensagemDeErro, parseNumero } from '@/services/apiHelpers'
import { CATEGORIAS, OPCOES_CATEGORIA, categoriaDe } from '@/config/culturas'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const authStore = useAuthStore()
const toastStore = useToastStore()

const culturas = ref([])
const carregando = ref(false)
const salvando = ref(false)
const excluindo = ref(false)
const erroCarregamento = ref('')

const busca = ref('')
const categoriaFiltro = ref('todas')
const ordenacao = ref('nome')

const exibirModal = ref(false)
const modoEdicao = ref(false)

const modalExclusaoAberto = ref(false)
const culturaParaExcluir = ref(null)

const podeExcluir = computed(() => Boolean(authStore.isGerente || authStore.isAdmin))

// Sem colheita agendada vai para o fim na ordenação por próxima colheita
const SEM_DATA = '9999-12-31'
const ORDENACOES = {
  nome: { nome: 'Nome (A-Z)', comparar: (a, b) => a.nome_cultura.localeCompare(b.nome_cultura, 'pt-BR') },
  colheita: {
    nome: 'Próxima colheita',
    comparar: (a, b) => (a.proxima_colheita || SEM_DATA).localeCompare(b.proxima_colheita || SEM_DATA),
  },
  producao: { nome: 'Mais colhido', comparar: (a, b) => parseNumero(b.total_colhido) - parseNumero(a.total_colhido) },
  recentes: { nome: 'Mais recentes', comparar: (a, b) => b.id - a.id },
}

const COR_COLHIDO = '#588157'
const COR_PERDA = '#d32f2f'

const formatarPercentual = (valor) =>
  `${parseNumero(valor).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

// Sem colheita registrada, a taxa 0% passaria a ideia de que a produção toda foi perdida
function temColheita(cultura) {
  return parseNumero(cultura.total_colhido) + parseNumero(cultura.total_perda) > 0
}

const kpis = computed(() => {
  const lista = culturas.value
  const colhido = lista.reduce((s, c) => s + parseNumero(c.total_colhido), 0)
  const perda = lista.reduce((s, c) => s + parseNumero(c.total_perda), 0)
  const lotes = lista.reduce((s, c) => s + (c.lotes_ativos || 0), 0)
  const categorias = new Set(lista.map((c) => c.categoria)).size
  return [
    { rotulo: 'Culturas cadastradas', icone: 'potted_plant', valor: lista.length,
      detalhe: `${categorias} ${categorias === 1 ? 'categoria' : 'categorias'}` },
    { rotulo: 'Em cultivo agora', icone: 'agriculture', valor: lista.filter((c) => c.lotes_ativos > 0).length,
      detalhe: `${lotes} ${lotes === 1 ? 'lote' : 'lotes'} nas mesas` },
    { rotulo: 'Total colhido', icone: 'shopping_basket', valor: formatarQuantidade(colhido),
      detalhe: `Perda: ${formatarQuantidade(perda)}` },
    // Ponderada: uma cultura com pouca colheita não pesa o mesmo que uma com muita
    { rotulo: 'Taxa de produção', icone: 'trending_up', valor: colhido + perda ? formatarPercentual((colhido * 100) / (colhido + perda)) : '—',
      detalhe: 'Colhido sobre colhido + perda' },
  ]
})

// Acima disso as demais viram uma linha "Outras", para o gráfico não virar um paredão de barras
const MAX_BARRAS = 8
const totalProduzido = (c) => parseNumero(c.total_colhido) + parseNumero(c.total_perda)

const graficoProducao = computed(() => {
  const linhas = culturasDaCategoria.value
    .filter(temColheita)
    .sort((a, b) => totalProduzido(b) - totalProduzido(a))
    .map((c) => ({ nome: c.nome_cultura, colhido: parseNumero(c.total_colhido), perda: parseNumero(c.total_perda) }))

  if (linhas.length > MAX_BARRAS) {
    const resto = linhas.splice(MAX_BARRAS - 1)
    linhas.push({
      nome: `Outras (${resto.length})`,
      colhido: resto.reduce((s, l) => s + l.colhido, 0),
      perda: resto.reduce((s, l) => s + l.perda, 0),
    })
  }

  return {
    rotulos: linhas.map((l) => l.nome),
    series: [
      { label: 'Colhido', data: linhas.map((l) => l.colhido), cor: COR_COLHIDO },
      { label: 'Perdido', data: linhas.map((l) => l.perda), cor: COR_PERDA },
    ],
    altura: `${Math.max(180, linhas.length * 40 + 60)}px`,
  }
})

function rotuloTooltipProducao(ctx, valor) {
  const colhido = ctx.chart.data.datasets[0].data[ctx.dataIndex]
  const perda = ctx.chart.data.datasets[1].data[ctx.dataIndex]
  const percentual = colhido + perda ? formatarPercentual((valor * 100) / (colhido + perda)) : '—'
  return `${ctx.dataset.label}: ${formatarQuantidade(valor)} (${percentual})`
}

const proximasColheitas = computed(() =>
  culturas.value.filter((c) => c.proxima_colheita).sort(ORDENACOES.colheita.comparar).slice(0, 4),
)

const filtros = computed(() => {
  const contagem = {}
  culturas.value.forEach((c) => { contagem[c.categoria] = (contagem[c.categoria] || 0) + 1 })
  return [
    { valor: 'todas', nome: 'Todas', total: culturas.value.length },
    ...Object.entries(CATEGORIAS)
      .filter(([valor]) => contagem[valor])
      .map(([valor, { nome }]) => ({ valor, nome, total: contagem[valor] })),
  ]
})

const culturasDaCategoria = computed(() =>
  culturas.value.filter((c) => categoriaFiltro.value === 'todas' || c.categoria === categoriaFiltro.value),
)

const culturasVisiveis = computed(() => {
  const termo = busca.value.trim().toLocaleLowerCase('pt-BR')
  return culturasDaCategoria.value
    .filter((c) => !termo || `${c.nome_cultura} ${c.descricao || ''}`.toLocaleLowerCase('pt-BR').includes(termo))
    .sort(ORDENACOES[ordenacao.value].comparar)
})

function parametros(cultura) {
  return [
    { rotulo: 'Ciclo', icone: 'calendar_month', valor: `${cultura.tempo_medio_colheita} dias` },
    { rotulo: 'Temp.', icone: 'device_thermostat',
      valor: `${parseNumero(cultura.temperatura_minima)}–${parseNumero(cultura.temperatura_maxima)}°C` },
    { rotulo: 'Umidade', icone: 'water_drop', valor: `${parseNumero(cultura.umidade_ideal)}%` },
  ]
}

function diaDoCiclo(cultura) {
  return cultura.tempo_medio_colheita - diasAte(cultura.proxima_colheita)
}

function progressoCiclo(cultura) {
  return Math.min(100, Math.max(0, (diaDoCiclo(cultura) / cultura.tempo_medio_colheita) * 100))
}

function prazoColheita(cultura) {
  const dias = diasAte(cultura.proxima_colheita)
  if (dias < 0) return { texto: `Atrasada ${-dias} ${dias === -1 ? 'dia' : 'dias'}`, classe: 'badge-out' }
  if (dias === 0) return { texto: 'Colher hoje', classe: 'badge-low' }
  return { texto: `Em ${dias} ${dias === 1 ? 'dia' : 'dias'}`, classe: dias <= 7 ? 'badge-low' : 'badge-good' }
}

function statusCultura(cultura) {
  if (!cultura.lotes_ativos) return { texto: 'Sem plantio', classe: 'badge-neutro' }
  if (diasAte(cultura.proxima_colheita) <= 0) return { texto: 'Pronta para colher', classe: 'badge-low' }
  return { texto: 'Em cultivo', classe: 'badge-good' }
}

function textoLotes(cultura) {
  const n = cultura.lotes_ativos || 0
  if (!n) return 'Nenhum lote em cultivo'
  return `${n} ${n === 1 ? 'lote' : 'lotes'} em cultivo`
}

const mensagemConfirmacaoExclusao = computed(() => {
  if (!culturaParaExcluir.value) return ''
  return `Excluir a cultura "${culturaParaExcluir.value.nome_cultura}"? Só é possível enquanto ela não tiver lotes; com histórico de plantio, edite a cultura em vez de excluir.`
})

const formularioPadrao = () => ({
  id: null,
  nome_cultura: '',
  categoria: 'outra',
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
    culturas.value = await culturaService.listar()
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
    categoria: cultura.categoria || 'outra',
    descricao: cultura.descricao || '',
    tempo_medio_colheita: cultura.tempo_medio_colheita,
    temperatura_minima: parseNumero(cultura.temperatura_minima),
    temperatura_maxima: parseNumero(cultura.temperatura_maxima),
    umidade_ideal: parseNumero(cultura.umidade_ideal),
    observacoes: cultura.observacoes || ''
  }
  exibirModal.value = true
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
    const { id, ...dados } = formulario.value
    const payload = { ...dados, nome_cultura: dados.nome_cultura.trim() }

    if (modoEdicao.value && id) {
      await culturaService.atualizar(id, payload)
      toastStore.success('Cultura atualizada com sucesso!')
    } else {
      await culturaService.criar(payload)
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
    await culturaService.excluir(culturaParaExcluir.value.id)
    toastStore.success('Cultura excluída com sucesso!')
    modalExclusaoAberto.value = false
    culturaParaExcluir.value = null
    await carregarCulturas()
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Erro ao excluir cultura.'))
  } finally {
    excluindo.value = false
  }
}

onMounted(carregarCulturas)
</script>

<style scoped>
.culturas-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.toolbar,
.acoes-cabecalho {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.kpi-detalhe,
.categoria-nome,
.sem-dados,
.painel-vazio {
  color: var(--color-text-muted);
}

.toolbar .search-box-estoque {
  width: 240px;
}

.btn-exportar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
}

.btn-exportar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: transparent;
  color: var(--primary-green);
}

.select-ordenar {
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  font-size: 0.9rem;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: 1rem;
}

.kpi-detalhe {
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.paineis {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 1rem;
}

.painel,
.cultura-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.painel {
  padding: 1.25rem;
}

.painel-titulo {
  font-size: 1rem;
  margin: 0 0 1rem;
}

.painel-vazio {
  text-align: center;
  padding: 2rem 0;
}

.proximas {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.proximas li,
.card-rodape,
.card-titulo,
.bloco-linha {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.proxima-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.proxima-info strong,
.proxima-info small {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.proxima-info small {
  color: var(--color-text-muted);
}

.icone-categoria {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #fff;
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.culturas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: 1.25rem;
}

.cultura-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-faixa {
  height: 44px;
  background: var(--cor-categoria);
  position: relative;
}

.card-faixa .icone-categoria {
  position: absolute;
  left: 1rem;
  bottom: -18px;
  width: 44px;
  height: 44px;
  background: var(--color-surface);
  color: var(--cor-categoria);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.card-corpo {
  padding: 1.75rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  flex: 1;
}

.card-titulo {
  align-items: flex-start;
}

.card-titulo h3 {
  font-size: 1.1rem;
  margin: 0;
}

.descricao-curta {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.parametros {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin: 0;
  font-size: 0.8rem;
}

.parametros dt {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: var(--color-text-muted);
}

.parametros dt .material-symbols-outlined {
  font-size: 1rem;
}

.parametros dd {
  margin: 0.15rem 0 0;
  font-weight: 600;
}

.bloco {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8rem;
}

.cultura-card .prog-fill {
  background: var(--cor-categoria);
}

.taxa {
  color: var(--color-success);
  font-weight: 600;
}

.badge-neutro {
  background: rgba(0, 0, 0, 0.06);
  color: var(--color-text-muted);
}

.badge {
  white-space: nowrap;
}

.card-rodape {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.85rem;
}

.card-actions {
  display: flex;
  gap: 0.25rem;
}

@media (max-width: 1100px) {
  .paineis {
    grid-template-columns: minmax(0, 1fr);
  }

  .toolbar {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
  }

  .toolbar .search-box-estoque {
    width: auto;
  }

  .proximas {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: 0.85rem 2rem;
  }
}

@media (max-width: 600px) {
  .kpis {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .toolbar {
    grid-template-columns: 1fr;
  }

  .toolbar .btn-primary {
    justify-content: center;
  }

  .filtros {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .filtros .filtro-btn {
    flex-shrink: 0;
  }
}

.btn-secondary {
  background-color: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
}
</style>
