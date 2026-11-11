<template>
  <div class="modal-overlay" @click.self="emit('fechar')">
    <div :class="['modal-card', { estreito }]" role="dialog" aria-modal="true" :aria-label="titulo">
      <header class="modal-header">
        <h3>{{ titulo }}</h3>
        <button type="button" class="btn-close" aria-label="Fechar" @click="emit('fechar')">
          <span class="material-symbols-outlined">close</span>
        </button>
      </header>
      <slot />
    </div>
  </div>
</template>

<script setup>
// Janela de formulário: fundo escuro, cabeçalho com título e fechar; o formulário vem no slot.
// Campos (.form-group, .form-row) e botões (.modal-actions) usam o estilo global de formulários.
defineProps({
  titulo: { type: String, required: true },
  estreito: { type: Boolean, default: false },
})
const emit = defineEmits(['fechar'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-card {
  width: 100%;
  max-width: 540px;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  padding: 1.5rem;
  background: var(--color-surface);
  border-radius: 12px;
}

.estreito {
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
  color: var(--color-text-muted);
  cursor: pointer;
}
</style>
