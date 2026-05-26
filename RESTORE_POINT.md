# RESTORE POINT — Histórico

## ✅ v0.15 (ATIVA — 2026-05-26)

3 patches após round test sistemático (54 disparos · 3 perfis × 18 combinações). Bugs catalogados em `ROUND_TEST_RESULTS.md`:
- **Patch 1:** força diluição R$ no roteiro quando #1/#2/#3/#10/#12 marcada em combinação com institucional (6 falhas em 12 pares observadas).
- **Patch 2:** força 3 perguntas em fala dedicada quando #14 marcada em qualquer combinação (2 falhas em 3 pares observadas).
- **Patch 3:** tabela PRÓXIMAS DATAS-ÂNCORA TRIMESTRAIS no Format Payload + referência no prompt — resolve "ano que vem" virando mês solto (3 reincidências observadas).

Detalhes da versão e validação: ver `SYSTEM_PROMPT.md` (histórico de iterações).

## Histórico de mudanças com rollback documentado

- **2026-05-23** — migração field `1378355` → `1378497` (texto curto → texto longo). ✅ Concluída.
- **2026-05-25** — v0.7 → v0.8 (concisão + cabeçalho objeções). ✅ Concluída.
- **2026-05-26** — v0.8 → v0.12 (calibração de tom humano em 4 iterações: v0.9, v0.10, v0.11, v0.12). ✅ Concluída.
- **2026-05-26** — v0.12 → v0.13 → v0.13.1 (cabeçalho clean "Contorno: <label literal>" — sem disclaimer, label Kommo preservado). ✅ Concluída.
- **2026-05-26** — v0.13.1 → v0.14 (regra de multi-objeção: roteiro cobre todas as objeções marcadas). ✅ Concluída.
- **2026-05-26** — v0.14 → v0.15 (round test 54 disparos · 3 patches: diluição forçada #1+combo, 3 perguntas forçadas #14+combo, datas-âncora trimestrais #9). ✅ Concluída.

## Como reverter qualquer versão via Git

```bash
git log --oneline --all
git show <hash-do-commit>:SYSTEM_PROMPT.md
git show <hash-do-commit>:.workflow-build.js
```

Aplicar via MCP `n8n_update_partial_workflow` com o conteúdo extraído do commit antigo.

## Próximos pontos de retorno

Documentar aqui antes de mudanças arquiteturais futuras (novos nodes, mudança de modelo LLM, mudança de estrutura de output).
