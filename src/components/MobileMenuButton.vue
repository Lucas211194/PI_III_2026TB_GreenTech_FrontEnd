<template>
  <button
    class="menu-toggle"
    @click="toggle"
    aria-label="Abrir menu principal"
    :aria-expanded="isOpen"
    aria-controls="sidebar-nav"
  >
    <span class="material-symbols-outlined" aria-hidden="true">menu</span>
  </button>
</template>

<script setup>
import { useSidebar } from '@/composables/useSidebar'
const { isOpen, toggle } = useSidebar()
</script>

<style scoped>
.menu-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--primary-green, #3a5a40);
  font-size: 2.2rem;
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s;
}

.menu-toggle:active {
  transform: scale(0.9);
}

.menu-toggle:focus-visible {
  outline: 2px solid var(--primary-green, #3a5a40);
  outline-offset: 4px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
