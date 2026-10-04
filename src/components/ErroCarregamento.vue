<script setup>
defineProps({
  mensagem: {
    type: String,
    default: 'Não foi possível carregar os dados do servidor.'
  },
  textoBotao: {
    type: String,
    default: 'Tentar novamente'
  }
})

defineEmits(['tentar-novamente'])
</script>

<template>
  <div class="erro-carregamento" role="alert">
    <span class="material-symbols-outlined icone">error</span>
    <p class="mensagem">{{ mensagem }}</p>
    <button type="button" class="btn-tentar" @click="$emit('tentar-novamente')">
      <span class="material-symbols-outlined">refresh</span>
      {{ textoBotao }}
    </button>
  </div>
</template>

<style scoped>
.erro-carregamento {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2.5rem 1.5rem;
  background-color: var(--color-surface, #ffffff);
  border: 1px solid var(--color-danger-light, #fee2e2);
  border-radius: var(--radius-lg, 12px);
  margin: 1rem 0;
}

.icone {
  font-size: 36px;
  color: var(--color-danger, #ef4444);
  margin-bottom: 0.75rem;
}

.mensagem {
  font-size: 0.9375rem;
  color: var(--color-text, #1e293b);
  margin: 0 0 1.25rem 0;
  max-width: 460px;
  line-height: 1.5;
}

.btn-tentar {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-surface, #ffffff);
  background-color: var(--color-primary, #16a34a);
  border: none;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-tentar:hover {
  background-color: var(--color-primary-dark, #15803d);
}

.btn-tentar .material-symbols-outlined {
  font-size: 18px;
}
</style>