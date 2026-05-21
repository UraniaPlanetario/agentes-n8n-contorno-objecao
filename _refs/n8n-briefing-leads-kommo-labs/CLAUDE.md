# CLAUDE.md — labs (briefing comercial pool D-015)

Variante **labs** da família `n8n-briefing-leads-kommo`. Padrão arquitetural compartilhado vive em `../CLAUDE.md` (mãe) — leia primeiro.

---

## Objetivo desta variante

Briefing comercial pré-ligação para leads do **pool warm D-015** (escolas que chegaram via tráfego pago Urânia + já contrataram evento de planetário). Disparado manualmente pelo Raphael via Salesbot, em batches.

**Foco do prompt:** discovery comercial híbrido (D-016), SPIN antecipado, separação entry point vs canal financeiro, match hipótese dor→produto, quebra-gelo do evento obrigatório.

**Calibrado com:** `negocios-tech-labs/SALES-PLAYBOOK-WARM.md`, `DISCOVERY.md`, `PRODUCTS.md`, `CONTEXT.md`.

---

## Workflow no n8n

| Campo | Valor |
|---|---|
| **ID** | `fk1ikmDHRYmIUOsD` |
| **Nome** | `[KOMMO] Briefing pós-qualificação U.Labs` |
| **Status** | **Ativo** (criado 2026-05-07 via MCP, ativado em seguida). |
| **Nodes** | **13** (briefing-only — qualifier saiu pra `../../n8n-qualificador-leads-kommo/`; node `System Prompt` adicionado em 2026-05-07) |
| **Webhook path** | `/webhook/briefing-lead-copia-kommo` (POST) |
| **URL produção** | `https://n8n-queue-mode-n8n-web.mmjkgs.easypanel.host/webhook/briefing-lead-copia-kommo` |
| **Body esperado** | `{ "lead_id": <number> }` (lead-cópia criada pela automação Kommo) **ou** payload nativo Kommo `leads[add\|update\|status][0][id]` |
| **Modelo IA** | `gpt-4o` (temp 0.4, max_tokens 1200, retry 3x) |
| **Briefing prompt ativo** | **v0.9** (vertical-agnóstico — ICP K-12 + B2B, anti-alucinação de data reforçado, DIREÇÃO consolidada com QUEBRA-GELO em 1 seção — ver `SYSTEM_PROMPT.md`) |
| **Onde mora o prompt** | Node `System Prompt` (Set), campo `systemPrompt`. **Editável direto na UI do n8n.** Fonte de verdade local: `.workflow-build.js > const SYSTEM_PROMPT`. |
| **Error workflow** | `HQGrY3cUDvQJLGMZ` |
| **Trigger esperado** | Automação Kommo nativa que cria lead-cópia quando `Qualificado U.labs = Sim` (configuração manual no Kommo após ativar) |

### Fluxo do workflow (13 nodes)

```
Webhook → System Prompt (Set, prompt editável) → Validate → Get Lead → IF Has Extras → Plan/Get/Aggregate ou Empty Extras
  ↓
Format Payload (lê $('System Prompt') + DATA ATUAL injetada) → OpenAI Chat → Build Note → Add Note [MS QYvm2okgK3bQgMbR] → END
```

> **Nota arquitetural:** este workflow recebe o `lead_id` da **CÓPIA** do lead (criada pela automação Kommo nativa após o qualificador setar `Qualificado U.labs = Sim` no lead original). A nota do briefing é criada na cópia, mantendo o lead original limpo. Ver `../../n8n-qualificador-leads-kommo/CLAUDE.md` pro fluxo upstream completo.

### Workflow anterior (arquivado)

`HyViCWWRUcTSq4tR` — `[KOMMO] Briefing de Lead via GPT` (briefing + qualifier combinado, 18 nodes). **Desativado em 2026-05-07** após split em 2 workflows separados. Mantido como referência histórica.

---

## Pré-ativação (checklist) — concluído 2026-05-06

1. [x] Credencial OpenAI auto-assignada (`OpenAi ([N8N-Q] Agentes SDR)`) — usuário aceitou.
2. [x] Workflow ativado.
3. [x] Webhook configurado no Kommo apontando pra URL produção.
4. [x] Disparado em lead real (`28416666` — Criar-te, Ubatuba-SP).

---

## Próximos passos

### Concluído (2026-05-06 e 2026-05-07)

1. ✅ Spec consolidado, workflow original criado, credencial OpenAI atribuída, ativado — ID `HyViCWWRUcTSq4tR` (desativado em 2026-05-07 após split).
2. ✅ Iterações de prompt v0.1 → v0.9 (atual). Análise por iteração + outputs reais documentados em `SYSTEM_PROMPT.md`.
3. ✅ Investigado 4 notas duplicadas no lead 28416666 → causa: webhook Kommo timeout vs duração workflow → fix `responseMode: onReceived` aplicado.
4. ✅ Qualifier branch adicionado em 2026-05-06 (workflow `HyViCWWRUcTSq4tR` ficou com 18 nodes).
5. ✅ **Split arquitetural em 2026-05-07** (decisão Raphael): qualificador vira workflow standalone (em `../../n8n-qualificador-leads-kommo/`) pra rodar em batch nos 3.000 leads. Briefing roda só nos qualificados via lead-cópia.

### Pendente — pré-ativação (manual no n8n editor)

6. ⏳ Atribuir credencial OpenAI no node `OpenAI Chat` deste workflow (`fk1ikmDHRYmIUOsD`). Mesma do antigo: `OpenAi ([N8N-Q] Agentes SDR)`.
7. ⏳ Ativar workflow `fk1ikmDHRYmIUOsD` (toggle).
8. ⏳ No qualificador (`../../n8n-qualificador-leads-kommo/`): mesma coisa — atribuir credencial OpenAI no `OpenAI Qualifier` + ativar.

### Pendente — configuração Kommo (manual)

9. ⏳ **Reapontar trigger atual**: o bot/webhook Kommo que apontava pro path antigo `/webhook/briefing-lead-kommo` agora deve apontar pro **qualificador** em `/webhook/qualificador-labs-kommo` (workflow `zkwKMK2GebcivhGU`).
10. ⏳ **Configurar automação Kommo nativa**: quando `Qualificado U.labs = Sim` (enum_id 955466) no lead, criar cópia do lead E disparar webhook em `/webhook/briefing-lead-copia-kommo` com o `lead_id` da CÓPIA. (Cópia preserva o lead original limpo, briefing fica na cópia.)

### Pendente — testes

11. ⏳ **Testar 4 cenários do qualificador** (no workflow A novo, ID `zkwKMK2GebcivhGU`):
    - Lead Particular bom (NPS alto, feedback rico): esperado `sim` no field 1376198.
    - Lead Particular pobre (sem NPS, sem feedback): esperado `inconclusivo`.
    - Lead Confessional/Pública/Rede: esperado `não` (gate).
    - Lead já qualificado (re-trigger): esperado workflow para no IF Already Qualified.
12. ⏳ **Testar briefing pós-qualificação** (workflow B `fk1ikmDHRYmIUOsD`): após cópia ser criada, deve gerar briefing v0.9 com vocabulário neutro e sem alucinar data quando `Data da Apresentação` estiver vazia.
13. ⏳ Iterar prompts conforme outputs reais (qualifier v0.6 → v0.7 e briefing v0.9 → v0.10 se necessário).
14. ⏳ Atualizar `n8n-ms-kommo/kommo-fields.md` com field `Qualificado U.labs` (1376198) — não catalogado lá ainda.

---

## Histórico de iterações do briefing prompt

Detalhe completo (outputs renderizados, matriz issue × lead, decisões de cada iteração) em `SYSTEM_PROMPT.md`. Resumo:

| Versão | Data | Status | Mudança principal |
|---|---|---|---|
| v0.1 | 2026-05-05 | Arquivado | Inicial. Testado em 3 leads (Criar-te, Sta Vitória, Deltha). 5 issues catalogadas em 3/3. |
| v0.2 | 2026-05-06 | Arquivado | PT 100%, anti-suposição, Urânia Class fixado como encaixe, regra de citação literal. |
| v0.3 | 2026-05-06 | Arquivado | Adicionou LEITURA DE CONTATO + DIREÇÃO DE ABORDAGEM. Removeu ENCAIXE DE PRODUTO + título "Briefing —". |
| v0.4 | 2026-05-06 | Arquivado | Removeu CONTEXTO redundante com card Kommo. Pergunta-âncora obrigatoriamente aberta. |
| v0.5 | 2026-05-07 | Arquivado | Bloco DISTÂNCIA TEMPORAL standalone + injeção `DATA ATUAL` no userPrompt. |
| v0.6 | 2026-05-07 | Arquivado | Calibração temporal inlinada na DIREÇÃO + PONTOS DE ATENÇÃO. Removido `Tipo` do output. |
| v0.7 | 2026-05-07 | Arquivado | Calibração temporal sem aspas (eram template-pra-copiar). |
| v0.8 | 2026-05-07 | Arquivado | Lista de campos pra ancoragem em HIPÓTESES DE DOR reorganizada em 5 grupos por utilidade (Dor #1, Objeções #2). |
| **v0.9** | **2026-05-07** | **ATIVO** (no workflow `fk1ikmDHRYmIUOsD`, hospedado no node Set `System Prompt`) | Vertical-agnóstico (K-12 + B2B). Anti-alucinação de data reforçado (`Data da Apresentação` literal ou OMITIR). DIREÇÃO consolidada com QUEBRA-GELO em 1 seção. Jargão K-12 removido das instruções. |

---

## Edição direta do prompt pelo Raphael (regra de colaboração)

O Raphael pode editar livremente o campo `systemPrompt` no node `System Prompt` (Set) **direto pela UI do n8n** sem avisar. **Live n8n é a fonte de verdade do prompt** — não `.workflow-build.js`.

### O que NÃO editar pela UI sem avisar
- Nome do node (`System Prompt`) — quebra `$('System Prompt')` no `Format Payload`.
- Nome do campo (`systemPrompt`) — mesmo motivo.
- Código JS no `Format Payload` (a const `SYSTEM_PROMPT = $('System Prompt')...`) — é cola, não prompt.
- Asteriscos `**...**` dentro do prompt são markdown bold pro GPT — fazem parte do conteúdo, podem ser editados livre.

### Procedimento obrigatório do Claude antes de tocar neste workflow

**Sempre que for regenerar `.workflow.json`, redeployar via MCP, ou modificar qualquer parte do workflow `fk1ikmDHRYmIUOsD`:**

1. **Primeiro**, fazer fetch do node `System Prompt` live: `mcp__n8n__n8n_get_workflow` com `id: fk1ikmDHRYmIUOsD`.
2. **Comparar** o valor de `systemPrompt` (em `parameters.assignments.assignments[0].value`) com `const SYSTEM_PROMPT` no `.workflow-build.js`.
3. Se divergente: **a versão do n8n live é a verdade**. Sincronizar `.workflow-build.js` com o live antes de qualquer regeneração. NUNCA sobrescrever o live com o build script sem perguntar.
4. Após qualquer mudança estrutural, validar que o workflow ainda roda sem erro (`mcp__n8n__n8n_validate_workflow` ou checar últimas Executions).

Razão: o Raphael itera prompts direto no n8n pra ganhar autonomia. Se eu redeployar do build script descalibrado, perco edição dele sem aviso.

---

## Arquivos nesta pasta

- `CLAUDE.md` — este doc (específico da variante labs)
- `SYSTEM_PROMPT.md` — prompt v0.9 versionado (com histórico v0.1 → v0.9 + nota sobre Set node)
- `FIELDS.md` — whitelist Tier S/A/C
- `.workflow-build.js` — gerador do JSON (rodar `node .workflow-build.js` pra regenerar `.workflow.json` com prompt atualizado)
- `.workflow.json` — config exportada do workflow (referência; não sincroniza com n8n)
