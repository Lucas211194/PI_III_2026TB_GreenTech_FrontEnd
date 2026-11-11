<template>
  <div v-if="isOpen" class="sidebar-backdrop" @click="close" aria-hidden="true"></div>

  <aside id="sidebar-nav" :class="['sidebar', { 'mobile-open': isOpen }]" aria-label="Navegação Principal">
    <div class="sidebar-brand">
      <span class="material-symbols-outlined brand-icon">psychiatry</span>
      <span class="brand-text">GreenTech</span>
      <button type="button" class="btn-close-mobile" @click="close" aria-label="Fechar menu lateral">
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </div>

    <nav class="sidebar-nav" @click="handleNavClick">
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
import { useSidebar } from '@/composables/useSidebar'

const authStore = useAuthStore()
const { isOpen, close } = useSidebar()

// Fecha o menu mobile ao navegar (clique em qualquer link do nav)
function handleNavClick(event) {
  if (event.target.closest('a')) close()
}

async function handleLogout() {
  close()
  await authStore.logout()
}
</script>

<style scoped>
.sidebar {
  /* Recolhida por padrão (só ícones); expande no hover. Mesmos tokens do layout global. */
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: var(--sidebar-collapsed-width, 85px);
  padding: 0; /* anula o padding do .sidebar global (03-layout.css) */
  background-color: var(--color-surface, #ffffff);
  border-right: 1px solid var(--color-border, #e2e8f0);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  transition:
    width 0.3s ease,
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.sidebar:hover,
.sidebar:has(:focus-visible) {
  width: var(--sidebar-expanded-width, 260px);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
}

/* Textos só aparecem com a sidebar expandida */
.brand-text,
.nav-label {
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.sidebar:hover .brand-text,
.sidebar:hover .nav-label,
.sidebar:has(:focus-visible) .brand-text,
.sidebar:has(:focus-visible) .nav-label {
  opacity: 1;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 26px; /* ícone centralizado na sidebar recolhida (85px) */
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  white-space: nowrap;
}

.brand-icon {
  font-size: 2rem;
  color: var(--color-primary, #16a34a);
  flex-shrink: 0;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text, #1e293b);
  letter-spacing: -0.025em;
}

.btn-close-mobile {
  display: none;
  margin-left: auto;
  background: none;
  border: none;
  color: var(--color-text-muted, #64748b);
  cursor: pointer;
  padding: 0;
}

.sidebar-backdrop {
  display: none;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 12px;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 19px; /* 12px do nav + 19px = ícone centralizado em 85px */
  white-space: nowrap;
  border-radius: var(--radius-md, 8px);
  color: var(--color-text-muted, #64748b);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-item .material-symbols-outlined {
  font-size: 1.35rem;
  flex-shrink: 0;
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
  padding: 1rem 12px;
  border-top: 1px solid var(--color-border, #e2e8f0);
}

.btn-logout {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 19px;
  white-space: nowrap;
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

/* --- MOBILE: sidebar vira gaveta, aberta pelo MobileMenuButton --- */
@media (max-width: 768px) {
  .sidebar {
    width: var(--sidebar-expanded-width, 260px);
    transform: translateX(-100%);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
    box-shadow: 5px 0 20px rgba(0, 0, 0, 0.2);
  }

  .brand-text,
  .nav-label {
    opacity: 1;
  }

  .btn-close-mobile {
    display: flex;
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 999;
  }
}
</style>