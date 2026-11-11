<template>
  <div class="grafico-barras" :style="{ height }">
    <Bar :data="dados" :options="opcoes" :aria-label="titulo" role="img" />
  </div>
</template>

<script setup>
// Gráfico de barras com o visual padrão do sistema. Cada série: { label, data, cor }
// rotuloTooltip(ctx, valor) personaliza a linha do tooltip; horizontal deixa os rótulos no eixo vertical
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip } from 'chart.js'

Chart.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip)

const props = defineProps({
  rotulos: { type: Array, required: true },
  series: { type: Array, required: true },
  titulo: { type: String, default: '' },
  unidade: { type: String, default: '' },
  empilhado: { type: Boolean, default: false },
  horizontal: { type: Boolean, default: false },
  rotuloTooltip: { type: Function, default: null },
  height: { type: String, default: '260px' },
})

const numero = (v) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 })

const dados = computed(() => ({
  labels: props.rotulos,
  datasets: props.series.map(({ label, data, cor }) => ({
    label,
    data,
    backgroundColor: cor,
    borderRadius: 6,
    maxBarThickness: 40,
  })),
}))

const opcoes = computed(() => {
  const [eixoCategoria, eixoValor] = props.horizontal ? ['y', 'x'] : ['x', 'y']
  const rotulo = (ctx) => {
    const valor = ctx.parsed[eixoValor]
    if (props.rotuloTooltip) return props.rotuloTooltip(ctx, valor)
    return `${ctx.dataset.label}: ${numero(valor)} ${props.unidade}`.trim()
  }
  return {
    indexAxis: eixoCategoria,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: { callbacks: { label: rotulo } },
    },
    scales: {
      [eixoCategoria]: { stacked: props.empilhado, grid: { display: false } },
      [eixoValor]: {
        stacked: props.empilhado,
        beginAtZero: true,
        ticks: { callback: (v) => numero(v) },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
    },
  }
})
</script>

<style scoped>
.grafico-barras {
  position: relative;
}
</style>
