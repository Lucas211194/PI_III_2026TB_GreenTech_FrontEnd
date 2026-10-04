<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <span class="material-symbols-outlined brand-icon">psychiatry</span>
      <span class="brand-text">GreenTech</span>
    </div>

    <nav class="sidebar-nav">
      <RouterLink to="/dashboard" class="nav-item" active-class="active">
        <span class="material-symbols-outlined">dashboard</span>
        <span class="nav-label">Dashboard</span>
      </RouterLink>

      <RouterLink to="/culturas" class="nav-item" active-class="active">
        <span class="material-symbols-outlined">potted_plant</span>
        <span class="nav-label">Culturas</span>
      </RouterLink>

      <RouterLink to="/lotes" class="nav-item" active-class="active">
        <span class="material-symbols-outlined">yard</span>
        <span class="nav-label">Lotes</span>
      </RouterLink>

      <RouterLink to="/colheitas" class="nav-item" active-class="active">
        <span class="material-symbols-outlined">agriculture</span>
        <span class="nav-label">Colheitas</span>
      </RouterLink>

      <RouterLink to="/estoque" class="nav-item" active-class="active">
        <span class="material-symbols-outlined">inventory_2</span>
        <span class="nav-label">Estoque</span>
      </RouterLink>

      <RouterLink to="/sensores" class="nav-item" active-class="active">
        <span class="material-symbols-outlined">sensors</span>
        <span class="nav-label">Sensores</span>
      </RouterLink>

      <RouterLink to="/alertas" class="nav-item" active-class="active">
        <span class="material-symbols-outlined">warning</span>
        <span class="nav-label">Alertas</span>
      </RouterLink>

      <RouterLink to="/irrigacao" class="nav-item" active-class="active">
        <span class="material-symbols-outlined">water_drop</span>
        <span class="nav-label">Irrigação</span>
      </RouterLink>

      <RouterLink to="/layout" class="nav-item" active-class="active">
        <span class="material-symbols-outlined">grid_view</span>
        <span class="nav-label">Layout Estufas</span>
      </RouterLink>

      <RouterLink to="/ocr-notas" class="nav-item" active-class="active">
        <span class="material-symbols-outlined">document_scanner</span>
        <span class="nav-label">Importar NF</span>
      </RouterLink>

      <RouterLink
        v-if="authStore.isGerente || authStore.isAdmin"
        to="/historico"
        class="nav-item"
        active-class="active"
      >
        <span class="material-symbols-outlined">history</span>
        <span class="nav-label">Auditoria</span>
      </RouterLink>

      <RouterLink to="/perfil" class="nav-item" active-class="active">
        <span class="material-symbols-outlined">person</span>
        <span class="nav-label">Perfil</span>
      </RouterLink>

      <RouterLink to="/configuracoes" class="nav-item" active-class="active">
        <span class="material-symbols-outlined">settings</span>
        <span class="nav-label">Configurações</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <button type="button" class="btn-logout" @click="handleLogout">
        <span class="material-symbols-outlined">logout</span>
        <span class="nav-label">Sair</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  height: 100vh;
  background-color: var(--color-surface, #ffffff);
  border-right: 1px solid var(--color-border, #e2e8f0);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  left: 0;
  z-index: 100;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1.25rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.brand-icon {
  font-size: 2rem;
  color: var(--color-primary, #16a34a);
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text, #1e293b);
  letter-spacing: -0.025em;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0.75rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius-md, 8px);
  color: var(--color-text-muted, #64748b);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-item .material-symbols-outlined {
  font-size: 1.35rem;
}

.nav-item:hover {
  background-color: var(--color-background, #f8fafc);
  color: var(--color-text, #1e293b);
}

.nav-item.active {
  background-color: rgba(22, 163, 74, 0.1);
  color: var(--color-primary, #16a34a);
  font-weight: 600;
}

.sidebar-footer {
  padding: 1rem 0.75rem;
  border-top: 1px solid var(--color-border, #e2e8f0);
}

.btn-logout {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border: none;
  background: none;
  border-radius: var(--radius-md, 8px);
  color: var(--color-danger, #ef4444);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-logout:hover {
  background-color: rgba(239, 68, 68, 0.08);
}
</style>