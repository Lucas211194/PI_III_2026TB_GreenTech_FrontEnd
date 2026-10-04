import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

import HomeView from '@/views/HomeView.vue'
import DashboardView from '@/views/DashboardView.vue'
import CulturasView from '@/views/CulturasView.vue'
import LotePlantioView from '@/views/LotePlantioView.vue'
import ColheitasView from '@/views/ColheitasView.vue'
import SensoresView from '@/views/SensoresView.vue'
import EstoqueView from '@/views/EstoqueView.vue'
import AlertasView from '@/views/AlertasView.vue'
import HistoricoView from '@/views/HistoricoView.vue'
import PerfilView from '@/views/PerfilView.vue'
import IrrigacaoView from '@/views/IrrigacaoView.vue'
import GerenciadorLayoutView from '@/views/GerenciadorLayoutView.vue'
import ConfiguracaoView from '@/views/ConfiguracaoView.vue'
import NotaFiscalOcrView from '@/views/NotaFiscalOcrView.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: HomeView
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/culturas',
    name: 'culturas',
    component: CulturasView,
    meta: { requiresAuth: true }
  },
  {
    path: '/lotes',
    name: 'lotes',
    component: LotePlantioView,
    meta: { requiresAuth: true }
  },
  {
    path: '/colheitas',
    name: 'colheitas',
    component: ColheitasView,
    meta: { requiresAuth: true }
  },
  {
    path: '/sensores',
    name: 'sensores',
    component: SensoresView,
    meta: { requiresAuth: true }
  },
  {
    path: '/irrigacao',
    name: 'irrigacao',
    component: IrrigacaoView,
    meta: { requiresAuth: true }
  },
  {
    path: '/estoque',
    name: 'estoque',
    component: EstoqueView,
    meta: { requiresAuth: true }
  },
  {
    path: '/ocr-notas',
    name: 'ocr-notas',
    component: NotaFiscalOcrView,
    meta: { requiresAuth: true }
  },
  {
    path: '/alertas',
    name: 'alertas',
    component: AlertasView,
    meta: { requiresAuth: true }
  },
  {
    // Corrigido: Rota única e com autorização consolidada
    path: '/historico',
    name: 'historico',
    component: HistoricoView,
    meta: { requiresAuth: true, requiresAuditor: true }
  },
  {
    path: '/perfil',
    name: 'perfil',
    component: PerfilView,
    meta: { requiresAuth: true }
  },
  {
    path: '/layout',
    name: 'layout',
    component: GerenciadorLayoutView,
    meta: { requiresAuth: true }
  },
  {
    path: '/configuracoes',
    name: 'configuracoes',
    component: ConfiguracaoView,
    meta: { requiresAuth: true }
  },
  {
    // Caminho inexistente volta para a raiz (login); se já estiver logado, o guard leva ao dashboard
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()
  const toastStore = useToastStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    toastStore.error('Sessão expirada ou não autenticada.')
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiresAuditor) {
    await authStore.carregarPerfil()
    if (!authStore.isGerente && !authStore.isAdmin) {
      toastStore.error('Acesso restrito a Gerentes e Administradores.')
      return { name: 'dashboard' }
    }
  }

  return true
})

export default router