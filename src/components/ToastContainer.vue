<template>
  <div class="toast-container" aria-live="polite">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toastStore.toasts" 
        :key="toast.id" 
        :class="['toast-item', `toast-${toast.type}`]"
        role="alert"
      >
        <span>{{ toast.message }}</span>
        <button 
          type="button" 
          class="toast-close" 
          @click="toastStore.remove(toast.id)"
          aria-label="Fechar notificação"
        >
          &times;
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToastStore } from '@/stores/toast'
const toastStore = useToastStore()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 360px;
  width: calc(100% - 3rem);
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.15rem;
  border-radius: var(--radius-md, 8px);
  color: #ffffff;
  font-size: 0.9rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-success {
  background-color: var(--cor-verde-primaria, #2e7d32);
}

.toast-error {
  background-color: var(--cor-alerta-erro, #d32f2f);
}

.toast-info {
  background-color: var(--cor-cinza-escuro, #37474f);
}

.toast-warning {
  background-color: #b45309;
}

.toast-close {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 1.25rem;
  cursor: pointer;
  margin-left: 0.75rem;
  line-height: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>