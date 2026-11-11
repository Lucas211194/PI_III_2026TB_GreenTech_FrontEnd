<template>
  <PageLayout title="Configurações" subtitle="Preferências do sistema, notificações e parâmetros operacionais.">

    <section class="config-layout">
      <nav class="config-nav">
        <button v-for="aba in abas" :key="aba.id" class="config-nav-item" :class="{ active: abaAtiva === aba.id }" @click="abaAtiva = aba.id">
          <span class="material-symbols-outlined">{{ aba.icon }}</span><span>{{ aba.label }}</span>
        </button>
      </nav>

      <div class="config-content">

        <div v-show="abaAtiva === 'localizacao'" class="config-section active">
          <h3 class="config-section-title"><span class="material-symbols-outlined">location_on</span> Localização da Propriedade</h3>
          <p class="config-descricao">
            Cidade onde ficam as estufas. É usada pela previsão do tempo do painel e pela previsão de chuva
            que a irrigação inteligente considera antes de abrir as válvulas.
          </p>

          <div class="config-group">
            <div class="local-atual" :class="{ vazio: !localizacao }">
              <span class="material-symbols-outlined">{{ localizacao ? 'location_on' : 'location_off' }}</span>
              <div v-if="localizacao">
                <strong>{{ rotuloCidade(localizacao) }}</strong>
                <p>
                  {{ formatarCoordenada(localizacao.latitude, 'lat') }}, {{ formatarCoordenada(localizacao.longitude, 'lon') }}
                  · fuso {{ localizacao.fuso_horario }}
                </p>
                <p v-if="localizacao.atualizado_por_nome" class="local-autor">
                  Definida por {{ localizacao.atualizado_por_nome }} em {{ formatarDataHora(localizacao.atualizado_em) }}
                </p>
              </div>
              <div v-else-if="carregadoLocal">
                <strong>Nenhuma cidade configurada</strong>
                <p>A previsão do tempo e a previsão de chuva da irrigação ficam desligadas até alguém escolher a cidade.</p>
              </div>
              <div v-else><p>Carregando...</p></div>
            </div>

            <p v-if="carregadoLocal && !podeEditar" class="aviso-permissao">
              <span class="material-symbols-outlined">lock</span>
              Só gerentes e administradores podem alterar a cidade da propriedade.
            </p>

            <div v-else-if="carregadoLocal" class="busca-cidade">
              <label for="busca-cidade">{{ localizacao ? 'Trocar cidade' : 'Buscar cidade' }}</label>
              <div class="busca-campo">
                <span class="material-symbols-outlined">search</span>
                <input
                  id="busca-cidade"
                  v-model="termoBusca"
                  type="search"
                  autocomplete="off"
                  placeholder="Digite o nome da cidade, ex.: Mogi Guaçu"
                  @keydown.esc="limparBusca"
                />
                <span v-if="buscando" class="material-symbols-outlined anim-spin">progress_activity</span>
              </div>
              <p v-if="erroBusca" class="busca-mensagem erro">{{ erroBusca }}</p>
              <p v-else-if="termoBusca.trim().length > 0 && termoBusca.trim().length < 3" class="busca-mensagem">
                Digite pelo menos 3 letras.
              </p>
              <p v-else-if="buscaFeita && !buscando && resultados.length === 0" class="busca-mensagem">
                Nenhuma cidade encontrada para "{{ termoBusca.trim() }}".
              </p>

              <ul v-if="resultados.length > 0" class="lista-cidades" role="listbox">
                <li v-for="c in resultados" :key="`${c.latitude},${c.longitude}`">
                  <button
                    type="button"
                    class="opcao-cidade"
                    :class="{ selecionada: selecionada === c }"
                    @click="selecionada = c"
                  >
                    <span class="material-symbols-outlined">location_city</span>
                    <span class="opcao-nome">
                      <strong>{{ c.cidade }}</strong>
                      <small>{{ [c.estado, c.pais].filter(Boolean).join(' · ') }}</small>
                    </span>
                    <small v-if="c.populacao" class="opcao-pop">{{ c.populacao.toLocaleString('pt-BR') }} hab.</small>
                  </button>
                </li>
              </ul>

              <div v-if="selecionada" class="acoes-cidade">
                <button type="button" class="btn-outline" :disabled="salvando" @click="limparBusca">Cancelar</button>
                <button type="button" class="btn-salvar" :disabled="salvando" @click="salvarCidade">
                  {{ salvando ? 'Salvando...' : `Usar ${rotuloCidade(selecionada)}` }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-show="abaAtiva === 'notificacoes'" class="config-section active">
          <h3 class="config-section-title"><span class="material-symbols-outlined">notifications</span> Preferências de Notificação</h3>
          <p class="config-descricao">Gerencie quais alertas você deseja receber no painel.</p>
          <div class="config-group">
            <div class="config-row">
              <div class="config-row-info"><strong>Alertas de Temperatura</strong><p>Avisos para limites excedidos nas estufas.</p></div>
              <ToggleSwitch v-model="config.notifTemp" />
            </div>
            <div class="config-row">
              <div class="config-row-info"><strong>Alertas de Umidade</strong><p>Avisos para variação de umidade no solo.</p></div>
              <ToggleSwitch v-model="config.notifUmid" />
            </div>
          </div>
        </div>

        <div v-show="abaAtiva === 'sistema'" class="config-section active">
          <h3 class="config-section-title"><span class="material-symbols-outlined">tune</span> Configurações do Sistema</h3>
          <p class="config-descricao">Ajustes visuais e comportamento geral da aplicação.</p>
          <div class="config-group">
            <div class="config-row">
              <div class="config-row-info">
                <strong>Modo Escuro (Dark Mode)</strong>
                <p>Altera o tema visual do sistema (em desenvolvimento).</p>
              </div>
              <ToggleSwitch disabled v-model="config.darkMode" />
            </div>
          </div>
        </div>

        <div v-show="abaAtiva === 'dados'" class="config-section active">
          <h3 class="config-section-title"><span class="material-symbols-outlined">database</span> Dados e Backup</h3>
          <p class="config-descricao">Gerencie os dados armazenados na plataforma.</p>
          <div class="config-group">
            <div class="dados-acoes">
              <ActionCard
                icon="download"
                title="Exportar Lotes (CSV)"
                description="Baixe uma cópia de todos os lotes registrados."
              >
                <template #button>
                  <button class="btn-outline">Exportar</button>
                </template>
              </ActionCard>
            </div>
          </div>
        </div>

        <div v-show="abaAtiva === 'sobre'" class="config-section active">
          <h3 class="config-section-title"><span class="material-symbols-outlined">info</span> Sobre o Sistema</h3>
          <div class="sobre-content">
            <div class="sobre-logo">
              <h2 style="color: var(--primary-green); font-family: 'Poppins', sans-serif;">GreenTech OS</h2>
              <p>Sistema Inteligente de Gestão Agrícola</p>
            </div>
            <div class="sobre-grid">
              <div class="sobre-item" v-for="(info, index) in infosSistema" :key="index">
                <label>{{ info.label }}</label>
                <span>{{ info.value }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

  </PageLayout>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageLayout from '@/components/PageLayout.vue';
import ToggleSwitch from "@/components/ToggleSwitch.vue";
import ActionCard from "@/components/ActionCard.vue";
import { useLocalizacao, rotuloCidade } from '@/composables/useLocalizacao';
import { formatarDataHora, mensagemDeErro } from '@/services/apiHelpers';
import { useToastStore } from '@/stores/toast';

const route = useRoute();
const router = useRouter();
const toastStore = useToastStore();

// Estrutura de dados para o menu lateral, evitando repetição de HTML
const abas = [
  { id: 'localizacao', icon: 'location_on', label: 'Localização' },
  { id: 'notificacoes', icon: 'notifications', label: 'Notificações' },
  { id: 'sistema', icon: 'tune', label: 'Sistema' },
  { id: 'dados', icon: 'database', label: 'Dados e Backup' },
  { id: 'sobre', icon: 'info', label: 'Sobre o Sistema' }
];

// Estrutura de dados para a aba "Sobre", mantendo o template limpo
const infosSistema = [
  { label: 'Versão da Aplicação', value: '0.1.0 (Alpha)' },
  { label: 'Stack Frontend', value: 'Vue.js' },
  { label: 'Licença de Uso', value: 'Projeto Acadêmico (FHO)' },
  { label: 'Suporte Técnico', value: 'Acesse o GitHub' }
];

// Os avisos das outras telas trazem ?aba=localizacao para cair direto aqui
const abaDaUrl = (aba) => (abas.some((a) => a.id === aba) ? aba : 'localizacao');
const abaAtiva = ref(abaDaUrl(route.query.aba));
watch(() => route.query.aba, (aba) => { abaAtiva.value = abaDaUrl(aba); });
watch(abaAtiva, (aba) => {
  if (route.query.aba !== aba) router.replace({ query: { ...route.query, aba } });
});

const config = ref({
  notifTemp: true,
  notifUmid: true,
  darkMode: false
});

// --- Localização da propriedade ---
const {
  localizacao, podeEditar, carregado: carregadoLocal, carregar, salvar, buscarCidades,
} = useLocalizacao();

const termoBusca = ref('');
const resultados = ref([]);
const selecionada = ref(null);
const buscando = ref(false);
const buscaFeita = ref(false);
const erroBusca = ref('');
const salvando = ref(false);
let temporizador = null;
let ultimaBusca = 0;

watch(termoBusca, (valor) => {
  clearTimeout(temporizador);
  const termo = valor.trim();
  selecionada.value = null;
  erroBusca.value = '';
  buscaFeita.value = false;
  if (termo.length < 3) {
    resultados.value = [];
    return;
  }
  // Espera o usuário parar de digitar para não consultar a cada letra
  temporizador = setTimeout(() => executarBusca(termo), 400);
});

async function executarBusca(termo) {
  const id = ++ultimaBusca;
  buscando.value = true;
  try {
    const lista = await buscarCidades(termo);
    if (id !== ultimaBusca) return; // chegou uma resposta antiga depois de uma nova busca
    resultados.value = lista;
    if (lista.length === 1) selecionada.value = lista[0];
  } catch (err) {
    if (id !== ultimaBusca) return;
    resultados.value = [];
    erroBusca.value = mensagemDeErro(err, 'Não foi possível buscar cidades agora.');
  } finally {
    if (id === ultimaBusca) {
      buscando.value = false;
      buscaFeita.value = true;
    }
  }
}

function limparBusca() {
  clearTimeout(temporizador);
  ultimaBusca++;
  termoBusca.value = '';
  resultados.value = [];
  selecionada.value = null;
  buscando.value = false;
}

async function salvarCidade() {
  if (!selecionada.value) return;
  salvando.value = true;
  try {
    const { cidade, estado, pais, latitude, longitude, fuso_horario } = selecionada.value;
    await salvar({ cidade, estado, pais, latitude, longitude, fuso_horario });
    toastStore.success(`Cidade da propriedade definida: ${rotuloCidade(localizacao.value)}`);
    limparBusca();
  } catch (err) {
    toastStore.error(mensagemDeErro(err, 'Não foi possível salvar a cidade.'));
  } finally {
    salvando.value = false;
  }
}

function formatarCoordenada(valor, eixo) {
  const n = Number(valor);
  if (Number.isNaN(n)) return '-';
  const hemisferio = eixo === 'lat' ? (n < 0 ? 'S' : 'N') : (n < 0 ? 'O' : 'L');
  return `${Math.abs(n).toFixed(4).replace('.', ',')}° ${hemisferio}`;
}


onMounted(() => carregar(true));
onBeforeUnmount(() => clearTimeout(temporizador));
</script>

<style scoped>
/* --- ESTILOS EXCLUSIVOS DA TELA DE CONFIGURAÇÃO --- */
.config-layout { display: grid; grid-template-columns: 250px 1fr; gap: 30px; align-items: start; }

/* Menu de Navegação */
.config-nav { display: flex; flex-direction: column; gap: 8px; }
.config-nav-item { background: transparent; border: none; padding: 12px 20px; border-radius: 12px; text-align: left; font-size: 0.95rem; font-weight: 600; color: #666; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s; }
.config-nav-item:hover { background: rgba(255,255,255,0.5); }
.config-nav-item.active { background: var(--primary-green); color: white; box-shadow: 0 4px 15px rgba(58,90,64,0.2); }

/* Layout das Abas */
.config-content { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 16px; padding: 30px; min-height: 500px; }
.config-section { animation: fadeIn 0.3s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.config-section-title { font-size: 1.4rem; font-weight: 700; color: var(--primary-dark); display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding-bottom: 15px; border-bottom: 1px solid rgba(0,0,0,0.05); }
.config-descricao { color: #666; margin-bottom: 25px; font-size: 0.95rem; }

/* Linhas de Configuração (Notificações/Sistema) */
.config-group { display: flex; flex-direction: column; gap: 15px; }
.config-row { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.4); padding: 15px 20px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.03); }
.config-row-info strong { display: block; color: var(--primary-dark); font-size: 1rem; margin-bottom: 4px; }
.config-row-info p { margin: 0; color: #777; font-size: 0.85rem; }

/* Localização */
.local-atual { display: flex; align-items: flex-start; gap: 14px; background: rgba(255,255,255,0.6); padding: 18px 20px; border-radius: 12px; border: 1px solid rgba(58,90,64,0.15); }
.local-atual > .material-symbols-outlined { font-size: 2rem; color: var(--primary-green); }
.local-atual.vazio { background: #fff8e1; border-color: #ffe082; }
.local-atual.vazio > .material-symbols-outlined { color: #f57f17; }
.local-atual strong { display: block; color: var(--primary-dark); font-size: 1.05rem; margin-bottom: 4px; }
.local-atual p { margin: 0; color: #666; font-size: 0.85rem; }
.local-atual .local-autor { margin-top: 4px; color: #888; font-size: 0.8rem; }
.aviso-permissao { display: flex; align-items: center; gap: 8px; margin: 0; color: #777; font-size: 0.9rem; }
.busca-cidade label { display: block; font-weight: 700; color: var(--primary-dark); margin-bottom: 8px; }
.busca-campo { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid rgba(0,0,0,0.12); border-radius: 10px; padding: 0 12px; }
.busca-campo:focus-within { border-color: var(--primary-green); box-shadow: 0 0 0 3px rgba(58,90,64,0.12); }
.busca-campo .material-symbols-outlined { color: #888; }
.busca-campo input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; padding: 12px 0; font-size: 0.95rem; }
.busca-mensagem { margin: 8px 0 0; font-size: 0.85rem; color: #777; }
.busca-mensagem.erro { color: #c62828; }
.lista-cidades { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }
.opcao-cidade { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.06); background: rgba(255,255,255,0.6); cursor: pointer; text-align: left; transition: 0.15s; }
.opcao-cidade:hover { background: #fff; }
.opcao-cidade.selecionada { border-color: var(--primary-green); background: rgba(58,90,64,0.08); }
.opcao-cidade > .material-symbols-outlined { color: var(--primary-green); }
.opcao-nome { flex: 1; min-width: 0; }
.opcao-nome strong { display: block; color: var(--primary-dark); }
.opcao-nome small, .opcao-pop { color: #888; font-size: 0.8rem; }
.acoes-cidade { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
.btn-salvar { background: var(--primary-green); color: #fff; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 600; cursor: pointer; }
.btn-salvar:disabled { opacity: 0.6; cursor: wait; }

/* Ações de Dados */
.dados-acoes { display: grid; grid-template-columns: 1fr; gap: 15px; }

/* Aba Sobre */
.sobre-content { text-align: center; padding: 20px; }
.sobre-logo { margin-bottom: 30px; }
.sobre-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left; background: rgba(255,255,255,0.5); padding: 25px; border-radius: 12px; }
.sobre-item label { display: block; font-size: 0.75rem; color: #888; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
.sobre-item span { font-weight: 600; color: var(--primary-dark); }

/* Responsividade */
@media (max-width: 992px) {
  .config-layout { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .sobre-grid { grid-template-columns: 1fr; }
}
</style>
