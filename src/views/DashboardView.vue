<template>
  <PageLayout title="Painel Geral" subtitle="Visão estratégica da infraestrutura, produção e próximas colheitas.">
    <template #header-actions>
      <WeatherWidget />
    </template>

    <section class="dashboard-content">

      <div class="kpi-grid">
        <div class="sensor-card kpi-card">
          <div class="kpi-icon" style="background: rgba(2, 136, 209, 0.1); color: #0288d1;"><span class="material-symbols-outlined">view_in_ar</span></div>
          <div class="kpi-data">
            <h3>{{ estufas.length }}</h3>
            <p>Estufas Ativas</p>
          </div>
        </div>

        <div class="sensor-card kpi-card">
          <div class="kpi-icon" style="background: rgba(230, 81, 0, 0.1); color: #e65100;"><span class="material-symbols-outlined">layers</span></div>
          <div class="kpi-data">
            <h3>{{ mesasOcupadas }} / {{ mesasDeEstufa.length }}</h3>
            <p>Mesas Ocupadas</p>
          </div>
        </div>

        <div class="sensor-card kpi-card">
          <div class="kpi-icon" style="background: rgba(76, 175, 80, 0.1); color: var(--primary-green);"><span class="material-symbols-outlined">psychiatry</span></div>
          <div class="kpi-data">
            <h3>{{ lotesAtivos }}</h3>
            <p>Lotes em Cultivo</p>
          </div>
        </div>

        <router-link to="/alertas" class="sensor-card kpi-card kpi-link">
          <div class="kpi-icon" :style="alertasCriticos > 0 ? 'background: rgba(211, 47, 47, 0.1); color: #c62828;' : 'background: rgba(76, 175, 80, 0.1); color: var(--primary-green);'">
            <span class="material-symbols-outlined">warning</span>
          </div>
          <div class="kpi-data">
            <h3>{{ alertasAtivos.length }}</h3>
            <p>Alertas Ativos<span v-if="alertasCriticos > 0" class="kpi-destaque"> · {{ alertasCriticos }} crítico(s)</span></p>
          </div>
        </router-link>
      </div>

      <div class="sensor-card full-width-card" style="margin-bottom: 25px;">
        <h3 class="card-title">
          <span class="material-symbols-outlined" style="color: var(--primary-dark);">pie_chart</span> Distribuição de Culturas por Estufa
        </h3>

        <EstadoVazio v-if="ocupacaoPorEstufa.length === 0" compacto texto="Nenhuma estufa cadastrada." />

        <div class="estufa-distribution-grid" v-else>
          <div v-for="estufa in ocupacaoPorEstufa" :key="estufa.id" class="estufa-distribution-item">
            <div class="estufa-header">
              <strong>Estufa: {{ estufa.nome_setor || `#${estufa.id}` }}</strong>
              <span class="estufa-total">
                {{ estufa.total > 0 ? formatarQuantidade(estufa.total) + ' plantas' : 'Vazia' }}
                <template v-if="estufa.disponivel > 0"> · {{ formatarQuantidade(estufa.disponivel) }} disponíveis</template>
              </span>
            </div>

            <div class="stacked-bar-container" v-if="estufa.total > 0">
              <div
                v-for="divisao in estufa.divisoes"
                :key="divisao.id"
                class="stacked-bar-segment"
                :style="{ width: divisao.porcentagem + '%', backgroundColor: divisao.cor }"
                :title="`${divisao.nome}: ${divisao.porcentagem}%`"
              >
                <span class="segment-label" v-if="divisao.porcentagem >= 15">{{ divisao.nome }}</span>
              </div>
              <div
                v-if="estufa.disponivel > 0"
                class="stacked-bar-segment segmento-disponivel"
                :style="{ width: estufa.porcentagemDisponivel + '%' }"
                :title="`Disponível: ${formatarQuantidade(estufa.disponivel)} plantas (${estufa.porcentagemDisponivel}%)`"
              >
                <span class="segment-label" v-if="estufa.porcentagemDisponivel >= 15">Disponível</span>
              </div>
            </div>

            <div class="stacked-bar-container empty" v-else>
              <div class="stacked-bar-segment empty-segment" style="width: 100%;">
                {{ estufa.disponivel > 0 ? 'Disponível para Plantio' : 'Sem mesas livres' }}
              </div>
            </div>

            <div class="distribution-legend" v-if="estufa.total > 0 || estufa.disponivel > 0">
              <div v-for="divisao in estufa.divisoes" :key="`leg-${divisao.id}`" class="legend-item">
                <span class="color-dot" :style="{ backgroundColor: divisao.cor }"></span>
                {{ divisao.nome }} <span class="legend-pct">({{ divisao.porcentagem }}%)</span>
              </div>
              <div v-if="estufa.disponivel > 0" class="legend-item">
                <span class="color-dot dot-disponivel"></span>
                Disponível: {{ formatarQuantidade(estufa.disponivel) }} plantas em {{ estufa.mesasLivres }}
                {{ estufa.mesasLivres === 1 ? 'mesa livre' : 'mesas livres' }}
                <span class="legend-pct">({{ estufa.porcentagemDisponivel }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PrevisaoEstoqueWidget :limite="3" compacto />

      <div class="telemetry-grid">
        <div class="sensor-card">
          <h3 class="card-title">
            <span class="material-symbols-outlined" style="color: var(--primary-green);">alarm</span> Maturação e Colheitas
          </h3>

          <EstadoVazio v-if="lotesMaisProximosColheita.length === 0" compacto texto="Nenhum lote em maturação no momento." />

          <div v-else class="list-container">
            <div v-for="l in lotesMaisProximosColheita" :key="l.id" class="list-item">
              <div class="item-header">
                <span>LOTE #{{ l.id }} — {{ l.nomeCultura }}</span>
                <span :style="{ color: l.porcentagem >= 90 ? '#e65100' : 'var(--primary-green)' }">{{ l.porcentagem }}%</span>
              </div>

              <div class="progress-track">
                <div class="progress-fill" :style="{ width: l.porcentagem + '%', background: l.porcentagem >= 90 ? '#e65100' : 'var(--primary-green)' }"></div>
              </div>

              <div class="item-footer">
                <span>Mesa {{ identificacaoMesa(l.mesa_id) }} · {{ formatarQuantidade(l.quantidade) }} plantas</span>
                <span v-if="l.diasRestantes > 0" style="font-weight: 600;">Faltam {{ l.diasRestantes }} dias</span>
                <router-link v-else :to="{ path: '/colheitas', query: { lote: l.id } }" class="btn-colher">
                  Colher agora &rarr;
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <div class="sensor-card">
          <h3 class="card-title">
            <span class="material-symbols-outlined" style="color: #0288d1;">history</span> Atividades Recentes
          </h3>

          <EstadoVazio v-if="movimentacoesRecentes.length === 0" compacto texto="Sem movimentações recentes registradas." />

          <div v-else class="list-container">
            <div v-for="m in movimentacoesRecentes" :key="m.id" class="activity-item">

              <div class="activity-icon" :style="{ background: m.tipo_movimentacao.toLowerCase() === 'entrada' ? '#e8f5e9' : '#ffebee', color: m.tipo_movimentacao.toLowerCase() === 'entrada' ? '#2e7d32' : '#c62828' }">
                <span class="material-symbols-outlined">
                  {{ m.tipo_movimentacao.toLowerCase() === 'entrada' ? 'arrow_downward' : 'arrow_upward' }}
                </span>
              </div>

              <div class="activity-details">
                <div class="activity-name">{{ descricaoLote(m.lote_id) }} — {{ m.motivo }}</div>
                <div class="activity-date">{{ new Date(m.data_movimentacao).toLocaleString('pt-BR') }}</div>
              </div>

              <div class="activity-qty" :style="{ color: m.tipo_movimentacao.toLowerCase() === 'entrada' ? '#2e7d32' : '#c62828' }">
                {{ m.tipo_movimentacao.toLowerCase() === 'entrada' ? '+' : '-' }}{{ formatarQuantidade(m.quantidade) }}
              </div>
            </div>
          </div>

          <div class="card-link-footer">
            <router-link to="/estoque">Ver Histórico Completo &rarr;</router-link>
          </div>
        </div>
      </div>
    </section>
  </PageLayout>
</template>

<script setup>
import EstadoVazio from '@/components/EstadoVazio.vue'
import { ref, computed, onMounted } from 'vue';
import apiClient from '@/services/api';
import { extrairLista, formatarQuantidade } from '@/services/apiHelpers';
import PageLayout from '@/components/PageLayout.vue';
import WeatherWidget from '@/components/WeatherWidget.vue';
import PrevisaoEstoqueWidget from '@/components/PrevisaoEstoqueWidget.vue';

const lotes = ref([]);
const culturas = ref([]);
const estufas = ref([]);
const mesas = ref([]);
const estoque = ref([]);
const alertasAtivos = ref([]);

const coresCulturas = ['#4caf50', '#0288d1', '#ab47bc', '#ff9800', '#009688', '#e91e63', '#795548', '#607d8b'];

// Em cultivo = plantado na mesa; mudas em estoque (ES/BX/DI) não entram na ocupação nem na previsão de colheita
const emCultivo = (lote) => lote.status === 'AT';
const lotesAtivos = computed(() => lotes.value.filter(emCultivo).length);
// NF-AUTO (sem estufa) não é mesa de cultivo
const mesasDeEstufa = computed(() => mesas.value.filter(m => m.estufa));
const mesasOcupadas = computed(() => mesasDeEstufa.value.filter(m => m.status_mesa === 'ocupada').length);
const alertasCriticos = computed(() => alertasAtivos.value.filter(a => a.gravidade === 'critico').length);

function identificacaoMesa(mesaId) {
  const mesa = mesas.value.find(m => m.id === mesaId);
  return mesa ? mesa.identificacao : `#${mesaId}`;
}

function descricaoLote(loteId) {
  const lote = lotes.value.find(l => l.id === loteId);
  if (!lote) return `Lote #${loteId}`;
  const cultura = culturas.value.find(c => c.id === lote.cultura_id);
  return `${cultura ? cultura.nome_cultura : `Lote #${loteId}`} (${identificacaoMesa(lote.mesa_id)})`;
}
const movimentacoesRecentes = computed(() => estoque.value.slice(0, 4));

const ocupacaoPorEstufa = computed(() => {
  return estufas.value.map(estufa => {

    const mesasEstufa = mesas.value.filter(m =>
      String(m.estufa || m.estufa_id) === String(estufa.id)
    );

    const lotesEstufa = lotes.value.filter(l =>
      mesasEstufa.some(m => String(m.id) === String(l.mesa || l.mesa_id)) &&
      emCultivo(l)
    );

    const mapCulturas = {};
    let totalNaEstufa = 0;

    lotesEstufa.forEach(lote => {
      // DRF pode mandar cultura ou cultura_id
      const cid = String(lote.cultura || lote.cultura_id);

      if (!mapCulturas[cid]) {
        const culturaObj = culturas.value.find(c => String(c.id) === cid);
        mapCulturas[cid] = {
          id: cid,
          nome: culturaObj ? culturaObj.nome_cultura : `Cultura #${cid}`,
          quantidade: 0
        };
      }

      const qtd = parseFloat(lote.quantidade) || 0;
      mapCulturas[cid].quantidade += qtd;
      totalNaEstufa += qtd;
    });

    // Espaço disponível = capacidade das mesas livres (mesa ocupada ou em manutenção não recebe plantio)
    const mesasLivres = mesasEstufa.filter(m => m.status_mesa === 'livre');
    const disponivel = mesasLivres.reduce((soma, m) => soma + (parseFloat(m.capacidade_maxima) || 0), 0);
    // A barra representa plantas em cultivo + espaço disponível
    const base = totalNaEstufa + disponivel;

    // 4. Transforma em array calculando a % e associando a cor
    let divisoes = Object.values(mapCulturas).map((c, index) => {
      const porcentagem = base > 0 ? ((c.quantidade / base) * 100).toFixed(1) : 0;
      return {
        ...c,
        porcentagem: parseFloat(porcentagem),
        cor: coresCulturas[index % coresCulturas.length]
      };
    });

    divisoes.sort((a, b) => b.porcentagem - a.porcentagem);

    return {
      ...estufa,
      total: totalNaEstufa,
      disponivel,
      mesasLivres: mesasLivres.length,
      porcentagemDisponivel: base > 0 ? parseFloat(((disponivel / base) * 100).toFixed(1)) : 0,
      divisoes
    };
  });
});

const lotesMaisProximosColheita = computed(() => {
  return lotes.value
    .filter(emCultivo)
    .map(lote => {
      const cultura = culturas.value.find(c => c.id === lote.cultura_id);
      if (!cultura || !(cultura.tempo_medio_colheita > 0)) return null;
      const diasPassados = Math.max(0, Math.floor((new Date() - new Date(lote.data_plantio)) / (1000 * 60 * 60 * 24)));
      const porcentagem = Math.min(100, Math.max(0, Math.round((diasPassados / cultura.tempo_medio_colheita) * 100)));
      const diasRestantes = Math.max(0, cultura.tempo_medio_colheita - diasPassados);
      return { ...lote, nomeCultura: cultura.nome_cultura, porcentagem, diasRestantes };
    })
    .filter(item => item !== null)
    .sort((a, b) => b.porcentagem - a.porcentagem)
    .slice(0, 4);
});

onMounted(async () => {
  // apiClient renova o token sozinho; o fetch direto deixava o painel vazio quando o token expirava
  const listar = (url, params) => apiClient.get(url, { params }).then(res => extrairLista(res.data)).catch(() => []);
  try {
    [lotes.value, culturas.value, estufas.value, mesas.value, estoque.value, alertasAtivos.value] = await Promise.all([
      listar('/lotes/'),
      listar('/cultura/'),
      listar('/estufa/'),
      listar('/mesa/'),
      listar('/estoque/'),
      listar('/alertas/', { status: 'ativo' })
    ]);
  } catch (e) {
    console.error("Erro ao carregar dados do Dashboard:", e);
  }
});
</script>

<style scoped>
/* =========================================
   ESTRUTURA BASE DO DASHBOARD
   ========================================= */


.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.kpi-link {
  text-decoration: none;
  color: inherit;
}

.kpi-destaque {
  color: #c62828;
  font-weight: 600;
}

.btn-colher {
  color: #c62828;
  font-weight: 700;
  text-decoration: none;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  width: 100%;
}

.telemetry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 25px;
  width: 100%;
}

/* =========================================
   COMPONENTES E CARTÕES
   ========================================= */

.sensor-card {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.sensor-card:hover {
  transform: translateY(-5px);
  border-color: var(--primary-green);
}

.full-width-card {
  width: 100%;
}

.kpi-card {
  flex-direction: row;
  align-items: center;
  padding: 20px;
  gap: 15px;
}

.kpi-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon span {
  font-size: 1.8rem;
}

.kpi-data h3 {
  font-size: 1.8rem;
  color: var(--primary-dark);
  margin: 0;
  line-height: 1;
}

.kpi-data p {
  color: #666;
  font-size: 0.85rem;
  margin: 5px 0 0 0;
  font-weight: 500;
}

.card-title {
  color: var(--primary-dark);
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
}

/* =========================================
   GRÁFICO STACKED BAR (Divisão)
   ========================================= */

.estufa-distribution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
  margin-top: 10px;
}

.estufa-distribution-item {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid #eee;
  padding: 15px;
  border-radius: 12px;
}

.estufa-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 0.95rem;
  color: #444;
}

.estufa-total {
  font-weight: bold;
  color: #666;
  font-size: 0.85rem;
}

/* A Barra Principal */
.stacked-bar-container {
  display: flex;
  width: 100%;
  height: 28px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  margin-bottom: 12px;
}

/* Os Segmentos Coloridos */
.stacked-bar-segment {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.6s ease;
  position: relative;
  cursor: pointer;
}

.stacked-bar-segment:hover {
  filter: brightness(1.1);
}

.segment-label {
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 5px;
}

.empty-segment {
  background: #e0e0e0;
  color: #888;
  font-size: 0.8rem;
  font-style: italic;
}

/* Legenda do Gráfico */
.distribution-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.8rem;
  color: #555;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

/* Espaço livre da estufa: em branco, com borda tracejada */
.segmento-disponivel {
  background: #ffffff;
  border: 1px dashed #bdbdbd;
  box-sizing: border-box;
}

.segmento-disponivel .segment-label {
  color: #777;
  text-shadow: none;
  font-weight: 600;
}

.dot-disponivel {
  background: #ffffff;
  border: 1px dashed #9e9e9e;
  box-sizing: border-box;
}

.legend-pct {
  color: #888;
  font-weight: 600;
}

/* =========================================
   LISTAS (Telemetria)
   ========================================= */
.list-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.list-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  font-weight: 700;
  color: #444;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: rgba(0,0,0,0.05);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.5s ease-in-out;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #777;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-icon span {
  font-size: 1.2rem;
}

.activity-details {
  flex: 1;
}

.activity-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--primary-dark);
}

.activity-date {
  font-size: 0.75rem;
  color: #888;
}

.activity-qty {
  font-weight: bold;
  font-size: 1rem;
}

.card-link-footer {
  text-align: center;
  margin-top: auto;
  padding-top: 15px;
}

.card-link-footer a {
  font-size: 0.85rem;
  color: var(--primary-green);
  font-weight: 600;
  text-decoration: none;
}

/* =========================================
   RESPONSIVIDADE (Mobile)
   ========================================= */
@media (max-width: 768px) {


  .estufa-distribution-grid {
    grid-template-columns: 1fr;
  }

  .kpi-grid, .telemetry-grid {
    grid-template-columns: 1fr;
  }

  .item-footer {
    flex-direction: column;
    gap: 2px;
  }
}
</style>
