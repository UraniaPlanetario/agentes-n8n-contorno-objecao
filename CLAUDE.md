# CLAUDE.md — n8n-contorno-objecao-kommo

Workflow n8n que recebe `lead_id` Kommo, lê 5 campos do lead via LLM (gpt-4o), gera roteiro de contorno calibrado e devolve em 2 destinos: custom field `Resp. IA objeção` (1378497) + nota no lead.

Coach de objeção pra vendedor comercial Urânia. Dispara via **salesbot manual** no Kommo após o vendedor preencher `Objeções` + `Objeções (livre)`.

> **Família funcional:** este agente · **Agente Dor** (réplica futura, monorepo Urânia · fora deste repo) · **SIRIUS CONDUZ** (conversacional, família arquitetural diferente · monorepo). Separação estrita: cada agente faz UMA coisa cognitiva.
>
> **Por que foi decidido assim** (12 decisões do brainstorm 2026-05-21): ver [`DESIGN.md`](./DESIGN.md).
>
> **Convenção de paths neste repo:**
> - Refs **críticas** (MS-KOMMO, briefing labs, qualifier) aparecem em formato **híbrido**: `[recurso](./_refs/X) · monorepo: ../X`. No clone isolado (Marcos) o link `_refs/` é a fonte; no monorepo Urânia o `../` é a fonte de verdade — `_refs/` é snapshot que pode dar drift e precisa ser re-sincronizado antes de cada push.
> - Refs **informativas** (Agente Dor, SIRIUS, tech-labs) só apontam pro monorepo — não foram snapshotted, não bloqueiam o MVP.

---

## Status

| Campo | Valor |
|---|---|
| **Status** | Spec fechado (2026-05-21). Workflow ainda não criado. |
| **Padrão arquitetural** | E (ETL+LLM one-shot) — clone do briefing labs + 1 ramo Save Field do qualifier |
| **Próxima ação** | Criar workflow no n8n via MCP + escrever `SYSTEM_PROMPT.md` v0.1 |

---

## Workflow no n8n

| Campo | Valor |
|---|---|
| **ID** | `AhnbRqc4wKX7UyHB` (criado 2026-05-22 via MCP, **ATIVO desde 2026-05-23** — aguardando salesbot Kommo) |
| **Nome** | `[KOMMO] Agente Contorno Objeção` |
| **Webhook path** | `/contorno-objecao-kommo` (POST) |
| **URL produção** | `https://n8n-queue-mode-n8n-web.mmjkgs.easypanel.host/webhook/contorno-objecao-kommo` |
| **responseMode** | `onReceived` (fire-and-forget — Kommo timeouta em 2s) |
| **Body esperado** | `{ "lead_id": <number> }` ou payload nativo Kommo `leads[add\|update\|status][0][id]` |
| **Modelo IA** | gpt-4o (temp 0.4, max_tokens ~1500-2000, JSON mode) |
| **Credencial OpenAI** | `OpenAi ([N8N-Q] Agentes Geral)` (compartilhada — briefing + qualifier + este) |
| **Error workflow** | `HQGrY3cUDvQJLGMZ` |
| **Onde mora o prompt** | Node Set `System Prompt`, campo `systemPrompt` — editável direto na UI do n8n |

---

## Pipeline (~14 nodes)

```
Webhook (onReceived) → System Prompt (Set, editável UI) → Validate Input
  → Get Lead [MS pSUCb5GTYWc4B99I] → IF Has Extras → Plan/Get/Aggregate ou Empty
  → Format Payload (lê $('System Prompt') + injeta DATA ATUAL) → OpenAI Chat (JSON mode)
  → Parse Output (separa roteiro vs nota completa) →
       ├─→ Save Field [MS m5K7FZDDvVXDiywo] (field 1378497 ← roteiro)
       └─→ Build Note → Add Note [MS QYvm2okgK3bQgMbR] (nota ← 3 seções)
```

Detalhes técnicos exatos (pipeline node a node, contrato JSON do LLM, pseudocódigo dos 3 nodes Code, payloads dos 3 MS, pendências de setup) → ver [`DESIGN.md`](./DESIGN.md) §3.

---

## MS-KOMMO usados (3)

| MS | n8n ID | Função neste agente |
|---|---|---|
| `[MS-KOMMO] Get Entity` | `pSUCb5GTYWc4B99I` | GET lead + contatos por ID |
| `[MS-KOMMO] Salvar campos em uma Entity` | `m5K7FZDDvVXDiywo` | Atualiza field 1378497 com o roteiro |
| `[MS-KOMMO] Add note` | `QYvm2okgK3bQgMbR` | Cria nota com 3 seções |

Padrão de chamada via `executeWorkflow` (`mode='each'`, `waitForSubWorkflow=true`). Detalhes I/O por MS → [`_refs/n8n-ms-kommo/ms/`](./_refs/n8n-ms-kommo/ms/) · monorepo: `../n8n-ms-kommo/ms/`.

---

## Input / Output (resumo)

**Input:** 5 campos lidos do lead. Whitelist e justificativa completa em [`FIELDS.md`](./FIELDS.md).

**Output em 2 destinos:**
- Custom field **`Resp. IA objeção`** (`field_id: 1378497`, text) ← **só o ROTEIRO COPIÁVEL** (sobrescreve a cada run)
- **Nota no lead** (`note_type=service_message`) ← 3 seções: `ROTEIRO COPIÁVEL` + `POR QUE FUNCIONA` + `PRÓXIMO PASSO` (acumula — cada run = 1 nota nova)

---

## Linhas vermelhas

### Herdadas da casa (ver `../CLAUDE.md`)

1. **Bearer Kommo `skV2BHNge0lsu6UO`** — não criar credencial nova.
2. **Não usar** community node `n8n-nodes-kommo.kommo`. Padrão: `executeWorkflow` chamando um MS.
3. **Webhook `onReceived`** — sem `Respond to Webhook` no fim do fluxo. Kommo retentaria 3-4× = N notas duplicadas (sintoma observado lead 28416666 em 2026-05-06).
4. **Sem PUT na API n8n** (corrompe UTF-8 dos prompts PT-BR). Editar via UI ou MCP `n8n_update_partial_workflow`.

### Específicas deste agente

5. **Vocabulário Urânia proibido no output:** `evento`, `atividade`, `diária` (sentido isolado), `sessão isolada`, `planetário inflável`. Aparecer = bug crítico do prompt, força calibração.
6. **Nunca sugerir desconto solto** — só "política de modalidade". Se LLM produzir, marca v0.X → v0.Y obrigatória.
7. **Não inventar dado.** Campo vazio = omitir trecho. Placeholders (`[a definir]`, `[não especificado]`) são bug.
8. **Separação Dor vs Objeção.** Esse agente é só objeção. Lógica de ativação de dor vive em workflow separado (monorepo Urânia).

---

## Edição direta do prompt pelo Raphael

Raphael edita o `systemPrompt` no node Set `System Prompt` **direto pela UI do n8n** sem avisar. **Live n8n é fonte de verdade do prompt** — não `.workflow-build.js`.

### NÃO editar pela UI sem avisar

- Nome do node (`System Prompt`) — quebra `$('System Prompt')` no `Format Payload`.
- Nome do campo (`systemPrompt`) — mesmo motivo.
- Código JS no `Format Payload` — é cola, não prompt.

### Procedimento Claude antes de regenerar `.workflow.json` ou redeployar

1. Fetch live: `mcp__n8n__n8n_get_workflow` com `id: <workflow_id>`.
2. Comparar `parameters.assignments.assignments[0].value` (node Set) com `const SYSTEM_PROMPT` em `.workflow-build.js`.
3. Se divergente: **versão live é a verdade.** Sincronizar `.workflow-build.js` antes de regenerar. Nunca sobrescrever live com build script sem perguntar.
4. Validar via `n8n_validate_workflow` ou checar últimas Executions.

---

## Pós-MVP (deferido)

- **Plugagem Hub** — registrar em `public.agents` após calibração estável (slug `contorno-objecao-kommo`).
- **Métricas de sucesso** — sample manual + pesquisa interna com vendedores + conversão de stage no Kommo.
- **Stub canônico** — criar `ferramenta-contorno-objecao.md` no repositório de soluções canônicas tech-labs (monorepo Urânia · padrão briefing/qualifier).

Detalhe → [`DESIGN.md`](./DESIGN.md) §4.

---

## Arquivos nesta pasta

- `HANDOFF.md` — porta de entrada do Marcos (checklist de acessos, ordem de leitura, quando travar).
- `README.md` — overview + onboarding pedagógico n8n/MCP/Pattern E + roteiro de implementação + glossário.
- `CLAUDE.md` — runbook operacional (este arquivo).
- `DESIGN.md` — decisões + design técnico detalhado (construtivo/histórico).
- `FIELDS.md` — 5 campos lidos + payload do webhook + destinos de output.
- `SYSTEM_PROMPT.md` — prompt versionado (**a criar**).
- `mapeamento-objecoes-lead-urania.txt` — fonte literal das 16 objeções (vai concatenada no system prompt).
- `_refs/` — snapshot crítico do monorepo (MS-KOMMO + briefing labs + qualificador).

---

## Ponteiros

### Implementações de referência (críticas — snapshotted)

| Recurso | Snapshot (clone) | Monorepo (fonte de verdade) |
|---|---|---|
| Briefing labs (pattern E + Set node prompt) | [`_refs/n8n-briefing-leads-kommo-labs/`](./_refs/n8n-briefing-leads-kommo-labs/) | `../n8n-briefing-leads-kommo/labs/` |
| Qualificador U.Labs (ramo Save Field) | [`_refs/n8n-qualificador-leads-kommo/`](./_refs/n8n-qualificador-leads-kommo/) | `../n8n-qualificador-leads-kommo/` |
| MS Get Entity | [`_refs/n8n-ms-kommo/ms/get-entity.md`](./_refs/n8n-ms-kommo/ms/get-entity.md) | `../n8n-ms-kommo/ms/get-entity.md` |
| MS Salvar campos | [`_refs/n8n-ms-kommo/ms/salvar-campos.md`](./_refs/n8n-ms-kommo/ms/salvar-campos.md) | `../n8n-ms-kommo/ms/salvar-campos.md` |
| MS Add note | [`_refs/n8n-ms-kommo/ms/add-note.md`](./_refs/n8n-ms-kommo/ms/add-note.md) | `../n8n-ms-kommo/ms/add-note.md` |
| Catálogo MS-KOMMO + Bearer + error workflow | [`_refs/n8n-ms-kommo/CLAUDE.md`](./_refs/n8n-ms-kommo/CLAUDE.md) | `../n8n-ms-kommo/CLAUDE.md` |
| IDs operacionais Kommo (custom fields, pipelines, enums) | [`_refs/n8n-ms-kommo/kommo-fields.md`](./_refs/n8n-ms-kommo/kommo-fields.md) | `../n8n-ms-kommo/kommo-fields.md` |

### Informativas (só monorepo Urânia · não snapshotted)

- Padrão arquitetural E + família+variantes: `../../tech-labs/ecossistema-tech-labs-canonico/base/padroes-de-agente.md`
- Agente Dor (réplica futura): `../n8n-ativacao-dor-kommo/`
- SIRIUS CONDUZ (família diferente, conversacional): `../n8n-sirius-conduz/`
- Regras herdadas da casa (Bearer Kommo, error workflow padrão): `../CLAUDE.md`
