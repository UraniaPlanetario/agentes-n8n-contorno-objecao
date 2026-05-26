# RESTORE POINT — Histórico

## ✅ v0.14 (ATIVA — 2026-05-26)

Regra de multi-objeção: roteiro cobre TODAS as objeções marcadas (não só a "mais pesada"). Validado no lead 29354429 (#6 + #11) — fala 2 com pergunta de 3 eixos cobrindo ambas, fala 5 amarrando ambas. Watch: cópia literal do exemplo inline pode virar bug de repetição em leads similares.

Detalhes da versão e validação: ver `SYSTEM_PROMPT.md` (histórico de iterações).

## Histórico de mudanças com rollback documentado

- **2026-05-23** — migração field `1378355` → `1378497` (texto curto → texto longo). ✅ Concluída.
- **2026-05-25** — v0.7 → v0.8 (concisão + cabeçalho objeções). ✅ Concluída.
- **2026-05-26** — v0.8 → v0.12 (calibração de tom humano em 4 iterações: v0.9, v0.10, v0.11, v0.12). ✅ Concluída.
- **2026-05-26** — v0.12 → v0.13 → v0.13.1 (cabeçalho clean "Contorno: <label literal>" — sem disclaimer, label Kommo preservado). ✅ Concluída.
- **2026-05-26** — v0.13.1 → v0.14 (regra de multi-objeção: roteiro cobre todas as objeções marcadas). ✅ Concluída.

## Como reverter qualquer versão via Git

```bash
git log --oneline --all
git show <hash-do-commit>:SYSTEM_PROMPT.md
git show <hash-do-commit>:.workflow-build.js
```

Aplicar via MCP `n8n_update_partial_workflow` com o conteúdo extraído do commit antigo.

## Próximos pontos de retorno

Documentar aqui antes de mudanças arquiteturais futuras (novos nodes, mudança de modelo LLM, mudança de estrutura de output).
