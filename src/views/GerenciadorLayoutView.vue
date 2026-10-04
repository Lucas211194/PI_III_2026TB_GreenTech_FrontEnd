<template>
  <PageLayout>
    <div class="layout-view">
      <div class="header-secao">
        <div>
          <h2>Layout Físico das Estufas</h2>
          <p class="subtitulo">
            Distribuição espacial das mesas de cultivo, ocupação e parâmetros por setor
          </p>
        </div>
        <button class="btn-toggle-painel" @click="exibirPainelGerenciamento = !exibirPainelGerenciamento">
          <span class="material-symbols-outlined">
            {{ exibirPainelGerenciamento ? 'expand_less' : 'tune' }}
          </span>
          {{ exibirPainelGerenciamento ? 'Ocultar Gerenciamento' : 'Gerenciar Estrutura Física' }}
        </button>
      </div>

      <!-- PAINEL DE GESTÃO FÍSICA (ESTUFAS E MESAS) -->
      <transition name="fade">
        <EstruturaFisicaPanel
          v-if="exibirPainelGerenciamento"
          @atualizado="carregarDados"
        />
      </transition>

      <!-- CARREGANDO -->
      <div v-if="carregando" class="loading-state">
        <div class="spinner"></div>
        <p>Montando layout físico das estufas...</p>
      </div>

      <!-- ERRO -->
      <ErroCarregamento
        v-else-if="erroCarregamento"
        :mensagem="erroCarregamento"
        @tentar-novamente="carregarDados"
      />

      <!-- GRADE DE ESTUFAS E MESAS -->
      <div v-else-if="estufasAgrupadas.length > 0" class="estufas-grid">
        <div
          v-for="estufa in estufasAgrupadas"
          :key="estufa.id"
          class="card-estufa"
        >
          <div class="estufa-cabecalho">
            <div class="estufa-info-principal">
              <span class="material-symbols-outlined icone-setor">warehouse</span>
              <div>
                <h3>{{ estufa.nome_setor }}</h3>
                <span class="tipo-cultivo">{{ estufa.tipo_cultivo || 'Geral' }}</span>
              </div>
            </div>
            <div class="estufa-metricas">
              <span class="badge-capacidade">
                Capacidade do Setor: <strong>{{ estufa.capacidade_maxima }}</strong>
              </span>
              <span class="badge-mesas">
                {{ estufa.mesas.length }} mesa(s)
              </span>
            </div>
          </div>

          <!-- MESAS DA ESTUFA -->
          <div class="mesas-grid">
            <div
              v-for="mesa in estufa.mesas"
              :key="mesa.id"
              :class="['card-mesa', `status-${mesa.status_mesa || 'livre'}`]"
            >
              <div class="mesa-topo">
                <span class="mesa-identificacao font-destaque">{{ mesa.identificacao }}</span>
                <span :class="['badge-status-mesa', `status-${mesa.status_mesa || 'livre'}`]">
                  {{ mesa.status_mesa || 'livre' }}
                </span>
              </div>

              <!-- DETALHES DO LOTE ATIVO NA MESA -->
              <div v-if="mesa.loteAtivo" class="mesa-lote-info">
                <div class="cultura-nome">
                  <span class="material-symbols-outlined">eco</span>
                  <strong>{{ obterNomeCultura(mesa.loteAtivo.cultura_id) }}</strong>
                </div>
                <div class="lote-saldo">
                  <span>Lote #{{ mesa.loteAtivo.id }}:</span>
                  <span>{{ mesa.loteAtivo.quantidade }} {{ mesa.loteAtivo.unidade }}</span>
                </div>

                <!-- BARRA DE OCUPAÇÃO -->
                <div class="barra-ocupacao-wrapper">
                  <div class="barra-fundo">
                    <div
                      class="barra-preenchimento"
                      :style="{ width: `${calcularPercentualOcupacao(mesa)}%` }"
                    ></div>
                  </div>
                  <span class="texto-ocupacao">
                    {{ calcularPercentualOcupacao(mesa).toFixed(0) }}% ocupado (Max: {{ mesa.capacidade_maxima }})
                  </span>
                </div>
              </div>

              <!-- MESA SEM LOTE ATIVO -->
              <div v-else class="mesa-vazia">
                <span class="material-symbols-outlined icone-vazio">crop_free</span>
                <p>Mesa disponível</p>
                <span class="capacidade-vazia">Capacidade: {{ mesa.capacidade_maxima }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- MESAS AVULSAS (SEM ESTUFA VINCULADA / AUTO) -->
        <div v-if="mesasSemEstufa.length > 0" class="card-estufa estufa-avulsa">
          <div class="estufa-cabecalho">
            <div class="estufa-info-principal">
              <span class="material-symbols-outlined icone-setor">table_restaurant</span>
              <div>
                <h3>Mesas Avulsas / Reserva Técnica</h3>
                <span class="tipo-cultivo">Mesas sem estufa definida (ex.: NF-AUTO)</span>
              </div>
            </div>
          </div>

          <div class="mesas-grid">
            <div
              v-for="mesa in mesasSemEstufa"
              :key="mesa.id"
              class="card-mesa status-avulsa"
            >
              <div class="mesa-topo">
                <span class="mesa-identificacao font-destaque">{{ mesa.identificacao }}</span>
                <span class="badge-status-mesa">{{ mesa.status_mesa || 'livre' }}</span>
              </div>
              <div v-if="mesa.loteAtivo" class="mesa-lote-info">
                <div class="cultura-nome">
                  <span class="material-symbols-outlined">eco</span>
                  <strong>{{ obterNomeCultura(mesa.loteAtivo.cultura_id) }}</strong>
                </div>
                <div class="lote-saldo">
                  <span>Lote #{{ mesa.loteAtivo.id }}:</span>
                  <span>{{ mesa.loteAtivo.quantidade }} {{ mesa.loteAtivo.unidade }}</span>
                </div>
              </div>
              <div v-else class="mesa-vazia">
                <p>Sem lote vinculado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- VAZIO -->
      <div v-else class="empty-state">
        <span class="material-symbols-outlined empty-icon">grid_off</span>
        <h3>Nenhuma estufa cadastrada no sistema</h3>
        <p>Utilize o painel de gerenciamento físico para cadastrar suas estufas e mesas de cultivo.</p>
        <button class="btn-primario" @click="exibirPainelGerenciamento = true">
          Cadastrar Primeira Estufa
        </button>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import ErroCarregamento from '@/components/ErroCarregamento.vue'
import EstruturaFisicaPanel from '@/components/EstruturaFisicaPanel.vue'
import estruturaService from '@/services/estruturaService'
import loteService from '@/services/loteService'
import culturaService from '@/services/culturaService'
import { mensagemDeErro, parseNumero } from '@/services/apiHelpers'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const carregando = ref(false)
const erroCarregamento = ref('')
const exibirPainelGerenciamento = ref(false)

const estufas = ref([])
const mesas = ref([])
const lotes = ref([])
const culturas = ref([])

async function carregarDados() {
  carregando.value = true
  erroCarregamento.value = ''

  try {
    const [resEst, resMes, resLot, resCul] = await Promise.all([
      estruturaService.listarEstufas(),
      estruturaService.listarMesas(),
      loteService.listar(),
      culturaService.listar(),
    ])

    estufas.value = resEst
    mesas.value = resMes
    lotes.value = resLot
    culturas.value = resCul
  } catch (err) {
    erroCarregamento.value = mensagemDeErro(err, 'Erro ao carregar o layout das estufas.')
    toastStore.error(erroCarregamento.value)
  } finally {
    carregando.value = false
  }
}

function obterNomeCultura(culturaId) {
  const c = culturas.value.find((item) => item.id === culturaId)
  return c ? c.nome_cultura : `Cultura #${culturaId}`
}

function obterLoteAtivoDaMesa(mesaId) {
  return lotes.value.find(
    (l) => l.mesa_id === mesaId && (l.status === 'AT' || l.status === 'DI' || l.status === 'ES'),
  ) || null
}

const estufasAgrupadas = computed(() => {
  return estufas.value.map((est) => {
    const mesasDestaEstufa = mesas.value
      .filter((m) => Number(m.estufa) === Number(est.id))
      .map((m) => ({
        ...m,
        loteAtivo: obterLoteAtivoDaMesa(m.id),
      }))

    return {
      ...est,
      mesas: mesasDestaEstufa,
    }
  })
})

const mesasSemEstufa = computed(() => {
  return mesas.value
    .filter((m) => !m.estufa)
    .map((m) => ({
      ...m,
      loteAtivo: obterLoteAtivoDaMesa(m.id),
    }))
})

function calcularPercentualOcupacao(mesa) {
  if (!mesa.loteAtivo) return 0
  const qtd = parseNumero(mesa.loteAtivo.quantidade)
  const cap = parseNumero(mesa.capacidade_maxima, 1)
  if (cap <= 0) return 0
  return Math.min((qtd / cap) * 100, 100)
}

onMounted(() => {
  carregarDados()
})
</script>

<style scoped>
.layout-view {
  padding: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
}

.header-secao {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-secao h2 {
  margin: 0;
  font-size: 1.5rem;
}

.subtitulo {
  color: var(--color-text-muted, #64748b);
  margin-top: 0.25rem;
  font-size: 0.95rem;
}

.btn-toggle-painel {
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
  transition: all 0.2s;
}

.btn-toggle-painel:hover {
  background-color: var(--color-background, #f8fafc);
}

.estufas-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card-estufa {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-estufa.estufa-avulsa {
  border-style: dashed;
  background-color: var(--color-background, #f8fafc);
}

.estufa-cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.estufa-info-principal {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icone-setor {
  font-size: 32px;
  color: var(--color-primary, #16a34a);
}

.estufa-cabecalho h3 {
  margin: 0;
  font-size: 1.25rem;
}

.tipo-cultivo {
  font-size: 0.8rem;
  color: var(--color-text-muted, #64748b);
}

.estufa-metricas {
  display: flex;
  gap: 0.75rem;
}

.badge-capacidade,
.badge-mesas {
  font-size: 0.8rem;
  padding: 0.35rem 0.65rem;
  background-color: var(--color-background, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-sm, 6px);
  color: var(--color-text-muted, #64748b);
}

.mesas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}

.card-mesa {
  background: var(--color-background, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 140px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card-mesa:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.card-mesa.status-ocupada {
  border-left: 4px solid var(--color-primary, #16a34a);
}

.card-mesa.status-livre {
  border-left: 4px solid var(--color-text-muted, #94a3b8);
}

.mesa-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.mesa-identificacao {
  font-size: 1rem;
}

.badge-status-mesa {
  font-size: 0.7rem;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  text-transform: uppercase;
  font-weight: 600;
  background-color: #e2e8f0;
  color: #64748b;
}

.badge-status-mesa.status-ocupada {
  background-color: rgba(22, 163, 74, 0.15);
  color: #16a34a;
}

.mesa-lote-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cultura-nome {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text, #1e293b);
  font-size: 0.9rem;
}

.cultura-nome .material-symbols-outlined {
  font-size: 18px;
  color: var(--color-primary, #16a34a);
}

.lote-saldo {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-text-muted, #64748b);
}

.barra-ocupacao-wrapper {
  margin-top: 0.25rem;
}

.barra-fundo {
  width: 100%;
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.barra-preenchimento {
  height: 100%;
  background-color: var(--color-primary, #16a34a);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.texto-ocupacao {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-muted, #94a3b8);
  margin-top: 0.25rem;
  text-align: right;
}

.mesa-vazia {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;
  color: var(--color-text-muted, #94a3b8);
  text-align: center;
}

.icone-vazio {
  font-size: 28px;
  margin-bottom: 0.25rem;
}

.mesa-vazia p {
  margin: 0;
  font-size: 0.85rem;
}

.capacidade-vazia {
  font-size: 0.7rem;
}

.font-destaque {
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.btn-primario {
  background-color: var(--color-primary, #16a34a);
  color: #fff;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  font-weight: 500;
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
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>