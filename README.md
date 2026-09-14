# GreenTech — Front-End (PI_III_2026TB)

Sistema de Gestão Agrícola e Monitoramento Inteligente de Estufas desenvolvido para o Projeto Interdisciplinar III (Sistemas de Informação — FHO | Uniararas).

---

## Stack Tecnológica

- **Framework:** Vue 3.5 (Composition API com `<script setup>`)
- **Build Tool & Bundler:** Vite 8
- **Roteamento:** Vue Router 5 (com Lazy Loading assíncrono e Route Guards)
- **Gerenciamento de Estado:** Pinia 3
- **Estilização:** CSS Modular em camadas com Design Tokens nativos (`01-tokens` a `06-responsive`)
- **Comunicação:** Client HTTP centralizado (`services/api.js`) com interceptação de tokens JWT e auto-refresh
- **Ícones:** Material Symbols (Google), sem emojis hardcoded na UI

---

## Módulos & Funcionalidades

### 1. ERP Agrícola & Gestão de Campo

- **Autenticação & Controle de Acesso:** Sessão com JWT (`access_token` e `refresh_token`) e controle por papéis via Grupos do Django (Operador, Técnico, Gerente e Administrador).
- **Dashboard Executivo:** Métricas consolidadas de produção, telemetria em tempo real e atalhos rápidos.
- **Culturas, Lotes e Colheitas:** Cadastro, rastreabilidade e acompanhamento do ciclo de vida das plantações, com barra de progresso de maturação por lote.
- **Telemetria de Sensores IoT:** Visualização de temperatura, umidade e luminosidade com tabelas responsivas.
- **Gêmeo Virtual da Estufa:** Mapeamento espacial das mesas de cultivo (`GerenciadorLayoutView`).
- **Auditoria & Rastreabilidade:** Histórico imutável de ações com conversão automática de tabelas em cards no mobile.

### 2. Inteligência Artificial Integrada (Arquitetura Plug-and-Play)

- **RF09 — Previsão de Estoque (Prophet):** Projeção inteligente da curva de consumo e data estimada de término por insumo (`PrevisaoEstoqueWidget`).
- **RF10 — Irrigação Inteligente (Scikit-learn):** Alternância entre modo manual e autônomo baseado em árvores de decisão, com registro de explicabilidade agronômica (`IrrigacaoView`).
- **RF11 — Importação de NF-e via OCR (Tesseract):** Upload de documento fiscal com leitura automatizada e interface de conferência manual antes da entrada em estoque (`NotaFiscalOcrView`).
- **RF12 — Assistente Virtual Inteligente (NLP/LLM):** Chatbot flutuante integrado para consultas de status e comandos operacionais em linguagem natural (`ChatAssistantModal`).

> **Arquitetura Plug-and-Play:** Todos os módulos de IA conectam-se prioritariamente aos endpoints do back-end Django REST Framework. Caso os modelos ou rotas do servidor ainda estejam em desenvolvimento ou temporariamente indisponíveis, a interface ativa um modo de contingência/simulação transparente sem interromper a navegação.

---

## Responsividade & Acessibilidade (WCAG 2.1 AA)

- **Ergonomia de Campo:** Áreas de toque mínimas (_touch targets_) de 44×44px em botões, paginações e seletores para uso seguro em tablets e smartphones.
- **Telas Ultra-largas (Ultrawide / 2K / 4K):** Layout contido com limite de largura de leitura (`max-width: 1440px`).
- **Navegação por Teclado:** Suporte a _Skip to Content_ (atalho para pular navegação) e anéis de foco visíveis (`:focus-visible`).
- **Sensibilidade de Movimento:** Adaptação automática a `prefers-reduced-motion` para usuários sensíveis a animações.
- **Resiliência de Rede:** Detecção de queda de conectividade celular em tempo real com alerta discreto ao operador rural.

---

## Arquitetura de Componentes

Para evitar duplicação entre as telas, o layout comum de toda página autenticada foi extraído em componentes compartilhados:

| Componente               | Responsabilidade                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PageLayout.vue`         | Esqueleto padrão de página: `Sidebar` + `main.main-content` + `DashHeader` + `Footer`. Toda view autenticada renderiza seu conteúdo dentro dele, via slot padrão e slot nomeado `#header-actions` |
| `DashHeader.vue`         | Cabeçalho da página (título, subtítulo e o `MobileMenuButton`); aceita widgets extras (ex: `WeatherWidget`, filtros) via slot                                                                     |
| `Sidebar.vue`            | Menu lateral de navegação; controla sua própria visibilidade no mobile através do composable `useSidebar`                                                                                         |
| `MobileMenuButton.vue`   | Botão de hambúrguer, visível apenas em telas ≤768px; aciona o mesmo estado compartilhado que a `Sidebar` escuta                                                                                   |
| `WeatherWidget.vue`      | Widget de condições climáticas exibido no cabeçalho das páginas operacionais                                                                                                                      |
| `ChatAssistantModal.vue` | Assistente virtual (RF12), montado globalmente no `App.vue` quando o usuário está autenticado                                                                                                     |
| `ToastContainer.vue`     | Notificações globais (sucesso/erro), consumidas via `stores/toast.js`                                                                                                                             |

### Estado compartilhado (composables)

- **`useSidebar.js`** — expõe um `ref` de estado (`isOpen`) definido no escopo do módulo, funcionando como um mini-store: qualquer componente que chame `useSidebar()` compartilha a mesma instância, sem precisar de `provide`/`inject` ou prop-drilling pelas views.

### Convenção para novas telas

Toda nova view autenticada deve seguir este esqueleto mínimo:

```vue
<template>
  <PageLayout subtitle="Descrição curta." title="Título da Página">
    <template #header-actions>
      <WeatherWidget />
      <!-- opcional -->
    </template>

    <section class="conteudo-especifico-da-tela">
      <!-- ... -->
    </section>
  </PageLayout>
</template>
```
