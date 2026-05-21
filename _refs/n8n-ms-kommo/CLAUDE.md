# MS-KOMMO — Mapa de Microserviços Kommo (n8n Urania)

**Propósito:** índice de microserviços Kommo prontos para reuso. Antes de criar HTTP Request direto pra Kommo num projeto novo, **verifique aqui se já existe um MS que resolve**. Para detalhes de cada um, abra o arquivo em `ms/`.

> **Vínculo canônico:** [`../../tech-labs/ecossistema-tech-labs-canonico/base/ms-kommo.md`](../../tech-labs/ecossistema-tech-labs-canonico/base/ms-kommo.md) — padrão técnico transversal (infra interna, 24+ consumidores).

---

## Stack & Auth

- **n8n:** `https://n8n-web.uraniaclass.com.br`
- **Kommo tenant:** `https://uraniaplanetario.kommo.com/api/v4/...`
- **Credencial compartilhada:** `httpBearerAuth` id **`skV2BHNge0lsu6UO`** ("Kommo Long Lived Bearer Access Token exp. 31/12/2026")
- **Token expira:** 31/12/2026 — renovar antes.
- **Error workflow padrão:** `HQGrY3cUDvQJLGMZ` (setar em `settings.errorWorkflow` em workflows novos)

### Regras duras

1. **Nunca crie credencial Kommo nova.** Reutilize `skV2BHNge0lsu6UO`. 24+ workflows ativos dependem dela.
2. **Nunca use** o community node `n8n-nodes-kommo.kommo`. Padrão é `n8n-nodes-base.httpRequest` + Bearer, ou (preferível) `executeWorkflow` chamando um MS abaixo.
3. **Não duplique lógica** — se um MS já existe pro caso, use.
4. Exceção atual conhecida usando OAuth2/community node: `[KOMMO] Monta Proposta Comercial PDF` (`Kzdy3gWtbmJUNiEl`) — tech debt, não replicar.

---

## Microserviços (10 ativos)

| Workflow | n8n ID | Detalhes |
|---|---|---|
| `[MS-KOMMO] Get Entity` | `pSUCb5GTYWc4B99I` | [ms/get-entity.md](ms/get-entity.md) |
| `[MS-KOMMO] Salvar campos em uma Entity` | `m5K7FZDDvVXDiywo` | [ms/salvar-campos.md](ms/salvar-campos.md) |
| `[MS-KOMMO] Search Entity` | `9MGaosNMbR5jy1wK` | [ms/search-entity.md](ms/search-entity.md) |
| `[MS-KOMMO] Create Entity` | `mDMa3eXAoGVCgfoC` | [ms/create-entity.md](ms/create-entity.md) |
| `[MS-KOMMO] Buscar lead por ID` | `1UPrNtE4Dg5gsbEC` | [ms/buscar-lead-por-id.md](ms/buscar-lead-por-id.md) |
| `[MS-KOMMO] Upsert Lead/Contato (por telefone)` | `8lUufdX1Qn95KSRq` | [ms/upsert-lead-contato.md](ms/upsert-lead-contato.md) |
| `[MS-KOMMO] Add note` | `QYvm2okgK3bQgMbR` | [ms/add-note.md](ms/add-note.md) |
| `[MS-KOMMO] Add task` | `Jh9SShZh9EPIzZI7` | [ms/add-task.md](ms/add-task.md) |
| `[MS-KOMMO] Aguardar Responsável do Lead` | `ihofJfubGw6yBmZN` | [ms/aguardar-responsavel.md](ms/aguardar-responsavel.md) |
| `[MS-KOMMO] Parsear telefone` | `qG2EtZVcPCPdWYCs` | [ms/parsear-telefone.md](ms/parsear-telefone.md) |

> Catálogo completo de IDs de custom fields, pipelines, status, tags, users → [kommo-fields.md](kommo-fields.md).

---

## Como decidir qual MS usar

| Cenário | MS a usar |
|---|---|
| Criar lead/contato a partir de um telefone (form, chatbot, LP, IA) | **Upsert Lead/Contato** — faz tudo (parse phone, busca, cria, opt note+task) |
| Já tenho `lead_id` e preciso dos dados completos (com contatos + catalog) | **Buscar lead por ID** |
| Ler entity arbitrária por ID (lead/contact/company) | **Get Entity** |
| Buscar por texto, email ou nome | **Search Entity** |
| Atualizar custom fields ou mover lead de pipeline/status | **Salvar campos em uma Entity** |
| Criar entity passando payload Kommo pronto | **Create Entity** |
| Registrar uma anotação no lead/contact/company | **Add note** |
| Criar uma tarefa | **Add task** |
| Esperar Kommo atribuir um vendedor real ao lead (anti-fallback) | **Aguardar Responsável do Lead** |
| Normalizar telefone BR para E.164 | **Parsear telefone** |

---

## Padrão de chamada via `executeWorkflow`

Forma canônica (interno, projeto novo chamando um MS):

```json
{
  "type": "n8n-nodes-base.executeWorkflow",
  "parameters": {
    "workflowId": "8lUufdX1Qn95KSRq",
    "mode": "each",
    "options": {
      "waitForSubWorkflow": true
    }
  }
}
```

Os MS aceitam payload em `body: {...}` ou no root do item — variar conforme detalhe em cada `ms/*.md`.

---

## IDs operacionais críticos (resumo)

Inline pra reuso rápido. Detalhes em [kommo-fields.md](kommo-fields.md).

- **Pipeline default (Vendas WhatsApp):** `10832516`
- **Status default (Saudação Manual):** `99618623`
- **Responsible user fallback (não é vendedor real):** `13346000`
- **Tag "Indefinido":** `159754`
- **Task type default:** `1`

**Custom fields lead mais usados:** `848739` Cidade · `847533` Faixa de alunos (enum) · `851275` Nome da escola · `853875` Origem da oportunidade (enum) · `849769` Canal de entrada (enum) · `586032` utm_source · `586028` utm_medium · `586030` utm_campaign · `586034` utm_term · `586026` utm_content · `853789` post_url · `586038` referrer

**Custom fields contact:** `840300` Cidade · `904188` Cargo

**Native fields contact (via `field_code`):** `EMAIL`, `PHONE`

---

## Hub de docs Notion

Database: [Hub Documentação](https://www.notion.so/26d0690dfef08044afcdd5e502fb56cc) — categoria `Microserviço` + `Kommo`. Cada MS tem seu doc com contrato I/O completo (link nos arquivos `ms/*.md`).

---

## Skills disponíveis (criadas em 2026-05-06)

### `sync-ms-kommo` (local — só roda nesta pasta)
**Path:** `.claude/skills/sync-ms-kommo/SKILL.md`

Diff a 3 vias (n8n + Notion + `ms/*.md`) → mostra ao usuário (5 buckets: OK / STALE / NEW / ORFÃO / MISSING NOTION) → pede aprovação → regrava `.md` afetados, atualiza tabela do `CLAUDE.md` e `kommo-fields.md`. Hard gate antes de qualquer escrita.

Use quando: suspeitar que docs estão stale, após mexer em workflow MS-KOMMO no n8n, ou pedir "sync MS-KOMMO".

### `usar-ms-kommo` (global — `Skills-Templates/`, no catálogo)
**Path:** `C:\Projetos-Vibe-Coding\Skills-Templates\usar-ms-kommo\SKILL-usar-ms-kommo.md`

Auto-restrita a CWD sob `Urania/`. Lê este `CLAUDE.md` por path absoluto, faz match na decision table, lê o `ms/<slug>.md` relevante e renderiza output fixo: MS recomendado + n8n ID + snippet `executeWorkflow` + payload mínimo + IDs do `kommo-fields.md` + alternativas.

Use em qualquer projeto Urania que precisar interagir com Kommo CRM.

---

## Itens pendentes de revisão

- [ ] `[MS-KOMMO] Aguardar Responsável do Lead` (`ihofJfubGw6yBmZN`) **não tem doc no Notion** — criar? (extraído da estrutura do workflow em `ms/aguardar-responsavel.md`)
- [ ] Field IDs de **companies** não estão catalogados em `kommo-fields.md` — buscar via API se algum produto futuro precisar
- [ ] `field_id 849067` aparece no workflow Upsert mas sem nome em CF_NAMES — investigar
- [ ] Testar `sync-ms-kommo` rodando aqui (após reiniciar a sessão)
- [ ] Testar `usar-ms-kommo` em um projeto real Urania (após reiniciar)
