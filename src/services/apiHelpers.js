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
/**
 * Quantidade no formato brasileiro sem casas decimais sobrando ("130" e não "130.00").
 */
export function formatarQuantidade(valor) {
  return parseNumero(valor).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export function parseNumero(valor, valorPadrao = 0) {
  if (valor === null || valor === undefined || valor === '') {
    return valorPadrao
  }
  const parsed = parseFloat(valor)
  return Number.isNaN(parsed) ? valorPadrao : parsed
}
/**
 * Data "YYYY-MM-DD" do backend como data local (new Date('2026-11-20') cairia no dia anterior no Brasil).
 */
export function dataLocal(iso) {
  if (!iso) return null
  const [ano, mes, dia] = String(iso).slice(0, 10).split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

/** Dias de hoje até a data (negativo se já passou). */
export function diasAte(iso) {
  const data = dataLocal(iso)
  if (!data) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.round((data - hoje) / 86400000)
}

/** Data no formato brasileiro (dd/mm/aaaa); aceita "AAAA-MM-DD" ou data/hora ISO. */
export function formatarData(valor) {
  if (!valor) return '-'
  const data = /^\d{4}-\d{2}-\d{2}$/.test(String(valor)) ? dataLocal(valor) : new Date(valor)
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleDateString('pt-BR')
}

/** Data e hora (dd/mm/aaaa, hh:mm); ano: false omite o ano, segundos: true inclui os segundos. */
export function formatarDataHora(valor, { ano = true, segundos = false } = {}) {
  if (!valor) return '-'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return String(valor)
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    ...(ano && { year: 'numeric' }),
    hour: '2-digit',
    minute: '2-digit',
    ...(segundos && { second: '2-digit' }),
  })
}

export function formatarDataCurta(iso) {
  const data = dataLocal(iso)
  return data ? data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'
}
