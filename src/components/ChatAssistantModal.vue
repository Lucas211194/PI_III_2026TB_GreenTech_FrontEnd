<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-chat"
      @keydown.esc="fechar"
      @click.self="fechar"
    >
      <div class="chat-container">
        <!-- CABEÇALHO -->
        <header class="chat-header">
          <div class="header-info">
            <span class="material-symbols-outlined icone-ia">smart_toy</span>
            <div>
              <h2 id="titulo-chat" class="header-title">Assistente GreenTech</h2>
              <span class="header-status">
                {{ FEATURES.iaChat ? 'Conectado à IA do Servidor' : 'Módulo em Stand-by' }}
              </span>
            </div>
          </div>
          <button
            type="button"
            class="btn-fechar"
            aria-label="Fechar assistente"
            @click="fechar"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <!-- CORPO DAS MENSAGENS -->
        <div ref="mensagensContainer" class="chat-mensagens">
          <!-- AVISO DE STAND-BY SE A FLAG ESTIVER DESLIGADA -->
          <div v-if="!FEATURES.iaChat" class="aviso-standby">
            <RecursoIndisponivel
              icone="smart_toy"
              titulo="Assistente de IA em Stand-by"
              mensagem="Este recurso será liberado assim que o servidor disponibilizar o módulo de IA (/ia/chat-assistant/)."
            />
          </div>

          <!-- MENSAGENS DA CONVERSA -->
          <template v-else>
            <div
              v-for="(msg, index) in historico"
              :key="index"
              :class="['mensagem-wrapper', msg.remetente === 'usuario' ? 'msg-usuario' : 'msg-ia']"
            >
              <div class="bolha-mensagem">
                <p class="texto-mensagem">{{ msg.texto }}</p>
                <span class="hora-mensagem">{{ msg.hora }}</span>
              </div>
            </div>

            <!-- INDICADOR DE PROCESSAMENTO -->
            <div v-if="carregando" class="mensagem-wrapper msg-ia">
              <div class="bolha-mensagem digitando">
                <span class="ponto"></span>
                <span class="ponto"></span>
                <span class="ponto"></span>
              </div>
            </div>
          </template>
        </div>

        <!-- FORMULÁRIO DE ENVIO -->
        <footer class="chat-footer">
          <form class="form-envio" @submit.prevent="enviarMensagem">
            <input
              ref="inputMensagemRef"
              v-model="mensagemAtual"
              type="text"
              placeholder="Digite sua dúvida ou comando..."
              class="input-mensagem"
              :disabled="!FEATURES.iaChat || carregando"
              aria-label="Mensagem para o assistente"
            />
            <button
              type="submit"
              class="btn-enviar"
              :disabled="!FEATURES.iaChat || carregando || !mensagemAtual.trim()"
              aria-label="Enviar mensagem"
            >
              <span class="material-symbols-outlined">send</span>
            </button>
          </form>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import RecursoIndisponivel from '@/components/RecursoIndisponivel.vue'
import apiClient from '@/services/api'
import { mensagemDeErro } from '@/services/apiHelpers'
import { FEATURES } from '@/config/features'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const mensagemAtual = ref('')
const carregando = ref(false)
const mensagensContainer = ref(null)
const inputMensagemRef = ref(null)

const historico = ref([
  {
    remetente: 'ia',
    texto: 'Olá! Sou o assistente virtual da GreenTech. Como posso ajudar com sua estufa hoje?',
    hora: obterHoraAtual(),
  },
])

function obterHoraAtual() {
  const agora = new Date()
  return agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function rolarParaFinal() {
  nextTick(() => {
    if (mensagensContainer.value) {
      mensagensContainer.value.scrollTop = mensagensContainer.value.scrollHeight
    }
  })
}

function fechar() {
  emit('update:modelValue', false)
}

async function enviarMensagem() {
  const textoLimpo = mensagemAtual.value.trim()
  if (!textoLimpo || carregando.value || !FEATURES.iaChat) return

  // Adiciona a mensagem do usuário ao histórico
  historico.value.push({
    remetente: 'usuario',
    texto: textoLimpo,
    hora: obterHoraAtual(),
  })

  mensagemAtual.value = ''
  carregando.value = true
  rolarParaFinal()

  try {
    const res = await apiClient.post('/ia/chat-assistant/', { mensagem: textoLimpo })
    const respostaTexto = res.data?.mensagem || res.data?.texto || 'Resposta recebida do servidor.'

    historico.value.push({
      remetente: 'ia',
      texto: respostaTexto,
      hora: obterHoraAtual(),
    })
  } catch (err) {
    // Exibe o erro real do servidor no próprio chat, sem simulação
    const detalheErro = mensagemDeErro(
      err,
      'Não foi possível obter resposta do servidor de IA no momento.',
    )
    historico.value.push({
      remetente: 'ia',
      texto: `Erro: ${detalheErro}`,
      hora: obterHoraAtual(),
    })
  } finally {
    carregando.value = false
    rolarParaFinal()
  }
}

watch(
  () => props.modelValue,
  (aberto) => {
    if (aberto) {
      rolarParaFinal()
      nextTick(() => {
        if (FEATURES.iaChat) {
          inputMensagemRef.value?.focus()
        }
      })
    }
  },
)

onMounted(() => {
  if (props.modelValue && FEATURES.iaChat) {
    inputMensagemRef.value?.focus()
  }
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.chat-container {
  background: var(--color-surface, #ffffff);
  border-radius: var(--radius-lg, 12px);
  width: 100%;
  max-width: 500px;
  height: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.chat-header {
  background: var(--color-primary, #16a34a);
  color: #fff;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icone-ia {
  font-size: 28px;
}

.header-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.header-status {
  font-size: 0.75rem;
  opacity: 0.9;
}

.btn-fechar {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  border-radius: 4px;
}

.btn-fechar:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.chat-mensagens {
  flex: 1;
  padding: 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: var(--color-background, #f8fafc);
}

.aviso-standby {
  margin: auto 0;
}

.mensagem-wrapper {
  display: flex;
  width: 100%;
}

.msg-usuario {
  justify-content: flex-end;
}

.msg-ia {
  justify-content: flex-start;
}

.bolha-mensagem {
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md, 8px);
  position: relative;
}

.msg-usuario .bolha-mensagem {
  background-color: var(--color-primary, #16a34a);
  color: #fff;
  border-bottom-right-radius: 2px;
}

.msg-ia .bolha-mensagem {
  background-color: var(--color-surface, #ffffff);
  color: var(--color-text, #1e293b);
  border: 1px solid var(--color-border, #e2e8f0);
  border-bottom-left-radius: 2px;
}

.texto-mensagem {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  white-space: pre-wrap;
}

.hora-mensagem {
  display: block;
  font-size: 0.65rem;
  margin-top: 0.35rem;
  text-align: right;
  opacity: 0.75;
}

.digitando {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.75rem 1.25rem;
}

.ponto {
  width: 8px;
  height: 8px;
  background-color: var(--color-text-muted, #94a3b8);
  border-radius: 50%;
  animation: pulso 1.4s infinite ease-in-out both;
}

.ponto:nth-child(1) {
  animation-delay: -0.32s;
}
.ponto:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes pulso {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chat-footer {
  padding: 1rem;
  background-color: var(--color-surface, #ffffff);
  border-top: 1px solid var(--color-border, #e2e8f0);
}

.form-envio {
  display: flex;
  gap: 0.5rem;
}

.input-mensagem {
  flex: 1;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  font-size: 0.9rem;
  outline: none;
}

.input-mensagem:focus {
  border-color: var(--color-primary, #16a34a);
}

.input-mensagem:disabled {
  background-color: var(--color-background, #f8fafc);
  cursor: not-allowed;
}

.btn-enviar {
  background-color: var(--color-primary, #16a34a);
  color: #fff;
  border: none;
  border-radius: var(--radius-md, 8px);
  padding: 0.65rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-enviar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>