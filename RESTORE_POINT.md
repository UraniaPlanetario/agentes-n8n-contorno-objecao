# RESTORE POINT — 2026-05-23 (antes da migração field 1378355 → 1378497)

> **✅ MIGRAÇÃO CONCLUÍDA com sucesso em 2026-05-23.** O field `1378355` foi deletado no Kommo, o `1378497` foi renomeado pra "Resp. IA objeção". Teste validou que o agente grava Roteiro + Próximo Passo (Opção C) no novo field texto longo. Este RESTORE_POINT fica como histórico — não é mais necessário reverter.

## Contexto

Marcos descobriu que o field `Resp. IA objeção` (1378355) foi criado como **texto curto** (limite 256 chars) em vez de texto longo. Criou um novo field `1378497` como **texto longo** e quer migrar pra ele, gravando **Opção C** (Roteiro + Próximo Passo) em vez de só o `proximo_passo`.

## Estado ANTES da migração (snapshot a reverter se necessário)

### Workflow
- **ID:** `AhnbRqc4wKX7UyHB`
- **Status:** ATIVO
- **Versão:** v0.6.2

### Parse Output (jsCode — trecho relevante)

```javascript
const leadId = $('Format Payload').first().json.leadId;
// Field 1378355 tem limite 256 chars (descoberto 2026-05-23) — usar proximo_passo curto

return [{ json: {
  entity_id: leadId,
  entity_type: 'leads',
  save: [{ field_id: 1378355, value: proximo }],
  roteiro: roteiro,
  por_que_funciona: porQue,
  proximo_passo: proximo,
  leadId: leadId
} }];
```

### Fields Kommo
- `1378355` **Resp. IA objeção** — texto curto, em uso pelo agente, recebendo apenas o `proximo_passo`
- `1378497` **Resp. IA objeção (novo)** — texto longo, **criado mas ainda vazio**

## Como reverter (se a mudança der erro)

1. Aplicar `updateNode` no `Parse Output` (workflow `AhnbRqc4wKX7UyHB`) com o jsCode anterior (acima).
2. Marcos: opcional — deletar o field `1378497` no Kommo (ou manter pra próxima tentativa).
3. Notificar e fechar o ciclo.

## Como aplicar a reversão via MCP

```javascript
mcp__n8n-mcp__n8n_update_partial_workflow({
  id: 'AhnbRqc4wKX7UyHB',
  operations: [{
    type: 'updateNode',
    nodeName: 'Parse Output',
    updates: { parameters: { jsCode: '<código v0.6.2 acima>' } }
  }]
})
```

(O jsCode completo está versionado em `.workflow-build.js` antes desta migração — mas só a const `PARSE_OUTPUT_CODE`.)
