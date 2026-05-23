# agente-n8n-contorno-objecao

Workflow n8n que recebe `lead_id` Kommo, gera roteiro de **contorno de objeção** via LLM (gpt-4o) e devolve em 2 destinos no lead:

- Custom field `Resp. IA objeção` (`field_id: 1378497`) ← só o roteiro copiável
- Nota no lead ← 3 seções (`ROTEIRO COPIÁVEL` + `POR QUE FUNCIONA` + `PRÓXIMO PASSO`)

> Snapshot exportado do monorepo interno **Urânia Labs · n8n-workflows** em **2026-05-21**. Brainstorm fechado, workflow ainda não criado.

---

## Status

| Fase | Status |
|---|---|
| Brainstorm (12 decisões + Understanding Lock) | ✅ Fechado 2026-05-21 |
| Documentação base (CLAUDE.md, DESIGN.md, FIELDS.md) | ✅ Criada |
| Design técnico detalhado (DESIGN.md §3) | ✅ Preenchido (pipeline, contrato JSON, pseudocódigo, payloads MS, setup pendings) |
| `SYSTEM_PROMPT.md` v0.1 | ⏳ A criar |
| Workflow criado no n8n | ⏳ A criar via MCP |
| Calibração em leads reais (v0.1 → v0.N) | ⏳ |

---

## Quick start

> **Marcos:** abra [`HANDOFF.md`](./HANDOFF.md) primeiro. Ele te orienta antes de ler o resto.

1. **[`HANDOFF.md`](./HANDOFF.md)** — porta de entrada. Checklist de acessos, ordem de leitura, roteiro, quando travar.
2. **[`CLAUDE.md`](./CLAUDE.md)** — runbook operacional. Status, pipeline, MS-KOMMO usados, IDs, linhas vermelhas, regra de colaboração do prompt.
3. **[`DESIGN.md`](./DESIGN.md)** — decisões + design técnico. 12 decisões com alternativas e razão, assumptions, design técnico detalhado (pipeline node a node, contrato JSON, pseudocódigo, payloads MS, pendências de setup), roadmap pós-MVP.
4. **[`FIELDS.md`](./FIELDS.md)** — whitelist de 5 campos + spec do webhook + destinos de output + regras de saída.
5. **[`mapeamento-objecoes-lead-urania.txt`](./mapeamento-objecoes-lead-urania.txt)** — 16 objeções canônicas Urânia. Vai concatenado no system prompt.
6. **[`_refs/`](./_refs/)** — referências críticas do monorepo: catálogo MS-KOMMO (`_refs/n8n-ms-kommo/`), implementação do briefing labs (`_refs/n8n-briefing-leads-kommo-labs/`), implementação do qualificador U.Labs (`_refs/n8n-qualificador-leads-kommo/`).

---

## Próximos passos (pra quem continuar)

1. **Preencher `DESIGN.md` §3** — design técnico detalhado:
   - Pipeline n8n (lista exata de nodes com nomes, tipos, conexões)
   - Contrato JSON do output do LLM
   - Código JS dos nodes `Format Payload`, `Build Note`, `Validate Input`
   - Payloads de chamada dos 3 MS-KOMMO
   - Pendências de setup (field_id de `Nº de alunos`, suporte a `\n` no field 1378497)
2. **Escrever `SYSTEM_PROMPT.md` v0.1** baseado em:
   - Persona + posicionamento Urânia
   - 6 Estruturas (Humana, Tecnológica, Digital, Internacional, Científica, Pedagógica) — mapeamento perfil → estruturas
   - 3 Compromissos invioláveis do time
   - 5 movimentos do contorno (validar → investigar → reframear → ancorar → próximo passo)
   - Concatenação de `mapeamento-objecoes-lead-urania.txt`
   - Vocabulário obrigatório + proibido
   - Anti-padrões
3. **Criar workflow no n8n** via MCP `mcp__n8n__n8n_create_workflow` clonando estrutura do briefing labs (ref em [`_refs/n8n-briefing-leads-kommo-labs/.workflow-build.js`](./_refs/n8n-briefing-leads-kommo-labs/.workflow-build.js)).
4. **Calibração** em 5-10 leads reais — mesmo loop do briefing labs (9 iterações v0.1 → v0.9 documentadas em `_refs/n8n-briefing-leads-kommo-labs/SYSTEM_PROMPT.md`).

---

## 🎓 Onboarding Marcos

Este projeto é também a **primeira incursão do Marcos em n8n + Claude Code + integração Kommo + LLM agents**. O repo foi pensado pra dosar entre "spec pronta pra implementar" e "exercício de aprendizado guiado". Leia esta seção antes de tocar em qualquer outro doc.

### Modelo mental: o que é o n8n da Urânia

**n8n** é uma plataforma de automação orquestradora — workflows visuais conectando serviços (APIs, banco, LLM, Slack, etc.) via **nodes**. Cada node faz uma coisa (ler webhook, chamar HTTP, transformar dados, decidir caminho).

A instância da Urânia (`https://n8n-web.uraniaclass.com.br`) roda em **queue mode** — execuções são enfileiradas e processadas por workers separados (alta concorrência, alta resiliência).

**Workflow** = grafo de nodes ligados. Tem um **trigger** (o que inicia — aqui sempre é Webhook) e zero+ **outputs** (efeitos no mundo — aqui são chamadas pra Kommo).

**🎓 Conceito-chave:** workflows são **JSON sob a UI**. A UI do n8n é uma renderização. Você pode editar via UI ou via API. Editar via API tem armadilhas (PUT corrompe UTF-8 de prompts PT-BR — sempre usar `mcp__n8n__n8n_update_partial_workflow`).

### Webhook + fire-and-forget

Este agente é disparado por um **webhook** — uma URL pública que recebe POST e inicia o workflow. O Kommo (via salesbot manual) chama essa URL.

Padrão da casa: **`responseMode: 'onReceived'`** = workflow responde HTTP `200` imediato e processa em background. Sem isso, o Kommo timeoutaria em 2s e tentaria de novo 3-4× (criando notas duplicadas — sintoma real observado em 2026-05-06).

**🎓 Conceito-chave:** nada de `Respond to Webhook` no fim do fluxo. Erros são tratados *internamente* via tasks/notes no Kommo, não via HTTP response.

### Microserviços n8n (MS-KOMMO)

A Urânia tem **10 workflows utilitários** que encapsulam chamadas Kommo (Get Entity, Add note, Save fields, etc.). Catálogo em [`_refs/n8n-ms-kommo/CLAUDE.md`](./_refs/n8n-ms-kommo/CLAUDE.md).

**Por que microserviços?**
1. **Bearer único compartilhado** (`skV2BHNge0lsu6UO`) — 1 credencial nos MS, 0 em workflows-cliente.
2. **Reuso massivo** — 24+ workflows ativos dependem desses MS.
3. **Isolamento** — mudou contrato Kommo? Atualiza o MS, todos os clientes ganham automaticamente.

Pra chamar um MS, use o node `n8n-nodes-base.executeWorkflow` com `workflowId` do MS. Resultado retorna como saída do node.

**🎓 Conceito-chave:** **NUNCA** fazer HTTP Request direto pra Kommo num workflow novo se já existe MS pro caso. Sempre checar `_refs/n8n-ms-kommo/CLAUDE.md` primeiro.

### Pattern E — ETL+LLM one-shot

A casa classifica agentes em padrões A, B, C, D, E. Este (e briefing labs e qualificador) são **Pattern E**:

- **E**xtract: pega `lead_id` do webhook, faz GET no Kommo (via MS Get Entity)
- **T**ransform: filtra whitelist, monta JSON com 5 campos, injeta data atual, prepara prompt
- **L**LM: chama gpt-4o (1 vez, sem multi-turn) com JSON mode
- **L**oad: salva resultado de volta no Kommo (custom field + nota)

Características de Pattern E:
- **Não-conversacional** — 1 chamada LLM. Sem `chat_id`, sem histórico, sem multi-turn.
- **Idempotência via overwrite** — campos sobrescrevem, notas acumulam.
- **Fire-and-forget** — webhook responde imediato.

Vs Pattern A/B/C: conversacionais com memória (chats com clientes). SIRIUS CONDUZ é A. Este aqui **não é**.

**🎓 Conceito-chave:** se você se pegar pensando "preciso lembrar do contexto da chamada anterior" — você saiu do Pattern E. Volta.

### Tipos de node que aparecem neste agente

Você vai encontrar 6 tipos diferentes ao ler os `.workflow-build.js` em `_refs/`:

- **Webhook** — endpoint HTTP que inicia o workflow
- **Set** — define variáveis estáticas (aqui guarda o `systemPrompt` editável pela UI)
- **Code** — roda JS arbitrário (validação, transformação, parsing)
- **IF** — branch condicional
- **executeWorkflow** — chama outro workflow (assim a gente usa os MS-KOMMO sem duplicar código)
- **OpenAI Chat** (LangChain) — faz a chamada de LLM (gpt-4o), aqui com JSON mode

Não decora — quando bater dúvida em um node específico, abre o equivalente no `.workflow-build.js` do briefing labs e copia o pattern.

### Claude Code + MCP n8n

Você vai usar **Claude Code** (CLI) com o servidor MCP `n8n` configurado. Os comandos mais usados:

| Comando | Uso típico |
|---|---|
| `mcp__n8n__n8n_get_workflow` | Lê workflow inteiro (JSON). Útil pra entender estrutura existente. |
| `mcp__n8n__n8n_create_workflow` | Cria workflow novo a partir de JSON. |
| `mcp__n8n__n8n_update_partial_workflow` | Edita parte de workflow (não usar PUT direto). |
| `mcp__n8n__n8n_executions` | Lista últimas execuções. `action: "get"` + `mode: "error"` ou `"full"` pra debug. |
| `mcp__n8n__n8n_test_workflow` | Dispara workflow com payload de teste. |
| `mcp__n8n__n8n_validate_workflow` | Checa workflow antes de ativar. |
| `mcp__n8n__search_nodes` | Busca tipos de node disponíveis (raro precisar — briefing labs já tem todos). |

**Dica:** quando pedir pro Claude Code criar este workflow, dê contexto explícito:
> "Lê DESIGN.md, FIELDS.md e os 2 `.workflow-build.js` em `_refs/`. Cria o `.workflow-build.js` deste agente clonando o briefing labs (`_refs/n8n-briefing-leads-kommo-labs/.workflow-build.js`) e adicionando o ramo Save Field do qualificador (`_refs/n8n-qualificador-leads-kommo/.workflow-build.js`). Diffs: whitelist é só 5 campos (ver FIELDS.md), LLM com JSON mode, ramo Save Field aponta pro field 1378497."

### Roteiro sugerido de implementação

Não construa tudo de uma vez. Faça em **4 etapas**, cada uma com checkpoint de teste.

1. **Setup** — lê este README, depois `DESIGN.md`, `FIELDS.md` e os 2 `.workflow-build.js` de `_refs/`. Resolve as pendências em `DESIGN.md` §3.7.
2. **Esqueleto E (Extract)** — só a parte que lê o lead do Kommo. Testa com `{lead_id}` real e confirma que volta o JSON esperado antes de seguir.
3. **Transform + LLM** — whitelist dos 5 campos + chamada gpt-4o JSON mode. Escreve `SYSTEM_PROMPT.md` v0.1. Confirma o JSON de saída na aba Executions do n8n.
4. **Load (saída dupla)** — ramo `Save Field` (field 1378497) em paralelo com `Add Note` (nota 3 seções). Confirma no card Kommo de um lead real.

Depois disso entra a **calibração** (loop de 1-2 semanas): dispara em 5-10 leads, sample manual, itera `systemPrompt` v0.1 → v0.N direto na UI do n8n.

### Glossário rápido

**Kommo / CRM**
- **Lead** — registro de cliente potencial. Tem campos default + custom fields.
- **Custom field** — campo personalizado (cada um com `field_id` numérico). Multiselect, text, enum, number, etc.
- **Pipeline** — funil de vendas (ex.: Vendas WhatsApp = `10832516`). Tem stages/status.
- **Salesbot** — automação Kommo nativa. Pode ser triggered manualmente (botão no card) ou por condição.
- **Bearer** — token de autorização. Da Urânia é `skV2BHNge0lsu6UO`, compartilhado.

**n8n**
- **Workflow** — grafo de nodes.
- **Node** — unidade de execução (Webhook, Code, Set, IF, executeWorkflow, etc.).
- **Trigger** — node que inicia o workflow (Webhook, Schedule, Manual, etc.).
- **Queue mode** — execuções enfileiradas, processadas por workers.
- **`executeWorkflow`** — node que chama outro workflow (usado pra MS-KOMMO).
- **`responseMode: 'onReceived'`** — webhook responde HTTP 200 imediato (fire-and-forget).
- **MS-KOMMO** — microserviço n8n parametrizado pra Kommo. 10 deles no catálogo (Get/Save/Add/etc.).
- **Error workflow** — workflow disparado em erro. Padrão da casa: `HQGrY3cUDvQJLGMZ`.

**Urânia / Comercial**
- **6 Estruturas** — alavancas de valor: Humana, Tecnológica, Digital, Internacional, Científica, Pedagógica. Cada perfil de cliente ressoa com 3 delas. Ver `_refs/n8n-briefing-leads-kommo-labs/SYSTEM_PROMPT.md` ou apostilas-fonte.
- **3 Compromissos** — regras invioláveis: (1) sempre diagnóstico antes de preço, (2) ativar 3 Estruturas antes de orçamento, (3) sempre diluir valor por aluno × 12 meses.
- **CONDUZ™** — método comercial proprietário (Compreender · Observar · Nutrir · Direcionar · Unificar · Zelar).
- **ICP Labs** — Particular K-12 (pool D-015) + B2B (shoppings, hotéis, eventos — em validação).

**Pattern**
- **Pattern E** — ETL+LLM one-shot (este, briefing, qualificador).
- **Pattern A/B/C** — conversacionais com memória (SIRIUS CONDUZ).
- **Pattern D** — workflow puramente determinístico (sem LLM).

---

## Convenção de referências neste repo

Algumas refs nos docs aparecem em formato **híbrido**:

- `[recurso](./_refs/X)` → snapshot incluído neste clone (use este aqui).
- `monorepo: ../X` → path original no monorepo Urânia (fonte de verdade — pode estar mais atualizado).

Refs marcadas "(monorepo)" **sem snapshot** apontam pra coisas não-bloqueantes (Agente Dor irmão, SIRIUS CONDUZ, tech-labs canônico, etc.) e podem ser ignoradas pra fins de implementação.

---

## Stack & restrições herdadas (monorepo Urânia)

| Item | Valor |
|---|---|
| **n8n** | `https://n8n-web.uraniaclass.com.br` (queue mode) |
| **Kommo tenant** | `https://uraniaplanetario.kommo.com/api/v4/...` |
| **Bearer Kommo (httpBearerAuth)** | `skV2BHNge0lsu6UO` (compartilhada · expira 31/12/2026 · não criar nova) |
| **Error workflow padrão** | `HQGrY3cUDvQJLGMZ` |
| **Credencial OpenAI** | `OpenAi ([N8N-Q] Agentes Geral)` (compartilhada com briefing + qualifier) |

Detalhes em [`CLAUDE.md`](./CLAUDE.md) seção "Linhas vermelhas".
