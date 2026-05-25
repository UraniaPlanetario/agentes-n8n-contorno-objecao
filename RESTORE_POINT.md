# RESTORE POINT — 2026-05-25 (antes da v0.8: concisão + cabeçalho de objeções)

## Contexto

Marcos pediu 2 mudanças observadas após primeiro disparo real:
1. **Roteiro mais conciso** — limitar palavras por fala pra evitar prolixidade
2. **Cabeçalho com objeções setadas no topo da nota** — pra auditoria se vendedor editar o campo depois

## Estado ANTES da v0.8 (snapshot pra reverter se necessário)

### Workflow
- **ID:** `AhnbRqc4wKX7UyHB`
- **Versão prévia:** v0.7 (field 1378497 já em uso, Build Note já DUAL)
- **Disparo real validado em v0.7:** execution 258319, lead 28339472 (RH Empresas, objeção #4)

### Regras do prompt (antes v0.8)

System Prompt — seção REGRAS DE SAÍDA — JSON OBRIGATÓRIO:

```
- "roteiro": 3 a 5 falas numeradas separadas por \n. Cada fala em 1 linha. ~50 a 200 palavras totais. Tom falado.
```

### Format Payload (jsCode antes v0.8 — não tinha `objecoesSetadas` no return)

Return era:
```javascript
return [{ json: {
  systemPrompt: SYSTEM_PROMPT,
  userPrompt: userPrompt,
  leadId: lead.id,
  ehObjecaoValida: ehObjecaoValida
} }];
```

### Build Note (jsCode antes v0.8 — sem cabeçalho de objeções)

```javascript
const p = $('Parse Output').first().json;

const texto = 'Agente Contorno Objeção\n\n' +
              'ROTEIRO COPIÁVEL\n' + p.roteiro + '\n\n' +
              'POR QUE FUNCIONA\n' + p.por_que_funciona + '\n\n' +
              'PRÓXIMO PASSO\n' + p.proximo_passo;
// (sem bloco OBJEÇÕES SETADAS NO DISPARO)

return [
  { json: { ..., note_type: 'common', text: texto }},
  { json: { ..., note_type: 'service_message', service: 'Agente Contorno Objeção', text: texto }}
];
```

### Build Orientation Note — mesma estrutura, sem cabeçalho de objeções

## Como reverter v0.8 → v0.7

### Opção 1 — Via Git (recomendada)

```bash
# Localizar o commit imediatamente anterior à v0.8 (commit do v0.7)
git log --oneline | head -5

# Ver o estado dos arquivos no commit antigo
git show <hash-do-commit-v0.7>:.workflow-build.js > /tmp/build-v0.7.js

# Re-aplicar jsCode antigo via MCP n8n_update_partial_workflow
# (não dá pra fazer git checkout direto pq o n8n live tá descasado do .workflow-build.js)
```

### Opção 2 — Re-aplicar manualmente via MCP

Pra cada um dos 4 nodes, mandar `updateNode` com o jsCode/value antigo:
1. **System Prompt** (Set): patchNodeField revertendo o trecho da regra do roteiro
2. **Format Payload** (Code): updateNode com jsCode sem `objecoesSetadas`
3. **Build Note** (Code): updateNode com jsCode sem o bloco "OBJEÇÕES SETADAS NO DISPARO"
4. **Build Orientation Note** (Code): idem

O conteúdo exato dos 3 jsCode v0.7 está no `.workflow-build.js` do commit `53cdf05` (use `git show 53cdf05:.workflow-build.js`).

## Como aplicar a reversão via MCP

Disparar `mcp__n8n-mcp__n8n_update_partial_workflow` com 4 operations (1 patchNodeField no System Prompt + 3 updateNode nos Code nodes), passando os jsCode antigos extraídos do Git.

## Histórico de RESTORE_POINTs anteriores

- **2026-05-23** — migração field `1378355` → `1378497` (texto curto → texto longo). ✅ Concluída com sucesso. Conteúdo arquivado no commit `53cdf05`.
