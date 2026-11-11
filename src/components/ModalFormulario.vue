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
// Os campos (.form-group, .form-row) e os botões (.modal-actions) do slot ganham o estilo daqui.
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

:slotted(.form-group) {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

:slotted(.form-group label) {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text);
}

:slotted(.form-group input),
:slotted(.form-group select),
:slotted(.form-group textarea) {
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.9rem;
}

:slotted(.form-row) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

:slotted(.modal-actions) {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

@media (max-width: 600px) {
  :slotted(.form-row) {
    grid-template-columns: 1fr;
  }
}
</style>
