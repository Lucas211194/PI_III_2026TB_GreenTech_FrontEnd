<template>
  <main class="login-split-layout">
    <!-- Lado Esquerdo: Apresentação (Escondido no Mobile) -->
    <aside class="login-presentation">
      <div class="presentation-overlay">
        <div class="presentation-content">
          <div class="brand-logo">
            <span class="material-symbols-outlined icon-logo">eco</span>
          </div>
          <h1 class="presentation-title">GreenTech</h1>
          <p class="presentation-subtitle">Gestão Agrícola e Monitoramento Inteligente</p>

          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon">
                <span class="material-symbols-outlined">sensors</span>
              </div>
              <div class="feature-text">
                <h3>Telemetria IoT</h3>
                <p>Acompanhe temperatura, umidade e luminosidade das estufas em tempo real.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">
                <span class="material-symbols-outlined">psychology</span>
              </div>
              <div class="feature-text">
                <h3>IA Integrada</h3>
                <p>Previsão inteligente de estoque e controle autônomo de irrigação.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">
                <span class="material-symbols-outlined">receipt_long</span>
              </div>
              <div class="feature-text">
                <h3>Automação OCR</h3>
                <p>Entrada rápida de notas fiscais de insumos com leitura automatizada.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Lado Direito: Formulário de Login -->
    <section class="login-form-section">
      <div class="login-box">
        <!-- Cabeçalho visível apenas no mobile -->
        <div class="mobile-brand">
          <span class="material-symbols-outlined">eco</span>
          <h2>GreenTech ERP</h2>
        </div>

        <div class="login-header">
          <h2>Bem-vindo de volta!</h2>
          <p>Insira suas credenciais para acessar o painel administrativo.</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username">Usuário</label>
            <div class="input-wrapper">
              <span class="material-symbols-outlined input-icon">person</span>
              <input
                id="username"
                v-model="username"
                type="text"
                required
                placeholder="Digite seu usuário"
                :disabled="carregando"
                autocomplete="username"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">Senha</label>
            <div class="input-wrapper">
              <span class="material-symbols-outlined input-icon">lock</span>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                placeholder="Digite sua senha"
                :disabled="carregando"
                autocomplete="current-password"
              />
            </div>
          </div>

          <button type="submit" class="btn-primary btn-login" :disabled="carregando">
            <span v-if="carregando" class="loading-state">
              <span class="material-symbols-outlined spinning">autorenew</span>
              Acessando...
            </span>
            <span v-else>Entrar no Sistema</span>
          </button>
        </form>

        <p class="login-footer">Projeto Interdisciplinar III — FHO | Uniararas</p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { apiClient } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const username = ref('')
const password = ref('')
const carregando = ref(false)

async function handleLogin() {
  if (carregando.value) return
  carregando.value = true

  try {
    const data = await apiClient('/token/', {
      method: 'POST',
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    })

    authStore.setLoginData(data)
    toastStore.success('Bem-vindo ao GreenTech!')
    router.push({ name: 'dashboard' })
  } catch (error) {
    toastStore.error(error.message || 'Credenciais inválidas.')
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
/* Container Principal */
.login-split-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: #f4f7f6;
  font-family: 'Inter', 'Poppins', sans-serif;
}

/* --- LADO ESQUERDO: Apresentação --- */
.login-presentation {
  flex: 1.2;
  background: linear-gradient(135deg, #1b5e20 0%, #388e3c 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

/* Padrão de fundo opcional para dar textura */
.login-presentation::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.15) 0%, transparent 50%);
  pointer-events: none;
}

.presentation-overlay {
  position: relative;
  z-index: 2;
  padding: 3rem;
  max-width: 600px;
}

.brand-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  margin-bottom: 1.5rem;
}

.icon-logo {
  font-size: 2.5rem;
  color: #ffffff;
}

.presentation-title {
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.5px;
}

.presentation-subtitle {
  font-size: 1.2rem;
  color: #c8e6c9;
  margin: 0 0 3rem 0;
  font-weight: 400;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  background: rgba(0, 0, 0, 0.15);
  padding: 1.25rem;
  border-radius: 12px;
  backdrop-filter: blur(5px);
  transition: transform 0.2s ease;
}

.feature-item:hover {
  transform: translateX(8px);
}

.feature-icon {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.75rem;
  border-radius: 50%;
  display: flex;
}

.feature-text h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.feature-text p {
  margin: 0;
  font-size: 0.9rem;
  color: #e8f5e9;
  line-height: 1.4;
}

/* --- LADO DIREITO: Formulário --- */
.login-form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #ffffff;
}

.login-box {
  width: 100%;
  max-width: 400px;
}

.mobile-brand {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  color: #1b5e20;
}

.mobile-brand .material-symbols-outlined {
  font-size: 2rem;
}

.mobile-brand h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.login-header {
  margin-bottom: 2.5rem;
}

.login-header h2 {
  font-size: 1.8rem;
  color: #263238;
  margin: 0 0 0.5rem 0;
}

.login-header p {
  color: #546e7a;
  margin: 0;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #37474f;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #90a4ae;
  font-size: 1.2rem;
}

.input-wrapper input {
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 2.8rem;
  border: 1px solid #cfd8dc;
  border-radius: 8px;
  font-size: 1rem;
  color: #263238;
  background-color: #f8fafc;
  transition: all 0.2s ease;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #2e7d32;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
}

.input-wrapper input:disabled {
  background-color: #eceff1;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-login {
  margin-top: 1rem;
  width: 100%;
  padding: 0.85rem;
  background-color: #2e7d32;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
  min-height: 48px;
}

.btn-login:hover:not(:disabled) {
  background-color: #1b5e20;
}

.btn-login:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-login:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.login-footer {
  margin-top: 3rem;
  text-align: center;
  font-size: 0.8rem;
  color: #90a4ae;
}

/* --- RESPONSIVIDADE --- */
@media (max-width: 900px) {
  .login-presentation {
    display: none; /* Esconde a apresentação em telas menores */
  }

  .login-split-layout {
    justify-content: center;
    align-items: center;
    padding: 1rem;
  }

  .login-form-section {
    width: 100%;
    max-width: 480px;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    flex: none;
  }

  .mobile-brand {
    display: flex;
  }

  .login-header {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .login-form-section {
    padding: 2rem 1.5rem;
    box-shadow: none;
    border-radius: 0;
    background-color: transparent;
  }

  .login-split-layout {
    background-color: #ffffff;
    align-items: flex-start;
    padding-top: 2rem;
  }
}
</style>
