# DESIGN — Agente Contorno de Objeção

> **Tipo de doc:** construtivo / histórico. Captura decisões, alternativas avaliadas e design técnico. Leitura rara — só pra auditoria, refator, ou retomar contexto profundo. Runbook operacional do dia-a-dia mora em [`CLAUDE.md`](./CLAUDE.md).
>
> **Status:** brainstorm fechado em **2026-05-21** (Understanding Lock confirmado). Design técnico detalhado pendente — slots marcados em §3.

---

## 1. Decision Log

12 decisões fechadas em 1 sessão de brainstorming. **Em conflito com qualquer doc anterior desta pasta, estas prevalecem.**

| # | Decisão | Alternativas avaliadas | Razão |
|---|---|---|---|
| 1 | **Trigger:** salesbot manual no Kommo | Automation nativa em campo/stage; híbrido | Controle do vendedor; permite re-disparo intencional (cliente trouxe objeção nova); evita N webhooks por save (sintoma observado lead 28416666 em 2026-05-06) |
| 2 | **Granularidade do output:** 1 nota canal-agnóstica | Multi-canal (WhatsApp/call/material direção); modo curto/completo via flag | YAGNI — vendedor adapta roteiro ao canal; flag complica salesbot sem evidência de necessidade |
| 3 | **Arquitetura:** clone do briefing labs + 1 ramo Save Field do qualifier (~14 nodes) | Solo do zero; outro pattern | Reuso máximo de pattern provado (briefing `fk1ikmDHRYmIUOsD`); ramo Save Field replica solução do qualifier (`zkwKMK2GebcivhGU`) |
| 4 | **Modelo LLM:** gpt-4o com credencial `OpenAi ([N8N-Q] Agentes SDR)` existente | Claude Sonnet 4.6 + prompt caching; gpt-4o-mini | Padrão da casa; credencial pronta (0 setup); migração pra Claude diferida pós-calibração quando ganho de cache em volume justificar overhead de nova credencial Anthropic |
| 5 | **Input do webhook:** só `{lead_id}` | `{lead_id, context_extra}` com trecho colado; ler última nota automaticamente | Salesbot Kommo é botão; passar texto livre via salesbot é fricção; campo `Objeções (livre)` já cobre nuance literal |
| 6 | **Output em 2 destinos:** custom field 1378355 (`Resp. IA objeção`) ← roteiro / nota Kommo ← 3 seções | Só nota; só field | Field = ação rápida visível no card; nota = histórico+contexto auditável |
| 7 | **Formato da nota:** 3 seções — `ROTEIRO COPIÁVEL` + `POR QUE FUNCIONA` + `PRÓXIMO PASSO` | 6 seções do briefing original; inverter ordem mantendo 6; 2 modos via flag | Action-first (vendedor com pressa raspa o topo); júnior ainda lê o porquê embaixo; menos token |
| 8 | **Idempotência:** field sobrescreve, notas acumulam | Dedupe por hash em janela temporal | Padrão qualifier; histórico fica nas notas (auditável); último roteiro vale no field |
| 9 | **Formato de saída do LLM:** JSON mode com 3 campos crus, code monta nota com headers fixos | Texto único com delimitadores; JSON com `nota_completa` pré-montada (duplica roteiro) | Menos tokens (sem duplicação, sem markers); headers `ROTEIRO COPIÁVEL` etc. ficam versionados em código JS (mudar layout não exige re-calibrar prompt); padrão JSON mode já provado no qualifier |
| 10 | **Whitelist:** 5 campos — `Objeções` (1376300) + `Objeções (livre)` (1376302) + `Tipo de cliente` (848211) + `Nº de alunos` + `Contato principal.cargo` | Herdar Tier S/A/C do briefing (16+6+12); reduzir só os 4 ruído; agressivo só CORE | Mínimo input pra saída limpa; cada campo a mais é token/run × N runs; campos do briefing/qualifier não calibram contorno (vendedor/consultor, anúncio, UTMs são briefing/qualifier-territory) |
| 11 | **Estrutura física:** pasta solo `n8n-contorno-objecao-kommo/`, irmã de `n8n-ativacao-dor-kommo/` | Família mãe `n8n-coach-comercial-kommo/objecao/+dor/` com SHARED_CONTEXT.md | YAGNI — 2 agentes não justifica mãe; refator quando 3º coach comercial existir; trabalho de migrar 1 agente é trivial |
| 12 | **Pós-MVP deferido:** plugagem Hub + métricas de sucesso + stub canônico tech-labs | Plugar Hub no MVP; definir métricas agora; criar stub já | Padrão briefing labs — calibrar em leads reais primeiro, formalizar Hub/métricas/stub só após v0.N estável; agente roda standalone sem Hub |

---

## 2. Assumptions

1. **Custom field 1378355 (`Resp. IA objeção`) existe no Kommo** e aceita texto longo (~500-1000 chars) sem truncar. Confirmar no setup do workflow.
2. **Credencial `OpenAi ([N8N-Q] Agentes SDR)` tem quota** suficiente pros 3 consumidores (briefing + qualifier + contorno). MVP volume baixo (~5-10 disparos pra calibração).
3. **Volume MVP:** disparos manuais via salesbot; sem batch externo (diferente do qualifier que rodou 3.000 leads).
4. **Error workflow `HQGrY3cUDvQJLGMZ`** aplicável padrão em `settings.errorWorkflow`.
5. **Bearer Kommo `skV2BHNge0lsu6UO`** reusado nos 3 MS-KOMMO chamados (Get Entity, Salvar campos, Add note).

---

## 3. Design técnico detalhado

> **Status:** TBD — slots vazios. A preencher na próxima sessão de construção (depois que workflow for criado no n8n via MCP, ou paralelo à escrita do `SYSTEM_PROMPT.md` v0.1).

### 3.1. Pipeline n8n (nodes)

> TBD — lista exata dos ~14 nodes com nomes, tipos (`n8n-nodes-base.*`), conexões e dependências. Base: estrutura do briefing labs (`fk1ikmDHRYmIUOsD`) + ramo Save Field do qualifier (`zkwKMK2GebcivhGU`).

### 3.2. Contrato JSON do LLM (output)

> TBD — schema exato dos 3 campos retornados (`roteiro`, `por_que_funciona`, `proximo_passo`). Tipos, tamanhos máximos esperados, exemplos de output válido e inválido. Definir se é OpenAI `response_format: json_object` ou JSON Schema mais estrito.

### 3.3. Format Payload — código JS do node

> TBD — código completo do node `Format Payload` (Code). Leitura do `$('System Prompt').first().json.systemPrompt`, injeção de DATA ATUAL no userPrompt, whitelist dos 5 campos, montagem do array de mensagens pro `OpenAI Chat`.

### 3.4. Build Note — código JS do node

> TBD — código completo do node `Build Note` (Code). Parsing do JSON do LLM, montagem da nota com 3 headers fixos (`ROTEIRO COPIÁVEL`, `POR QUE FUNCIONA`, `PRÓXIMO PASSO`).

### 3.5. Payloads de chamada dos 3 MS-KOMMO

> TBD — body exato do `executeWorkflow` pra cada MS:
> - `[MS-KOMMO] Get Entity` (`pSUCb5GTYWc4B99I`)
> - `[MS-KOMMO] Salvar campos em uma Entity` (`m5K7FZDDvVXDiywo`) — inclui mapeamento `field_id: 1378355`
> - `[MS-KOMMO] Add note` (`QYvm2okgK3bQgMbR`)

### 3.6. Validate Input — código JS

> TBD — código exato do node `Validate Input`. Aceita `{lead_id}` direto OU payload nativo Kommo `leads[add|update|status][0][id]` (form-urlencoded — compatibilidade salesbot).

### 3.7. Pendências de setup

> TBD — confirmar antes de criar workflow:
> - `field_id` exato de `Nº de alunos` (não está catalogado em [`_refs/n8n-ms-kommo/kommo-fields.md`](./_refs/n8n-ms-kommo/kommo-fields.md) · monorepo: `../n8n-ms-kommo/kommo-fields.md` — buscar via API)
> - Custom field `Cargo` em contacts (`904188`) — confirmar nome de campo retornado em `_embedded.contacts[0].custom_fields_values`
> - Custom field 1378355 — confirmar limite de chars e suporte a quebras de linha (`\n`)

---

## 4. Roadmap pós-MVP

Os 3 itens abaixo são pós-ativação. Disparar quando agente estiver calibrado (5-10 leads reais com output estável).

- **Plugagem Hub** — registrar em `public.agents` (Supabase Hub `poxolucfvuutvcfpjznt`) com slug `contorno-objecao-kommo`. Configurar `public.agent_access` (departamento Comercial). Padrão análogo: briefing labs, qualificador U.Labs, Sugestor de Datas.
- **Métricas de sucesso** — sample manual de outputs (modelo briefing). Pesquisa interna com vendedores (taxa de aceitação do roteiro pelo vendedor). Conversão de stage no Kommo pós-uso.
- **Stub canônico tech-labs** — criar `tech-labs/ecossistema-tech-labs-canonico/solucoes/ferramenta-contorno-objecao.md`. Mesmo padrão de `ferramenta-briefing-leads.md` e `ferramenta-qualificador-leads.md`.

---

## 5. Histórico

| Data | Evento |
|---|---|
| 2026-05-21 | Brainstorm fechado; 12 decisões logadas; CLAUDE.md/DESIGN.md/FIELDS.md criados; design técnico detalhado e `SYSTEM_PROMPT.md` v0.1 pendentes |
