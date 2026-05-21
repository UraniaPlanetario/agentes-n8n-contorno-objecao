# CLAUDE.md — n8n-qualificador-leads-kommo

> **Vínculo canônico:** [`../../tech-labs/ecossistema-tech-labs-canonico/solucoes/ferramenta-qualificador-leads.md`](../../tech-labs/ecossistema-tech-labs-canonico/solucoes/ferramenta-qualificador-leads.md) — solução vendável. Padrão técnico transversal: [`../../tech-labs/ecossistema-tech-labs-canonico/base/classifier.md`](../../tech-labs/ecossistema-tech-labs-canonico/base/classifier.md).

Workflow n8n que recebe `lead_id` Kommo, analisa campos do lead via LLM (gpt-4o, JSON mode), classifica em `sim`/`talvez`/`inconclusivo`/`não` e popula o field Kommo `Qualificado U.labs`.

Triagem barata pra qualificar leads pra Urânia Labs (frente comercial). Roda em batch (~3.000 leads pool D-015) ANTES de qualquer ação custosa (briefing, criação de cópia de lead, etc.). Idempotente: se field já preenchido, workflow para sem custo.

> **Estrutura flat** (sem subpastas): por enquanto é 1 variante só (labs). Se outras frentes (CS, upsell, marketing) precisarem de qualifier com critérios diferentes no futuro, refatoramos pra `<funcao>/<variante>/` igual `n8n-briefing-leads-kommo/`.

---

## Workflow no n8n

| Campo | Valor |
|---|---|
| **ID** | `zkwKMK2GebcivhGU` |
| **Nome** | `[KOMMO] Qualificador U.Labs` |
| **Status** | **Inativo** (criado 2026-05-07 via MCP). Pré-ativação: atribuir credencial OpenAI no node `OpenAI Qualifier`, ativar toggle no editor. |
| **Webhook path** | `/qualificador-labs-kommo` (POST) |
| **URL produção** | `https://n8n-queue-mode-n8n-web.mmjkgs.easypanel.host/webhook/qualificador-labs-kommo` |
| **Body esperado** | `{ "lead_id": <number> }` (Salesbot/script) **ou** payload nativo Kommo `leads[add\|update\|status][0][id]` (form-urlencoded) |
| **Modelo IA** | `gpt-4o` (temperature 0.2, max_tokens 100, JSON mode). Trocado de `gpt-4o-mini` → `gpt-4o` em 2026-05-07 — mini estava conservador demais (interpretava campos vazios como sinais negativos), mesmo com 6 iterações de prompt. |
| **Field Kommo destino** | `Qualificado U.labs` `field_id: 1376198` (enums: `955466 Sim` / `955468 Talvez` / `955470 Inconclusivo` / `955472 Não`) |
| **Idempotência** | **Não. Roda sempre, sobrescreve o field a cada chamada.** Decisão Raphael (2026-05-07): se o lead ganhar mais campos preenchidos depois, dispara de novo e o qualifier reavalia com mais info. Custo extra é desprezível (qualifier ~$0.001/run). |
| **Auditoria** | Cada run cria 1 nota no lead com formato compacto (3 linhas): decisão + campos preenchidos vs total + lista de Tier S vazios. |
| **Error workflow** | `HQGrY3cUDvQJLGMZ` |
| **Webhook fire-and-forget** | `responseMode: 'onReceived'` (sem `Respond to Webhook`). Padrão Kommo da casa — evita timeout retry. |
| **Doc Notion (manutenção)** | https://www.notion.so/35a0690dfef081eb8cf0d362d8acd4f6 — runbook completo (visão geral, fluxo, bugs históricos, histórico de iterações). Hub Documentação > `[KOMMO] Qualificador U.Labs`. |

### Fluxo (15 nodes)

```
Webhook (POST, onReceived) → System Prompt (Set, prompt editável na UI)
  ↓
Validate Input → Get Lead [MS pSUCb5GTYWc4B99I]
  ↓
IF Has Extras → Plan/Get/Aggregate ou Empty Extras
  ↓
Format Qualifier Payload (lê $('System Prompt').first().json.systemPrompt) → OpenAI Qualifier (gpt-4o, JSON)
  ↓
Parse Qualifier (mapeia enum_id) → Save Qualified Field [MS m5K7FZDDvVXDiywo]
  ↓
Build Audit Note (Code: monta texto 3-linhas) → Add Audit Note [MS QYvm2okgK3bQgMbR] → END
```

> **Como editar o prompt:** abrir node `System Prompt` (Set) na UI do n8n, editar campo `systemPrompt`. Fonte de verdade local: `.workflow-build.js > const QUALIFIER_SYSTEM_PROMPT`. Edição direta na UI descasa o build script — sincronizar manualmente quando consolidar.

---

## Edição direta do prompt pelo Raphael (regra de colaboração)

O Raphael pode editar livremente o campo `systemPrompt` no node `System Prompt` (Set) **direto pela UI do n8n** sem avisar. **Live n8n é a fonte de verdade do prompt** — não `.workflow-build.js`.

### O que o Raphael NÃO deve editar pela UI sem avisar
- Nome do node (`System Prompt`) — quebra `$('System Prompt')` no `Format Qualifier Payload`.
- Nome do campo (`systemPrompt`) — mesmo motivo.
- Código JS no `Format Qualifier Payload` (a const `SYSTEM_PROMPT = $('System Prompt')...`) — é cola, não prompt.
- Asteriscos `**...**` dentro do prompt são markdown bold pro GPT — fazem parte do conteúdo, podem ser editados livre.

### Procedimento obrigatório do Claude antes de tocar neste workflow

**Sempre que for regenerar `.workflow.json`, redeployar via MCP, ou modificar qualquer parte do workflow `zkwKMK2GebcivhGU`:**

1. **Primeiro**, fazer fetch do node `System Prompt` live: `mcp__n8n__n8n_get_workflow` com `id: zkwKMK2GebcivhGU`.
2. **Comparar** o valor de `systemPrompt` (em `parameters.assignments.assignments[0].value`) com `const QUALIFIER_SYSTEM_PROMPT` no `.workflow-build.js`.
3. Se divergente: **a versão do n8n live é a verdade**. Sincronizar `.workflow-build.js` com o live antes de qualquer regeneração. NUNCA sobrescrever o live com o build script sem perguntar.
4. Após qualquer mudança estrutural, validar que o workflow ainda roda sem erro (`mcp__n8n__n8n_validate_workflow` ou checar últimas Executions).

Razão: o Raphael itera prompts direto no n8n pra ganhar autonomia. Se eu redeployar do build script descalibrado, perco edição dele sem aviso.

> **Nota:** sem `IF Already Qualified` no início. O fluxo SEMPRE roda e sobrescreve o field, permitindo re-qualificação quando o lead ganhar novos dados no CRM.

---

## Critérios de qualificação (variante atual: labs)

> Esta versão usa critérios da Urânia Labs definidos pelo Raphael em 2026-05-06. Outras frentes (CS, upsell, etc.) podem usar critérios diferentes — refatorar pra subpastas se isso acontecer.

- **HARD GATE:** Tipo de escola = `Particular` → continua avaliação. Não-Particular (Confessional, Pública, Rede) → `não` automático.
- **SINAIS COMBINADOS** (após gate, não excludentes): NPS / avaliação geral, contato operacional identificado, riqueza de feedback no CRM, porte da escola.

Texto completo do prompt em `SYSTEM_PROMPT.md`.

---

## Reuso de microserviços (catálogo `n8n-ms-kommo/`)

| Função | Workflow | ID |
|---|---|---|
| GET lead/contact/company | `[MS-KOMMO] Get Entity` | `pSUCb5GTYWc4B99I` |
| Salvar campos no lead | `[MS-KOMMO] Salvar campos em uma Entity` | `m5K7FZDDvVXDiywo` |

Padrão completo em `../n8n-ms-kommo/CLAUDE.md`.

---

## Linhas vermelhas

1. **Bearer Kommo `skV2BHNge0lsu6UO`** — não criar credencial nova.
2. **Não usar community node** — usar `executeWorkflow` chamando MS.
3. **Webhook fire-and-forget obrigatório** (`responseMode: 'onReceived'`, sem `Respond to Webhook`) — Kommo timeouta em ~2s, workflow demora 5-10s. Padrão da casa.
4. **Sem idempotência por design** — workflow sempre roda e sobrescreve o field 1376198. Cada run gera 1 nova nota de auditoria. Razão: leads ganham campos novos com o tempo (NPS preenchido depois, feedback adicionado), e re-qualificar permite atualizar a decisão. Custo (~$0.005/run no gpt-4o + 1 nota) — em batch de 3000 leads ≈ R$30.
5. **Sem PUT na API n8n** (corrompe UTF-8 dos prompts em PT-BR). Editar via UI ou MCP `n8n_update_partial_workflow`.

---

## Como o qualifier conecta com outros workflows

```
[Batch externo: 3.000 leads] → POST /qualificador-labs-kommo → Workflow Qualificador
                                                                    ↓
                                                              Field "Qualificado U.labs" preenchido
                                                                    ↓
[Automação Kommo nativa: se field=Sim, criar cópia do lead] → POST /briefing-lead-copia-kommo
                                                                    ↓
                                                              Workflow Briefing (em ../n8n-briefing-leads-kommo/labs/)
                                                                    ↓
                                                              Nota no lead-cópia
```

**Referências cruzadas:**
- Consumidor atual do output: `../n8n-briefing-leads-kommo/labs/` (Briefing pós-qualificação U.Labs).
- Outros consumidores futuros: TBD (vendas, CS, marketing podem aproveitar a triagem).

---

## Arquivos nesta pasta

- `CLAUDE.md` — este doc
- `SYSTEM_PROMPT.md` — prompt versionado do qualifier
- `FIELDS.md` — whitelist Tier S/A (compartilhada com briefing por enquanto; pode reduzir no futuro pra cortar tokens)
- `.workflow-build.js` — gerador do JSON
- `.workflow.json` — config exportada (referência local; não sincroniza com n8n)
