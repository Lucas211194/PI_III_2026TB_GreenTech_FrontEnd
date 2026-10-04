# Contratos de Integração Front-end ↔ Back-end (GreenTech ERP)

Este documento descreve os contratos formais de API, restrições operacionais e convenções arquiteturais adotadas pelo front-end Vue 3 para comunicação com a API Django REST Framework (DRF).

---

## 1. Convenções Globais

- **Autenticação:** Baseada em tokens JWT (`SimpleJWT`).
  - Cabeçalho obrigatório: `Authorization: Bearer <access_token>`.
  - Renovação: interceptor Axios escuta `401 Unauthorized` e realiza chamada transparente para `POST /token/refresh/`.
  - Invalidação de sessão (`POST /logout/`): envia `{ refresh: "<refresh_token>" }` para inclusão na blacklist do servidor.
- **Tratamento de Listas (`extrairLista`):**
  - O front-end processa tanto respostas em array simples `[...]` quanto respostas paginadas pelo DRF `{ count, next, previous, results: [...] }` de forma transparente.
- **Tratamento de Erros (`mensagemDeErro`):**
  - Erros do back-end são mapeados priorizando:
    1. Campo de detalhe genérico: `res.data.detail` ou `res.data.mensagem`.
    2. Erros de validação de formulário DRF: chaves de atributos contendo arrays de strings (ex.: `{ nome: ["Este campo é obrigatório."] }`).
    3. Status HTTP (400, 401, 403, 404, 500) com fallback amigável.
- **Formatação Numérica e Datas:**
  - Valores numéricos e decimais de retorno de API passam por `parseNumero` garantindo conversão segura mesmo em valores nulos ou strings formatadas.
  - Datas retornadas no formato ISO 8601 (`YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm:ssZ`) são tratadas com formatação local `pt-BR`.

---

## 2. Tabela de Endpoints e Contratos

| Recurso / Rota | Método | Payloads Esperados / Retornos | Permissões & Regras Específicas |
| :--- | :--- | :--- | :--- |
| `/cultura/` | `GET`, `POST` | `GET`: lista de culturas.<br>`POST`: `{ nome_cultura, tipo, ciclo_dias, espacamento_cm, temperatura_minima, temperatura_maxima, umidade_ideal }` | Criação restrita a perfis autorizados. |
| `/cultura/{id}/` | `GET`, `PUT`, `DELETE` | `PUT`: payload completo da cultura. | Exclusão falha se houver lotes vinculados. |
| `/lotes/` | `GET`, `POST` | `GET`: lista de lotes.<br>`POST`: `{ cultura_id, mesa_id, quantidade, data_plantio, status, validade, fornecedor }` | `cultura_id` e `mesa_id` são inteiros obrigatórios. |
| `/lotes/{id}/` | `GET`, `PUT`, `PATCH`, `DELETE` | `PATCH`: suporta atualização parcial de `{ quantidade, status, validade, fornecedor }`. | Exclusão apenas se não houver colheitas associadas. |
| `/colheita/` | `GET`, `POST` | `GET`: histórico de colheitas.<br>`POST`: `{ lote_id, quantidade_colhida, quantidade_perda }` | **Irreversível:** o servidor define `funcionario_id` (usuário logado) e `data_colheita`, zera a quantidade do lote e muda seu status para `CO`. |
| `/estoque/` | `GET`, `POST` | `GET`: movimentações de lote.<br>`POST`: `{ lote_id, tipo_movimentacao, quantidade, unidade, motivo, observacoes }` | Tipos aceitos: `Entrada`, `Saída`, `Perda`, `Ajuste`. |
| `/insumos/` | `GET`, `POST` | `GET`: catálogo de insumos.<br>`POST`: `{ nome, tipo, unidade, quantidade_atual, estoque_minimo, validade, fornecedor }` | Restrito a `is_gerente` ou `is_admin`. Novos cadastros são criados com saldo 0; o front-end dispara em seguida uma movimentação de `Entrada`. |
| `/insumos/{id}/` | `GET`, `PUT`, `DELETE` | `PUT`: atualiza dados cadastrais.<br>`DELETE`: permitido apenas se `quantidade_atual == 0`. | Restrito a `is_gerente` ou `is_admin`. |
| `/movimentacoes-insumo/` | `GET`, `POST` | `GET`: histórico de insumos.<br>`POST`: `{ insumo_id, tipo_movimentacao, quantidade, motivo, observacoes }` | Tipos `Entrada` e `Ajuste` restritos a `is_gerente`/`is_admin`. `Saída` e `Perda` são abertos a operadores. |
| `/estufa/` | `GET`, `POST` | `GET`: lista de estufas.<br>`POST`: `{ nome_setor, tipo_cultivo, capacidade_maxima }` | Permite agrupamento de mesas por setor. |
| `/estufa/{id}/` | `GET`, `PUT`, `DELETE` | `PUT`: atualização completa. | Exclusão remove vínculo das mesas associadas. |
| `/mesa/` | `GET`, `POST` | `GET`: lista de mesas.<br>`POST`: `{ identificacao, estufa, capacidade_maxima, status_mesa, observacoes }` | `estufa` é chave estrangeira opcional (permite `null`). |
| `/mesa/{id}/` | `GET`, `PUT`, `DELETE` | `PUT`: atualização de identificação e vínculos. | Permite movimentar mesa entre estufas. |
| `/clima/` | `GET`, `POST`, `DELETE` | `GET`: telemetria de sensores climáticos (`temperatura`, `umidade`, `co2`, `luminosidade`, `mesa_id`, `data_registro`). | Sem ordenação nativa; o front-end ordena por `data_registro` decrescente. |
| `/irrigacao/` | `GET`, `POST`, `DELETE` | `GET`: registros de telemetria das válvulas (`valvula_id`, `mesa_id`, `status_atual`, `fluxo_l_min`, `consumo_ciclo_l`, `data_registro`). | A interface agrupa os registros por válvula apresentando o último estado operacional. |
| `/funcionarios/me/` | `GET`, `PATCH` | `GET`: dados do usuário autenticado.<br>`PATCH`: aceita estritamente `{ nome_completo, cpf, telefone }`. | Não expõe ou aceita `cargo`, `data_contratacao`, `foto` ou `status_conta`. |
| `/funcionarios/me/alterar-senha/` | `POST` | `{ senha_atual, nova_senha, confirmar_senha }` | Validação de complexidade executada no DRF. |
| `/funcionarios/` | `GET` | `GET`: lista básica de colaboradores. | Tratamento de privacidade (A16): o front-end retém em memória apenas `{ id, nome }`, descartando CPF e contatos. |
| `/funcionarios/auditoria/` | `GET` | `GET`: logs de alterações administrativas (`id_log`, `usuario`, `acao`, `tabela_afetada`, `registro_afetado`, `detalhes`, `data_hora`). | Retorna `403 Forbidden` para usuários não administradores. O front-end trata este código sem disparar erros genéricos. |
| `/estoque/ocr-nota-fiscal/` | `POST` | `multipart/form-data`: campo `arquivo` (PDF ou imagem). | Processamento e extração OCR de produtos e insumos. |
| `/estoque/confirmar-lote-nf/` | `POST` | `{ fornecedor, numero_nf, itens: [...] }` | Efetiva a entrada de lotes e insumos no estoque. |

---

## 3. Catálogo de Feature Flags em Stand-by

O arquivo `src/config/features.js` controla a ativação de funcionalidades cujos endpoints ainda não estão disponíveis no back-end.

```javascript
export const FEATURES = {
  irrigacaoIA: false,       // Endpoints: /irrigacao/modo/, /irrigacao/decisoes-ia/
  iaChat: false,            // Endpoint: /ia/chat-assistant/
  previsaoEstoque: false,   // Endpoint: /estoque/previsao-prophet/
}