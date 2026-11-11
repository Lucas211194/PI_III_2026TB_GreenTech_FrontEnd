<template>
  <div :class="['estado-carregamento', { compacto }]" role="status" aria-live="polite">
    <span :class="compacto ? 'spinner-sm' : 'spinner'" aria-hidden="true"></span>
    <p>{{ mensagem }}</p>
    <slot />
  </div>
</template>

<script setup>
// Carregamento da página inteira (cartão centralizado) ou, com compacto, dentro de um painel
defineProps({
  mensagem: { type: String, default: 'Carregando...' },
  compacto: { type: Boolean, default: false },
})
</script>

<style scoped>
.estado-carregamento {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
}

.estado-carregamento p {
  margin: 0;
}

.compacto {
  flex-direction: row;
  gap: 0.5rem;
  padding: 1.5rem;
}
</style>
