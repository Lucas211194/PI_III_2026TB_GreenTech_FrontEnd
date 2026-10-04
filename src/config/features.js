/**
 * Configuração de Feature Flags para o modelo Stand-by / Plug-and-Play.
 * Quando desligadas (false), a interface oculta ou desabilita os controles
 * e exibe o componente RecursoIndisponivel, sem realizar chamadas de rede.
 */

const parseEnvBool = (value) => value === 'true'

export const FEATURES = Object.freeze({
  iaChat: parseEnvBool(import.meta.env.VITE_FEATURE_IA_CHAT),
  previsaoEstoque: parseEnvBool(import.meta.env.VITE_FEATURE_PREVISAO_ESTOQUE),
  irrigacaoIA: parseEnvBool(import.meta.env.VITE_FEATURE_IRRIGACAO_IA),
  dashboardResumo: parseEnvBool(import.meta.env.VITE_FEATURE_DASHBOARD_RESUMO),
  ocrImagem: parseEnvBool(import.meta.env.VITE_FEATURE_OCR_IMAGEM)
})

export default FEATURES