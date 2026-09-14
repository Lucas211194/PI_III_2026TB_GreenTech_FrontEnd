<template>
  <label class="toggle-switch">
    <input type="checkbox" :disabled="disabled" v-model="model" class="sr-only" />
    <span class="toggle-slider" aria-hidden="true"></span>
  </label>
</template>

<script setup>
const model = defineModel()
defineProps({
  disabled: { type: Boolean, default: false },
})
</script>

<style scoped>
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

/* Substituto acessível para display: none e opacity: 0 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
}
.toggle-slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--primary-green, #3a5a40);
}
.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

/* Foco visível via teclado */
.toggle-switch input:focus-visible + .toggle-slider {
  outline: 2px solid var(--primary-green, #3a5a40);
  outline-offset: 2px;
}
</style>
