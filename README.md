# agente-n8n-contorno-objecao

Workflow n8n que recebe `lead_id` Kommo, gera roteiro de **contorno de objeção** via LLM (gpt-4o) e devolve em 2 destinos no lead:

- Custom field `Resp. IA objeção` (`field_id: 1378355`) ← só o roteiro copiável
- Nota no lead ← 3 seções (`ROTEIRO COPIÁVEL` + `POR QUE FUNCIONA` + `PRÓXIMO PASSO`)

> Snapshot exportado do monorepo interno **Urânia Labs · n8n-workflows** em **2026-05-21**. Brainstorm fechado, workflow ainda não criado.

---

## Status

| Fase | Status |
|---|---|
| Brainstorm (12 decisões + Understanding Lock) | ✅ Fechado 2026-05-21 |
| Documentação base (CLAUDE.md, DESIGN.md, FIELDS.md) | ✅ Criada |
| Design técnico detalhado (DESIGN.md §3) | ⏳ Slots TBD |
| `SYSTEM_PROMPT.md` v0.1 | ⏳ A criar |
| Workflow criado no n8n | ⏳ A criar via MCP |
| Calibração em leads reais (v0.1 → v0.N) | ⏳ |

---

## Quick start

1. **[`CLAUDE.md`](./CLAUDE.md)** — runbook operacional. Status, pipeline, MS-KOMMO usados, IDs, linhas vermelhas, regra de colaboração do prompt.
2. **[`DESIGN.md`](./DESIGN.md)** — decisões + design técnico. 12 decisões com alternativas e razão, assumptions, slots TBD do design técnico, roadmap pós-MVP.
3. **[`FIELDS.md`](./FIELDS.md)** — whitelist de 5 campos + spec do webhook + destinos de output + regras de saída.
4. **[`mapeamento-objecoes-lead-urania.txt`](./mapeamento-objecoes-lead-urania.txt)** — 16 objeções canônicas Urânia. Vai concatenado no system prompt.
5. **[`_refs/`](./_refs/)** — referências críticas do monorepo: catálogo MS-KOMMO (`_refs/n8n-ms-kommo/`), implementação do briefing labs (`_refs/n8n-briefing-leads-kommo-labs/`), implementação do qualificador U.Labs (`_refs/n8n-qualificador-leads-kommo/`).

---

## Próximos passos (pra quem continuar)

1. **Preencher `DESIGN.md` §3** — design técnico detalhado:
   - Pipeline n8n (lista exata de nodes com nomes, tipos, conexões)
   - Contrato JSON do output do LLM
   - Código JS dos nodes `Format Payload`, `Build Note`, `Validate Input`
   - Payloads de chamada dos 3 MS-KOMMO
   - Pendências de setup (field_id de `Nº de alunos`, suporte a `\n` no field 1378355)
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
| **Credencial OpenAI** | `OpenAi ([N8N-Q] Agentes SDR)` (compartilhada com briefing + qualifier) |

Detalhes em [`CLAUDE.md`](./CLAUDE.md) seção "Linhas vermelhas".
