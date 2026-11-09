<script setup>
import { onMounted } from 'vue'
import { useLocalizacao } from '@/composables/useLocalizacao'

defineProps({
  // O que deixa de funcionar sem a cidade, na tela onde o aviso aparece
  motivo: {
    type: String,
    default: 'a previsão do tempo',
  },
})

const { faltaConfigurar, podeEditar, carregar } = useLocalizacao()

onMounted(() => carregar())
</script>

<template>
  <div v-if="faltaConfigurar" class="aviso-localizacao" role="status">
    <span class="material-symbols-outlined icone">location_off</span>
    <div class="texto">
      <strong>Cidade da propriedade não configurada</strong>
      <p>
        Sem ela, {{ motivo }} não funciona.
        <template v-if="podeEditar">Escolha a cidade em Configurações › Localização.</template>
        <template v-else>Peça a um gerente ou administrador para escolher a cidade em Configurações › Localização.</template>
      </p>
    </div>
    <router-link
      v-if="podeEditar"
      :to="{ name: 'configuracoes', query: { aba: 'localizacao' } }"
      class="btn-configurar"
    >
      Configurar
    </router-link>
  </div>
</template>

<style scoped>
.aviso-localizacao {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 12px;
  background: #fff8e1;
  border: 1px solid #ffe082;
  color: #5d4037;
}

.icone {
  font-size: 1.8rem;
  color: #f57f17;
  flex-shrink: 0;
}

.texto {
  flex: 1;
  min-width: 0;
}

.texto strong {
  display: block;
  font-size: 0.95rem;
  margin-bottom: 2px;
}

.texto p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
}

.btn-configurar {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--primary-green, #3a5a40);
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  text-decoration: none;
}

.btn-configurar:hover {
  filter: brightness(1.1);
}

@media (max-width: 600px) {
  .aviso-localizacao {
    flex-wrap: wrap;
  }

  .btn-configurar {
    width: 100%;
    text-align: center;
  }
}
</style>
