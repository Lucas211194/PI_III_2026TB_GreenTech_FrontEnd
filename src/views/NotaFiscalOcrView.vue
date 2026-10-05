<template>
  <PageLayout title="Importar Nota Fiscal" subtitle="Processamento automático via OCR">
  <div class="ocr-view">
    <div class="ocr-content">
      <!-- ÁREA DE UPLOAD -->
      <section v-if="!dadosProcessados" class="upload-section">
        <div
          class="dropzone"
          :class="{ 'is-dragover': isDragOver, 'is-loading': carregando }"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="tratarDrop"
          @click="selecionarArquivo"
        >
          <input
            ref="inputArquivoRef"
            type="file"
            :accept="acceptFormatos"
            style="display: none"
            @change="tratarSelecaoArquivo"
          />

          <div v-if="!carregando" class="dropzone-placeholder">
            <span class="material-symbols-outlined upload-icon">cloud_upload</span>
            <h3>Arraste o arquivo aqui ou clique para selecionar</h3>
            <p class="formato-info">
              {{ formatoInfoTexto }}
            </p>
          </div>

          <div v-else class="loading-state">
            <div class="spinner"></div>
            <p>Processando documento via OCR...</p>
            <span class="subtext">Identificando produtos e valores</span>
          </div>
        </div>
      </section>

      <!-- RESULTADO DO PROCESSAMENTO -->
      <section v-else class="resultado-section">
        <div class="card-metadados">
          <div class="meta-item">
            <span class="label">Número da NF</span>
            <input v-model="dadosNota.numero" type="text" class="input-inline" />
          </div>
          <div class="meta-item">
            <span class="label">Data de Emissão</span>
            <input v-model="dadosNota.dataEmissao" type="date" class="input-inline" />
          </div>
          <div class="meta-item full-width">
            <span class="label">Fornecedor / Emitente</span>
            <input v-model="dadosNota.fornecedor" type="text" class="input-inline" />
          </div>
        </div>

        <div class="tabela-itens-wrapper">
          <div class="table-header-actions">
            <h3>Itens Identificados</h3>
            <button class="btn-secundario" @click="adicionarItemManual">
              <span class="material-symbols-outlined">add</span> Adicionar Item
            </button>
          </div>

          <table class="tabela-itens">
            <thead>
              <tr>
                <th>Descrição do Item</th>
                <th width="150">Destino</th>
                <th width="100">Qtd</th>
                <th width="80">Unidade</th>
                <th width="120">Valor Total</th>
                <th width="60">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in dadosNota.itens" :key="index">
                <td>
                  <input v-model="item.descricao" type="text" class="input-tabela" />
                </td>
                <td>
                  <select v-model="item.tipo" class="select-tabela">
                    <option value="insumo">Insumo</option>
                    <option value="cultura">Cultura</option>
                  </select>
                </td>
                <td>
                  <input
                    v-model.number="item.quantidade"
                    type="number"
                    step="0.01"
                    class="input-tabela"
                  />
                </td>
                <td>
                  <input v-model="item.unidade" type="text" class="input-tabela" />
                </td>
                <td>
                  <input
                    v-model.number="item.valor"
                    type="number"
                    step="0.01"
                    class="input-tabela"
                  />
                </td>
                <td>
                  <button
                    class="btn-icon"
                    title="Remover Item"
                    @click="removerItem(index)"
                  >
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </td>
              </tr>
              <tr v-if="dadosNota.itens.length === 0">
                <td colspan="6" class="empty-state">
                  Nenhum item detectado. Adicione manualmente acima.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="acoes-rodape">
          <button class="btn-perigo-outline" :disabled="salvando" @click="descartarProcessamento">
            Descartar
          </button>
          <button
            class="btn-primario"
            :disabled="salvando || dadosNota.itens.length === 0"
            @click="abrirConfirmacao"
          >
            <span v-if="!salvando" class="material-symbols-outlined">check_circle</span>
            <span v-else class="spinner-sm"></span>
            {{ salvando ? 'Processando Lote...' : 'Salvar no Estoque' }}
          </button>
        </div>
      </section>
    </div>

    <!-- MODAL DE CONFIRMAÇÃO DE DESTINO -->
    <div v-if="exibirModalConfirmacao" class="modal-overlay">
      <div class="modal-card">
        <h3>Confirmar Entrada em Massa</h3>
        <p>
          Os itens identificados serão inseridos no estoque de acordo com o destino configurado (Insumos ou Culturas).
        </p>
        <div class="resumo-confirmacao">
          <div>
            Total de Itens: <strong>{{ dadosNota.itens.length }}</strong>
          </div>
          <div>
            Valor Total: <strong>{{ formatarMoeda(calcularValorTotalNota()) }}</strong>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secundario" :disabled="salvando" @click="exibirModalConfirmacao = false">
            Voltar e Revisar
          </button>
          <button class="btn-primario" :disabled="salvando" @click="confirmarGravacaoEstoque">
            Confirmar e Gravar
          </button>
        </div>
      </div>
    </div>
  </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import apiClient from '@/services/api'
import { mensagemDeErro } from '@/services/apiHelpers'
import { FEATURES } from '@/config/features'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const isDragOver = ref(false)
const carregando = ref(false)
const salvando = ref(false)
const dadosProcessados = ref(false)
const inputArquivoRef = ref(null)
const exibirModalConfirmacao = ref(false)

const acceptFormatos = computed(() => {
  return FEATURES.ocrImagem ? '.pdf,image/*' : '.pdf'
})

const formatoInfoTexto = computed(() => {
  return FEATURES.ocrImagem
    ? 'Formatos aceitos: PDF ou imagens (PNG, JPG)'
    : 'Envie a NF-e em formato PDF com texto selecionável'
})

const dadosNota = ref({
  numero: '',
  dataEmissao: '',
  fornecedor: '',
  itens: []
})

function selecionarArquivo() {
  if (carregando.value) return
  inputArquivoRef.value?.click()
}

function tratarDrop(e) {
  isDragOver.value = false
  const arquivos = e.dataTransfer?.files
  if (arquivos && arquivos.length > 0) {
    processarArquivo(arquivos[0])
  }
}

function tratarSelecaoArquivo(e) {
  const arquivos = e.target.files
  if (arquivos && arquivos.length > 0) {
    processarArquivo(arquivos[0])
  }
}

async function processarArquivo(arquivo) {
  if (!FEATURES.ocrImagem && arquivo.type !== 'application/pdf') {
    toastStore.warning('O servidor aceita apenas arquivos PDF com texto selecionável.')
    return
  }

  carregando.value = true

  const formData = new FormData()
  formData.append('documento', arquivo)

  try {
    const res = await apiClient.post('/estoque/ocr-nota-fiscal/', formData)
    const dados = res.data

    dadosNota.value = {
      numero: dados.numero || '',
      dataEmissao: dados.dataEmissao || '',
      fornecedor: dados.fornecedor || '',
      itens: (dados.itens || []).map((item) => ({
        descricao: item.descricao || '',
        tipo: item.tipo || 'insumo',
        quantidade: item.quantidade || 1,
        unidade: item.unidade || 'UN',
        valor: item.valor || 0
      }))
    }

    dadosProcessados.value = true
    toastStore.success('Nota fiscal processada com sucesso via OCR.')
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Falha ao processar a nota fiscal no servidor.'))
    dadosProcessados.value = false
  } finally {
    carregando.value = false
    if (inputArquivoRef.value) {
      inputArquivoRef.value.value = ''
    }
  }
}

function adicionarItemManual() {
  dadosNota.value.itens.push({
    descricao: '',
    tipo: 'insumo',
    quantidade: 1,
    unidade: 'UN',
    valor: 0
  })
}

function removerItem(index) {
  dadosNota.value.itens.splice(index, 1)
}

function descartarProcessamento() {
  dadosProcessados.value = false
  dadosNota.value = {
    numero: '',
    dataEmissao: '',
    fornecedor: '',
    itens: []
  }
}

function validarDadosNota() {
  if (!dadosNota.value.numero || !dadosNota.value.fornecedor) {
    toastStore.warning('Preencha o número da nota e o fornecedor.')
    return false
  }

  for (const item of dadosNota.value.itens) {
    if (!item.descricao.trim()) {
      toastStore.warning('Todos os itens precisam de uma descrição.')
      return false
    }
    if (item.quantidade <= 0) {
      toastStore.warning('A quantidade dos itens deve ser maior que zero.')
      return false
    }
  }

  return true
}

function abrirConfirmacao() {
  if (validarDadosNota()) {
    exibirModalConfirmacao.value = true
  }
}

function calcularValorTotalNota() {
  return dadosNota.value.itens.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
}

function formatarMoeda(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

async function confirmarGravacaoEstoque() {
  salvando.value = true
  try {
    const payload = {
      numero: dadosNota.value.numero,
      dataEmissao: dadosNota.value.dataEmissao,
      fornecedor: dadosNota.value.fornecedor,
      itens: dadosNota.value.itens.map((i) => ({
        descricao: i.descricao,
        tipo: i.tipo,
        quantidade: i.quantidade,
        unidade: i.unidade,
        valor: i.valor
      }))
    }

    const res = await apiClient.post('/estoque/confirmar-lote-nf/', payload)
    toastStore.success(res.data?.mensagem || 'Itens gravados com sucesso no estoque!')
    exibirModalConfirmacao.value = false
    descartarProcessamento()
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Erro ao gravar os itens no estoque.'))
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
.ocr-view {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.upload-section {
  margin-top: 2rem;
}

.dropzone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: 4rem 2rem;
  text-align: center;
  background-color: var(--color-surface);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
}

.dropzone:hover,
.dropzone.is-dragover {
  border-color: var(--color-primary);
  background-color: rgba(var(--color-primary-rgb, 46, 125, 50), 0.04);
}

.upload-icon {
  font-size: 56px;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.formato-info {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-top: 0.5rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-sm {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.card-metadados {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  background-color: var(--color-surface);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  margin-bottom: 1.5rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item.full-width {
  grid-column: span 2;
}

.label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.input-inline {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
}

.tabela-itens-wrapper {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.table-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tabela-itens {
  width: 100%;
  border-collapse: collapse;
}

.tabela-itens th {
  text-align: left;
  padding: 0.75rem 0.5rem;
  border-bottom: 2px solid var(--color-border);
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.tabela-itens td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.input-tabela,
.select-tabela {
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}

.btn-icon {
  background: none;
  border: none;
  color: var(--color-danger, #d32f2f);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
}

.acoes-rodape {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-primario {
  background-color: var(--color-primary);
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secundario {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-perigo-outline {
  background: none;
  border: 1px solid var(--color-danger, #d32f2f);
  color: var(--color-danger, #d32f2f);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  cursor: pointer;
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
  padding: 2rem;
  width: 100%;
  max-width: 450px;
}

.resumo-confirmacao {
  background-color: var(--color-background);
  padding: 1rem;
  border-radius: var(--radius-sm);
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
</style>