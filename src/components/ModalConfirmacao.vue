<template>
  <Teleport to="body">
    <div
      v-if="ativo"
      class="modal-backdrop"
      @click.self="cancelar"
      role="dialog"
      aria-modal="true"
      :aria-label="titulo"
    >
      <div class="modal-card">
        <header class="modal-header">
          <span :class="['modal-icon', `icon-${variante}`]" aria-hidden="true">{{
            iconeVariante
          }}</span>
          <h3 class="modal-title">{{ titulo }}</h3>
        </header>

        <div class="modal-content">
          <p>{{ mensagem }}</p>
        </div>

        <footer class="modal-actions">
          <button type="button" class="btn-cancelar" @click="cancelar" :disabled="processando">
            {{ textoCancelar }}
          </button>
          <button
            type="button"
            :class="['btn-confirmar', `btn-${variante}`]"
            @click="confirmar"
            :disabled="processando"
            ref="btnConfirmarRef"
          >
            {{ processando ? 'Processando...' : textoConfirmar }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  ativo: {
    type: Boolean,
    default: false,
  },
  titulo: {
    type: String,
    default: 'Confirmar Operação',
  },
  mensagem: {
    type: String,
    required: true,
  },
  textoConfirmar: {
    type: String,
    default: 'Confirmar',
  },
  textoCancelar: {
    type: String,
    default: 'Voltar',
  },
  variante: {
    type: String,
    default: 'destrutivo',
    validator: (v) => ['destrutivo', 'seguro', 'alerta'].includes(v),
  },
  processando: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['confirmar', 'cancelar'])
const btnConfirmarRef = ref(null)

const iconeVariante = computed(() => {
  const mapa = {
    destrutivo: '⚠️',
    seguro: '✅',
    alerta: 'ℹ️',
  }
  return mapa[props.variante]
})

function confirmar() {
  emit('confirmar')
}

function cancelar() {
  if (!props.processando) {
    emit('cancelar')
  }
}

// Captura global da tecla Escape para garantir acessibilidade
function handleKeydown(e) {
  if (props.ativo && e.key === 'Escape') {
    cancelar()
  }
}

watch(
  () => props.ativo,
  async (newVal) => {
    if (newVal) {
      document.addEventListener('keydown', handleKeydown)
      await nextTick()
      // Move o foco automaticamente para o botão primário ao abrir o modal
      btnConfirmarRef.value?.focus()
    } else {
      document.removeEventListener('keydown', handleKeydown)
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
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
  z-index: 10000;
  padding: 1rem;
}

.modal-card {
  background: var(--cor-fundo-card, #ffffff);
  width: 100%;
  max-width: 440px;
  border-radius: var(--radius-lg, 12px);
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  animation: scaleUp 0.2s ease-out;
}

@keyframes scaleUp {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-icon {
  font-size: 1.6rem;
}

.modal-title {
  margin: 0;
  color: var(--cor-texto-principal, #263238);
  font-size: 1.15rem;
}

.modal-content p {
  margin: 0;
  font-size: 0.95rem;
  color: var(--cor-texto-secundario, #546e7a);
  line-height: 1.4;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-cancelar,
.btn-confirmar {
  min-height: 44px;
  padding: 0 1.25rem;
  border-radius: var(--radius-md, 6px);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
  border: 1px solid transparent;
}

.btn-cancelar:focus-visible,
.btn-confirmar:focus-visible {
  outline: 2px solid var(--cor-verde-primaria, #2e7d32);
  outline-offset: 2px;
}

.btn-cancelar {
  background: transparent;
  border-color: #cfd8dc;
  color: #455a64;
}

.btn-destrutivo {
  background-color: #d32f2f;
  color: #ffffff;
}

.btn-seguro {
  background-color: var(--cor-verde-primaria, #2e7d32);
  color: #ffffff;
}

.btn-cancelar:disabled,
.btn-confirmar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .modal-actions {
    flex-direction: column;
  }
  .btn-cancelar,
  .btn-confirmar {
    width: 100%;
  }
}
</style>
