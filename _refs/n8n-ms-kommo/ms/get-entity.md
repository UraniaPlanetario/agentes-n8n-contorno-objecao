# [MS-KOMMO] Get Entity (Lead/Contact/Company)

- **n8n ID:** `pSUCb5GTYWc4B99I`
- **n8n URL:** https://n8n-web.uraniaclass.com.br/workflow/pSUCb5GTYWc4B99I
- **Notion:** https://www.notion.so/2ee0690dfef0804293fbf04faace6bb4

## O que faz
GET de uma entidade Kommo por ID (`leads|contacts|companies`), com expansão opcional via `with`. Normaliza datas de topo (`created_at`, `updated_at`, `closest_task_at`, `closed_at`) de epoch para ISO 8601. Não toca em `_embedded` / `custom_fields_values`.

## Triggers
- `executeWorkflow` (interno)
- Webhook POST: `https://n8n-web.uraniaclass.com.br/webhook/get-kommo-entity`

## Input
| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `entity_id` | number | sim | aceita string numérica |
| `entity` | string | sim | whitelist `leads` / `contacts` / `companies` |
| `with` | string | não | query param de expansão |

Aceita `body: {...}` ou root.

## Output
Objeto da entidade direto no `json` do item. Datas de topo já em ISO. Estruturas internas inalteradas.

## Erros / edges
- `entity_id` ausente ou não numérico → exception
- `entity` fora da whitelist → exception
- 401/403 (token), 404 (id inexistente)
- Sem retry/backoff. Sem 400 padronizado.

## Endpoint Kommo
`GET /api/v4/{entity}/{entity_id}?with=...`
