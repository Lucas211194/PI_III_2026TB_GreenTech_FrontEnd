<template>
  <main class="login-scene">
    <!-- Fundo decorativo: gradiente suave + folhas flutuantes -->
    <div class="scene-backdrop" aria-hidden="true">
      <span
        class="leaf"
        v-for="leaf in leaves"
        :key="leaf.id"
        :style="{
          top: leaf.top,
          left: leaf.left,
          '--float-duration': leaf.duration,
          '--float-delay': leaf.delay,
          '--float-size': leaf.size,
        }"
      >
        <span class="material-symbols-outlined">eco</span>
      </span>
    </div>

    <div class="login-card">
      <span class="card-top-accent" aria-hidden="true"></span>

      <div class="card-header">
        <div class="brand-badge" aria-hidden="true">
          <span class="material-symbols-outlined">eco</span>
        </div>
        <h1>GreenTech</h1>
        <p class="tagline">Cultive dados. Colha decisões.</p>
        <p class="subtitle">Gestão agrícola e monitoramento inteligente de estufas.</p>
      </div>

      <ul class="feature-strip" aria-label="Funcionalidades do sistema">
        <li>
          <span class="feature-icon feature-icon--primary">
            <span class="material-symbols-outlined" aria-hidden="true">sensors</span>
          </span>
          <span>Telemetria IoT</span>
        </li>
        <li>
          <span class="feature-icon feature-icon--accent">
            <span class="material-symbols-outlined" aria-hidden="true">psychology</span>
          </span>
          <span>IA integrada</span>
        </li>
        <li>
          <span class="feature-icon feature-icon--primary">
            <span class="material-symbols-outlined" aria-hidden="true">receipt_long</span>
          </span>
          <span>OCR de notas</span>
        </li>
      </ul>

      <form @submit.prevent="handleLogin" class="login-form" novalidate>
        <div class="field-group field-group--1">
          <div class="field">
            <span class="material-symbols-outlined field-icon" aria-hidden="true">person</span>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              placeholder="Usuário"
              :disabled="carregando"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="field-group field-group--2">
          <div class="field">
            <span class="material-symbols-outlined field-icon" aria-hidden="true">lock</span>
            <input
              id="password"
              v-model="password"
              :type="mostrarSenha ? 'text' : 'password'"
              required
              placeholder="Senha"
              :disabled="carregando"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="toggle-visibility"
              @click="mostrarSenha = !mostrarSenha"
              :aria-pressed="mostrarSenha"
              :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
            >
              <span class="material-symbols-outlined" aria-hidden="true">
                {{ mostrarSenha ? 'visibility_off' : 'visibility' }}
              </span>
            </button>
          </div>
        </div>

        <label class="remember-row field-group field-group--3">
          <input type="checkbox" v-model="lembrarUsuario" />
          <span>Lembrar meu usuário</span>
        </label>

        <button type="submit" class="btn-login field-group field-group--4" :disabled="carregando">
          <span v-if="carregando" class="loading-state">
            <span class="material-symbols-outlined spinning" aria-hidden="true">autorenew</span>
            Acessando...
          </span>
          <span v-else>Entrar no sistema</span>
        </button>
      </form>

      <p class="card-footer field-group field-group--5">
        Projeto Interdisciplinar III — FHO | Uniararas
      </p>
    </div>
  </main>
</template>

<script setup>
import { apiClient } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const username = ref('')
const password = ref('')
const carregando = ref(false)
const mostrarSenha = ref(false)
const lembrarUsuario = ref(false)

const USUARIO_SALVO_KEY = 'greenTech_usuario_lembrado'

// Folhas decorativas do fundo: geradas uma vez, com posição e tempo de animação variados
const leaves = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  top: `${8 + Math.random() * 80}%`,
  left: `${4 + Math.random() * 90}%`,
  duration: `${7 + Math.random() * 5}s`,
  delay: `${Math.random() * 4}s`,
  size: `${1.1 + Math.random() * 1.3}rem`,
}))

onMounted(() => {
  const usuarioSalvo = localStorage.getItem(USUARIO_SALVO_KEY)
  if (usuarioSalvo) {
    username.value = usuarioSalvo
    lembrarUsuario.value = true
  }
})

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

    if (lembrarUsuario.value) {
      localStorage.setItem(USUARIO_SALVO_KEY, username.value)
    } else {
      localStorage.removeItem(USUARIO_SALVO_KEY)
    }

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
.login-scene {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  overflow: hidden;
  font-family: var(--font-body);
  background:
    radial-gradient(
      circle at 12% 15%,
      color-mix(in srgb, var(--color-accent) 40%, transparent) 0%,
      transparent 45%
    ),
    radial-gradient(
      circle at 88% 12%,
      color-mix(in srgb, var(--color-primary) 55%, transparent) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 20% 90%,
      color-mix(in srgb, var(--color-primary) 45%, transparent) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 90% 85%,
      color-mix(in srgb, var(--color-accent) 35%, transparent) 0%,
      transparent 45%
    ),
    linear-gradient(
      160deg,
      var(--color-primary-dark) 0%,
      var(--color-primary) 45%,
      var(--color-accent) 100%
    );
}

/* --- Fundo: "linhas de plantio" + folhas flutuantes --- */
.scene-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.scene-backdrop::before {
  content: '';
  position: absolute;
  inset: -10%;
  background-image: repeating-linear-gradient(
    -35deg,
    rgba(255, 255, 255, 0.07) 0px,
    rgba(255, 255, 255, 0.07) 1px,
    transparent 1px,
    transparent 90px
  );
}

.leaf {
  position: absolute;
  display: block;
  color: var(--color-text-inverse);
  opacity: 0.22;
  font-size: var(--float-size);
  animation: float-leaf var(--float-duration) ease-in-out var(--float-delay) infinite;
}

.leaf .material-symbols-outlined {
  font-size: inherit;
  display: block;
}

@keyframes float-leaf {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-18px) rotate(8deg);
  }
}

/* --- Cartão de login --- */
.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  background: var(--color-surface-glass-strong);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-3xl);
  box-shadow: var(--shadow-panel);
  padding: var(--space-8) var(--space-7) var(--space-7);
  overflow: hidden;
}

.card-top-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-primary));
}

.card-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.brand-badge {
  width: 56px;
  height: 56px;
  margin: 0 auto var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: var(--color-text-inverse);
  box-shadow: var(--shadow-md);
}

.brand-badge .material-symbols-outlined {
  font-size: 1.6rem;
}

.card-header h1 {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.5rem;
  color: var(--color-primary-dark);
  margin: 0 0 var(--space-2) 0;
}

.tagline {
  margin: 0;
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-accent);
}

.subtitle {
  margin: var(--space-1) 0 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

/* Tira de funcionalidades: reforça a identidade com as cores da marca */
.feature-strip {
  list-style: none;
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-2);
  margin: 0 0 var(--space-6);
  background: color-mix(in srgb, var(--color-bg) 65%, var(--color-surface));
  border-radius: var(--radius-lg);
}

.feature-strip li {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  text-align: center;
}

.feature-strip span:last-child {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--color-text-muted);
  line-height: 1.2;
}

.feature-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.feature-icon .material-symbols-outlined {
  font-size: 1.1rem;
}

.feature-icon--primary {
  background: color-mix(in srgb, var(--color-primary) 16%, transparent);
  color: var(--color-primary);
}

.feature-icon--accent {
  background: color-mix(in srgb, var(--color-accent) 16%, transparent);
  color: var(--color-accent);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Entrada escalonada: cada elemento aparece em sequência ao carregar */
.field-group {
  opacity: 0;
  transform: translateY(8px);
  animation: sprout-in 0.4s ease forwards;
}

.field-group--1 {
  animation-delay: 0.1s;
}
.field-group--2 {
  animation-delay: 0.2s;
}
.field-group--3 {
  animation-delay: 0.3s;
}
.field-group--4 {
  animation-delay: 0.4s;
}
.field-group--5 {
  animation-delay: 0.5s;
}

@keyframes sprout-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Campos em pílula, com preenchimento suave */
.field {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: var(--space-5);
  font-size: 1.15rem;
  color: var(--color-text-soft);
  transition: color var(--transition-fast);
}

.field:focus-within .field-icon {
  color: var(--color-primary);
}

.field input {
  width: 100%;
  padding: 0.85rem var(--space-5) 0.85rem calc(var(--space-5) * 2 + 0.15rem);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-pill);
  background-color: color-mix(in srgb, var(--color-bg) 55%, var(--color-surface));
  font-size: 0.95rem;
  font-family: var(--font-body);
  color: var(--color-text);
  transition: var(--transition-fast);
}

.field input::placeholder {
  color: var(--color-text-soft);
}

.field input:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: var(--color-surface);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.field input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-visibility {
  position: absolute;
  right: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--color-text-soft);
  cursor: pointer;
}

.toggle-visibility:hover {
  color: var(--color-text-muted);
}

.toggle-visibility:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

/* Lembrar usuário */
.remember-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-left: var(--space-2);
  font-size: 0.82rem;
  color: var(--color-text-muted);
  cursor: pointer;
  user-select: none;
}

.remember-row input[type='checkbox'] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
  cursor: pointer;
}

/* Botão principal, em degradê */
.btn-login {
  margin-top: var(--space-2);
  padding: 0.85rem;
  border: none;
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-text-inverse);
  font-size: 0.98rem;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  min-height: 48px;
  transition:
    filter var(--transition-fast),
    transform 0.1s;
}

.btn-login:hover:not(:disabled) {
  filter: brightness(1.08);
}

.btn-login:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-login:focus-visible {
  outline: 2px solid var(--color-primary-dark);
  outline-offset: 2px;
}

.btn-login:disabled {
  background: var(--color-text-soft);
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.card-footer {
  margin: var(--space-6) 0 0;
  text-align: center;
  font-size: 0.72rem;
  color: var(--color-text-soft);
}

/* --- Responsividade --- */
@media (max-width: 480px) {
  .login-card {
    padding: var(--space-7) var(--space-5) var(--space-6);
  }

  .feature-strip {
    padding: var(--space-3) var(--space-1);
  }

  .feature-strip span:last-child {
    font-size: 0.62rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .leaf {
    animation: none;
  }

  .field-group {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
