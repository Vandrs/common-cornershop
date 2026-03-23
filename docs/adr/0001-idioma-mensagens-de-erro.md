# ADR-0001: 🌐 Idioma das mensagens de erro

## Status
Aceito

## Contexto
A API precisa retornar mensagens de erro legíveis por humanos para consumidores (clientes internos, integrações e times de produto). Durante discussões do time surgiram dúvidas sobre qual idioma adotar para os campos que expõem texto destinado a humanos (por exemplo: message, details) e também sobre o formato/estrutura desses erros. É necessário documentar uma decisão clara e rastreável para evitar inconsistências na experiência do consumidor e dívida técnica avoidable.

Requisitos/contexto adicional considerado:
- Consumidores iniciais são majoritariamente internos e no Brasil.
- Convenção de código do repositório: todo código em inglês; documentação em pt-BR (ver [convenções do projeto](../conventions.md)).

## Decisão
As mensagens de erro direcionadas a humanos (campos como message e details em respostas HTTP e payloads de eventos de erro) serão escritas em português do Brasil (pt-BR) na primeira etapa do produto.

Regras explícitas desta decisão:
- O campo identificador do erro (campo error / code / nome do tipo/exceção) permanecerá em inglês, pois é um identificador técnico (ex.: "ProductNotFoundException", "InvalidRequestError").
- Mensagens legíveis por humanos (ex.: message, details[].message) serão em pt-BR.
- Mensagens centralizadas devem ser colocadas em: libs/shared/src/errors/messages/ (mensagens atuais podem começar como arquivos .ts/.json contendo chaves e textos pt-BR).
- Internacionalização (i18n) é reconhecida como necessidade futura, mas está fora do escopo imediato. Este ADR documenta a decisão temporária e o caminho de migração.

Exemplo de payload de erro (padrão recomendado):

```json
{
  "error": "ProductNotFoundException",
  "message": "Produto não encontrado para o id informado",
  "details": [
    { "field": "productId", "message": "Nenhum produto com este id foi localizado" }
  ]
}
```

## Consequências
### Positivas
- Melhor experiência imediata para consumidores internos brasileiros — mensagens claras no idioma de negócio.
- Menor overhead de implementação e complexidade operacional no curto prazo (sem necessidade de infra/arquivos de tradução, lógica de fallback, testes de compatibilidade).

### Negativas / Trade-offs
- Mensagens em pt-BR tornam a futura internacionalização mais trabalhosa: texto pode estar espalhado ou hardcoded em lugares não centralizados.
- Integrações internacionais (se aparecerem) terão experiência degradada até que i18n seja adotado.

### Riscos e Dívida Técnica
- Risco de mensagens espalhadas: se as mensagens não forem centralizadas desde o começo, será necessário esforço de refactor maior.
- Dívida técnica: strings do usuário em pt-BR são uma camada de dívida que exigirá mapeamento para chaves de tradução e possíveis mudanças em payloads de erro.
- Mitigação: centralizar mensagens desde já em libs/shared/src/errors/messages/ e usar constantes/keys mesmo que o valor final seja pt-BR.

## Alternativas Consideradas

| Alternativa | Descrição | Por que foi descartada/observações |
|---|---:|---|
| Inglês desde o início | Usar inglês para todas as mensagens legíveis por humanos | Pro: prepara internacionalização; Con: pior experiência para time/consumidores internos que esperam pt-BR; aumento de atrito para suporte/POs. Considerada, mas não alinhada ao público atual.
| i18n desde o início (ex: i18next) | Implementar suporte a múltiplos idiomas já na primeira entrega | Pro: evita dívida; Con: aumento de complexidade e tempo de entrega (infra, arquivos de tradução, testes, processo de atualização de traduções). Descartada por custo/overhead inicial.
| pt-BR agora, i18n depois (decisão tomada) | Mensagens em pt-BR, centralizadas; planejar migração para i18n | Pro: entrega rápida e boa UX para público atual; Con: dívida técnica que precisa ser gerenciada. Escolhida por equilíbrio entre valor e custo.

## Plano de Migração Futuro (i18n)
Quando for necessário suportar múltiplos idiomas, seguir o plano abaixo.

Passos concretos:
1. Marcar este ADR como "Substituído por ADR-XXXX" (criar novo ADR para i18n) e manter histórico.
2. Adotar uma biblioteca de i18n: sugerimos i18next (por maturidade, eco-sistema Node/TS e suporte a namespaces e pluralização).
3. Estrutura de arquivos de tradução:
   - libs/shared/i18n/locales/pt-BR.json
   - libs/shared/i18n/locales/en-US.json
   - etc.
4. Refatoração incremental:
   - Passo 0 (pré-condição): garantir que todas as mensagens estejam centralizadas em libs/shared/src/errors/messages/ como chaves/constantes. Exemplo:

```ts
// libs/shared/src/errors/messages/product.ts
export const ProductMessages = {
  ProductNotFound: 'Produto não encontrado para o id informado',
}
```

   - Passo 1: adicionar um adaptador mínimo que resolve chaves para textos usando i18next, mantendo fallback para as strings existentes (dual-read): quando uma chave existe no i18next usa-se ela, senão usa-se o texto pt-BR atual.
   - Passo 2: substituir chamadas diretas a textos por lookup por chave (ex: t('errors.product.not_found')). Isso pode ser feito por refactors em módulos individuais com cobertura de testes.
   - Passo 3: publicar traduções em en-US (ou outro idioma alvo) e validar com testes de contrato e e2e com header Accept-Language.
5. API backward-compatibility:
   - A estrutura do JSON (campos error, message, details) não deve mudar. Inicialmente, incluir um novo campo opcional metadata.locale quando aplicável. Exemplo:

```json
{
  "error": "ProductNotFoundException",
  "message": "Produto não encontrado para o id informado",
  "metadata": { "locale": "pt-BR" }
}
```

   - Alternativa mais suave: aceitar header Accept-Language e retornar message no idioma solicitado sem alterar shape.
6. Estratégia de rollout:
   - Migrar serviço por serviço (strangler pattern). Em cada serviço, trocar uso direto de strings por chaves, habilitar i18n por feature flag e monitorar erros/regressões.
   - Para consumidores externos, documentar o novo comportamento e oferecer período de coexistência.
7. Testes e validação:
   - Contract tests que validam shape dos erros (independente do idioma).
   - Testes de integração que validam header Accept-Language/locale behaviour.
8. Substituição do ADR:
   - Ao completar migração, criar ADR-XXXX que documenta suporte a i18n e marcar este ADR como "Substituído por ADR-XXXX".

Observações práticas sobre ferramentas e localização de código:
- Biblioteca sugerida: i18next (node + typescript). Alternativas: FormatJS, lingui. i18next tem suporte a namespaces e carregamento assíncrono de recursos.
- Local sugerida para centralizar mensagens desde já: libs/shared/src/errors/messages/ (trocar para chaves/constantes para facilitar mapeamento futuro).
- Quando migrar, preferir abordagem de mapeamento por chave (key -> localized string) em vez de regex/patching de strings.

Mermaid — visão de alto nível do fluxo de erro e migração

```mermaid
flowchart LR
  Client[Cliente -> API]
  API[API Service]
  Messages[libs/shared/src/errors/messages]
  i18n[i18n adapter (i18next)]

  Client -->|request| API
  API -->|throws| Messages
  Messages -->|pt-BR text| API
  API -->|response (message: pt-BR)| Client

  subgraph Future migration
    Messages -->|refactor to keys| i18n
    i18n -->|localized text| API
  end
```

## Referências
- [Conventions do projeto](../conventions.md)
- i18next: https://www.i18next.com/

[⬆ Voltar para README](../../README.md)
