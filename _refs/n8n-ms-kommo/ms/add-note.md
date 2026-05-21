# [MS-KOMMO] Add note

- **n8n ID:** `QYvm2okgK3bQgMbR`
- **n8n URL:** https://n8n-web.uraniaclass.com.br/workflow/QYvm2okgK3bQgMbR
- **Notion:** https://www.notion.so/2ee0690dfef080e6bcd4d91d08282178

## O que faz
Cria notes em batch no Kommo (`leads | contacts | companies`, default `leads`). Sanitiza `service_message` substituindo `\n` real e literal por `||`.

## Triggers
- `executeWorkflow` (interno)
- Webhook POST: `https://n8n-web.uraniaclass.com.br/webhook/add-note`

## Input — 3 formatos aceitos

**A) Body wrap**
```json
{ "body": { "entity_type": "leads", "entity_id": 123, "note_type": "service_message", "service": "Bot", "text": "..." } }
```

**B) Array (sub-workflow batch)**
```json
[ { "entity_id": 123, "text": "..." }, { "entity_id": 456, "text": "..." } ]
```

**C) Root direto** — mesmo schema do A sem o `body:`.

Defaults: `note_type=service_message`, `entity_type=leads`, `service=""`, `text=""`.

## Output
Resposta direta do Kommo (`200 | 400 | 401 | 402 | 403`, `Content-Type: application/hal+json` no sucesso).

## Erros / edges
- Input fora dos 3 formatos → throw "Entrada não reconhecida"
- Sanitização **só** para `note_type=service_message`. Outros tipos: mande `params` completo
- Lote (formato B) deve ser do mesmo `entity_type`

## Endpoint Kommo
`POST /api/v4/{entity_type}/notes` body `[{ entity_id, note_type, params:{ service, text } }, ...]`.
