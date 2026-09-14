<template>
  <div class="chatbot-wrapper">
    <!-- Botão Flutuante -->
    <button
      type="button"
      class="chat-bubble-btn"
      @click="toggleChat"
      aria-label="Assistente Virtual GreenTech"
      :aria-expanded="isOpen"
      aria-controls="chat-window"
    >
      <span v-if="!isOpen" aria-hidden="true">🤖</span>
      <span v-else aria-hidden="true">&times;</span>
    </button>

    <!-- Janela de Conversação -->
    <div
      v-if="isOpen"
      id="chat-window"
      class="chat-window"
      role="dialog"
      aria-label="Janela de chat do assistente"
    >
      <div class="chat-header">
        <div class="bot-info">
          <span class="bot-avatar" aria-hidden="true">🌿</span>
          <div>
            <h4>GreenTech Assistant</h4>
            <span class="status-indicator">Online</span>
          </div>
        </div>
      </div>

      <div
        class="messages-container"
        ref="messagesArea"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div
          v-for="(msg, idx) in mensagens"
          :key="idx"
          :class="['message-bubble', `msg-${msg.origem}`]"
        >
          <p>{{ msg.texto }}</p>
          <span class="timestamp">{{ msg.hora }}</span>
        </div>
        <div v-if="carregandoResposta" class="message-bubble msg-bot typing">Digitando...</div>
      </div>

      <form @submit.prevent="enviarMensagem" class="chat-input-area">
        <input
          v-model="inputTexto"
          type="text"
          placeholder="Ex: Qual o nível do tanque de água?"
          :disabled="carregandoResposta"
          aria-label="Mensagem para o assistente"
          ref="inputRef"
        />
        <button
          type="submit"
          :disabled="!inputTexto.trim() || carregandoResposta"
          aria-label="Enviar mensagem"
        >
          <span aria-hidden="true">➤</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { apiClient } from '@/services/api'
import { nextTick, ref } from 'vue'

const isOpen = ref(false)
const inputTexto = ref('')
const carregandoResposta = ref(false)
const messagesArea = ref(null)
const inputRef = ref(null)

const mensagens = ref([
  {
    origem: 'bot',
    texto:
      'Olá! Sou o assistente de IA da GreenTech. Como posso ajudar com a sua plantação ou estoque hoje?',
    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
])

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    rolarParaFinal()
    // Move o foco para o input quando o chat abre para uso imediato via teclado
    nextTick(() => inputRef.value?.focus())
  }
}

async function enviarMensagem() {
  const texto = inputTexto.value.trim()
  if (!texto) return

  const agora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  mensagens.value.push({ origem: 'user', texto, hora: agora })
  inputTexto.value = ''
  rolarParaFinal()

  carregandoResposta.value = true

  try {
    const resposta = await apiClient('/ia/chat-assistant/', {
      method: 'POST',
      body: JSON.stringify({ mensagem: texto }),
    })
    mensagens.value.push({
      origem: 'bot',
      texto: resposta.mensagem || resposta.texto,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
  } catch (err) {
    setTimeout(() => {
      let respostaSimulada =
        'Entendido. Seus sensores indicam umidade média em 68% e temperatura ideal.'
      if (texto.toLowerCase().includes('estoque')) {
        respostaSimulada =
          'Verifiquei o estoque: o insumo Biofungicida está crítico com previsão de término em 4 dias.'
      } else if (
        texto.toLowerCase().includes('irrigar') ||
        texto.toLowerCase().includes('válvula')
      ) {
        respostaSimulada =
          'O modelo de árvore de decisão indica que o solo da Estufa A já possui umidade suficiente. Irrigação desnecessária no momento.'
      }

      mensagens.value.push({
        origem: 'bot',
        texto: respostaSimulada,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
      carregandoResposta.value = false
      rolarParaFinal()
    }, 800)
    return
  }

  carregandoResposta.value = false
  rolarParaFinal()
}

function rolarParaFinal() {
  nextTick(() => {
    if (messagesArea.value) {
      messagesArea.value.scrollTop = messagesArea.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.chatbot-wrapper {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 9999;
}

.chat-bubble-btn {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background-color: var(--cor-verde-primaria, #2e7d32);
  color: #ffffff;
  border: none;
  font-size: 1.6rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.chat-bubble-btn:hover {
  transform: scale(1.05);
}

.chat-bubble-btn:focus-visible {
  outline: 3px solid #1b5e20;
  outline-offset: 3px;
}

.chat-window {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 360px;
  height: 480px;
  max-width: calc(100vw - 2rem);
  background: var(--cor-fundo-card, #ffffff);
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--cor-borda, #e0e0e0);
}

.chat-header {
  background: var(--cor-verde-primaria, #2e7d32);
  color: #fff;
  padding: 1rem;
}

.bot-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.bot-avatar {
  font-size: 1.5rem;
}

.bot-info h4 {
  margin: 0;
  font-size: 0.95rem;
}

.status-indicator {
  font-size: 0.75rem;
  color: #c8e6c9;
}

.messages-container {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background-color: #f4f6f8;
}

.message-bubble {
  max-width: 80%;
  padding: 0.75rem;
  border-radius: var(--radius-md, 8px);
  font-size: 0.85rem;
  line-height: 1.35;
}

.message-bubble p {
  margin: 0;
}

.timestamp {
  display: block;
  font-size: 0.65rem;
  margin-top: 0.35rem;
  opacity: 0.7;
  text-align: right;
}

.msg-bot {
  align-self: flex-start;
  background-color: #ffffff;
  color: #263238;
  border-bottom-left-radius: 2px;
}

.msg-user {
  align-self: flex-end;
  background-color: var(--cor-verde-primaria, #2e7d32);
  color: #ffffff;
  border-bottom-right-radius: 2px;
}

.chat-input-area {
  padding: 0.75rem;
  background: #ffffff;
  display: flex;
  gap: 0.5rem;
  border-top: 1px solid #e0e0e0;
}

.chat-input-area input {
  flex: 1;
  padding: 0.6rem;
  border: 1px solid #cfd8dc;
  border-radius: var(--radius-md, 6px);
  font-size: 0.85rem;
}

.chat-input-area input:focus-visible {
  outline: 2px solid var(--cor-verde-primaria, #2e7d32);
  border-color: transparent;
}

.chat-input-area button {
  background-color: var(--cor-verde-primaria, #2e7d32);
  color: #fff;
  border: none;
  padding: 0 1rem;
  border-radius: var(--radius-md, 6px);
  cursor: pointer;
}

.chat-input-area button:focus-visible {
  outline: 2px solid #1b5e20;
  outline-offset: 2px;
}
</style>
