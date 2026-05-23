# HANDOFF — Marcos

> **Comece por este doc.** Ele te orienta antes de mergulhar nos outros.

Olá Marcos! Este é seu primeiro projeto com **Claude Code + n8n + integração Kommo**. O repo foi preparado pra dosar entre "spec pronta" e "exercício de aprendizado guiado" — você vai construir o agente, mas com guard rails. Quando tiver dúvida, leia primeiro, pergunte ao Raphael depois.

---

## O projeto em 30 segundos

Você vai construir um **agente de IA** (workflow n8n) que ajuda o vendedor da Urânia a **contornar objeções de leads** no CRM Kommo. Fluxo:

1. Vendedor preenche 2 campos no card do lead (`Objeções` + `Objeções (livre)`).
2. Vendedor clica num botão no Kommo (salesbot manual) → dispara webhook.
3. n8n lê o lead, manda pro gpt-4o, recebe um **roteiro de contorno** calibrado.
4. n8n salva o roteiro em 2 lugares no card do lead: **custom field `Resp. IA objeção`** (só o roteiro) + **nota** (roteiro + porquê + próximo passo).
5. Vendedor lê a nota, copia o roteiro, usa na próxima conversa com o cliente.

**Pattern arquitetural:** ETL+LLM one-shot (Pattern E da casa). Não-conversacional. Já existem 2 agentes em produção com esse mesmo pattern (briefing labs + qualificador U.Labs) — você vai cloná-los como base.

---

## Status

| Fase | Status |
|---|---|
| Brainstorm + decisões (12 decisões, Understanding Lock) | ✅ Fechado 2026-05-21 |
| Documentação base (CLAUDE.md, DESIGN.md, FIELDS.md, README.md) | ✅ Pronta |
| Snapshot crítico em `_refs/` (briefing labs, qualificador, MS-KOMMO) | ✅ Pronto |
| Pendências técnicas de setup | ⏳ A resolver (DESIGN.md §3.7) |
| `SYSTEM_PROMPT.md` v0.1 | ⏳ Você cria |
| Workflow no n8n | ⏳ Você cria via MCP |
| Calibração em leads reais (v0.1 → v0.N) | ⏳ Loop após criação |

---

## Antes de começar — checklist de acessos

Confirme com o Raphael que você tem:

- [ ] **Conta n8n** na instância Urânia (`https://n8n-web.uraniaclass.com.br`) com permissão de criar workflow
- [ ] **Conta Kommo** (`uraniaplanetario.kommo.com`) com permissão de leitura/edição de leads
- [ ] **Claude Code** instalado e configurado com **MCP n8n** habilitado (`mcp__n8n__*` deve aparecer no `/mcp` do CC)
- [ ] **Bearer Kommo** disponível pro MCP — credencial id `skV2BHNge0lsu6UO` (não criar nova; ela está compartilhada na instância n8n)
- [ ] **Push autorizado** neste repo GitHub (`UraniaPlanetario/agente-n8n-contorno-objecao`)

Se faltar algum, **chama o Raphael antes de começar a codar**.

---

## Ordem de leitura (faça nessa sequência)

1. **`HANDOFF.md`** (este doc) — você tá aqui.
2. **[`README.md`](./README.md)** — onboarding pedagógico em n8n + Pattern E + MCP + glossário. Lê com calma.
3. **[`DESIGN.md`](./DESIGN.md)** — começa pelas seções §1 (Decision Log) e §2 (Assumptions). Depois §3 (design técnico detalhado).
4. **[`FIELDS.md`](./FIELDS.md)** — input/output do agente (5 campos + payload webhook + destinos).
5. **[`mapeamento-objecoes-lead-urania.txt`](./mapeamento-objecoes-lead-urania.txt)** — 16 objeções canônicas Urânia. Vai concatenado no system prompt.
6. **[`CLAUDE.md`](./CLAUDE.md)** — runbook operacional (linhas vermelhas, regras de colaboração, ponteiros).
7. **[`_refs/n8n-briefing-leads-kommo-labs/CLAUDE.md`](./_refs/n8n-briefing-leads-kommo-labs/CLAUDE.md)** — entender o pattern do briefing labs (referência mais próxima).
8. **[`_refs/n8n-briefing-leads-kommo-labs/.workflow-build.js`](./_refs/n8n-briefing-leads-kommo-labs/.workflow-build.js)** — código real (você vai clonar adaptando).

Estimativa: 2-3h pra absorver tudo. Não pule.

---

## Roteiro de implementação resumido

Detalhe em README seção "Roteiro sugerido de implementação". Resumo:

1. **Setup** — leituras + resolver pendências `DESIGN.md` §3.7 (field_id de `Nº de alunos`, suporte a `\n` no field 1378497).
2. **Esqueleto E (Extract)** — só a parte que lê o lead. Testa antes de seguir.
3. **Transform + LLM** — whitelist 5 campos + JSON mode. Escreve `SYSTEM_PROMPT.md` v0.1.
4. **Load (saída dupla)** — `Save Field` (1378497) + `Add Note`. Testa em lead real.
5. **Calibração** — 5-10 leads, sample manual, itera v0.1 → v0.N.

Cada etapa termina com **checkpoint de teste** (`mcp__n8n__n8n_test_workflow` + olhar Executions). Não pule os checkpoints.

---

## Linhas vermelhas (não viole)

1. **Bearer Kommo `skV2BHNge0lsu6UO`** — não criar credencial nova. 24+ workflows dependem dela.
2. **Webhook `responseMode: 'onReceived'`** — sem `Respond to Webhook` no fim do fluxo. Senão Kommo retenta e cria notas duplicadas.
3. **Sem PUT na API n8n** (corrompe UTF-8 PT-BR). Sempre `mcp__n8n__n8n_update_partial_workflow`.
4. **Error workflow `HQGrY3cUDvQJLGMZ`** — setar em `settings.errorWorkflow` quando criar o workflow.
5. **Vocabulário Urânia proibido no output** (`evento`, `atividade`, `diária` isolada, `sessão isolada`, `planetário inflável`). Se LLM produzir, é bug de prompt.
6. **Não inventar dado** — campo vazio = omitir trecho, sem placeholders `[a definir]`.
7. **Não misturar lógica de Dor** — esse agente é só Objeção. Agente Dor é workflow separado (monorepo Urânia).

Detalhe completo em `CLAUDE.md` seção "Linhas vermelhas".

---

## Quando travar

| Tipo de dúvida | Onde resolver |
|---|---|
| n8n / Pattern E / MCP n8n | Lê `README.md` → consulta `_refs/n8n-briefing-leads-kommo-labs/` → Raphael |
| Integração Kommo (custom fields, MS) | Lê `_refs/n8n-ms-kommo/` → Raphael |
| Estratégia de contorno (qual fala, qual Estrutura ativar) | `mapeamento-objecoes-lead-urania.txt` + apostilas Urânia (pedir pro Raphael) |
| Erro durante execução do workflow | `mcp__n8n__n8n_executions` com `mode: "error"` → debug → Raphael se travar |
| Pergunta de produto (vendedor não usaria assim) | Raphael / time comercial |

**Antes de pingar:** tenta resolver consultando os docs + perguntando pro Claude Code primeiro. Quando pingar, mande contexto: o que tentou, o que viu, o erro exato.

---

## Convenções de commit

- Commits pequenos e focados (uma mudança lógica por commit).
- Mensagens em inglês imperative ("add", "fix", "update"), em PT-BR no body se quiser detalhar.
- Push em cada etapa concluída (não acumula).
- Após calibração estável (v0.N), abre PR ou avisa Raphael pra revisar antes de merge no `main`.
- Branch atual `main` é livre pra trabalhar direto (repo novo, não tem outros colaboradores ainda).

---

## Próximos passos depois do MVP

(Não pra você fazer agora — só pra você saber onde isso vai.)

- **Plugagem Hub** — registrar agente no Supabase Hub interno (depois de calibrado).
- **Métricas** — sample manual + pesquisa interna + conversão de stage Kommo.
- **Replicar pro Agente Dor** — mesma infraestrutura, prompt diferente, em `n8n-ativacao-dor-kommo/` (monorepo).

Detalhe em `DESIGN.md` §4.

---

Bom trabalho. Qualquer dúvida grita 🚀
