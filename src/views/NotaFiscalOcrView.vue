<template>
  <PageLayout
    title="Importação de NF-e via OCR"
    subtitle="Faça o upload do documento fiscal para extração inteligente de insumos."
  >
    <div class="ocr-container">
      <div class="ocr-content-grid">
        <!-- Área de Upload (Dropzone Animada) -->
        <div class="upload-panel">
          <div
            class="drop-zone"
            :class="{ 'drag-active': isDragging, processing: processando }"
            @dragenter.prevent="isDragging = true"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onFileDrop"
            @click="!processando && $refs.fileInput.click()"
            role="button"
            tabindex="0"
            aria-label="Área de upload de nota fiscal"
            @keydown.enter="!processando && $refs.fileInput.click()"
          >
            <!-- Efeito de Scanner Overlay -->
            <div v-if="processando" class="scanner-overlay"></div>

            <input
              type="file"
              ref="fileInput"
              class="hidden-input"
              accept="image/*,.pdf"
              @change="onFileSelected"
              :disabled="processando"
            />

            <span v-if="!processando" class="material-symbols-outlined upload-icon"
              >upload_file</span
            >
            <span v-else class="material-symbols-outlined upload-icon pulse">document_scanner</span>

            <p v-if="!processando">Arraste o arquivo ou <strong>clique aqui</strong></p>
            <p v-else><strong>Analisando documento...</strong></p>

            <span v-if="!processando" class="file-format-hint"
              >Formatos suportados: PNG, JPG, PDF</span
            >
          </div>

          <div v-if="arquivoSelecionado && !processando" class="file-summary slide-down">
            <div class="file-info">
              <span class="material-symbols-outlined">description</span>
              <span class="file-name">{{ arquivoSelecionado.name }}</span>
            </div>
            <button
              type="button"
              class="btn-processar"
              @click="processarOcr"
              :disabled="processando"
            >
              Executar OCR
            </button>
          </div>
        </div>

        <!-- Área de Validação dos Dados Extraídos -->
        <div class="preview-panel">
          <h3 class="panel-title">
            <span class="material-symbols-outlined">fact_check</span> Dados Reconhecidos
          </h3>

          <div v-if="!dadosNota" class="empty-state">
            <span class="material-symbols-outlined empty-icon">receipt_long</span>
            <p>Nenhum documento processado.<br />Carregue uma nota para revisar os insumos.</p>
          </div>

          <form v-else @submit.prevent="confirmarEntradaEstoque" class="form-revisao fade-in">
            <div class="form-row">
              <div class="form-field">
                <label for="nf-numero"
                  >Número da Nota <span class="campo-obrigatorio">*</span></label
                >
                <input
                  id="nf-numero"
                  v-model="dadosNota.numero"
                  type="text"
                  required
                  :disabled="salvando"
                />
              </div>
              <div class="form-field">
                <label for="nf-data"
                  >Data de Emissão <span class="campo-obrigatorio">*</span></label
                >
                <input
                  id="nf-data"
                  v-model="dadosNota.dataEmissao"
                  type="date"
                  required
                  :disabled="salvando"
                />
              </div>
            </div>

            <div class="form-field">
              <label for="nf-fornecedor">Fornecedor <span class="campo-obrigatorio">*</span></label>
              <input
                id="nf-fornecedor"
                v-model="dadosNota.fornecedor"
                type="text"
                required
                :disabled="salvando"
              />
            </div>

            <h4 class="section-subtitle">Itens Identificados</h4>
            <p class="campos-obrigatorios-hint">
              <span class="material-symbols-outlined">info</span>
              Todos os campos, incluindo o <strong>Tipo</strong> de cada item, são obrigatórios para
              confirmar a entrada em estoque.
            </p>

            <!-- Tabela que vira Cards no Mobile -->
            <div class="table-responsive-wrapper">
              <table class="itens-table">
                <thead>
                  <tr>
                    <th>Descrição <span class="campo-obrigatorio">*</span></th>
                    <th width="100">Qtd <span class="campo-obrigatorio">*</span></th>
                    <th width="100">Unid <span class="campo-obrigatorio">*</span></th>
                    <th width="120">Valor (R$) <span class="campo-obrigatorio">*</span></th>
                    <th width="150">Tipo <span class="campo-obrigatorio">*</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in dadosNota.itens" :key="index">
                    <td data-label="Descrição">
                      <input v-model="item.descricao" type="text" required :disabled="salvando" />
                    </td>
                    <td data-label="Quantidade">
                      <input
                        v-model.number="item.quantidade"
                        type="number"
                        step="0.1"
                        min="0.01"
                        required
                        :disabled="salvando"
                      />
                    </td>
                    <td data-label="Unidade">
                      <input v-model="item.unidade" type="text" required :disabled="salvando" />
                    </td>
                    <td data-label="Valor (R$)">
                      <input
                        v-model.number="item.valor"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        :disabled="salvando"
                      />
                    </td>
                    <td data-label="Tipo">
                      <select
                        v-model="item.tipo"
                        class="select-tipo"
                        :class="{ 'select-tipo--vazio': !item.tipo }"
                        required
                        :disabled="salvando"
                      >
                        <option value="" disabled>Selecione...</option>
                        <option value="insumo">Insumo</option>
                        <option value="cultura">Cultura</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="actions-area">
              <button type="button" class="btn-outline" @click="cancelarOcr" :disabled="salvando">
                Descartar
              </button>
              <button type="submit" class="btn-confirmar" :disabled="salvando">
                <span v-if="salvando" class="material-symbols-outlined spinning">autorenew</span>
                {{ salvando ? 'Integrando...' : 'Confirmar e Atualizar Estoque' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/components/PageLayout.vue'
import { apiClient } from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { ref } from 'vue'

const toastStore = useToastStore()

const fileInput = ref(null)
const arquivoSelecionado = ref(null)
const isDragging = ref(false)
const processando = ref(false)
const salvando = ref(false)
const dadosNota = ref(null)

function onFileSelected(event) {
  const file = event.target.files?.[0]
  if (file) arquivoSelecionado.value = file
}

function onFileDrop(event) {
  isDragging.value = false
  const file = event.dataTransfer.files?.[0]
  if (file) arquivoSelecionado.value = file
}

function cancelarOcr() {
  dadosNota.value = null
  arquivoSelecionado.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function processarOcr() {
  if (!arquivoSelecionado.value) return
  processando.value = true

  const formData = new FormData()
  formData.append('documento', arquivoSelecionado.value)

  try {
    const resultado = await apiClient('/estoque/ocr-nota-fiscal/', {
      method: 'POST',
      body: formData,
    })
    // O OCR não classifica os itens; o usuário escolhe 'insumo' ou 'cultura' aqui na revisão.
    resultado.itens = (resultado.itens || []).map((item) => ({ tipo: '', ...item }))
    dadosNota.value = resultado
    toastStore.success('Dados extraídos com sucesso!')
  } catch (err) {
    toastStore.info('Modo demonstração: aplicando dados simulados do OCR.')

    // Timeout simulando o tempo de processamento visual do "Scanner"
    setTimeout(() => {
      dadosNota.value = {
        numero: '000.142.891',
        dataEmissao: '2026-09-01',
        fornecedor: 'AgroQuímica Soluções Rurais Ltda',
        itens: [
          {
            descricao: 'Nitrato de Cálcio',
            quantidade: 50,
            unidade: 'kg',
            valor: 450.0,
            tipo: 'insumo',
          },
          {
            descricao: 'Sulfato de Potássio',
            quantidade: 25,
            unidade: 'kg',
            valor: 310.5,
            tipo: 'insumo',
          },
        ],
      }
      processando.value = false
    }, 2000)
    return
  }

  processando.value = false
}

const TIPOS_VALIDOS = ['insumo', 'cultura']

function validarDadosNota() {
  const dados = dadosNota.value
  if (!dados.numero?.trim()) {
    toastStore.error('Informe o número da nota.')
    return false
  }
  if (!dados.dataEmissao) {
    toastStore.error('Informe a data de emissão.')
    return false
  }
  if (!dados.fornecedor?.trim()) {
    toastStore.error('Informe o fornecedor.')
    return false
  }
  if (!dados.itens?.length) {
    toastStore.error('Adicione ao menos um item para confirmar a entrada em estoque.')
    return false
  }

  for (let i = 0; i < dados.itens.length; i++) {
    const item = dados.itens[i]
    const numeroLinha = i + 1

    if (!item.descricao?.trim()) {
      toastStore.error(`Item ${numeroLinha}: informe a descrição.`)
      return false
    }
    if (item.quantidade === null || item.quantidade === '' || Number(item.quantidade) <= 0) {
      toastStore.error(`Item ${numeroLinha}: informe uma quantidade maior que zero.`)
      return false
    }
    if (!item.unidade?.trim()) {
      toastStore.error(`Item ${numeroLinha}: informe a unidade.`)
      return false
    }
    if (item.valor === null || item.valor === '' || Number(item.valor) < 0) {
      toastStore.error(`Item ${numeroLinha}: informe o valor.`)
      return false
    }
    if (!TIPOS_VALIDOS.includes(item.tipo)) {
      toastStore.error(
        `Item ${numeroLinha} (${item.descricao}): selecione o Tipo — Insumo ou Cultura.`,
      )
      return false
    }
  }

  return true
}

async function confirmarEntradaEstoque() {
  if (salvando.value) return
  if (!validarDadosNota()) return

  salvando.value = true
  try {
    await apiClient('/estoque/confirmar-lote-nf/', {
      method: 'POST',
      body: JSON.stringify(dadosNota.value),
    })
    toastStore.success('Estoque atualizado com sucesso!')
    cancelarOcr()
  } catch (err) {
    toastStore.error(err?.message || 'Não foi possível confirmar a entrada em estoque.')
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
.ocr-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.ocr-content-grid {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 2rem;
  align-items: start;
}
.upload-panel,
.preview-panel {
  background: var(--cor-fundo-card, #ffffff);
  border-radius: var(--radius-lg, 12px);
  padding: 1.5rem;
  box-shadow: var(--sombra-card, 0 4px 6px rgba(0, 0, 0, 0.05));
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #263238;
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
}
.section-subtitle {
  color: #455a64;
  margin: 1.5rem 0 1rem 0;
  font-size: 1.1rem;
}

/* Dropzone Animada */
.drop-zone {
  position: relative;
  overflow: hidden;
  border: 2px dashed var(--cor-verde-primaria, #2e7d32);
  border-radius: var(--radius-md, 8px);
  padding: 4rem 1.5rem;
  text-align: center;
  cursor: pointer;
  background-color: var(--cor-fundo-item, #fafafa);
  transition: all 0.3s ease;
}
.drop-zone:hover,
.drop-zone:focus-visible {
  background-color: #e8f5e9;
  outline: none;
  border-color: #1b5e20;
}
.drop-zone.drag-active {
  background-color: #e8f5e9;
  border-color: #1b5e20;
  transform: scale(1.02);
}
.drop-zone.processing {
  cursor: wait;
  border-style: solid;
  border-color: #81c784;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 10px;
  background: rgba(76, 175, 80, 0.5);
  box-shadow: 0 0 15px 5px rgba(76, 175, 80, 0.4);
  animation: scan 1.5s infinite linear alternate;
}
@keyframes scan {
  0% {
    top: 0;
  }
  100% {
    top: 100%;
  }
}

.upload-icon {
  font-size: 3rem;
  color: #4caf50;
  margin-bottom: 0.5rem;
  transition: transform 0.3s;
}
.pulse {
  animation: pulse 1s infinite alternate;
  color: #1b5e20;
}
@keyframes pulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.1);
  }
}

.file-format-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--cor-texto-secundario, #90a4ae);
  margin-top: 0.5rem;
}
.hidden-input {
  display: none;
}

.file-summary {
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f4f6f8;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}
.file-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
}
.file-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #37474f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

/* Botões */
.btn-processar,
.btn-confirmar {
  background-color: var(--cor-verde-primaria, #2e7d32);
  color: #fff;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-md, 6px);
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}
.btn-processar:hover:not(:disabled),
.btn-confirmar:hover:not(:disabled) {
  background-color: #1b5e20;
}
.btn-processar:disabled,
.btn-confirmar:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}
.btn-outline {
  background: transparent;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
  padding: 0.65rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}
.btn-outline:hover:not(:disabled) {
  background: #ffebee;
}
.actions-area {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.empty-state {
  padding: 4rem 1rem;
  text-align: center;
  color: #90a4ae;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.empty-icon {
  font-size: 4rem;
  opacity: 0.3;
}

/* Formulário e Tabelas */
.form-row {
  display: flex;
  gap: 1rem;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
  flex: 1;
}
.form-field label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #455a64;
}
.form-field input,
.itens-table input,
.itens-table select {
  padding: 0.6rem;
  border: 1px solid var(--cor-borda, #cfd8dc);
  border-radius: var(--radius-sm, 4px);
  font-size: 0.95rem;
  width: 100%;
  box-sizing: border-box;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  background-color: #fff;
  color: #37474f;
  font-family: inherit;
}
.form-field input:focus,
.itens-table input:focus,
.itens-table select:focus {
  outline: none;
  border-color: var(--cor-verde-primaria, #2e7d32);
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.12);
}
.form-field input:disabled,
.itens-table input:disabled,
.itens-table select:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

/* Select customizado (remove aparência nativa do SO, alinhado ao resto do formulário) */
.itens-table select.select-tipo {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;
  padding-right: 2rem;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'><path fill='%23546e7a' d='M7 10l5 5 5-5z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.1rem;
}
.itens-table select.select-tipo:disabled {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'><path fill='%23bdbdbd' d='M7 10l5 5 5-5z'/></svg>");
}
/* Reforça visualmente que o Tipo ainda não foi escolhido (obrigatório) */
.itens-table select.select-tipo--vazio {
  border-color: #ef9a9a;
  color: #90a4ae;
}
.itens-table select.select-tipo--vazio:focus {
  border-color: var(--cor-verde-primaria, #2e7d32);
  color: #37474f;
}

.campo-obrigatorio {
  color: #d32f2f;
  font-weight: 700;
}
.campos-obrigatorios-hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: #546e7a;
  background: #f4f6f8;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  margin: 0.25rem 0 1rem 0;
}
.campos-obrigatorios-hint .material-symbols-outlined {
  font-size: 1.1rem;
  color: #546e7a;
}

.itens-table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
}
.itens-table th {
  font-size: 0.8rem;
  color: #546e7a;
  text-transform: uppercase;
  white-space: nowrap;
  padding: 0 0.6rem 0.6rem 0.25rem;
  border-bottom: 2px solid #eee;
  text-align: left;
}
.itens-table td {
  padding: 0.5rem 0.6rem 0.5rem 0.25rem;
  border-bottom: 1px solid var(--cor-borda, #eee);
}
.table-responsive-wrapper {
  width: 100%;
  overflow-x: auto;
}

/* Animações e Utilidades */
.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
.fade-in {
  animation: fadeIn 0.3s ease;
}
.slide-down {
  animation: slideDown 0.3s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsividade: Tabelas viram Cards no Mobile */
@media (max-width: 900px) {
  .ocr-content-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .itens-table,
  .itens-table tbody,
  .itens-table tr,
  .itens-table td {
    display: block;
    width: 100%;
  }
  .itens-table thead {
    display: none;
  } /* Esconde o cabeçalho original */
  .itens-table tr {
    margin-bottom: 1.5rem;
    border: 1px solid #cfd8dc;
    border-radius: 8px;
    padding: 1rem;
    background: #f8fafc;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  }
  .itens-table td {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    border-bottom: none;
    padding: 0.5rem 0;
  }
  .itens-table td::before {
    content: attr(data-label);
    font-size: 0.8rem;
    font-weight: 600;
    color: #546e7a;
    text-transform: uppercase;
  }
  .actions-area {
    flex-direction: column;
  }
  .btn-outline,
  .btn-confirmar {
    width: 100%;
    justify-content: center;
  }
}
</style>
