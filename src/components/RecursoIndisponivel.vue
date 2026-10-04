<script setup>
defineProps({
  icone: {
    type: String,
    default: 'construction'
  },
  titulo: {
    type: String,
    default: 'Recurso em desenvolvimento'
  },
  mensagem: {
    type: String,
    default: 'Este módulo será habilitado assim que os serviços correspondentes forem disponibilizados no servidor.'
  }
})
</script>

<template>
  <div class="recurso-indisponivel" role="status" aria-live="polite">
    <div class="icone-wrapper">
      <span class="material-symbols-outlined icone">{{ icone }}</span>
    </div>
    <h3 class="titulo">{{ titulo }}</h3>
    <p class="mensagem">{{ mensagem }}</p>
    <div v-if="$slots.default" class="acoes">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.recurso-indisponivel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1.5rem;
  background-color: var(--color-surface, #ffffff);
  border: 1px dashed var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  margin: 1rem 0;
}

.icone-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--color-background, #f8fafc);
  margin-bottom: 1rem;
}

.icone {
  font-size: 32px;
  color: var(--color-text-muted, #64748b);
}

.titulo {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #1e293b);
  margin: 0 0 0.5rem 0;
}

.mensagem {
  font-size: 0.875rem;
  color: var(--color-text-muted, #64748b);
  max-width: 480px;
  margin: 0;
  line-height: 1.5;
}

.acoes {
  margin-top: 1.5rem;
}
</style>