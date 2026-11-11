<template>
  <AppSidebar />
  <main class="main-content">
    <DashHeader :title="title" :subtitle="subtitle">
      <template #actions>
        <slot name="header-actions" />
      </template>
    </DashHeader>

    <div class="conteudo-pagina">
      <slot />
    </div>

    <AppFooter />
  </main>
</template>

<script setup>
import AppSidebar from '@/components/AppSidebar.vue'
import AppFooter from '@/components/AppFooter.vue'
import DashHeader from '@/components/DashHeader.vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<style scoped>
/* Corpo de todas as telas: mesmo recuo do cabeçalho e largura total */
.conteudo-pagina {
  padding: 1.5rem 40px 40px;
}

@media (max-width: 768px) {
  .conteudo-pagina {
    padding: 1rem 15px 30px;
  }
}
</style>
