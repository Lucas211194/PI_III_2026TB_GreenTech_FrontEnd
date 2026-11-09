<template>
  <div class="weather-widget">
    <div v-if="!carregado || carregando" class="loading">Buscando clima...</div>

    <!-- Sem cidade configurada: o clima é o da propriedade, não o de onde o usuário está -->
    <component
      :is="podeEditar ? 'router-link' : 'div'"
      v-else-if="!localizacao"
      :to="podeEditar ? { name: 'configuracoes', query: { aba: 'localizacao' } } : undefined"
      class="weather-sem-cidade"
      :title="podeEditar ? 'Escolher a cidade da propriedade' : 'Peça a um gerente para configurar a cidade'"
    >
      <span class="material-symbols-outlined">location_off</span>
      <div>
        <strong>Clima indisponível</strong>
        <p>{{ podeEditar ? 'Configure a cidade da propriedade' : 'Cidade da propriedade não configurada' }}</p>
      </div>
    </component>

    <div v-else-if="temperatura === null" class="weather-content">
      <div class="weather-icon"><span class="material-symbols-outlined">cloud_off</span></div>
      <div class="weather-info">
        <h2>--</h2>
        <p>{{ rotuloCidade(localizacao) }}</p>
      </div>
    </div>

    <div v-else class="weather-content" :title="`Clima em ${rotuloCidade(localizacao)}`">
      <div class="weather-icon">
        <span class="material-symbols-outlined">{{ iconeClima }}</span>
      </div>
      <div class="weather-info">
        <h2>{{ temperatura }}°C</h2>
        <p>{{ condicaoAtual }}</p>
        <small>{{ localizacao.cidade }}</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useLocalizacao, rotuloCidade } from '@/composables/useLocalizacao';

const { localizacao, podeEditar, carregado, carregar } = useLocalizacao();

const temperatura = ref(null);
const codigoClima = ref(null);
const carregando = ref(false);

const interpretarClima = (codigo) => {
  if (codigo === 0) return { texto: 'Céu Limpo', icone: 'sunny' };
  if (codigo >= 1 && codigo <= 3) return { texto: 'Parcialmente Nublado', icone: 'partly_cloudy_day' };
  if (codigo >= 45 && codigo <= 48) return { texto: 'Neblina', icone: 'foggy' };
  if (codigo >= 51 && codigo <= 67) return { texto: 'Chuva Leve/Moderada', icone: 'rainy' };
  if (codigo >= 80 && codigo <= 99) return { texto: 'Tempestade', icone: 'thunderstorm' };
  return { texto: 'Indefinido', icone: 'cloud' };
};

const condicaoAtual = computed(() => interpretarClima(codigoClima.value).texto);
const iconeClima = computed(() => interpretarClima(codigoClima.value).icone);

const TEMPO_EXPIRACAO_MS = 60 * 60 * 1000; // 1 hora

function lerCache(chave) {
  try {
    const salvo = JSON.parse(localStorage.getItem(chave) || 'null');
    if (salvo && Date.now() - salvo.hora < TEMPO_EXPIRACAO_MS) return salvo.dados;
  } catch {
    // cache ilegível ou armazenamento bloqueado: busca de novo
  }
  return null;
}

function gravarCache(chave, dados) {
  try {
    localStorage.setItem(chave, JSON.stringify({ hora: Date.now(), dados }));
  } catch {
    // sem armazenamento local, só não guarda
  }
}

const buscarClima = async (local) => {
  const { latitude: lat, longitude: lon } = local;
  // O cache é por coordenada: trocar a cidade em Configurações não mostra o clima da anterior
  const chave = `greenTech_clima_${lat}_${lon}`;
  carregando.value = true;

  try {
    let dados = lerCache(chave);
    if (!dados) {
      const fuso = encodeURIComponent(local.fuso_horario || 'America/Sao_Paulo');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=${fuso}`;
      const resposta = await fetch(url);
      dados = await resposta.json();
      gravarCache(chave, dados);
    }
    temperatura.value = Math.round(dados.current_weather.temperature);
    codigoClima.value = dados.current_weather.weathercode;
  } catch (erro) {
    console.error('Erro ao buscar o clima da Open-Meteo:', erro);
    temperatura.value = null;
  } finally {
    carregando.value = false;
  }
};

watch(localizacao, (local) => {
  temperatura.value = null;
  if (local) buscarClima(local);
});

onMounted(async () => {
  await carregar();
  if (localizacao.value && temperatura.value === null) buscarClima(localizacao.value);
});
</script>

<style scoped>
.weather-widget {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 15px 25px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}
.weather-content {
  display: flex;
  align-items: center;
  gap: 15px;
}
.weather-icon span {
  font-size: 2.5rem;
  color: #0288d1;
}
.weather-info h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--primary-dark);
}
.weather-info p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
}
.weather-info small {
  display: block;
  font-size: 0.75rem;
  color: #888;
}
.weather-sem-cidade {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #5d4037;
  text-decoration: none;
}
.weather-sem-cidade span {
  font-size: 2rem;
  color: #f57f17;
}
.weather-sem-cidade strong {
  display: block;
  font-size: 0.95rem;
}
.weather-sem-cidade p {
  margin: 0;
  font-size: 0.8rem;
}
a.weather-sem-cidade:hover p {
  text-decoration: underline;
}
</style>
