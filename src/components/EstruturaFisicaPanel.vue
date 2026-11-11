<template>
  <div class="estrutura-panel">
    <div class="panel-header">
      <div class="tabs-estrutura">
        <button
          type="button"
          :class="['tab-btn', { active: abaInterna === 'estufas' }]"
          @click="abaInterna = 'estufas'"
        >
          <span class="material-symbols-outlined">warehouse</span>
          Estufas (Setores)
        </button>
        <button
          type="button"
          :class="['tab-btn', { active: abaInterna === 'mesas' }]"
          @click="abaInterna = 'mesas'"
        >
          <span class="material-symbols-outlined">table_restaurant</span>
          Mesas de Cultivo
        </button>
      </div>

      <button class="btn-novo" @click="abrirModalNovo">
        <span class="material-symbols-outlined">add</span>
        {{ abaInterna === 'estufas' ? 'Nova Estufa' : 'Nova Mesa' }}
      </button>
    </div>

    <!-- CARREGANDO -->
    <EstadoCarregamento v-if="carregando" mensagem="Carregando estrutura física..." compacto />

    <!-- ABA: ESTUFAS -->
    <div v-else-if="abaInterna === 'estufas'" class="conteudo-tab">
      <div v-if="estufas.length > 0" class="tabela-wrapper">
        <table class="tabela-estrutura">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome / Setor</th>
              <th>Tipo de Cultivo</th>
              <th>Capacidade Máxima</th>
              <th>Alocada nas Mesas</th>
              <th width="100">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="est in estufas" :key="est.id">
              <td class="font-mono">#{{ est.id }}</td>
              <td class="font-destaque">{{ est.nome_setor }}</td>
              <td>{{ est.tipo_cultivo || '-' }}</td>
              <td>{{ est.capacidade_maxima }}</td>
              <td>
                <span :class="{ 'texto-lotada': capacidadeAlocada(est.id) >= Number(est.capacidade_maxima) }">
                  {{ capacidadeAlocada(est.id) }} / {{ est.capacidade_maxima }}
                </span>
              </td>
              <td>
                <div class="acoes-btns">
                  <button class="btn-icon" title="Editar" @click="editarEstufa(est)">
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                  <button class="btn-icon btn-danger" title="Excluir" @click="excluirEstufa(est.id)">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <EstadoVazio v-else compacto texto="Nenhuma estufa cadastrada." />
    </div>

    <!-- ABA: MESAS -->
    <div v-else-if="abaInterna === 'mesas'" class="conteudo-tab">
      <div v-if="mesas.length > 0" class="tabela-wrapper">
        <table class="tabela-estrutura">
          <thead>
            <tr>
              <th>ID</th>
              <th>Identificação</th>
              <th>Estufa Vinculada</th>
              <th>Capacidade</th>
              <th>Status</th>
              <th>Observações</th>
              <th width="100">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in mesas" :key="m.id">
              <td class="font-mono">#{{ m.id }}</td>
              <td class="font-destaque">{{ m.identificacao }}</td>
              <td>{{ m.estufa_nome || obterNomeEstufa(m.estufa) }}</td>
              <td>{{ m.capacidade_maxima }}</td>
              <td>
                <span class="badge-status-mesa">{{ m.status_mesa || 'livre' }}</span>
              </td>
              <td class="col-obs">{{ m.observacoes || '-' }}</td>
              <td>
                <div class="acoes-btns">
                  <button class="btn-icon" title="Editar" @click="editarMesa(m)">
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                  <button class="btn-icon btn-danger" title="Excluir" @click="excluirMesa(m.id)">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <EstadoVazio v-else compacto texto="Nenhuma mesa cadastrada." />
    </div>

    <!-- MODAL ESTUFA -->
    <ModalFormulario v-if="modalEstufaAberto" :titulo="modoEdicaoEstufa ? 'Editar Estufa' : 'Nova Estufa'" estreito @fechar="modalEstufaAberto = false">
      <form @submit.prevent="salvarEstufa">
        <div class="form-group">
          <label for="est-setor">Nome do Setor / Estufa *</label>
          <input id="est-setor" v-model="formEstufa.nome_setor" type="text" required placeholder="Ex.: Estufa Hidropônica A" />
        </div>

        <div class="form-group">
          <label for="est-cultivo">Tipo de Cultivo</label>
          <input id="est-cultivo" v-model="formEstufa.tipo_cultivo" type="text" placeholder="Ex.: Hidroponia NFT, Substrato..." />
        </div>

        <div class="form-group">
          <label for="est-capacidade">Capacidade Máxima *</label>
          <input
            id="est-capacidade"
            v-model.number="formEstufa.capacidade_maxima"
            type="number"
            :min="Math.max(1, minimoCapacidadeEstufa)"
            required
          />
          <small v-if="modoEdicaoEstufa && minimoCapacidadeEstufa > 0" class="dica-capacidade">
            As mesas já somam {{ minimoCapacidadeEstufa }}; a capacidade não pode ser menor que isso.
          </small>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secundario" :disabled="salvando" @click="modalEstufaAberto = false">Cancelar</button>
          <button type="submit" class="btn-primario" :disabled="salvando">
            {{ salvando ? 'Salvando...' : 'Salvar Estufa' }}
          </button>
        </div>
      </form>
    </ModalFormulario>

    <!-- MODAL MESA -->
    <ModalFormulario v-if="modalMesaAberto" :titulo="modoEdicaoMesa ? 'Editar Mesa' : 'Nova Mesa de Cultivo'" estreito @fechar="modalMesaAberto = false">
      <form @submit.prevent="salvarMesa">
        <div class="form-group">
          <label for="mesa-ident">Identificação da Mesa *</label>
          <input id="mesa-ident" v-model="formMesa.identificacao" type="text" required placeholder="Ex.: MESA-01" />
        </div>

        <div class="form-group">
          <label for="mesa-estufa">Estufa Vinculada</label>
          <select id="mesa-estufa" v-model="formMesa.estufa">
            <option :value="null">Sem estufa vinculada (Livre/Geral)</option>
            <option v-for="e in estufas" :key="e.id" :value="e.id">
              {{ e.nome_setor }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="mesa-capacidade">Capacidade Máxima *</label>
            <input
              id="mesa-capacidade"
              v-model.number="formMesa.capacidade_maxima"
              type="number"
              min="1"
              :max="disponivelParaMesa ?? undefined"
              required
            />
            <small v-if="disponivelParaMesa !== null" :class="['dica-capacidade', { 'dica-erro': capacidadeMesaExcedida }]">
              Disponível na estufa: {{ disponivelParaMesa }}
            </small>
          </div>

          <div class="form-group">
            <label for="mesa-status">Status da Mesa</label>
            <input v-if="formMesa.lote_em_cultivo" id="mesa-status" type="text" value="Ocupada" disabled />
            <select v-else id="mesa-status" v-model="formMesa.status_mesa">
              <option value="livre">Livre</option>
              <option value="manutencao">Em manutenção</option>
            </select>
            <small v-if="formMesa.lote_em_cultivo" class="hint-capacidade">
              Ocupada pelo lote #{{ formMesa.lote_em_cultivo }}. Fica livre ao colher ou registrar a perda.
            </small>
          </div>
        </div>

        <div class="form-group">
          <label for="mesa-obs">Observações</label>
          <textarea id="mesa-obs" v-model="formMesa.observacoes" rows="2"></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secundario" :disabled="salvando" @click="modalMesaAberto = false">Cancelar</button>
          <button type="submit" class="btn-primario" :disabled="salvando">
            {{ salvando ? 'Salvando...' : 'Salvar Mesa' }}
          </button>
        </div>
      </form>
    </ModalFormulario>
  </div>
</template>

<script setup>
import ModalFormulario from '@/components/ModalFormulario.vue'
import EstadoVazio from '@/components/EstadoVazio.vue'
import EstadoCarregamento from '@/components/EstadoCarregamento.vue'
import { ref, computed, onMounted } from 'vue'
import estruturaService from '@/services/estruturaService'
import { mensagemDeErro } from '@/services/apiHelpers'
import { useToastStore } from '@/stores/toast'

const emit = defineEmits(['atualizado'])
const toastStore = useToastStore()

const abaInterna = ref('estufas')
const estufas = ref([])
const mesas = ref([])
const carregando = ref(false)
const salvando = ref(false)

const modalEstufaAberto = ref(false)
const modoEdicaoEstufa = ref(false)
const formEstufa = ref({ id: null, nome_setor: '', tipo_cultivo: '', capacidade_maxima: 100 })

const modalMesaAberto = ref(false)
const modoEdicaoMesa = ref(false)
const formMesa = ref({ id: null, identificacao: '', estufa: null, capacidade_maxima: 50, status_mesa: 'livre', observacoes: '' })

async function carregarDados() {
  carregando.value = true
  try {
    const [resEst, resMes] = await Promise.all([
      estruturaService.listarEstufas(),
      estruturaService.listarMesas(),
    ])
    estufas.value = resEst
    mesas.value = resMes
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Erro ao carregar estrutura física.'))
  } finally {
    carregando.value = false
  }
}

// Soma da capacidade das mesas já vinculadas à estufa (opcionalmente ignorando uma mesa, ao editar)
function capacidadeAlocada(estufaId, ignorarMesaId = null) {
  return mesas.value
    .filter((m) => m.estufa === estufaId && m.id !== ignorarMesaId)
    .reduce((total, m) => total + Number(m.capacidade_maxima || 0), 0)
}

// Edição de estufa: não pode ficar abaixo do que as mesas já ocupam
const minimoCapacidadeEstufa = computed(() =>
  formEstufa.value.id ? capacidadeAlocada(formEstufa.value.id) : 0,
)

// Modal de mesa: quanto ainda cabe na estufa selecionada (null = mesa sem estufa, sem limite)
const disponivelParaMesa = computed(() => {
  const estufaId = formMesa.value.estufa
  if (!estufaId) return null
  const estufa = estufas.value.find((e) => e.id === estufaId)
  if (!estufa) return null
  const livre = Number(estufa.capacidade_maxima) - capacidadeAlocada(estufaId, formMesa.value.id)
  return Math.max(livre, 0)
})

const capacidadeMesaExcedida = computed(
  () => disponivelParaMesa.value !== null && Number(formMesa.value.capacidade_maxima) > disponivelParaMesa.value,
)

function obterNomeEstufa(estufaId) {
  if (!estufaId) return 'Sem Estufa'
  const est = estufas.value.find((e) => e.id === estufaId)
  return est ? est.nome_setor : `Estufa #${estufaId}`
}

function abrirModalNovo() {
  if (abaInterna.value === 'estufas') {
    modoEdicaoEstufa.value = false
    formEstufa.value = { id: null, nome_setor: '', tipo_cultivo: '', capacidade_maxima: 100 }
    modalEstufaAberto.value = true
  } else {
    modoEdicaoMesa.value = false
    formMesa.value = { id: null, identificacao: '', estufa: estufas.value[0]?.id || null, capacidade_maxima: 50, status_mesa: 'livre', observacoes: '' }
    modalMesaAberto.value = true
  }
}

function editarEstufa(est) {
  modoEdicaoEstufa.value = true
  formEstufa.value = { ...est }
  modalEstufaAberto.value = true
}

function editarMesa(m) {
  modoEdicaoMesa.value = true
  // "ocupada" é calculado pelo back-end; no formulário a mesa ocupada segue como livre
  formMesa.value = { ...m, status_mesa: m.status_mesa === 'manutencao' ? 'manutencao' : 'livre' }
  modalMesaAberto.value = true
}

async function salvarEstufa() {
  if (modoEdicaoEstufa.value && Number(formEstufa.value.capacidade_maxima) < minimoCapacidadeEstufa.value) {
    toastStore.error(
      `As mesas desta estufa já somam ${minimoCapacidadeEstufa.value}. A capacidade não pode ser menor que isso.`,
    )
    return
  }
  salvando.value = true
  try {
    if (modoEdicaoEstufa.value && formEstufa.value.id) {
      await estruturaService.atualizarEstufa(formEstufa.value.id, formEstufa.value)
      toastStore.success('Estufa atualizada com sucesso!')
    } else {
      await estruturaService.criarEstufa(formEstufa.value)
      toastStore.success('Estufa criada com sucesso!')
    }
    modalEstufaAberto.value = false
    await carregarDados()
    emit('atualizado')
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Erro ao salvar estufa.'))
  } finally {
    salvando.value = false
  }
}

async function salvarMesa() {
  if (capacidadeMesaExcedida.value) {
    toastStore.error(
      `A capacidade da mesa (${formMesa.value.capacidade_maxima}) excede o espaço disponível na estufa (${disponivelParaMesa.value}).`,
    )
    return
  }
  salvando.value = true
  try {
    if (modoEdicaoMesa.value && formMesa.value.id) {
      await estruturaService.atualizarMesa(formMesa.value.id, formMesa.value)
      toastStore.success('Mesa atualizada com sucesso!')
    } else {
      await estruturaService.criarMesa(formMesa.value)
      toastStore.success('Mesa criada com sucesso!')
    }
    modalMesaAberto.value = false
    await carregarDados()
    emit('atualizado')
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Erro ao salvar mesa.'))
  } finally {
    salvando.value = false
  }
}

async function excluirEstufa(id) {
  if (!window.confirm(`Excluir esta estufa?`)) return
  try {
    await estruturaService.excluirEstufa(id)
    toastStore.success('Estufa excluída com sucesso!')
    await carregarDados()
    emit('atualizado')
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Erro ao excluir estufa.'))
  }
}

async function excluirMesa(id) {
  if (!window.confirm(`Excluir esta mesa?`)) return
  try {
    await estruturaService.excluirMesa(id)
    toastStore.success('Mesa excluída com sucesso!')
    await carregarDados()
    emit('atualizado')
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Erro ao excluir mesa.'))
  }
}

onMounted(() => {
  carregarDados()
})
</script>

<style scoped>
.estrutura-panel {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 1.25rem;
  margin-bottom: 2rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
}

.tabs-estrutura {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  border: none;
  background: none;
  border-radius: var(--radius-md, 8px);
  color: var(--color-text-muted, #64748b);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
}

.tab-btn.active {
  background-color: rgba(22, 163, 74, 0.1);
  color: var(--color-primary, #16a34a);
  font-weight: 600;
}

.btn-novo {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background-color: var(--color-primary, #16a34a);
  color: #fff;
  border: none;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-md, 8px);
  font-size: 0.8rem;
  cursor: pointer;
}

.tabela-wrapper {
  overflow-x: auto;
}

.tabela-estrutura {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;
}

.tabela-estrutura th {
  padding: 0.6rem 0.75rem;
  background-color: var(--color-background, #f8fafc);
  color: var(--color-text-muted, #64748b);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.tabela-estrutura td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.badge-status-mesa {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  border-radius: 9999px;
  background: rgba(100, 116, 139, 0.12);
  color: #64748b;
  font-size: 0.7rem;
  text-transform: uppercase;
}

.col-obs {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.acoes-btns {
  display: flex;
  gap: 0.25rem;
}

.btn-secundario {
  background: none;
  border: 1px solid var(--color-border, #e2e8f0);
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-primario {
  background: var(--color-primary, #16a34a);
  color: #fff;
  border: none;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  font-size: 0.8rem;
}

.dica-capacidade {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: var(--color-text-muted, #64748b);
}

.dica-erro,
.texto-lotada {
  color: var(--color-danger, #d32f2f);
  font-weight: 600;
}
</style>