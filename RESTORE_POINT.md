# RESTORE POINT — Histórico

## ✅ v0.18 (ATIVA — 2026-05-26)

Inferência de objeção a partir do campo `Objeções (livre)` quando o enum está vazio. Bug descoberto em lead 29479931 (Nelson, Pública): vendedor preencheu só o campo livre → agente caía em branch defensivo ignorando citação rica. Patch faz Format Payload aceitar `livrePreenchido` como sinal válido + prompt instrui LLM a inferir 1-3 objeções canônicas + alertar vendedor no `por_que_funciona`. Validado no mesmo lead: inferiu #10 + #2 corretamente, gerou roteiro completo, manteve rastreabilidade ("Contorno: (nenhuma)").

### Histórico v0.15 → v0.18

- **v0.15** — 3 patches pós-round test (diluição forçada #1+combo, 3 perguntas forçadas #14+combo, datas-âncora trimestrais #9). Validado em produção (lead 29373445 com #2+#10 e lead 29483911 com #1+#2+#14).
- **v0.16** — anti-cópia reforçada para #6 (frases queimadas + variantes). Cópia deslocada, não eliminada — aceita como cosmética.
- **v0.17** — uso ativo de `Objeções (livre)`. Resolve caso SME (lead 28231916).
- **v0.18** — inferência enum-vazio + livre-preenchido. Resolve caso Nelson (lead 29479931).

Detalhes da versão e validação: ver `SYSTEM_PROMPT.md` (histórico de iterações).

## Histórico de mudanças com rollback documentado

- **2026-05-23** — migração field `1378355` → `1378497` (texto curto → texto longo). ✅ Concluída.
- **2026-05-25** — v0.7 → v0.8 (concisão + cabeçalho objeções). ✅ Concluída.
- **2026-05-26** — v0.8 → v0.12 (calibração de tom humano em 4 iterações: v0.9, v0.10, v0.11, v0.12). ✅ Concluída.
- **2026-05-26** — v0.12 → v0.13 → v0.13.1 (cabeçalho clean "Contorno: <label literal>" — sem disclaimer, label Kommo preservado). ✅ Concluída.
- **2026-05-26** — v0.13.1 → v0.14 (regra de multi-objeção: roteiro cobre todas as objeções marcadas). ✅ Concluída.
- **2026-05-26** — v0.14 → v0.15 (round test 54 disparos · 3 patches: diluição forçada #1+combo, 3 perguntas forçadas #14+combo, datas-âncora trimestrais #9). ✅ Concluída.
- **2026-05-26** — v0.15 → v0.16 (anti-cópia reforçada #6, validação em 4 leads reais com cópia 100% — fala 3 melhorou parcial, fala 2 cópia deslocada). ✅ Concluída.
- **2026-05-26** — v0.16 → v0.17 (uso ativo de `Objeções (livre)` — bug descoberto em lead 28231916 SME, validado no mesmo lead pós-patch). ✅ Concluída.
- **2026-05-26** — v0.17 → v0.18 (inferência enum-vazio + livre-preenchido — bug descoberto em lead 29479931 Nelson, Format Payload + Prompt patcheados, validado no mesmo lead pós-patch). ✅ Concluída.
- **2026-06-07** — Plugagem com Hub Urânia + troca de credencial OpenAI (sem revisão do prompt). Workflow passou de 17 → 18 nodes com a adição de `Record Tool Usage` (HTTP fire-and-forget pra edge function `record-tool-usage` do Supabase Hub, registrando custo/tokens/duração em `tools.exports`). Credencial OpenAI trocada de `OpenAi ([N8N-Q] Agentes Geral)` (`AJnAAldqTmp3tWXt`) → `n8n-kommo-conta-contato@urania` (`3p67hRvZclz7v4NF`). Edição feita direto na UI pelo Raphael; descoberta no health check 2026-06-16 e sincronizada nos docs nesta data. ⚠️ `system_prompt_version` no body do Record Tool Usage é hardcoded `'v0.18'` — atualizar ao subir v0.19+. ✅ Concluída.

## Como reverter qualquer versão via Git

```bash
git log --oneline --all
git show <hash-do-commit>:SYSTEM_PROMPT.md
git show <hash-do-commit>:.workflow-build.js
```

Aplicar via MCP `n8n_update_partial_workflow` com o conteúdo extraído do commit antigo.

## Próximos pontos de retorno

Documentar aqui antes de mudanças arquiteturais futuras (novos nodes, mudança de modelo LLM, mudança de estrutura de output).
