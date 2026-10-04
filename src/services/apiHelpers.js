/**
 * Utilitários para normalização de dados e tratamento de erros da API.
 */

/**
 * Extrai listas de forma resiliente tanto para respostas diretas (Array)
 * quanto para respostas paginadas do Django Rest Framework ({ results: [...] })
 * ou formatos legados ({ resultados: [...] }).
 *
 * @param {any} payload Dados retornados pela API
 * @returns {Array} Lista de itens extraída ou array vazio em caso de dado inválido
 */
export function extrairLista(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.results)) return payload.results
  if (Array.isArray(payload.resultados)) return payload.resultados
  return []
}

/**
 * Converte erros do Axios/DRF ({ error }, { detail }, dicionários de validação de campos
 * ou Error genérico) em uma única string amigável em português.
 *
 * @param {any} err Erro capturado no bloco catch
 * @param {string} fallback Mensagem padrão se não houver detalhe específico
 * @returns {string} Mensagem legível para exibição ao usuário
 */
export function mensagemDeErro(err, fallback = 'Ocorreu um erro ao processar a requisição.') {
  if (!err) return fallback

  const data = err.response?.data

  if (data) {
    if (typeof data === 'string') {
      return data
    }

    if (data.error && typeof data.error === 'string') {
      return data.error
    }

    if (data.detail && typeof data.detail === 'string') {
      return data.detail
    }

    if (typeof data === 'object') {
      const mensagens = []
      for (const [campo, valor] of Object.entries(data)) {
        const campoFormatado = campo === 'non_field_errors' ? '' : `${campo}: `
        if (Array.isArray(valor)) {
          mensagens.push(`${campoFormatado}${valor.join(' ')}`)
        } else if (typeof valor === 'string') {
          mensagens.push(`${campoFormatado}${valor}`)
        }
      }

      if (mensagens.length > 0) {
        return mensagens.join(' | ')
      }
    }
  }

  if (err.message) {
    if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão ou se a API está online.'
    }
    return err.message
  }

  return fallback
}

/**
 * Converte com segurança valores vindos do back-end (strings como "25.50" de DecimalField)
 * para número float do JavaScript.
 *
 * @param {any} valor Valor a ser convertido
 * @param {number} valorPadrao Valor retornado em caso de NaN ou nulo
 * @returns {number} Número convertido
 */
export function parseNumero(valor, valorPadrao = 0) {
  if (valor === null || valor === undefined || valor === '') {
    return valorPadrao
  }
  const parsed = parseFloat(valor)
  return Number.isNaN(parsed) ? valorPadrao : parsed
}