<template>
  <div :class="['estado-vazio', { compacto }]">
    <span v-if="icone" class="material-symbols-outlined estado-vazio-icone" aria-hidden="true">{{ icone }}</span>
    <h3 v-if="titulo">{{ titulo }}</h3>
    <p v-if="texto">{{ texto }}</p>
    <slot />
  </div>
</template>

<script setup>
// Lista vazia: cartão com ícone, título e ação (slot) ou, com compacto, só o texto dentro de um painel
defineProps({
  icone: { type: String, default: '' },
  titulo: { type: String, default: '' },
  texto: { type: String, default: '' },
  compacto: { type: Boolean, default: false },
})
</script>

<style scoped>
.estado-vazio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 4rem 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: 12px;
}

.estado-vazio h3 {
  margin: 0;
  color: var(--color-text);
}

.estado-vazio p {
  margin: 0 0 0.5rem;
}

.estado-vazio-icone {
  font-size: 48px;
}

.compacto {
  padding: 1.5rem;
  background: none;
  border: none;
  font-size: 0.9rem;
}
</style>
