/**
 * src/stores/toast.js
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  function show(message, type = 'info', timeout = 4000) {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type })

    setTimeout(() => {
      remove(id)
    }, timeout)
  }

  function remove(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const success = (msg, time) => show(msg, 'success', time)
  const error = (msg, time) => show(msg, 'error', time)
  const info = (msg, time) => show(msg, 'info', time)
  const warning = (msg, time) => show(msg, 'warning', time)

  return { toasts, show, remove, success, error, info, warning }
})