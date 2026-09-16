<template>
  <aside
    id="sidebar-nav"
    :class="['sidebar-nav', { 'mobile-open': isOpen, 'touch-expanded': touchExpanded }]"
    aria-label="Navegação Principal"
  >
    <div class="sidebar-header">
      <span class="brand-title">GreenTech</span>
      <button
        type="button"
        class="btn-close-mobile"
        @click="close"
        aria-label="Fechar menu lateral"
        :aria-expanded="isOpen"
        aria-controls="sidebar-nav"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>

    <nav aria-label="Menu principal">
      <ul class="nav-list" role="menu">
        <li class="nav-item" role="none">
          <RouterLink to="/dashboard" class="nav-link" @click="handleNavClick" role="menuitem">
            <span class="material-symbols-outlined icon" aria-hidden="true">dashboard</span>
            <span class="label">Dashboard</span>
          </RouterLink>
        </li>
        <li class="nav-item" role="none">
          <RouterLink to="/culturas" class="nav-link" @click="handleNavClick" role="menuitem">
            <span class="material-symbols-outlined icon" aria-hidden="true">eco</span>
            <span class="label">Culturas</span>
          </RouterLink>
        </li>
        <li class="nav-item" role="none">
          <RouterLink to="/lotes" class="nav-link" @click="handleNavClick" role="menuitem">
            <span class="material-symbols-outlined icon" aria-hidden="true">layers</span>
            <span class="label">Lotes</span>
          </RouterLink>
        </li>
        <li class="nav-item" role="none">
          <RouterLink to="/colheitas" class="nav-link" @click="handleNavClick" role="menuitem">
            <span class="material-symbols-outlined icon" aria-hidden="true">agriculture</span>
            <span class="label">Colheitas</span>
          </RouterLink>
        </li>
        <li class="nav-item" role="none">
          <RouterLink to="/sensores" class="nav-link" @click="handleNavClick" role="menuitem">
            <span class="material-symbols-outlined icon" aria-hidden="true">sensors</span>
            <span class="label">Sensores</span>
          </RouterLink>
        </li>
        <li class="nav-item" role="none">
          <RouterLink to="/irrigacao" class="nav-link" @click="handleNavClick" role="menuitem">
            <span class="material-symbols-outlined icon" aria-hidden="true">water_drop</span>
            <span class="label">Irrigação</span>
          </RouterLink>
        </li>
        <li class="nav-item" role="none">
          <RouterLink to="/estoque" class="nav-link" @click="handleNavClick" role="menuitem">
            <span class="material-symbols-outlined icon" aria-hidden="true">inventory_2</span>
            <span class="label">Estoque</span>
          </RouterLink>
        </li>
        <li class="nav-item" role="none">
          <RouterLink to="/ocr-notas" class="nav-link" @click="handleNavClick" role="menuitem">
            <span class="material-symbols-outlined icon" aria-hidden="true">receipt_long</span>
            <span class="label">Importar NF (OCR)</span>
          </RouterLink>
        </li>
        <li class="nav-item" role="none">
          <RouterLink to="/alertas" class="nav-link" @click="handleNavClick" role="menuitem">
            <span class="material-symbols-outlined icon" aria-hidden="true">notifications</span>
            <span class="label">Alertas</span>
          </RouterLink>
        </li>

        <li v-if="authStore.isGerente || authStore.isAdmin" class="nav-item" role="none">
          <RouterLink to="/historico" class="nav-link" @click="handleNavClick" role="menuitem">
            <span class="material-symbols-outlined icon" aria-hidden="true">history</span>
            <span class="label">Auditoria & Histórico</span>
          </RouterLink>
        </li>

        <li class="nav-item" role="none">
          <RouterLink to="/perfil" class="nav-link" @click="handleNavClick" role="menuitem">
            <span class="material-symbols-outlined icon" aria-hidden="true">person</span>
            <span class="label">Meu Perfil</span>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <div class="sidebar-footer">
      <button type="button" class="nav-link btn-logout" @click="handleLogout">
        <span class="material-symbols-outlined icon" aria-hidden="true">logout</span>
        <span class="label">Sair</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { useSidebar } from '@/composables/useSidebar'
import { useAuthStore } from '@/stores/auth'
import { RouterLink, useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
// Extraindo propriedades do composable
const { isOpen, close, touchExpanded } = useSidebar()

function handleNavClick() {
  close()
}

function handleLogout() {
  authStore.logout()
  close()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.sidebar-nav {
  width: 240px;
  background-color: var(--cor-fundo-sidebar, #1b5e20);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  transition:
    width 0.3s ease,
    transform 0.3s ease;
  z-index: 1000;
}

.sidebar-header {
  padding: 1.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-title {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.btn-close-mobile {
  display: none;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.75rem;
  cursor: pointer;
}

.btn-close-mobile:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
  border-radius: 4px;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar-footer {
  margin-top: auto;
  padding: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.btn-logout {
  width: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  font-family: inherit;
}

.btn-logout:hover {
  background-color: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.btn-logout:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: -2px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 1.25rem;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 0.95rem;
  transition: background-color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.nav-link:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: -2px;
}

.icon {
  font-size: 1.15rem;
}

@media (max-width: 1024px) {
  .sidebar-nav {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.25);
  }

  .sidebar-nav.mobile-open {
    transform: translateX(0);
  }

  .btn-close-mobile {
    display: block;
  }
}
</style>
