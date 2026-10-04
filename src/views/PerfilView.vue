<template>
  <div class="perfil-view">
    <DashHeader
      title="Meu Perfil"
      subtitle="Gerenciamento de informações da conta e credenciais de acesso"
    />

    <div class="perfil-container">
      <!-- CARREGANDO -->
      <div v-if="carregando" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando dados do perfil...</p>
      </div>

      <!-- ERRO -->
      <ErroCarregamento
        v-else-if="erroCarregamento"
        :mensagem="erroCarregamento"
        @tentar-novamente="carregarDadosPerfil"
      />

      <div v-else class="perfil-grid">
        <!-- CARD RESUMO E PAPEL -->
        <div class="card-resumo">
          <div class="avatar-circulo">
            {{ iniciaisNome }}
          </div>
          <h3 class="nome-destaque">{{ perfil.nome_completo || perfil.usuario || 'Usuário' }}</h3>
          <span class="usuario-tag font-mono">@{{ perfil.usuario }}</span>

          <div class="badges-papeis">
            <span v-if="perfil.is_admin" class="badge-papel papel-admin">
              <span class="material-symbols-outlined">shield</span> Administrador
            </span>
            <span v-if="perfil.is_gerente" class="badge-papel papel-gerente">
              <span class="material-symbols-outlined">badge</span> Gerente
            </span>
            <span v-if="!perfil.is_admin && !perfil.is_gerente" class="badge-papel papel-operador">
              <span class="material-symbols-outlined">person</span> Operador
            </span>
          </div>

          <div class="divisor"></div>

          <button class="btn-seguranca" @click="abrirModalSenha">
            <span class="material-symbols-outlined">lock_reset</span>
            Alterar Senha
          </button>
        </div>

        <!-- FORMULÁRIO DE DADOS PESSOAIS -->
        <div class="card-detalhes">
          <div class="detalhes-header">
            <div>
              <h3>Dados Cadastrais</h3>
              <p class="subtexto">Campos permitidos para atualização no sistema</p>
            </div>
            <button
              v-if="!modoEdicao"
              class="btn-editar"
              @click="iniciarEdicao"
            >
              <span class="material-symbols-outlined">edit</span>
              Editar Dados
            </button>
          </div>

          <form @submit.prevent="salvarDadosPessoais">
            <div class="form-grid">
              <!-- ID (APENAS LEITURA) -->
              <div class="form-group">
                <label>Identificador (ID)</label>
                <input
                  type="text"
                  :value="`#${perfil.id || '-'}`"
                  disabled
                  class="input-desabilitado font-mono"
                />
              </div>

              <!-- USUÁRIO / USERNAME (APENAS LEITURA) -->
              <div class="form-group">
                <label>Nome de Usuário (Login)</label>
                <input
                  type="text"
                  :value="perfil.usuario || '-'"
                  disabled
                  class="input-desabilitado font-mono"
                />
              </div>

              <!-- NOME COMPLETO (EDITÁVEL) -->
              <div class="form-group col-span-2">
                <label for="perf-nome">Nome Completo *</label>
                <input
                  id="perf-nome"
                  v-model="formEdicao.nome_completo"
                  type="text"
                  :disabled="!modoEdicao || salvando"
                  required
                />
              </div>

              <!-- CPF (EDITÁVEL) -->
              <div class="form-group">
                <label for="perf-cpf">CPF</label>
                <input
                  id="perf-cpf"
                  v-model="formEdicao.cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  :disabled="!modoEdicao || salvando"
                />
              </div>

              <!-- TELEFONE (EDITÁVEL) -->
              <div class="form-group">
                <label for="perf-telefone">Telefone</label>
                <input
                  id="perf-telefone"
                  v-model="formEdicao.telefone"
                  type="text"
                  placeholder="(00) 00000-0000"
                  :disabled="!modoEdicao || salvando"
                />
              </div>
            </div>

            <!-- AÇÕES DE SALVAMENTO -->
            <div v-if="modoEdicao" class="acoes-edicao">
              <button
                type="button"
                class="btn-secundario"
                :disabled="salvando"
                @click="cancelarEdicao"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primario"
                :disabled="salvando"
              >
                {{ salvando ? 'Salvando...' : 'Salvar Alterações' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL DE ALTERAÇÃO DE SENHA -->
    <div
      v-if="modalSenhaAberto"
      class="modal-overlay"
      @click.self="modalSenhaAberto = false"
    >
      <div class="modal-card">
        <div class="modal-header">
          <h3>Alterar Minha Senha</h3>
          <button class="btn-close" @click="modalSenhaAberto = false">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form @submit.prevent="submeterAlteracaoSenha">
          <div class="form-group">
            <label for="senha-atual">Senha Atual *</label>
            <input
              id="senha-atual"
              v-model="formSenha.senha_atual"
              type="password"
              required
              autocomplete="current-password"
            />
          </div>

          <div class="form-group">
            <label for="nova-senha">Nova Senha *</label>
            <input
              id="nova-senha"
              v-model="formSenha.nova_senha"
              type="password"
              required
              autocomplete="new-password"
            />
          </div>

          <div class="form-group">
            <label for="conf-senha">Confirmar Nova Senha *</label>
            <input
              id="conf-senha"
              v-model="formSenha.confirmar_senha"
              type="password"
              required
              autocomplete="new-password"
            />
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="btn-secundario"
              :disabled="salvandoSenha"
              @click="modalSenhaAberto = false"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primario"
              :disabled="salvandoSenha"
            >
              {{ salvandoSenha ? 'Alterando...' : 'Atualizar Senha' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DashHeader from '@/components/DashHeader.vue'
import ErroCarregamento from '@/components/ErroCarregamento.vue'
import funcionarioService from '@/services/funcionarioService'
import { mensagemDeErro } from '@/services/apiHelpers'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const authStore = useAuthStore()
const toastStore = useToastStore()

const carregando = ref(false)
const salvando = ref(false)
const salvandoSenha = ref(false)
const erroCarregamento = ref('')
const modoEdicao = ref(false)
const modalSenhaAberto = ref(false)

const perfil = ref({
  id: null,
  usuario: '',
  nome_completo: '',
  cpf: '',
  telefone: '',
  is_gerente: false,
  is_admin: false,
})

const formEdicao = ref({
  nome_completo: '',
  cpf: '',
  telefone: '',
})

const formSenha = ref({
  senha_atual: '',
  nova_senha: '',
  confirmar_senha: '',
})

const iniciaisNome = computed(() => {
  const nome = (perfil.value.nome_completo || perfil.value.usuario || '').trim()
  if (!nome) return 'GT'
  const partes = nome.split(' ')
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
})

async function carregarDadosPerfil() {
  carregando.value = true
  erroCarregamento.value = ''

  try {
    const dados = await funcionarioService.obterPerfil()
    perfil.value = { ...dados }
    formEdicao.value = {
      nome_completo: dados.nome_completo || '',
      cpf: dados.cpf || '',
      telefone: dados.telefone || '',
    }
  } catch (err) {
    erroCarregamento.value = mensagemDeErro(err, 'Não foi possível carregar os dados do seu perfil.')
    toastStore.error(erroCarregamento.value)
  } finally {
    carregando.value = false
  }
}

function iniciarEdicao() {
  formEdicao.value = {
    nome_completo: perfil.value.nome_completo || '',
    cpf: perfil.value.cpf || '',
    telefone: perfil.value.telefone || '',
  }
  modoEdicao.value = true
}

function cancelarEdicao() {
  modoEdicao.value = false
}

async function salvarDadosPessoais() {
  salvando.value = true
  try {
    const dadosAtualizados = await funcionarioService.atualizarPerfil({
      nome_completo: formEdicao.value.nome_completo,
      cpf: formEdicao.value.cpf || null,
      telefone: formEdicao.value.telefone || null,
    })

    perfil.value = {
      ...perfil.value,
      ...dadosAtualizados,
    }

    // Mantém o authStore sincronizado
    if (authStore.usuario) {
      authStore.usuario.nome_completo = perfil.value.nome_completo
    }

    toastStore.success('Dados cadastrais atualizados com sucesso!')
    modoEdicao.value = false
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Erro ao salvar alterações no perfil.'))
  } finally {
    salvando.value = false
  }
}

function abrirModalSenha() {
  formSenha.value = {
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: '',
  }
  modalSenhaAberto.value = true
}

async function submeterAlteracaoSenha() {
  if (formSenha.value.nova_senha !== formSenha.value.confirmar_senha) {
    toastStore.warning('A confirmação da senha não confere com a nova senha digitada.')
    return
  }

  salvandoSenha.value = true
  try {
    await funcionarioService.alterarSenha({
      senha_atual: formSenha.value.senha_atual,
      nova_senha: formSenha.value.nova_senha,
      confirmar_senha: formSenha.value.confirmar_senha,
    })

    toastStore.success('Senha atualizada com sucesso!')
    modalSenhaAberto.value = false
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Falha ao alterar senha no servidor.'))
  } finally {
    salvandoSenha.value = false
  }
}

onMounted(() => {
  carregarDadosPerfil()
})
</script>

<style scoped>
.perfil-view {
  padding: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
}

.perfil-container {
  margin-top: 1.5rem;
}

.perfil-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
}

@media (max-width: 860px) {
  .perfil-grid {
    grid-template-columns: 1fr;
  }
}

.card-resumo,
.card-detalhes {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 1.5rem;
}

.card-resumo {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.avatar-circulo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-primary, #16a34a);
  color: #fff;
  font-size: 1.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.nome-destaque {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-text, #1e293b);
}

.usuario-tag {
  color: var(--color-text-muted, #64748b);
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.badges-papeis {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: center;
}

.badge-papel {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-papel .material-symbols-outlined {
  font-size: 16px;
}

.papel-admin {
  background-color: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.papel-gerente {
  background-color: rgba(2, 136, 209, 0.12);
  color: #0288d1;
}

.papel-operador {
  background-color: rgba(100, 116, 139, 0.12);
  color: #64748b;
}

.divisor {
  width: 100%;
  height: 1px;
  background-color: var(--color-border, #e2e8f0);
  margin: 1.5rem 0;
}

.btn-seguranca {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  justify-content: center;
  padding: 0.6rem 1rem;
  background-color: var(--color-background, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-seguranca:hover {
  background-color: #f1f5f9;
}

.detalhes-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.detalhes-header h3 {
  margin: 0;
  font-size: 1.15rem;
}

.subtexto {
  margin: 0.2rem 0 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted, #64748b);
}

.btn-editar {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  background: none;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-editar:hover {
  background-color: var(--color-background, #f8fafc);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.col-span-2 {
  grid-column: span 2;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text, #1e293b);
}

.form-group input {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  font-size: 0.9rem;
}

.input-desabilitado {
  background-color: var(--color-background, #f8fafc);
  color: var(--color-text-muted, #64748b);
  cursor: not-allowed;
}

.acoes-edicao {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  border-top: 1px solid var(--color-border, #e2e8f0);
  padding-top: 1.25rem;
}

.btn-secundario {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-md, 8px);
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-primario {
  background: var(--color-primary, #16a34a);
  color: #fff;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-md, 8px);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primario:disabled,
.btn-secundario:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.font-mono {
  font-family: monospace;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
}

.modal-card {
  background: var(--color-surface, #ffffff);
  border-radius: var(--radius-lg, 12px);
  padding: 1.5rem;
  width: 100%;
  max-width: 440px;
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
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
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>