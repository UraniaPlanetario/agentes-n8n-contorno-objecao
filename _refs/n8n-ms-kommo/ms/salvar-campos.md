# [MS-KOMMO] Salvar campos em uma Entity (Lead/Contato)

- **n8n ID:** `m5K7FZDDvVXDiywo`
- **n8n URL:** https://n8n-web.uraniaclass.com.br/workflow/m5K7FZDDvVXDiywo
- **Notion:** https://www.notion.so/2ee0690dfef080e9b585dfc22ff92a0c

## O que faz
PATCH para atualizar custom fields, campos nativos (EMAIL/PHONE), nome e/ou mover Lead de pipeline/status. Suporta `leads | contacts | companies`. Não chama Kommo se não houver nada para atualizar.

## Triggers
- `executeWorkflow` apenas (sem webhook)

## Input
| Campo | Tipo | Notas |
|---|---|---|
| `entity_type` | string | default `leads`. Aceita `leads` / `contacts` / `companies`. Sinônimo legacy: `entity` |
| `entity_id` | number | obrigatório. Legacy: `lead_id` / `contact_id` / `company_id` |
| `save[]` | array | itens: `{id\|field_id, value}`, `{field_id, enum_id}`, `{field_id, values:[...]}`. Aceita `{field_code:"EMAIL"\|"PHONE", value\|values}` (mapeia em `native_fields_values`) |
| `lead_update` | object | **só leads** — `{pipeline_id, status_id}` (aceita camelCase). NÃO lê esses campos fora deste objeto |
| `name_update` | string | renomeia entity |

## Output
Item enriquecido com:
- `kommo` (payload PATCH montado)
- `meta`: `data_valid`, `reasons`, `skipped`, `built_fields_count`, `has_fields_to_save`, `lead_update_applied`
- `resultBool`, `resultMessage`
- Retrocompat: `lead_id` / `contact_id` / `company_id`

## Erros / edges
- `save` vazio E sem `lead_update` válido → não chama API, retorna OK silencioso
- Itens sem `field_id` ou sem valor → vão pra `meta.skipped`
- Não valida tipo do campo (URL, enum existente)
- Não valida se `status_id` pertence ao `pipeline_id`
- `lead_update` é ignorado em `contacts`/`companies`

## Endpoint Kommo
`PATCH /api/v4/{entity_type}/{entity_id}` (entity_type plural).
